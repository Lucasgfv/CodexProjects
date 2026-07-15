import { addAlteracao, addCertificado, addContato, addDocumento, addSocio, deleteEmpresa } from "@/app/actions";
import { CompanyRegistration } from "@/components/company-registration";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EmpresaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const company = await prisma.empresa.findUnique({
    where: { id },
    include: {
      socios: { include: { socio: { include: { vinculos: true } } }, orderBy: { dataSaida: "asc" } },
      contatos: { orderBy: [{ principal: "desc" }, { nome: "asc" }] },
      certificados: { orderBy: { dataVencimento: "asc" } },
      alteracoes: { orderBy: { data: "desc" } },
      documentos: { orderBy: { createdAt: "desc" }, select: { id: true, tipo: true, nomeArquivo: true, mimeType: true, tamanho: true, observacoes: true, createdAt: true } },
    },
  });
  if (!company) notFound();

  const message = typeof query.mensagem === "string" ? query.mensagem : typeof query.erro === "string" ? query.erro : undefined;
  const flash = message ? { kind: typeof query.erro === "string" ? "error" as const : "success" as const, message } : undefined;

  return <CompanyRegistration
    company={company}
    flash={flash}
    addSocioAction={addSocio.bind(null, id)}
    addContatoAction={addContato.bind(null, id)}
    addCertificadoAction={addCertificado.bind(null, id)}
    addAlteracaoAction={addAlteracao.bind(null, id)}
    addDocumentoAction={addDocumento.bind(null, id)}
    deleteAction={deleteEmpresa.bind(null, id)}
  />;
}
