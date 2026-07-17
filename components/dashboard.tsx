"use client";

import { AppHeader } from "@/components/app-header";
import { Eye, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Company = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  cidade: string;
  uf: string;
  regimeTributario: string;
  ranking: string;
  pendenciasFiscais: boolean;
  status: "ATIVA" | "INATIVA";
};

type DashboardUser = { nome: string; papel: "ADMIN" | "OPERADOR" | "VISUALIZADOR" };
type Stats = { active: number; inactive: number; recentEntries: number; pending: number };
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (character) => character.toUpperCase());

export function Dashboard({ companies, user, stats, includeInactive, databaseUnavailable = false }: { companies: Company[]; user: DashboardUser; stats: Stats; includeInactive: boolean; databaseUnavailable?: boolean }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase("pt-BR");
    return companies.filter((company) => [company.razaoSocial, company.nomeFantasia, company.cnpj, company.cidade].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  }, [companies, query]);
  const canEdit = user.papel === "ADMIN" || user.papel === "OPERADOR";

  return <div className="app-shell">
    <AppHeader user={user} />
    <main className="container">
      <div className="hero-row"><div><p className="eyebrow">Visão geral</p><h1>Empresas clientes</h1><p className="subtitle">Acompanhe a carteira ativa e consulte empresas inativas sem misturar os indicadores.</p></div><Link className="button secondary" href={includeInactive ? "/" : "/?inativos=1"}>{includeInactive ? "Ocultar inativas" : "Consultar inativas"}</Link></div>
      {databaseUnavailable ? <div className="form-alert error" role="alert"><strong>Banco de dados indisponível.</strong> Não há dados demonstrativos nesta tela; confira a conexão com o PostgreSQL.</div> : null}
      <section className="stats" aria-label="Indicadores">
        <div className="stat"><div className="stat-label">Empresas ativas</div><div className="stat-value">{stats.active}</div></div>
        <div className="stat"><div className="stat-label">Empresas inativas</div><div className="stat-value">{stats.inactive}</div></div>
        <div className="stat"><div className="stat-label">Entradas em 12 meses</div><div className="stat-value">{stats.recentEntries}</div></div>
        <div className="stat"><div className="stat-label">Pendências fiscais ativas</div><div className="stat-value">{stats.pending}</div></div>
      </section>
      <section className="panel">
        <div className="panel-head"><h2 className="panel-title">Carteira de clientes</h2><div className="search-wrap"><Search size={16} /><input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por empresa, CNPJ ou cidade" aria-label="Buscar empresas" /></div></div>
        <div className="table-wrap"><table><thead><tr><th>Empresa</th><th>CNPJ</th><th>Localização</th><th>Regime</th><th>Status</th><th>Situação fiscal</th><th>Ações</th></tr></thead>
          <tbody>{filtered.map((company) => <tr key={company.id}><td><div className="company-name">{company.nomeFantasia}</div><div className="company-legal">{company.razaoSocial}</div></td><td>{company.cnpj}</td><td>{company.cidade}/{company.uf}</td><td>{label(company.regimeTributario)}</td><td><span className={`badge ${company.status === "ATIVA" ? "green" : "red"}`}>{label(company.status)}</span></td><td><span className={`badge ${company.pendenciasFiscais ? "orange" : "green"}`}>{company.pendenciasFiscais ? "Com pendências" : "Regular"}</span></td><td><div className="row-actions"><Link className="icon-link" title="Abrir cadastro" href={`/empresas/${company.id}`}><Eye size={16} /></Link>{canEdit ? <Link className="icon-link" title="Editar dados principais" href={`/empresas/${company.id}/editar`}><Pencil size={16} /></Link> : null}</div></td></tr>)}</tbody>
        </table>{filtered.length === 0 && !databaseUnavailable ? <div className="empty">{companies.length === 0 ? "Nenhuma empresa encontrada neste filtro." : "Nenhuma empresa encontrada."}</div> : null}</div>
      </section>
    </main>
  </div>;
}
