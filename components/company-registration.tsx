import { currency, date, enumLabel } from "@/lib/format";
import { AlertTriangle, Building2, CalendarClock, FileText, MapPin, Pencil, Phone, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

type Action = (form: FormData) => void | Promise<void>;
type Company = Record<string, any>;

const display = (value: unknown) => value == null || value === "" ? "—" : String(value);
const formattedDocument = (value: string) => {
  const clean = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (clean.length === 14) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
  if (clean.length === 11 && /^\d+$/.test(clean)) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  return value;
};
const phone = (value: string | null | undefined) => {
  const clean = value?.replace(/\D/g, "") ?? "";
  if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return value || "—";
};

function DataItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="data-item"><span>{label}</span><strong>{children || "—"}</strong></div>;
}

function CertificateStatus({ expiration, revoked }: { expiration: Date | string; revoked?: Date | string | null }) {
  if (revoked) return <span className="badge red">Revogado</span>;
  const days = Math.ceil((new Date(expiration).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return <span className="badge red">Vencido há {Math.abs(days)} dias</span>;
  if (days <= 30) return <span className="badge orange">Vence em {days} dias</span>;
  return <span className="badge green">Válido por {days} dias</span>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="section-empty">{children}</p>;
}

export function CompanyRegistration({
  company,
  flash,
  addSocioAction,
  addContatoAction,
  addCertificadoAction,
  addAlteracaoAction,
  addDocumentoAction,
  deleteAction,
}: {
  company: Company;
  flash?: { kind: "success" | "error"; message: string };
  addSocioAction: Action;
  addContatoAction: Action;
  addCertificadoAction: Action;
  addAlteracaoAction: Action;
  addDocumentoAction: Action;
  deleteAction: Action;
}) {
  const certificates = company.certificados ?? [];
  const attentionCertificates = certificates.filter((certificate: any) => !certificate.revogadoEm && new Date(certificate.dataVencimento).getTime() - Date.now() <= 30 * 86_400_000);

  return <main className="registration-shell">
    <Link className="back" href="/">← Voltar para empresas</Link>
    <header className="registration-hero">
      <div className="company-avatar"><Building2 size={28} /></div>
      <div className="registration-heading"><p className="eyebrow">Cadastro da empresa</p><h1>{company.nomeFantasia}</h1><p>{company.razaoSocial} · {formattedDocument(company.cnpj)}</p></div>
      <Link className="button" href={`/empresas/${company.id}/editar`}><Pencil size={16} /> Editar dados principais</Link>
    </header>

    {flash && <div className={`form-alert ${flash.kind === "error" ? "error" : "success"}`} role="status">{flash.message}</div>}
    {attentionCertificates.length > 0 && <div className="attention-card"><AlertTriangle size={20} /><div><strong>Certificados que exigem atenção</strong><p>{attentionCertificates.length} certificado(s) vencido(s) ou com vencimento nos próximos 30 dias.</p></div><a href="#certificados">Ver certificados</a></div>}

    <nav className="section-nav" aria-label="Seções do cadastro">
      <a href="#dados">Dados principais</a><a href="#socios">Sócios</a><a href="#contatos">Contatos</a><a href="#certificados">Certificados</a><a href="#historico">Histórico</a><a href="#documentos">Documentos</a>
    </nav>

    <section className="registration-panel" id="dados">
      <div className="registration-panel-head"><div><p className="eyebrow">Visão cadastral</p><h2>Dados principais</h2></div></div>
      <div className="data-group"><h3>Identificação</h3><div className="data-grid">
        <DataItem label="CNPJ">{formattedDocument(company.cnpj)}</DataItem><DataItem label="Data de abertura">{date(company.dataAbertura)}</DataItem><DataItem label="Porte">{display(company.porte)}</DataItem><DataItem label="Natureza jurídica">{display(company.naturezaJuridica)}</DataItem>
        <DataItem label="Situação cadastral">{display(company.situacaoCadastral)}</DataItem><DataItem label="Data da situação">{date(company.dataSituacaoCadastral)}</DataItem><DataItem label="Inscrição estadual">{display(company.inscricaoEstadual)}</DataItem><DataItem label="Inscrição municipal">{display(company.inscricaoMunicipal)}</DataItem><DataItem label="NIRE">{display(company.nire)}</DataItem>
      </div></div>
      <div className="data-group"><h3><MapPin size={16} /> Endereço e contato principal</h3><div className="data-grid">
        <DataItem label="Endereço">{[company.endereco, company.numero, company.complemento, company.bairro].filter(Boolean).join(", ")}</DataItem><DataItem label="Cidade/UF">{company.cidade}/{company.uf}</DataItem><DataItem label="CEP">{display(company.cep)}</DataItem><DataItem label="E-mail">{display(company.email)}</DataItem><DataItem label="Telefone 1">{phone(company.telefone1)}</DataItem><DataItem label="Telefone 2">{phone(company.telefone2)}</DataItem>
      </div></div>
      <div className="data-group"><h3>Atividade e escritório</h3><div className="data-grid">
        <DataItem label="Capital social">{currency(company.capitalSocial)}</DataItem><DataItem label="CNAE principal">{display(company.cnaePrincipal)}</DataItem><DataItem label="Ramo">{display(company.ramoAtividade)}</DataItem><DataItem label="Serviço/produto">{display(company.servicoProduto)}</DataItem><DataItem label="Regime tributário">{enumLabel(company.regimeTributario)}</DataItem><DataItem label="Entrada no escritório">{date(company.dataEntrada)}</DataItem><DataItem label="Responsável interno">{display(company.responsavelInterno)}</DataItem><DataItem label="Tipo de cliente">{enumLabel(company.tipoCliente)}</DataItem><DataItem label="Ranking">{company.ranking}</DataItem>
      </div></div>
      {company.observacoesInternas && <div className="internal-note"><strong>Observações internas</strong><p>{company.observacoesInternas}</p></div>}
    </section>

    <section className="registration-panel" id="socios">
      <div className="registration-panel-head"><div><Users size={20} /><div><p className="eyebrow">Quadro societário</p><h2>Sócios e titular</h2></div></div><span className="count-pill">{company.socios.length}</span></div>
      <div className="record-list">{company.socios.length ? company.socios.map((relation: any) => <article className="record-card" key={relation.socio.id}>
        <div><strong>{relation.socio.nome}</strong><p>{relation.cargo || "Cargo não informado"}{relation.administrador ? " · Administrador" : ""}</p></div>
        <div><span>CPF</span><strong>{formattedDocument(relation.socio.cpf)}</strong></div><div><span>Participação</span><strong>{relation.participacao == null ? "—" : `${Number(relation.participacao)}%`}</strong></div><div><span>Período</span><strong>{date(relation.dataEntrada)} → {date(relation.dataSaida)}</strong></div>
      </article>) : <Empty>Nenhum sócio cadastrado.</Empty>}</div>
      <details className="inline-form"><summary>Adicionar ou atualizar sócio</summary><form action={addSocioAction} className="form-grid">
        <div className="field span-6"><label htmlFor="nome">Nome *</label><input id="nome" required name="nome" /></div><div className="field"><label htmlFor="cpf">CPF *</label><input id="cpf" required name="cpf" inputMode="numeric" /></div><div className="field"><label htmlFor="participacao">Participação (%)</label><input id="participacao" type="number" min="0" max="100" step="0.01" name="participacao" /></div>
        <div className="field span-6"><label htmlFor="enderecoSocio">Endereço *</label><input id="enderecoSocio" required name="enderecoSocio" /></div><div className="field"><label htmlFor="telefoneSocio">Telefone</label><input id="telefoneSocio" name="telefoneSocio" /></div><div className="field"><label htmlFor="emailSocio">E-mail</label><input id="emailSocio" type="email" name="emailSocio" /></div>
        <div className="field"><label htmlFor="cargo">Cargo</label><input id="cargo" name="cargo" /></div><div className="field"><label htmlFor="dataEntradaSocio">Data de entrada</label><input id="dataEntradaSocio" type="date" name="dataEntradaSocio" /></div><div className="field"><label htmlFor="dataSaidaSocio">Data de saída</label><input id="dataSaidaSocio" type="date" name="dataSaidaSocio" /></div><label className="check-field"><input type="checkbox" name="administrador" /> Administrador</label>
        <div className="field"><label htmlFor="vinculoTipo">Tipo de vínculo adicional</label><select id="vinculoTipo" name="vinculoTipo"><option value="SOCIO_EM_OUTRA_EMPRESA">Sócio em outra empresa</option><option value="VINCULO_DE_INTERESSE">Vínculo de interesse</option></select></div><div className="field span-8"><label htmlFor="vinculoDescricao">Descrição do vínculo</label><input id="vinculoDescricao" name="vinculoDescricao" /></div>
        <div className="form-actions span-12"><button className="button" type="submit">Salvar sócio</button></div>
      </form></details>
    </section>

    <section className="registration-panel" id="contatos">
      <div className="registration-panel-head"><div><Phone size={20} /><div><p className="eyebrow">Comunicação</p><h2>Contatos por área</h2></div></div><span className="count-pill">{company.contatos.length}</span></div>
      <div className="record-list">{company.contatos.length ? company.contatos.map((contact: any) => <article className="record-card" key={contact.id}>
        <div><strong>{contact.nome}{contact.principal ? " · Principal" : ""}</strong><p>{enumLabel(contact.tipo)}{contact.cargo ? ` · ${contact.cargo}` : ""}</p></div><div><span>Telefone</span><strong>{phone(contact.telefone)}</strong></div><div><span>WhatsApp</span><strong>{phone(contact.whatsapp)}</strong></div><div><span>E-mail</span><strong>{contact.email || "—"}</strong></div>
      </article>) : <Empty>Nenhum contato adicional cadastrado.</Empty>}</div>
      <details className="inline-form"><summary>Adicionar contato</summary><form action={addContatoAction} className="form-grid">
        <div className="field span-6"><label htmlFor="nomeContato">Nome *</label><input id="nomeContato" required name="nomeContato" /></div><div className="field"><label htmlFor="cargoContato">Cargo/função</label><input id="cargoContato" name="cargoContato" /></div><div className="field"><label htmlFor="tipoContato">Área</label><select id="tipoContato" name="tipoContato"><option value="PRINCIPAL">Principal</option><option value="SOCIETARIO">Societário</option><option value="FISCAL">Fiscal</option><option value="CONTABIL">Contábil</option><option value="DEPARTAMENTO_PESSOAL">Departamento pessoal</option><option value="FINANCEIRO">Financeiro</option><option value="OUTRO">Outro</option></select></div>
        <div className="field"><label htmlFor="telefoneContato">Telefone</label><input id="telefoneContato" name="telefoneContato" /></div><div className="field"><label htmlFor="whatsappContato">WhatsApp</label><input id="whatsappContato" name="whatsappContato" /></div><div className="field span-6"><label htmlFor="emailContato">E-mail</label><input id="emailContato" type="email" name="emailContato" /></div><label className="check-field"><input type="checkbox" name="contatoPrincipal" /> Contato principal</label><div className="field span-8"><label htmlFor="observacoesContato">Observações</label><input id="observacoesContato" name="observacoesContato" /></div>
        <div className="form-actions span-12"><button className="button" type="submit">Adicionar contato</button></div>
      </form></details>
    </section>

    <section className="registration-panel" id="certificados">
      <div className="registration-panel-head"><div><ShieldCheck size={20} /><div><p className="eyebrow">Controle de validade</p><h2>Certificados digitais PJ e PF</h2></div></div><span className="count-pill">{certificates.length}</span></div>
      <p className="security-note">Por segurança, o sistema não armazena senhas nem arquivos de certificado.</p>
      <div className="record-list">{certificates.length ? certificates.map((certificate: any) => <article className="record-card" key={certificate.id}>
        <div><strong>{certificate.titularNome}</strong><p>{certificate.titularTipo} · {certificate.tipo} · {formattedDocument(certificate.titularDocumento)}</p></div><div><span>Emissão</span><strong>{date(certificate.dataEmissao)}</strong></div><div><span>Vencimento</span><strong>{date(certificate.dataVencimento)}</strong></div><CertificateStatus expiration={certificate.dataVencimento} revoked={certificate.revogadoEm} />
      </article>) : <Empty>Nenhum certificado cadastrado.</Empty>}</div>
      <details className="inline-form"><summary>Adicionar certificado</summary><form action={addCertificadoAction} className="form-grid">
        <div className="field"><label htmlFor="titularTipo">Titular</label><select id="titularTipo" name="titularTipo"><option value="PJ">Pessoa jurídica</option><option value="PF">Pessoa física</option></select></div><div className="field span-6"><label htmlFor="titularNome">Nome do titular *</label><input id="titularNome" required name="titularNome" /></div><div className="field"><label htmlFor="titularDocumento">CPF/CNPJ *</label><input id="titularDocumento" required name="titularDocumento" /></div>
        <div className="field"><label htmlFor="tipoCertificado">Tipo</label><select id="tipoCertificado" name="tipoCertificado"><option value="A1">A1</option><option value="A3">A3</option><option value="NUVEM">Nuvem</option><option value="OUTRO">Outro</option></select></div><div className="field"><label htmlFor="emissora">Autoridade emissora</label><input id="emissora" name="emissora" /></div><div className="field"><label htmlFor="dataEmissao">Emissão</label><input id="dataEmissao" type="date" name="dataEmissao" /></div><div className="field"><label htmlFor="dataVencimento">Vencimento *</label><input id="dataVencimento" required type="date" name="dataVencimento" /></div><div className="field span-8"><label htmlFor="observacoesCertificado">Observações</label><input id="observacoesCertificado" name="observacoesCertificado" /></div>
        <div className="form-actions span-12"><button className="button" type="submit">Adicionar certificado</button></div>
      </form></details>
    </section>

    <section className="registration-panel" id="historico">
      <div className="registration-panel-head"><div><CalendarClock size={20} /><div><p className="eyebrow">Linha do tempo</p><h2>Histórico de alterações</h2></div></div><span className="count-pill">{company.alteracoes.length}</span></div>
      <div className="timeline">{company.alteracoes.length ? company.alteracoes.map((change: any) => <article key={change.id}><time>{date(change.data)}</time><div><span className="badge">{enumLabel(change.tipo)}</span><h3>{change.descricao}</h3>{change.observacoes && <p>{change.observacoes}</p>}</div></article>) : <Empty>Nenhuma alteração estruturada registrada.</Empty>}</div>
      {company.historicoAlteracoes?.length > 0 && <div className="legacy-history"><strong>Registros anteriores</strong><ul>{company.historicoAlteracoes.map((item: string, index: number) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>}
      <details className="inline-form"><summary>Registrar alteração</summary><form action={addAlteracaoAction} className="form-grid">
        <div className="field"><label htmlFor="dataAlteracao">Data *</label><input id="dataAlteracao" required type="date" name="dataAlteracao" /></div><div className="field"><label htmlFor="tipoAlteracao">O que foi alterado</label><select id="tipoAlteracao" name="tipoAlteracao"><option value="ENDERECO">Endereço</option><option value="ATIVIDADES">Atividades/CNAEs</option><option value="RAZAO_SOCIAL">Razão social</option><option value="CAPITAL_SOCIAL">Capital social</option><option value="REGIME_TRIBUTARIO">Regime tributário</option><option value="CONTATOS">Contatos</option><option value="SOCIOS_ENTRADA">Entrada de sócio</option><option value="SOCIOS_SAIDA">Saída de sócio</option><option value="SOCIOS_ENTRADA_E_SAIDA">Entrada e saída de sócios</option><option value="SEM_ALTERACAO_SOCIOS">Sem alteração de sócios</option><option value="OUTRA">Outra</option></select></div><div className="field span-6"><label htmlFor="descricaoAlteracao">Descrição objetiva *</label><input id="descricaoAlteracao" required name="descricaoAlteracao" placeholder="Ex.: alteração do endereço da sede" /></div><div className="field span-12"><label htmlFor="observacoesAlteracao">Observações</label><textarea id="observacoesAlteracao" name="observacoesAlteracao" /></div>
        <div className="form-actions span-12"><button className="button" type="submit">Registrar alteração</button></div>
      </form></details>
    </section>

    <section className="registration-panel" id="documentos">
      <div className="registration-panel-head"><div><FileText size={20} /><div><p className="eyebrow">Arquivos de apoio</p><h2>Documentos</h2></div></div><span className="count-pill">{company.documentos.length}</span></div>
      <div className="document-grid">{company.documentos.length ? company.documentos.map((document: any) => <a className="document-card" key={document.id} href={`/empresas/${company.id}/documentos/${document.id}`} target="_blank" rel="noreferrer"><FileText size={20} /><span><strong>{document.nomeArquivo}</strong><small>{enumLabel(document.tipo)} · {(document.tamanho / 1024).toFixed(1)} KB</small></span></a>) : <Empty>Nenhum documento anexado.</Empty>}</div>
      <details className="inline-form"><summary>Anexar documento</summary><form action={addDocumentoAction} className="form-grid" encType="multipart/form-data">
        <div className="field"><label htmlFor="tipoDocumento">Tipo</label><select id="tipoDocumento" name="tipoDocumento"><option value="CARTAO_CNPJ">Cartão CNPJ</option><option value="CONTRATO_SOCIAL">Contrato social</option><option value="ALTERACAO_CONTRATUAL">Alteração contratual</option><option value="BIC">BIC</option><option value="TEC">TEC</option><option value="ALVARA">Alvará</option><option value="OUTRO">Outro</option></select></div><div className="field span-6"><label htmlFor="documento">Arquivo *</label><input id="documento" required type="file" name="documento" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" /></div><div className="field span-6"><label htmlFor="observacoesDocumento">Observações</label><input id="observacoesDocumento" name="observacoesDocumento" /></div>
        <div className="form-actions span-12"><button className="button" type="submit">Anexar documento</button></div>
      </form></details>
    </section>

    <section className="danger-zone" id="exclusao"><div><strong>Excluir empresa</strong><p>Esta ação também remove contatos, certificados, histórico, documentos e vínculos.</p></div><form action={deleteAction}><label className="delete-confirm"><input required type="checkbox" name="confirmarExclusao" /> Confirmo a exclusão permanente</label><button className="button danger" type="submit">Excluir empresa</button></form></section>
  </main>;
}
