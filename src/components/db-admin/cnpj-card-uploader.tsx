"use client";

import {
  CheckCircle2,
  FileText,
  ImageUp,
  LoaderCircle,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { type DragEvent, useRef, useState } from "react";

import { formatCnpj, isValidCnpj } from "@/lib/cnpj";

export type CnpjLookupResult = {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  porte: string | null;
  dataInicio: string | null;
  endereco: string | null;
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
};

type ProcessingState =
  | { status: "idle" }
  | { status: "processing"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

let pdfWorkerConfigured = false;

function configurePdfWorker(pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs")) {
  if (pdfWorkerConfigured) return;

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  pdfWorkerConfigured = true;
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function findCnpj(text: string) {
  const candidates = text.match(/(?:\d[\s./-]?){14}/g) ?? [];
  return candidates
    .map((candidate) => candidate.replace(/\D/g, ""))
    .find(isValidCnpj);
}

async function textFromPdf(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  configurePdfWorker(pdfjs);
  const pdf = await pdfjs.getDocument({
    data: await file.arrayBuffer(),
  }).promise;
  const textParts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    textParts.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
    );
  }

  return textParts.join("\n");
}

async function imageFromPdf(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  configurePdfWorker(pdfjs);
  const pdf = await pdfjs.getDocument({
    data: await file.arrayBuffer(),
  }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a página do PDF.");
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas;
}

async function imageCanvasFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      element.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem para OCR.");
    context.drawImage(image, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function recognizeFile(file: File, onProgress: (message: string) => void) {
  const extractedText =
    file.type === "application/pdf"
      ? await withTimeout(
          textFromPdf(file),
          20_000,
          "A leitura do PDF demorou. Tente uma imagem do cartão.",
        )
      : "";
  const textCnpj = findCnpj(extractedText);
  if (textCnpj) return textCnpj;

  onProgress("Aplicando OCR local no documento...");
  const source =
    file.type === "application/pdf"
      ? await withTimeout(
          imageFromPdf(file),
          20_000,
          "Não foi possível preparar o PDF para OCR.",
        )
      : await imageCanvasFromFile(file);
  const { createWorker } = await import("tesseract.js");
  const worker = await withTimeout(
    createWorker("por"),
    45_000,
    "O OCR não conseguiu carregar o idioma. Verifique a internet e tente novamente.",
  );
  try {
    const result = await withTimeout(
      worker.recognize(source),
      60_000,
      "O OCR demorou demais. Tente uma imagem mais nítida.",
    );
    const cnpj = findCnpj(result.data.text);
    if (!cnpj) {
      throw new Error(
        "Não encontrei um CNPJ legível. Use uma imagem nítida ou informe o CNPJ manualmente.",
      );
    }
    return cnpj;
  } finally {
    await worker.terminate();
  }
}

export function CnpjCardUploader({
  onDataExtracted,
}: {
  onDataExtracted: (data: CnpjLookupResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<ProcessingState>({ status: "idle" });

  async function processFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setState({ status: "error", message: "Selecione uma imagem ou PDF." });
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setState({ status: "error", message: "O arquivo deve ter no máximo 12 MB." });
      return;
    }

    setState({ status: "processing", message: "Lendo o cartão CNPJ..." });
    try {
      const cnpj = await recognizeFile(file, (message) =>
        setState({ status: "processing", message }),
      );
      setState({ status: "processing", message: "Consultando dados públicos..." });
      const response = await withTimeout(
        fetch(`/api/empresas/consulta-cnpj?cnpj=${encodeURIComponent(cnpj)}`, {
          signal: AbortSignal.timeout(20_000),
        }),
        25_000,
        "A consulta pública demorou. Revise o CNPJ e tente novamente.",
      );
      const data = (await response.json()) as CnpjLookupResult | { error: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Falha ao consultar o CNPJ.");
      }
      onDataExtracted(data);
      setState({
        status: "success",
        message: `Dados encontrados para ${formatCnpj(cnpj)}. Revise antes de salvar.`,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Falha ao ler o documento.",
      });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void processFile(event.dataTransfer.files[0]);
  }

  const isProcessing = state.status === "processing";
  return (
    <section className="mb-6 rounded-panel border border-dashed border-[#b9c9bb] bg-[#f5f9f5] p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e3efe5] text-moss">
          <FileText size={19} />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Preencher pelo cartão CNPJ</h3>
          <p className="mt-1 text-[11px] leading-5 text-[#647268]">
            A leitura acontece no navegador. O arquivo não é enviado nem salvo; somente o CNPJ e os dados encontrados preenchem o formulário.
          </p>
        </div>
      </div>
      <div
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border px-4 py-5 text-center transition ${dragging ? "border-moss bg-[#eaf3eb]" : "border-[#d2ded3] bg-white/75 hover:border-moss"}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          accept="image/*,application/pdf"
          className="sr-only"
          disabled={isProcessing}
          onChange={(event) => void processFile(event.target.files?.[0])}
          type="file"
        />
        {isProcessing ? (
          <LoaderCircle className="animate-spin text-moss" size={22} />
        ) : state.status === "success" ? (
          <CheckCircle2 className="text-[#2d7047]" size={22} />
        ) : state.status === "error" ? (
          <XCircle className="text-coral" size={22} />
        ) : (
          <UploadCloud className="text-moss" size={22} />
        )}
        <span className="mt-2 text-xs font-semibold text-[#46554a]">
          {isProcessing ? state.message : "Arraste o cartão ou clique para selecionar"}
        </span>
        <span className="mt-1 flex items-center gap-1 text-[10px] text-[#7b887d]">
          <ImageUp size={12} /> PNG, JPG ou PDF até 12 MB
        </span>
      </div>
      {state.status !== "idle" && !isProcessing ? (
        <p className={`mt-2 text-[11px] ${state.status === "error" ? "text-coral" : "text-[#2d7047]"}`}>
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
