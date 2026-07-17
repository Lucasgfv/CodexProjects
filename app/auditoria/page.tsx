import { AppHeader } from "@/components/app-header";
import { requirePageUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await requirePageUser(["ADMIN"]);
  const events = await prisma.auditoria.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { usuario: { select: { nome: true, email: true } } } });
  return <div className="app-shell"><AppHeader user={user} /><main className="container"><div><p className="eyebrow">Acesso administrativo</p><h1>Auditoria técnica</h1><p className="subtitle">Eventos imutáveis das mutações. Senhas, sessões e conteúdo de documentos não são registrados.</p></div><section className="panel audit-panel"><div className="table-wrap"><table><thead><tr><th>Data</th><th>Usuário</th><th>Entidade</th><th>Ação</th><th>Alterações</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{event.createdAt.toLocaleString("pt-BR")}</td><td>{event.usuario?.nome ?? "Sistema"}<div className="company-legal">{event.usuario?.email ?? "—"}</div></td><td>{event.entidade}<div className="company-legal">{event.entidadeId}</div></td><td><span className="badge">{event.acao}</span></td><td><pre className="audit-json">{event.alteracoes ? JSON.stringify(event.alteracoes, null, 2) : "Sem valores registrados"}</pre></td></tr>)}</tbody></table>{events.length === 0 ? <div className="empty">Nenhum evento de auditoria registrado.</div> : null}</div></section></main></div>;
}

