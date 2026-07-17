import {
  addAlteracao,
  addCertificado,
  addContato,
  addDocumento,
  addSocio,
  inactivateEmpresa,
  reactivateEmpresa,
  removeCertificado,
  removeDocumento,
  setContatoAtivo,
  updateCertificado,
  updateContato,
} from "@/app/actions";
import { CompanyRegistration } from "@/components/company-registration";
import { canEditCompanies, requirePageUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EmpresaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const query = await searchParams;
  const company = await prisma.empresa.findUnique({
    where: { id },
    include: {
      socios: { include: { socio: { include: { vinculos: { where: { ativo: true } } } } }, orderBy: { dataSaida: "asc" } },
      contatos: { orderBy: [{ ativo: "desc" }, { principal: "desc" }, { nome: "asc" }] },
      certificados: { where: { removidoEm: null }, orderBy: { dataVencimento: "asc" } },
      alteracoes: { include: { usuario: { select: { nome: true } } }, orderBy: { data: "desc" } },
      documentos: { where: { removidoEm: null }, orderBy: { createdAt: "desc" }, select: { id: true, tipo: true, nomeArquivo: true, mimeType: true, tamanho: true, observacoes: true, createdAt: true } },
    },
  });
  if (!company) notFound();

  const message = typeof query.mensagem === "string" ? query.mensagem : typeof query.erro === "string" ? query.erro : undefined;
  const flash = message ? { kind: typeof query.erro === "string" ? "error" as const : "success" as const, message } : undefined;

  return <CompanyRegistration
    company={company}
    canEdit={canEditCompanies(user.papel)}
    flash={flash}
    addSocioAction={addSocio.bind(null, id)}
    addContatoAction={addContato.bind(null, id)}
    updateContatoAction={updateContato.bind(null, id)}
    setContatoAtivoAction={setContatoAtivo.bind(null, id)}
    addCertificadoAction={addCertificado.bind(null, id)}
    updateCertificadoAction={updateCertificado.bind(null, id)}
    removeCertificadoAction={removeCertificado.bind(null, id)}
    addAlteracaoAction={addAlteracao.bind(null, id)}
    addDocumentoAction={addDocumento.bind(null, id)}
    removeDocumentoAction={removeDocumento.bind(null, id)}
    inactivateAction={inactivateEmpresa.bind(null, id)}
    reactivateAction={reactivateEmpresa.bind(null, id)}
  />;
}
