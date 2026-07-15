import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const { id, documentId } = await params;
  const document = await prisma.documentoEmpresa.findFirst({ where: { id: documentId, empresaId: id } });
  if (!document) return new Response("Documento não encontrado.", { status: 404 });

  const safeName = document.nomeArquivo.replace(/[\r\n"]/g, "_");
  return new Response(document.conteudo, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Length": String(document.tamanho),
      "Content-Disposition": `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
