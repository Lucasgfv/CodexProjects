import { parseCnpjCardText, type CnpjCardData } from "@/lib/cnpj-card";
import language from "@tesseract.js-data/por";
import { createWorker } from "tesseract.js";
import { definePDFJSModule, extractText, getDocumentProxy, renderPageAsImage } from "unpdf";

export type CnpjExtraction = {
  data: CnpjCardData;
  source: "TEXT" | "OCR";
  confidence: number;
  warning?: string;
};

const hasEssentialData = (data: CnpjCardData) => Boolean(data.cnpj && data.razaoSocial);
const pdfJsReady = definePDFJSModule(() => import("pdfjs-dist/legacy/build/pdf.mjs"));
const isPng = (value: Uint8Array) => value.length >= 8 && value.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
const isJpeg = (value: Uint8Array) => value.length >= 3 && value[0] === 0xff && value[1] === 0xd8 && value[2] === 0xff;

export function ocrReviewWarning(confidence: number) {
  return confidence < 80
    ? "O OCR apresentou baixa confiança. Revise todos os campos antes de salvar."
    : "Dados obtidos por OCR. Revise todos os campos antes de salvar.";
}

async function recognizeImage(image: Uint8Array) {
  const worker = await createWorker(language.code, 1, { langPath: language.langPath, gzip: language.gzip, cacheMethod: "none" });
  try {
    const result = await worker.recognize(Buffer.from(image));
    return { text: result.data.text, confidence: Math.round(result.data.confidence) };
  } finally {
    await worker.terminate();
  }
}

export async function extractCnpjCard(file: Uint8Array, mimeType: string, fileName: string): Promise<CnpjExtraction> {
  const pdf = mimeType === "application/pdf" || fileName.toLocaleLowerCase("pt-BR").endsWith(".pdf");
  let image = file;

  if (!pdf && !isPng(file) && !isJpeg(file)) throw new Error("INVALID_IMAGE");

  if (pdf) {
    await pdfJsReady;
    const document = await getDocumentProxy(file);
    const extracted = await extractText(document, { mergePages: true });
    const textData = parseCnpjCardText(extracted.text);
    if (hasEssentialData(textData)) return { data: textData, source: "TEXT", confidence: 100 };
    image = new Uint8Array(await renderPageAsImage(document, 1, { scale: 2.2, canvasImport: () => import("@napi-rs/canvas") }));
  }

  const recognized = await recognizeImage(image);
  const data = parseCnpjCardText(recognized.text);
  if (!hasEssentialData(data)) throw new Error("OCR_INSUFFICIENT");
  return {
    data,
    source: "OCR",
    confidence: recognized.confidence,
    warning: ocrReviewWarning(recognized.confidence),
  };
}
