import { currency, date, enumLabel } from "@/lib/format";
import { Building2, CalendarClock, FileText, MapPin, Pencil, Phone, Printer, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

type Company = Record<string, any>;
type FormAction = (form: FormData) => void | Promise<void>;
type UpdateAction = (id: string, form: FormData) => void | Promise<void>;
type ToggleAction = (id: string, active: boolean) => void | Promise<void>;
type NoArgAction = () => void | Promise<void>;

const display = (value: unknown) => value == null || value === "" ? "—" : String(value);
const phone = (value: unknown) => {
  const clean = String(value ?? "").replace(/\D/g, "");
  if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return value ? String(value) : "—";
};
const formattedDocument = (value: unknown) => {
  const clean = String(value ?? "").replace(/\D/g, "");
  if (clean.length === 11) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  if (clean.length === 14) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
  return value ? String(value) : "—";
};
const iso = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 10) : "";

function DataItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="data-item"><span>{label}</span><strong>{children || "—"}</strong></div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="section-empty">{children}</p>;
}

function PartnerForm({ action, relation }: { action: FormAction; relation?: any }) {
  const partner = relation?.socio;
  return <form action={action} className="form-grid">
    <div className="field span-6"><label htmlFor={`nome-${partner?.id ?? "novo"}`}>Nome *</label><input id={`nome-${partner?.id ?? "novo"}`} required name="nome" defaultValue={partner?.nome ?? ""} /></div>
    <div className="field"><label htmlFor={`cpf-${partner?.id ?? "novo"}`}>CPF *</label><input id={`cpf-${partner?.id ?? "novo"}`} required name="cpf" inputMode="numeric" defaultValue={partner?.cpf ?? ""} readOnly={Boolean(partner)} /></div>
    <div className="field"><label htmlFor={`participacao-${partner?.id ?? "novo"}`}>Participação (%)</label><input id={`participacao-${partner?.id ?? "novo"}`} type="number" min="0" max="100" step="0.01" name="participacao" defaultValue={relation?.participacao == null ? "" : String(relation.participacao)} /></div>
    <div className="field span-6"><label htmlFor={`enderecoSocio-${partner?.id ?? "novo"}`}>Endereço *</label><input id={`enderecoSocio-${partner?.id ?? "novo"}`} required name="enderecoSocio" defaultValue={partner?.endereco ?? ""} /></div>
    <div className="field"><label htmlFor={`telefoneSocio-${partner?.id ?? "novo"}`}>Telefone</label><input id={`telefoneSocio-${partner?.id ?? "novo"}`} name="telefoneSocio" defaultValue={partner?.telefone ?? ""} /></div>
    <div className="field"><label htmlFor={`emailSocio-${partner?.id ?? "novo"}`}>E-mail</label><input id={`emailSocio-${partner?.id ?? "novo"}`} type="email" name="emailSocio" defaultValue={partner?.email ?? ""} /></div>
    <div className="field"><label htmlFor={`cargo-${partner?.id ?? "novo"}`}>Cargo</label><input id={`cargo-${partner?.id ?? "novo"}`} name="cargo" defaultValue={relation?.cargo ?? ""} /></div>
    <div className="field"><label htmlFor={`entrada-${partner?.id ?? "novo"}`}>Data de entrada</label><input id={`entrada-${partner?.id ?? "novo"}`} type="date" name="dataEntradaSocio" defaultValue={iso(relation?.dataEntrada)} /></div>
    <div className="field"><label htmlFor={`saida-${partner?.id ?? "novo"}`}>Data de saída</label><input id={`saida-${partner?.id ?? "novo"}`} type="date" name="dataSaidaSocio" defaultValue={iso(relation?.dataSaida)} /></div>
    <label className="check-field"><input type="checkbox" name="administrador" defaultChecked={Boolean(relation?.administrador)} /> Administrador</label>
    {!partner ? <><div className="field"><label htmlFor="vinculoTipo">Tipo de vínculo adicional</label><select id="vinculoTipo" name="vinculoTipo"><option value="SOCIO_EM_OUTRA_EMPRESA">Sócio em outra empresa</option><option value="VINCULO_DE_INTERESSE">Vínculo de interesse</option></select></div><div className="field span-8"><label htmlFor="vinculoDescricao">Descrição do vínculo</label><input id="vinculoDescricao" name="vinculoDescricao" /></div></> : null}
    <div className="form-actions span-12"><button className="button" type="submit">Salvar sócio</button></div>
  </form>;
}

function ContactForm({ action, contact }: { action: FormAction; contact?: any }) {
  const suffix = contact?.id ?? "novo";
  return <form action={action} className="form-grid">
    <div className="field span-6"><label htmlFor={`nomeContato-${suffix}`}>Nome *</label><input id={`nomeContato-${suffix}`} required name="nomeContato" defaultValue={contact?.nome ?? ""} /></div>
    <div className="field"><label htmlFor={`cargoContato-${suffix}`}>Cargo/função</label><input id={`cargoContato-${suffix}`} name="cargoContato" defaultValue={contact?.cargo ?? ""} /></div>
    <div className="field"><label htmlFor={`tipoContato-${suffix}`}>Área</label><select id={`tipoContato-${suffix}`} name="tipoContato" defaultValue={contact?.tipo ?? "PRINCIPAL"}><option value="PRINCIPAL">Principal</option><option value="SOCIETARIO">Societário</option><option value="FISCAL">Fiscal</option><option value="CONTABIL">Contábil</option><option value="DEPARTAMENTO_PESSOAL">Departamento pessoal</option><option value="FINANCEIRO">Financeiro</option><option value="OUTRO">Outro</option></select></div>
    <div className="field"><label htmlFor={`telefoneContato-${suffix}`}>Telefone</label><input id={`telefoneContato-${suffix}`} name="telefoneContato" defaultValue={contact?.telefone ?? ""} /></div>
    <div className="field"><label htmlFor={`whatsappContato-${suffix}`}>WhatsApp</label><input id={`whatsappContato-${suffix}`} name="whatsappContato" defaultValue={contact?.whatsapp ?? ""} /></div>
    <div className="field span-6"><label htmlFor={`emailContato-${suffix}`}>E-mail</label><input id={`emailContato-${suffix}`} type="email" name="emailContato" defaultValue={contact?.email ?? ""} /></div>
    <label className="check-field"><input type="checkbox" name="contatoPrincipal" defaultChecked={Boolean(contact?.principal)} /> Contato principal</label>
    <div className="field span-8"><label htmlFor={`observacoesContato-${suffix}`}>Observações</label><input id={`observacoesContato-${suffix}`} name="observacoesContato" defaultValue={contact?.observacoes ?? ""} /></div>
    <div className="form-actions span-12"><button className="button" type="submit">Salvar contato</button></div>
  </form>;
}

function CertificateForm({ action, certificate }: { action: FormAction; certificate?: any }) {
  const suffix = certificate?.id ?? "novo";
  return <form action={action} className="form-grid">
    <div className="field"><label htmlFor={`titularTipo-${suffix}`}>Titular</label><select id={`titularTipo-${suffix}`} name="titularTipo" defaultValue={certificate?.titularTipo ?? "PJ"}><option value="PJ">Pessoa jurídica</option><option value="PF">Pessoa física</option></select></div>
    <div className="field"><label htmlFor={`dataEmissao-${suffix}`}>Emissão *</label><input id={`dataEmissao-${suffix}`} required type="date" name="dataEmissao" defaultValue={iso(certificate?.dataEmissao)} /></div>
    <div className="field"><label htmlFor={`dataVencimento-${suffix}`}>Vencimento *</label><input id={`dataVencimento-${suffix}`} required type="date" name="dataVencimento" defaultValue={iso(certificate?.dataVencimento)} /></div>
    <div className="form-actions span-12"><button className="button" type="submit">Salvar certificado</button></div>
  </form>;
}

export function CompanyRegistration({
  company, canEdit, flash, addSocioAction, addContatoAction, updateContatoAction, setContatoAtivoAction, addCertificadoAction, updateCertificadoAction,
  removeCertificadoAction, addAlteracaoAction, addDocumentoAction, removeDocumentoAction, inactivateAction, reactivateAction,
}: {
  company: Company;
  canEdit: boolean;
  flash?: { kind: "success" | "error"; message: string };
  addSocioAction: FormAction;
  addContatoAction: FormAction;
  updateContatoAction: UpdateAction;
  setContatoAtivoAction: ToggleAction;
  addCertificadoAction: FormAction;
  updateCertificadoAction: UpdateAction;
  removeCertificadoAction: (id: string) => void | Promise<void>;
  addAlteracaoAction: FormAction;
  addDocumentoAction: FormAction;
  removeDocumentoAction: (id: string) => void | Promise<void>;
  inactivateAction: FormAction;
  reactivateAction: NoArgAction;
}) {
  const activeContacts = company.contatos.filter((contact: any) => contact.ativo);
  return <main className="registration-shell">
    <Link className="back" href="/">← Voltar para empresas</Link>
    <header className="registration-hero">
      <div className="company-avatar"><Building2 size={28} /></div>
      <div className="registration-heading"><p className="eyebrow">Cadastro da empresa</p><h1>{company.nomeFantasia}</h1><p>{company.razaoSocial} · {formattedDocument(company.cnpj)} · <span className={`badge ${company.status === "ATIVA" ? "green" : "red"}`}>{enumLabel(company.status)}</span></p></div>
      <div className="hero-actions"><Link className="button" href={`/empresas/${company.id}/ficha`}><Printer size={16} /> Abrir ficha</Link>{canEdit ? <Link className="button" href={`/empresas/${company.id}/editar`}><Pencil size={16} /> Editar</Link> : null}</div>
    </header>
    {flash ? <div className={`form-alert ${flash.kind === "error" ? "error" : ""}`} role="status">{flash.message}</div> : null}

    <nav className="section-nav" aria-label="Seções do cadastro"><a href="#dados">Dados</a><a href="#situacao">Situação</a><a href="#socios">Sócios</a><a href="#contatos">Contatos</a><a href="#certificados">Certificados</a><a href="#historico">Histórico</a><a href="#documentos">Documentos</a></nav>

    <section className="registration-panel" id="dados">
      <div className="registration-panel-head"><div><p className="eyebrow">Visão cadastral</p><h2>Dados principais</h2></div></div>
      <div className="data-group"><h3>Identificação</h3><div className="data-grid"><DataItem label="CNPJ">{formattedDocument(company.cnpj)}</DataItem><DataItem label="Data de abertura">{date(company.dataAbertura)}</DataItem><DataItem label="Porte">{display(company.porte)}</DataItem><DataItem label="Natureza jurídica">{display(company.naturezaJuridica)}</DataItem><DataItem label="Situação cadastral">{display(company.situacaoCadastral)}</DataItem><DataItem label="Inscrição estadual">{display(company.inscricaoEstadual)}</DataItem><DataItem label="Inscrição municipal">{display(company.inscricaoMunicipal)}</DataItem><DataItem label="NIRE">{display(company.nire)}</DataItem></div></div>
      <div className="data-group"><h3><MapPin size={16} /> Endereço e contato</h3><div className="data-grid"><DataItem label="Endereço">{[company.endereco, company.numero, company.complemento, company.bairro].filter(Boolean).join(", ")}</DataItem><DataItem label="Cidade/UF">{company.cidade}/{company.uf}</DataItem><DataItem label="CEP">{display(company.cep)}</DataItem><DataItem label="E-mail">{display(company.email)}</DataItem><DataItem label="Telefone 1">{phone(company.telefone1)}</DataItem><DataItem label="Telefone 2">{phone(company.telefone2)}</DataItem></div></div>
      <div className="data-group"><h3>Atividade e escritório</h3><div className="data-grid"><DataItem label="Capital social">{currency(company.capitalSocial)}</DataItem><DataItem label="CNAE principal">{display(company.cnaePrincipal)}</DataItem><DataItem label="Ramo">{display(company.ramoAtividade)}</DataItem><DataItem label="Serviço/produto">{display(company.servicoProduto)}</DataItem><DataItem label="Regime tributário">{enumLabel(company.regimeTributario)}</DataItem><DataItem label="Entrada no escritório">{date(company.dataEntrada)}</DataItem><DataItem label="Responsável interno">{display(company.responsavelInterno)}</DataItem><DataItem label="Tipo de cliente">{enumLabel(company.tipoCliente)}</DataItem></div></div>
      {company.observacoesInternas ? <div className="internal-note"><strong>Observações internas</strong><p>{company.observacoesInternas}</p></div> : null}
    </section>

    <section className="registration-panel" id="situacao"><div className="registration-panel-head"><div><ShieldCheck size={20} /><div><p className="eyebrow">Ciclo de atendimento</p><h2>{company.status === "ATIVA" ? "Empresa ativa" : "Empresa inativa"}</h2></div></div></div>
      {company.status === "INATIVA" ? <div className="inactive-summary"><p><strong>Saída:</strong> {date(company.dataSaidaEscritorio)}</p><p><strong>Motivo:</strong> {display(company.motivoSaidaEscritorio)}</p>{canEdit ? <form action={reactivateAction}><button className="button" type="submit">Reativar empresa</button></form> : null}</div> : canEdit ? <details className="inline-form"><summary>Inativar empresa</summary><form action={inactivateAction} className="form-grid"><div className="field"><label htmlFor="dataSaida">Data de saída *</label><input id="dataSaida" name="dataSaida" type="date" required /></div><div className="field span-8"><label htmlFor="motivo">Motivo *</label><input id="motivo" name="motivo" required /></div><div className="form-actions span-12"><button className="button danger" type="submit">Inativar sem apagar dados</button></div></form></details> : <p className="security-note">Somente administradores e operadores podem inativar empresas.</p>}
    </section>

    <section className="registration-panel" id="socios"><div className="registration-panel-head"><div><Users size={20} /><div><p className="eyebrow">Quadro societário</p><h2>Sócios e titular</h2></div></div><span className="count-pill">{company.socios.length}</span></div>
      <div className="record-list">{company.socios.length ? company.socios.map((relation: any) => <article className={`record-card ${relation.dataSaida ? "inactive-record" : ""}`} key={relation.socio.id}><div><strong>{relation.socio.nome}</strong><p>{relation.cargo || "Cargo não informado"}{relation.dataSaida ? " · Sócio retirante" : relation.administrador ? " · Administrador" : ""}</p></div><div><span>CPF</span><strong>{formattedDocument(relation.socio.cpf)}</strong></div><div><span>Participação</span><strong>{relation.participacao == null ? "—" : `${Number(relation.participacao)}%`}</strong></div><div><span>Período</span><strong>{date(relation.dataEntrada)} → {date(relation.dataSaida)}</strong></div>{canEdit ? <details className="record-editor"><summary>Editar/registrar saída</summary><PartnerForm action={addSocioAction} relation={relation} /></details> : null}</article>) : <Empty>Nenhum sócio cadastrado.</Empty>}</div>
      {canEdit ? <details className="inline-form"><summary>Adicionar sócio</summary><PartnerForm action={addSocioAction} /></details> : null}
    </section>

    <section className="registration-panel" id="contatos"><div className="registration-panel-head"><div><Phone size={20} /><div><p className="eyebrow">Comunicação</p><h2>Contatos por área</h2></div></div><span className="count-pill">{activeContacts.length}</span></div>
      <div className="record-list">{company.contatos.length ? company.contatos.map((contact: any) => <article className={`record-card ${contact.ativo ? "" : "inactive-record"}`} key={contact.id}><div><strong>{contact.nome}{contact.principal ? " · Principal" : ""}</strong><p>{enumLabel(contact.tipo)}{contact.ativo ? "" : " · Inativo"}</p></div><div><span>Telefone</span><strong>{phone(contact.telefone)}</strong></div><div><span>WhatsApp</span><strong>{phone(contact.whatsapp)}</strong></div><div><span>E-mail</span><strong>{contact.email || "—"}</strong></div>{canEdit ? <div className="record-actions"><details className="record-editor"><summary>Editar</summary><ContactForm action={updateContatoAction.bind(null, contact.id)} contact={contact} /></details><form action={setContatoAtivoAction.bind(null, contact.id, !contact.ativo)}><button className="button secondary" type="submit">{contact.ativo ? "Inativar" : "Reativar"}</button></form></div> : null}</article>) : <Empty>Nenhum contato cadastrado.</Empty>}</div>
      {canEdit ? <details className="inline-form"><summary>Adicionar contato</summary><ContactForm action={addContatoAction} /></details> : null}
    </section>

    <section className="registration-panel" id="certificados"><div className="registration-panel-head"><div><ShieldCheck size={20} /><div><p className="eyebrow">Controle mínimo</p><h2>Certificados PJ e PF</h2></div></div><span className="count-pill">{company.certificados.length}</span></div>
      <p className="security-note">São armazenados somente empresa, PJ/PF, emissão e vencimento. O sistema não armazena arquivo, senha ou documento do titular. <Link href="/certificados">Abrir lista geral</Link>.</p>
      <div className="record-list">{company.certificados.length ? company.certificados.map((certificate: any) => <article className="record-card" key={certificate.id}><div><strong>{certificate.titularTipo === "PJ" ? "Pessoa jurídica" : "Pessoa física"}</strong><p>Certificado vinculado a {company.nomeFantasia}</p></div><div><span>Emissão</span><strong>{date(certificate.dataEmissao)}</strong></div><div><span>Vencimento</span><strong>{date(certificate.dataVencimento)}</strong></div><div><span>Histórico legado</span><strong>{certificate.tipo ? enumLabel(certificate.tipo) : "Sem dados adicionais"}</strong></div>{canEdit ? <div className="record-actions"><details className="record-editor"><summary>Corrigir datas</summary><CertificateForm action={updateCertificadoAction.bind(null, certificate.id)} certificate={certificate} /></details><form action={removeCertificadoAction.bind(null, certificate.id)}><button className="button secondary" type="submit">Remover do controle</button></form></div> : null}</article>) : <Empty>Nenhum certificado cadastrado.</Empty>}</div>
      {canEdit ? <details className="inline-form"><summary>Registrar novo certificado ou renovação</summary><CertificateForm action={addCertificadoAction} /></details> : null}
    </section>

    <section className="registration-panel" id="historico"><div className="registration-panel-head"><div><CalendarClock size={20} /><div><p className="eyebrow">Linha do tempo</p><h2>Histórico cadastral</h2></div></div><span className="count-pill">{company.alteracoes.length}</span></div>
      <div className="timeline">{company.alteracoes.length ? company.alteracoes.map((change: any) => <article key={change.id}><time>{date(change.data)}</time><div><span className="badge">{enumLabel(change.tipo)}</span><h3>{change.descricao}</h3><p>{change.origem === "AUTOMATICA" ? `Automática${change.usuario?.nome ? ` · ${change.usuario.nome}` : ""}` : `Manual${change.usuario?.nome ? ` · ${change.usuario.nome}` : ""}`}</p>{change.observacoes ? <p>{change.observacoes}</p> : null}</div></article>) : <Empty>Nenhuma alteração estruturada registrada.</Empty>}</div>
      {company.historicoAlteracoes?.length ? <div className="legacy-history"><strong>Registros anteriores</strong><ul>{company.historicoAlteracoes.map((item: string, index: number) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div> : null}
      {canEdit ? <details className="inline-form"><summary>Registrar evento manual</summary><form action={addAlteracaoAction} className="form-grid"><div className="field"><label htmlFor="dataAlteracao">Data *</label><input id="dataAlteracao" required type="date" name="dataAlteracao" /></div><div className="field"><label htmlFor="tipoAlteracao">Tipo</label><select id="tipoAlteracao" name="tipoAlteracao"><option value="ENDERECO">Endereço</option><option value="ATIVIDADES">Atividades/CNAEs</option><option value="RAZAO_SOCIAL">Razão social</option><option value="CAPITAL_SOCIAL">Capital social</option><option value="REGIME_TRIBUTARIO">Regime tributário</option><option value="CONTATOS">Contatos</option><option value="SOCIOS_ENTRADA">Entrada de sócio</option><option value="SOCIOS_SAIDA">Saída de sócio</option><option value="SOCIOS_ENTRADA_E_SAIDA">Entrada e saída</option><option value="SEM_ALTERACAO_SOCIOS">Sem alteração de sócios</option><option value="OUTRA">Outra</option></select></div><div className="field span-6"><label htmlFor="descricaoAlteracao">Descrição *</label><input id="descricaoAlteracao" required name="descricaoAlteracao" /></div><div className="field span-12"><label htmlFor="observacoesAlteracao">Observações</label><textarea id="observacoesAlteracao" name="observacoesAlteracao" /></div><div className="form-actions span-12"><button className="button" type="submit">Registrar alteração</button></div></form></details> : null}
    </section>

    <section className="registration-panel" id="documentos"><div className="registration-panel-head"><div><FileText size={20} /><div><p className="eyebrow">Arquivos de apoio</p><h2>Documentos</h2></div></div><span className="count-pill">{company.documentos.length}</span></div>
      <div className="document-grid">{company.documentos.length ? company.documentos.map((document: any) => <article className="document-card-wrap" key={document.id}><a className="document-card" href={`/empresas/${company.id}/documentos/${document.id}`} target="_blank" rel="noreferrer"><FileText size={20} /><span><strong>{document.nomeArquivo}</strong><small>{enumLabel(document.tipo)} · {(document.tamanho / 1024).toFixed(1)} KB</small></span></a>{canEdit ? <form action={removeDocumentoAction.bind(null, document.id)}><button className="text-button danger-text" type="submit">Remover</button></form> : null}</article>) : <Empty>Nenhum documento anexado.</Empty>}</div>
      {canEdit ? <details className="inline-form"><summary>Anexar documento</summary><form action={addDocumentoAction} className="form-grid" encType="multipart/form-data"><div className="field"><label htmlFor="tipoDocumento">Tipo</label><select id="tipoDocumento" name="tipoDocumento"><option value="CARTAO_CNPJ">Cartão CNPJ</option><option value="CONTRATO_SOCIAL">Contrato social</option><option value="ALTERACAO_CONTRATUAL">Alteração contratual</option><option value="BIC">BIC</option><option value="TEC">TEC</option><option value="ALVARA">Alvará</option><option value="OUTRO">Outro</option></select></div><div className="field span-6"><label htmlFor="documento">Arquivo *</label><input id="documento" required type="file" name="documento" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" /></div><div className="field span-6"><label htmlFor="observacoesDocumento">Observações</label><input id="observacoesDocumento" name="observacoesDocumento" /></div><div className="form-actions span-12"><button className="button" type="submit">Anexar documento</button></div></form></details> : null}
    </section>
  </main>;
}
