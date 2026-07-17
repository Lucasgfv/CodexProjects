import { canEditCompanies, getCurrentUser } from "@/lib/authz";
import { extractCnpjCard } from "@/lib/cnpj-ocr";
import { logSafeError } from "@/lib/logger";
import { validateUpload } from "@/lib/upload-validation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.deveTrocarSenha || !canEditCompanies(user.papel)) return NextResponse.json({ message: "Acesso não autorizado." }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("cartaoCnpj");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ message: "Selecione o Cartão CNPJ em PDF, JPG ou PNG." }, { status: 400 });
    const validation = await validateUpload(file);
    if (!validation.ok) return NextResponse.json({ message: validation.error }, { status: 400 });

    const extraction = await extractCnpjCard(new Uint8Array(await file.arrayBuffer()), validation.mimeType, file.name);
    return NextResponse.json({
      data: extraction.data,
      source: extraction.source,
      confidence: extraction.confidence,
      message: extraction.warning ?? "Dados importados do texto do PDF. Confira as informações antes de salvar.",
    });
  } catch (error) {
    const eventId = logSafeError("cnpj.importar", error);
    const message = error instanceof Error && error.message === "OCR_INSUFFICIENT"
      ? "O OCR não reconheceu CNPJ e razão social com segurança. Preencha os dados manualmente."
      : `Não foi possível ler o arquivo enviado. Código: ${eventId}.`;
    return NextResponse.json({ message }, { status: 422 });
  }
}
