"use client";

import { Building2, CalendarClock, Eye, Pencil, Plus, Search } from "lucide-react";
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
  certificados: Array<{ dataVencimento: Date | string }>;
};

const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (character) => character.toUpperCase());
const certificateDays = (company: Company) => company.certificados[0] ? Math.ceil((new Date(company.certificados[0].dataVencimento).getTime() - Date.now()) / 86_400_000) : null;

export function Dashboard({ companies, databaseUnavailable = false }: { companies: Company[]; databaseUnavailable?: boolean }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase("pt-BR");
    return companies.filter((company) => [company.razaoSocial, company.nomeFantasia, company.cnpj, company.cidade].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  }, [companies, query]);
  const pending = companies.filter((company) => company.pendenciasFiscais).length;
  const certificatesAttention = companies.filter((company) => {
    const days = certificateDays(company);
    return days !== null && days <= 30;
  }).length;

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Building2 size={19} /></span><span>AutCompany<small>Gestão contábil</small></span></div>
      <div className="top-actions"><Link className="button" href="/empresas/nova"><Plus size={17} /> Nova empresa</Link></div>
    </header>
    <main className="container">
      <div className="hero-row"><div><p className="eyebrow">Visão geral</p><h1>Empresas clientes</h1><p className="subtitle">Cadastre empresas e acompanhe contatos, certificados, documentos e alterações.</p></div></div>
      {databaseUnavailable && <div className="form-alert error" role="alert"><strong>Banco de dados indisponível.</strong> Não há dados demonstrativos nesta tela; confira a conexão com o PostgreSQL.</div>}
      <section className="stats" aria-label="Indicadores">
        <div className="stat"><div className="stat-label">Empresas</div><div className="stat-value">{companies.length}</div></div>
        <div className="stat"><div className="stat-label">Ranking A ou superior</div><div className="stat-value">{companies.filter((company) => ["A", "S", "SS"].includes(company.ranking)).length}</div></div>
        <div className="stat"><div className="stat-label">Pendências fiscais</div><div className="stat-value">{pending}</div></div>
        <div className="stat"><div className="stat-label">Certificados em atenção</div><div className="stat-value">{certificatesAttention}</div></div>
      </section>
      <section className="panel">
        <div className="panel-head"><h2 className="panel-title">Carteira de clientes</h2><div className="search-wrap"><Search size={16} /><input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por empresa, CNPJ ou cidade" aria-label="Buscar empresas" /></div></div>
        <div className="table-wrap"><table><thead><tr><th>Empresa</th><th>CNPJ</th><th>Localização</th><th>Regime</th><th>Certificado</th><th>Situação</th><th>Ações</th></tr></thead>
          <tbody>{filtered.map((company) => {
            const days = certificateDays(company);
            return <tr key={company.id}><td><div className="company-name">{company.nomeFantasia}</div><div className="company-legal">{company.razaoSocial}</div></td><td>{company.cnpj}</td><td>{company.cidade}/{company.uf}</td><td>{label(company.regimeTributario)}</td><td>{days === null ? <span className="badge">Não cadastrado</span> : days < 0 ? <span className="badge red">Vencido</span> : days <= 30 ? <span className="badge orange">{days} dias</span> : <span className="badge green"><CalendarClock size={13} /> {days} dias</span>}</td><td><span className={`badge ${company.pendenciasFiscais ? "orange" : "green"}`}>{company.pendenciasFiscais ? "Com pendências" : "Regular"}</span></td><td><div className="row-actions"><Link className="icon-link" title="Abrir cadastro" href={`/empresas/${company.id}`}><Eye size={16} /></Link><Link className="icon-link" title="Editar dados principais" href={`/empresas/${company.id}/editar`}><Pencil size={16} /></Link></div></td></tr>;
          })}</tbody>
        </table>{filtered.length === 0 && !databaseUnavailable && <div className="empty">{companies.length === 0 ? "Nenhuma empresa cadastrada." : "Nenhuma empresa encontrada."}</div>}</div>
      </section>
    </main>
  </div>;
}
