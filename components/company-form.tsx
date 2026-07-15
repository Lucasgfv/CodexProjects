"use client";

import { INITIAL_COMPANY_ACTION_STATE, type CompanyActionState } from "@/lib/company-validation";
import { FileUp, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";

type Company = Record<string, unknown>;
type CompanyAction = (state: CompanyActionState, form: FormData) => Promise<CompanyActionState>;

const value = (company: Company | undefined, key: string) => company?.[key] == null ? "" : String(company[key]);
const iso = (company: Company | undefined, key: string) => company?.[key] ? new Date(String(company[key])).toISOString().slice(0, 10) : "";

function ErrorMessage({ state, name }: { state: CompanyActionState; name: string }) {
  const error = state.fieldErrors?.[name];
  return error ? <span className="field-error" id={`${name}-error`}>{error}</span> : null;
}

export function CompanyForm({ action, company }: { action: CompanyAction; company?: Company }) {
  const [state, formAction, pending] = useActionState(action, INITIAL_COMPANY_ACTION_STATE);
  const [importStatus, setImportStatus] = useState<{ loading: boolean; message?: string; error?: boolean }>({ loading: false });
  const formRef = useRef<HTMLFormElement>(null);
  const cancelHref = company?.id ? `/empresas/${company.id}` : "/";

  async function importCard(file: File | undefined) {
    if (!file || !formRef.current) return;
    setImportStatus({ loading: true, message: "Lendo o Cartão CNPJ..." });
    const payload = new FormData();
    payload.set("cartaoCnpj", file);
    try {
      const response = await fetch("/api/cnpj/cartao", { method: "POST", body: payload });
      const result = await response.json() as { data?: Record<string, string>; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message || "Não foi possível importar o PDF.");
      for (const [name, importedValue] of Object.entries(result.data)) {
        const control = formRef.current.elements.namedItem(name);
        if ((control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) && !control.value.trim()) control.value = importedValue;
      }
      setImportStatus({ loading: false, message: result.message });
    } catch (error) {
      setImportStatus({ loading: false, error: true, message: error instanceof Error ? error.message : "Não foi possível importar o PDF." });
    }
  }

  const errorProps = (name: string) => ({
    "aria-invalid": Boolean(state.fieldErrors?.[name]),
    "aria-describedby": state.fieldErrors?.[name] ? `${name}-error` : undefined,
  });

  return <form ref={formRef} action={formAction} className="form-card" encType="multipart/form-data">
    <div>
      <p className="eyebrow">Cadastro empresarial</p>
      <h1 className="form-title">{company ? "Editar dados principais" : "Nova empresa"}</h1>
      <p className="subtitle">Campos marcados com * são obrigatórios. Dados complementares serão adicionados na central do cadastro após salvar.</p>
    </div>

    {state.status === "error" && <div className="form-alert error" role="alert">{state.message}</div>}

    <section className="import-card" aria-labelledby="import-title">
      <div><FileUp size={22} /><div><h2 id="import-title">Importar Cartão CNPJ</h2><p>Selecione o PDF original da Receita Federal. Os dados reconhecidos preencherão apenas campos vazios.</p></div></div>
      <label className="button secondary file-button" htmlFor="cartaoCnpj">Selecionar PDF</label>
      <input className="sr-only" id="cartaoCnpj" name="cartaoCnpj" type="file" accept="application/pdf,.pdf" onChange={(event) => importCard(event.target.files?.[0])} />
      {importStatus.message && <p className={`import-message ${importStatus.error ? "error-text" : ""}`} aria-live="polite">{importStatus.loading && <LoaderCircle className="spin" size={15} />}{importStatus.message}</p>}
    </section>

    <section className="form-section"><h2 className="section-title">Identificação e situação cadastral</h2><div className="form-grid">
      <div className="field span-8"><label htmlFor="razaoSocial">Razão social *</label><input id="razaoSocial" name="razaoSocial" required defaultValue={value(company, "razaoSocial")} {...errorProps("razaoSocial")} /><ErrorMessage state={state} name="razaoSocial" /></div>
      <div className="field"><label htmlFor="nomeFantasia">Nome fantasia *</label><input id="nomeFantasia" name="nomeFantasia" required defaultValue={value(company, "nomeFantasia")} {...errorProps("nomeFantasia")} /><ErrorMessage state={state} name="nomeFantasia" /></div>
      <div className="field"><label htmlFor="cnpj">CNPJ *</label><input id="cnpj" name="cnpj" required maxLength={18} autoCapitalize="characters" placeholder="00.000.000/0001-00" defaultValue={value(company, "cnpj")} {...errorProps("cnpj")} /><ErrorMessage state={state} name="cnpj" /></div>
      <div className="field"><label htmlFor="dataAbertura">Data de abertura</label><input id="dataAbertura" type="date" name="dataAbertura" defaultValue={iso(company, "dataAbertura")} {...errorProps("dataAbertura")} /><ErrorMessage state={state} name="dataAbertura" /></div>
      <div className="field"><label htmlFor="porte">Porte</label><input id="porte" name="porte" placeholder="ME, EPP ou demais" defaultValue={value(company, "porte")} /></div>
      <div className="field span-6"><label htmlFor="naturezaJuridica">Natureza jurídica</label><input id="naturezaJuridica" name="naturezaJuridica" defaultValue={value(company, "naturezaJuridica")} /></div>
      <div className="field"><label htmlFor="nire">NIRE</label><input id="nire" name="nire" defaultValue={value(company, "nire")} /></div>
      <div className="field"><label htmlFor="situacaoCadastral">Situação cadastral</label><input id="situacaoCadastral" name="situacaoCadastral" placeholder="Ativa, baixada..." defaultValue={value(company, "situacaoCadastral")} /></div>
      <div className="field"><label htmlFor="dataSituacaoCadastral">Data da situação</label><input id="dataSituacaoCadastral" type="date" name="dataSituacaoCadastral" defaultValue={iso(company, "dataSituacaoCadastral")} {...errorProps("dataSituacaoCadastral")} /><ErrorMessage state={state} name="dataSituacaoCadastral" /></div>
      <div className="field"><label htmlFor="inscricaoEstadual">Inscrição estadual</label><input id="inscricaoEstadual" name="inscricaoEstadual" defaultValue={value(company, "inscricaoEstadual")} /></div>
      <div className="field"><label htmlFor="inscricaoMunicipal">Inscrição municipal</label><input id="inscricaoMunicipal" name="inscricaoMunicipal" defaultValue={value(company, "inscricaoMunicipal")} /></div>
    </div></section>

    <section className="form-section"><h2 className="section-title">Endereço e contato principal</h2><div className="form-grid">
      <div className="field span-8"><label htmlFor="endereco">Logradouro *</label><input id="endereco" name="endereco" required defaultValue={value(company, "endereco")} {...errorProps("endereco")} /><ErrorMessage state={state} name="endereco" /></div>
      <div className="field"><label htmlFor="numero">Número</label><input id="numero" name="numero" defaultValue={value(company, "numero")} /></div>
      <div className="field"><label htmlFor="complemento">Complemento</label><input id="complemento" name="complemento" defaultValue={value(company, "complemento")} /></div>
      <div className="field"><label htmlFor="bairro">Bairro</label><input id="bairro" name="bairro" defaultValue={value(company, "bairro")} /></div>
      <div className="field"><label htmlFor="cep">CEP</label><input id="cep" name="cep" inputMode="numeric" defaultValue={value(company, "cep")} {...errorProps("cep")} /><ErrorMessage state={state} name="cep" /></div>
      <div className="field span-6"><label htmlFor="cidade">Cidade *</label><input id="cidade" name="cidade" required defaultValue={value(company, "cidade")} {...errorProps("cidade")} /><ErrorMessage state={state} name="cidade" /></div>
      <div className="field"><label htmlFor="uf">UF *</label><input id="uf" name="uf" required maxLength={2} autoCapitalize="characters" defaultValue={value(company, "uf")} {...errorProps("uf")} /><ErrorMessage state={state} name="uf" /></div>
      <div className="field"><label htmlFor="pontoReferencia">Ponto de referência</label><input id="pontoReferencia" name="pontoReferencia" defaultValue={value(company, "pontoReferencia")} /></div>
      <div className="field span-6"><label htmlFor="email">E-mail principal</label><input id="email" type="email" name="email" defaultValue={value(company, "email")} {...errorProps("email")} /><ErrorMessage state={state} name="email" /></div>
      <div className="field"><label htmlFor="telefone1">Telefone principal</label><input id="telefone1" name="telefone1" inputMode="tel" defaultValue={value(company, "telefone1")} /></div>
      <div className="field"><label htmlFor="telefone2">Telefone alternativo</label><input id="telefone2" name="telefone2" inputMode="tel" defaultValue={value(company, "telefone2")} /></div>
    </div></section>

    <section className="form-section"><h2 className="section-title">Atividade e quadro operacional</h2><div className="form-grid">
      <div className="field"><label htmlFor="capitalSocial">Capital social</label><input id="capitalSocial" inputMode="decimal" name="capitalSocial" placeholder="0,00" defaultValue={value(company, "capitalSocial")} {...errorProps("capitalSocial")} /><ErrorMessage state={state} name="capitalSocial" /></div>
      <div className="field span-8"><label htmlFor="cnaePrincipal">CNAE principal *</label><input id="cnaePrincipal" name="cnaePrincipal" required defaultValue={value(company, "cnaePrincipal")} {...errorProps("cnaePrincipal")} /><ErrorMessage state={state} name="cnaePrincipal" /></div>
      <div className="field span-6"><label htmlFor="cnaesSecundarios">CNAEs secundários (um por linha)</label><textarea id="cnaesSecundarios" name="cnaesSecundarios" defaultValue={Array.isArray(company?.cnaesSecundarios) ? company.cnaesSecundarios.join("\n") : ""} /></div>
      <div className="field span-6"><label htmlFor="ramoAtividade">Ramo de atividade *</label><input id="ramoAtividade" name="ramoAtividade" required defaultValue={value(company, "ramoAtividade")} {...errorProps("ramoAtividade")} /><ErrorMessage state={state} name="ramoAtividade" /></div>
      <div className="field span-6"><label htmlFor="servicoProduto">Serviço ou produto *</label><input id="servicoProduto" name="servicoProduto" required defaultValue={value(company, "servicoProduto")} {...errorProps("servicoProduto")} /><ErrorMessage state={state} name="servicoProduto" /></div>
      <div className="field"><label htmlFor="quantidadeFuncionarios">Quantidade de funcionários</label><input id="quantidadeFuncionarios" type="number" min="0" name="quantidadeFuncionarios" defaultValue={value(company, "quantidadeFuncionarios") || "0"} {...errorProps("quantidadeFuncionarios")} /><ErrorMessage state={state} name="quantidadeFuncionarios" /></div>
      <div className="field"><label htmlFor="tempoEmpresa">Tempo de empresa</label><input id="tempoEmpresa" name="tempoEmpresa" placeholder="Ex.: 5 anos" defaultValue={value(company, "tempoEmpresa")} /></div>
    </div></section>

    <section className="form-section"><h2 className="section-title">Relacionamento com o escritório</h2><div className="form-grid">
      <div className="field"><label htmlFor="tipoCliente">Tipo de cliente</label><select id="tipoCliente" name="tipoCliente" defaultValue={value(company, "tipoCliente") || "PRINCIPAL"}><option value="PRINCIPAL">Principal</option><option value="SECUNDARIO">Secundário</option><option value="PROSPECT">Prospect</option><option value="INATIVO">Inativo</option></select></div>
      <div className="field"><label htmlFor="dataEntrada">Entrada no escritório *</label><input id="dataEntrada" type="date" name="dataEntrada" required defaultValue={iso(company, "dataEntrada")} {...errorProps("dataEntrada")} /><ErrorMessage state={state} name="dataEntrada" /></div>
      <div className="field"><label htmlFor="responsavelInterno">Responsável interno</label><input id="responsavelInterno" name="responsavelInterno" defaultValue={value(company, "responsavelInterno")} /></div>
      <div className="field span-6"><label htmlFor="responsavelAnterior">Contabilidade anterior</label><input id="responsavelAnterior" name="responsavelAnterior" defaultValue={value(company, "responsavelAnterior")} /></div>
      <div className="field"><label htmlFor="dataSaidaEscritorio">Saída do escritório</label><input id="dataSaidaEscritorio" type="date" name="dataSaidaEscritorio" defaultValue={iso(company, "dataSaidaEscritorio")} {...errorProps("dataSaidaEscritorio")} /><ErrorMessage state={state} name="dataSaidaEscritorio" /></div>
      <div className="field span-6"><label htmlFor="motivoSaidaEscritorio">Motivo da saída</label><input id="motivoSaidaEscritorio" name="motivoSaidaEscritorio" defaultValue={value(company, "motivoSaidaEscritorio")} /></div>
    </div></section>

    <section className="form-section"><h2 className="section-title">Fiscal e acompanhamento</h2><div className="form-grid">
      <div className="field"><label htmlFor="situacaoAlvaras">Situação dos alvarás</label><select id="situacaoAlvaras" name="situacaoAlvaras" defaultValue={value(company, "situacaoAlvaras") || "PENDENTE"}><option value="PRONTO">Pronto</option><option value="EM_ANDAMENTO">Em andamento</option><option value="PENDENTE">Pendente</option><option value="NAO_APLICAVEL">Não aplicável</option></select></div>
      <div className="field"><label htmlFor="regimeTributario">Regime tributário</label><select id="regimeTributario" name="regimeTributario" defaultValue={value(company, "regimeTributario") || "SIMPLES_NACIONAL"}><option value="SIMPLES_NACIONAL">Simples Nacional</option><option value="LUCRO_PRESUMIDO">Lucro Presumido</option><option value="LUCRO_REAL">Lucro Real</option><option value="MEI">MEI</option><option value="ISENTO">Isento</option></select></div>
      <div className="field"><label htmlFor="ranking">Ranking</label><select id="ranking" name="ranking" defaultValue={value(company, "ranking") || "C"}>{["C", "B", "A", "S", "SS"].map((rank) => <option key={rank}>{rank}</option>)}</select></div>
      <div className="field"><label htmlFor="dataBaixa">Data da baixa</label><input id="dataBaixa" type="date" name="dataBaixa" defaultValue={iso(company, "dataBaixa")} {...errorProps("dataBaixa")} /><ErrorMessage state={state} name="dataBaixa" /></div>
      <div className="field"><label htmlFor="dataAtualizacaoBancaria">Atualização bancária</label><input id="dataAtualizacaoBancaria" type="date" name="dataAtualizacaoBancaria" defaultValue={iso(company, "dataAtualizacaoBancaria")} {...errorProps("dataAtualizacaoBancaria")} /><ErrorMessage state={state} name="dataAtualizacaoBancaria" /></div>
      <label className="check-field"><input type="checkbox" name="participaLicitacoes" defaultChecked={Boolean(company?.participaLicitacoes)} /> Participa de licitações</label>
      <label className="check-field"><input type="checkbox" name="irpfSociosNaContabilidade" defaultChecked={Boolean(company?.irpfSociosNaContabilidade)} /> IRPF dos sócios no escritório</label>
      <label className="check-field"><input type="checkbox" name="pendenciasFiscais" defaultChecked={Boolean(company?.pendenciasFiscais)} /> Possui pendências fiscais</label>
      <div className="field span-12"><label htmlFor="observacoesInternas">Observações internas</label><textarea id="observacoesInternas" name="observacoesInternas" defaultValue={value(company, "observacoesInternas")} /></div>
    </div></section>

    <div className="form-actions"><Link className="button secondary" href={cancelHref}>Cancelar</Link><button className="button" type="submit" disabled={pending}>{pending ? "Salvando..." : company ? "Salvar dados principais" : "Cadastrar empresa"}</button></div>
  </form>;
}
