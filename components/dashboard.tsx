"use client";

import Link from "next/link";
import { Building2, Eye, Pencil, Plus, Search } from "lucide-react";
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
};

const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export function Dashboard({ companies, isDemo = false }: { companies: Company[]; isDemo?: boolean }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLocaleLowerCase("pt-BR");
    return companies.filter((c) => [c.razaoSocial, c.nomeFantasia, c.cnpj, c.cidade].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [companies, query]);
  const pending = companies.filter((c) => c.pendenciasFiscais).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Building2 size={19} /></span><span>AutCompany<small>Gestão contábil</small></span></div>
        <div className="top-actions"><Link className="button" href="/empresas/nova"><Plus size={17} /> Nova empresa</Link></div>
      </header>
      <main className="container">
        <div className="hero-row">
          <div><p className="eyebrow">Visão geral</p><h1>Empresas clientes</h1><p className="subtitle">Cadastre, acompanhe e gere fichas cadastrais prontas para impressão.</p></div>
        </div>
        {isDemo && <p className="subtitle" style={{ color: "#a76713" }}>Exibindo dados demonstrativos. Configure o PostgreSQL no arquivo .env para habilitar o cadastro persistente.</p>}
        <section className="stats" aria-label="Indicadores">
          <div className="stat"><div className="stat-label">Empresas</div><div className="stat-value">{companies.length}</div></div>
          <div className="stat"><div className="stat-label">Ranking A ou superior</div><div className="stat-value">{companies.filter((c) => ["A", "S", "SS"].includes(c.ranking)).length}</div></div>
          <div className="stat"><div className="stat-label">Pendências fiscais</div><div className="stat-value">{pending}</div></div>
          <div className="stat"><div className="stat-label">Em dia</div><div className="stat-value">{companies.length - pending}</div></div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2 className="panel-title">Carteira de clientes</h2><div style={{ position: "relative" }}><Search size={16} style={{ position: "absolute", left: 13, top: 13, color: "#7b8191" }} /><input className="search" style={{ paddingLeft: 38 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por empresa, CNPJ ou cidade" /></div></div>
          <div className="table-wrap"><table><thead><tr><th>Empresa</th><th>CNPJ</th><th>Localização</th><th>Regime</th><th>Ranking</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>{filtered.map((company) => <tr key={company.id}><td><div className="company-name">{company.nomeFantasia}</div><div className="company-legal">{company.razaoSocial}</div></td><td>{company.cnpj}</td><td>{company.cidade}/{company.uf}</td><td>{label(company.regimeTributario)}</td><td><span className="badge">{company.ranking}</span></td><td><span className={`badge ${company.pendenciasFiscais ? "orange" : "green"}`}>{company.pendenciasFiscais ? "Com pendências" : "Regular"}</span></td><td><div className="row-actions"><Link className="icon-link" title="Ver ficha" href={`/empresas/${company.id}`}><Eye size={16} /></Link>{!isDemo && <Link className="icon-link" title="Editar" href={`/empresas/${company.id}/editar`}><Pencil size={16} /></Link>}</div></td></tr>)}</tbody>
          </table>{filtered.length === 0 && <div className="empty">Nenhuma empresa encontrada.</div>}</div>
        </section>
      </main>
    </div>
  );
}
