import { currency, date, enumLabel } from "@/lib/format";

type SheetCompany = Record<string, any>;
const yesNo = (value: boolean) => `${value ? "☒ Sim   ☐ Não" : "☐ Sim   ☒ Não"}`;
const choice = (active: boolean, label: string) => `${active ? "☒" : "☐"} ${label}`;

function Cell({ label, children, className = "" }: { label: string; children?: React.ReactNode; className?: string }) {
  return <div className={`cell ${className}`}><span className="cell-label">{label}</span><span className="cell-value">{children || "—"}</span></div>;
}

export function CompanySheet({ company }: { company: SheetCompany }) {
  const partners = company.socios ?? [];
  const emptyRows = Math.max(0, 4 - partners.length);
  return <article className="sheet" aria-label={`Ficha cadastral de ${company.razaoSocial}`}>
    <div className="sheet-content">
      <header className="sheet-header">
        <div className="sheet-logo"><span className="sheet-logo-mark"><i /><i /><i /></span><span><strong>AutCompany</strong><small>GESTÃO CONTÁBIL INTEGRADA</small></span></div>
        <div className="sheet-title">FICHA CADASTRAL</div>
      </header>
      <section className="sheet-box">
        <div className="bar">Qualificação da empresa</div>
        <div className="company-row"><Cell label="Razão Social">{company.razaoSocial}</Cell><Cell label="Tipo de Cliente">{enumLabel(company.tipoCliente)}</Cell></div>
        <div className="company-row"><Cell label="Nome Fantasia">{company.nomeFantasia}</Cell><Cell label="Ranking">{company.ranking}</Cell></div>
        <div className="grid g-3"><Cell label="CNPJ">{company.cnpj}</Cell><Cell label="Inscrição Estadual">{company.inscricaoEstadual}</Cell><Cell label="Inscrição Municipal">{company.inscricaoMunicipal}</Cell></div>
        <div className="company-row"><Cell label="Endereço completo">{[company.endereco, company.numero, company.complemento, company.bairro].filter(Boolean).join(", ")}</Cell><Cell label="CEP">{company.cep}</Cell></div>
        <div className="grid g-4"><Cell label="Ponto de referência">{company.pontoReferencia}</Cell><Cell label="Cidade">{company.cidade}</Cell><Cell label="UF">{company.uf}</Cell><Cell label="E-mail">{company.email}</Cell></div>
        <div className="grid g-3"><Cell label="Responsável/Contabilidade anterior">{company.responsavelAnterior}</Cell><Cell label="Telefone 1">{company.telefone1}</Cell><Cell label="Telefone 2">{company.telefone2}</Cell></div>
        <div className="grid g-4"><Cell label="Capital Social">{currency(company.capitalSocial)}</Cell><Cell label="CNAE principal">{company.cnaePrincipal}</Cell><Cell label="Ramo de atividade">{company.ramoAtividade}</Cell><Cell label="Serviço ou produto">{company.servicoProduto}</Cell></div>
        <Cell label="CNAEs secundários" className="compact">{company.cnaesSecundarios?.join(" • ") || "—"}</Cell>
      </section>
      <section className="sheet-box">
        <div className="partners-head"><div>Titular / Sócios participantes</div><div>CPF</div><div>%</div></div>
        {partners.map((relation: any) => <div className="partner" key={relation.socio.id}><div><strong>{relation.socio.nome}</strong>{relation.cargo ? ` — ${relation.cargo}` : ""}{relation.socio.vinculos?.map((v: any) => <span className="partner-note" key={v.id}>({v.descricao})</span>)}</div><div>{relation.socio.cpf}<span className="partner-note">End.: {relation.socio.endereco}</span></div><div>{relation.participacao == null ? "—" : `${Number(relation.participacao)}%`}</div></div>)}
        {Array.from({ length: emptyRows }).map((_, index) => <div className="partner" key={`empty-${index}`}><div> </div><div> </div><div> </div></div>)}
      </section>
      <section className="sheet-box">
        <div className="bar">Dados adicionais e operação</div>
        <div className="grid g-4"><Cell label="Qtd. funcionários" className="compact">{company.quantidadeFuncionarios}</Cell><Cell label="Tempo de empresa" className="compact">{company.tempoEmpresa}</Cell><Cell label="Data de entrada" className="compact">{date(company.dataEntrada)}</Cell><Cell label="Data da baixa" className="compact">{date(company.dataBaixa)}</Cell></div>
        <div className="inline-data"><strong>Alvarás:</strong> {enumLabel(company.situacaoAlvaras)} &nbsp;&nbsp; <strong>Participa de licitações:</strong> {yesNo(company.participaLicitacoes)} &nbsp;&nbsp; <strong>IRPF Sócios:</strong> {yesNo(company.irpfSociosNaContabilidade)}</div>
        <div className="inline-data"><strong>Regime:</strong> {choice(company.regimeTributario === "SIMPLES_NACIONAL", "Simples Nacional")} &nbsp; {choice(company.regimeTributario === "LUCRO_PRESUMIDO", "Lucro Presumido")} &nbsp; {choice(company.regimeTributario === "LUCRO_REAL", "Lucro Real")} &nbsp; {choice(company.regimeTributario === "MEI", "MEI")}</div>
        <div className="inline-data history"><strong>Histórico de alterações:</strong> {company.historicoAlteracoes?.join(" • ") || "Sem alterações registradas"}</div>
      </section>
      <section className="sheet-box">
        <div className="bar">Financeiro e compliance</div>
        <div className="grid g-3"><Cell label="Última atualização bancária" className="compact">{date(company.dataAtualizacaoBancaria)}</Cell><Cell label="Pendências fiscais" className="compact">{yesNo(company.pendenciasFiscais)}</Cell><Cell label="Ranking" className="compact">{["C", "B", "A", "S", "SS"].map((rank) => choice(company.ranking === rank, rank)).join("   ")}</Cell></div>
      </section>
    </div>
    <footer className="workflow">
      <div className="bar">Tramitação de documentos internos</div>
      <div className="workflow-grid">
        {["Departamento de Legalização", "Departamento Pessoal (DP)", "Departamento Fiscal"].map((department) => <div className="workflow-item" key={department}><span className="workflow-check" />{department}<div className="signature-line">______/______/________<br /><strong>DATA</strong></div></div>)}
      </div>
    </footer>
  </article>;
}
