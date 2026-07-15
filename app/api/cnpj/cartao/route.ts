import { parseCnpjCardText } from "@/lib/cnpj-card";
import { extractText, getDocumentProxy } from "unpdf";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("cartaoCnpj");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "Selecione o Cartão CNPJ em PDF." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "O PDF deve ter no máximo 5 MB." }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLocaleLowerCase("pt-BR").endsWith(".pdf")) {
      return NextResponse.json({ message: "Envie um arquivo PDF válido." }, { status: 400 });
    }

    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const result = await extractText(pdf, { mergePages: true });
    const data = parseCnpjCardText(result.text);

    if (!data.cnpj || !data.razaoSocial) {
      return NextResponse.json({
        message: "Não foi possível reconhecer os dados. Use o PDF original da Receita Federal, com texto selecionável.",
      }, { status: 422 });
    }

    return NextResponse.json({ data, message: "Dados importados. Confira as informações antes de salvar." });
  } catch {
    return NextResponse.json({ message: "Não foi possível ler o PDF enviado." }, { status: 422 });
  }
}

