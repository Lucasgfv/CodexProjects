import { AppHeader } from "@/components/app-header";
import { certificateDaysUntil, certificateStatus, type CertificateStatus } from "@/lib/certificate-status";
import { requirePageUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { date } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";
const FILTERS = new Set<CertificateStatus>(["VENCIDO", "PROXIMO", "EM_DIA"]);
const statusLabel = (status: CertificateStatus) => status === "VENCIDO" ? "Vencidos" : status === "PROXIMO" ? "Próximos a vencer" : "Em dia";

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePageUser();
  const query = await searchParams;
  const includeInactive = query.inativos === "1";
  const filterRaw = typeof query.status === "string" ? query.status.toUpperCase() as CertificateStatus : null;
  const filter = filterRaw && FILTERS.has(filterRaw) ? filterRaw : null;
  const records = await prisma.certificadoDigital.findMany({
    where: { removidoEm: null, empresa: includeInactive ? undefined : { status: "ATIVA" } },
    orderBy: { dataVencimento: "asc" },
    select: { id: true, titularTipo: true, dataEmissao: true, dataVencimento: true, empresa: { select: { id: true, nomeFantasia: true, razaoSocial: true, status: true } } },
  });
  const classified = records.map((record) => ({ ...record, situacao: certificateStatus(record.dataVencimento), dias: certificateDaysUntil(record.dataVencimento) }));
  const visible = filter ? classified.filter((record) => record.situacao === filter) : classified;
  const counts = { VENCIDO: 0, PROXIMO: 0, EM_DIA: 0 };
  for (const record of classified) counts[record.situacao] += 1;

  return <div className="app-shell"><AppHeader user={user} /><main className="container">
    <div className="hero-row"><div><p className="eyebrow">Controle de vencimentos</p><h1>Certificados</h1><p className="subtitle">Lista independente do dashboard, sem armazenar arquivo, senha ou documento do titular.</p></div><Link className="button secondary" href={includeInactive ? "/certificados" : "/certificados?inativos=1"}>{includeInactive ? "Ocultar empresas inativas" : "Incluir empresas inativas"}</Link></div>
    <nav className="filter-tabs" aria-label="Filtrar certificados"><Link className={!filter ? "active" : ""} href={includeInactive ? "/certificados?inativos=1" : "/certificados"}>Todos ({classified.length})</Link>{(["VENCIDO", "PROXIMO", "EM_DIA"] as CertificateStatus[]).map((status) => <Link className={filter === status ? "active" : ""} key={status} href={`/certificados?status=${status}${includeInactive ? "&inativos=1" : ""}`}>{statusLabel(status)} ({counts[status]})</Link>)}</nav>
    <section className="panel"><div className="table-wrap"><table><thead><tr><th>Empresa</th><th>Titular</th><th>Emissão</th><th>Vencimento</th><th>Situação</th></tr></thead><tbody>{visible.map((record) => <tr key={record.id}><td><Link className="company-name" href={`/empresas/${record.empresa.id}`}>{record.empresa.nomeFantasia}</Link><div className="company-legal">{record.empresa.razaoSocial}{record.empresa.status === "INATIVA" ? " · Inativa" : ""}</div></td><td>{record.titularTipo === "PJ" ? "Pessoa jurídica" : "Pessoa física"}</td><td>{date(record.dataEmissao)}</td><td>{date(record.dataVencimento)}</td><td><span className={`badge ${record.situacao === "VENCIDO" ? "red" : record.situacao === "PROXIMO" ? "orange" : "green"}`}>{record.situacao === "VENCIDO" ? `Vencido há ${Math.abs(record.dias)} dia(s)` : record.situacao === "PROXIMO" ? `Vence em ${record.dias} dia(s)` : "Em dia"}</span></td></tr>)}</tbody></table>{visible.length === 0 ? <div className="empty">Nenhum certificado neste filtro.</div> : null}</div></section>
  </main></div>;
}

