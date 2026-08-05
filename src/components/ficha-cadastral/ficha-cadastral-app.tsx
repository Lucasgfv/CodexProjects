"use client";

import { AlertCircle, Download, FileText, Printer } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import type { EmpresaDTO } from "@/lib/types";

const fichaFields: Array<[keyof EmpresaDTO, string]> = [
  ["razaoSocial", "Razão social"], ["nomeFantasia", "Nome fantasia"],
  ["cnpj", "CNPJ"], ["email", "E-mail"], ["telefone", "Telefone"],
  ["cep", "CEP"], ["endereco", "Endereço"], ["numeroEndereco", "Número"],
  ["bairro", "Bairro"], ["cidade", "Cidade"], ["uf", "UF"],
  ["regimeTributario", "Regime tributário"], ["capitalSocial", "Capital social"],
  ["inscricaoEstadual", "Inscrição estadual"], ["inscricaoMunicipal", "Inscrição municipal"],
  ["cnaePrincipal", "CNAE principal"], ["cnaesSecundarios", "CNAEs secundários"],
  ["ramoAtividade", "Ramo de atividade"], ["servicoProduto", "Serviço ou produto"],
  ["quantidadeFuncionarios", "Quantidade de funcionários"], ["situacaoAlvaras", "Alvarás"],
  ["participaLicitacoes", "Participação em licitações"], ["contadorAnterior", "Contador anterior"],
  ["dataAtualizacaoBancaria", "Data da atualização bancária"], ["pendenciasFiscais", "Pendências fiscais"],
  ["ranking", "Ranking"],
];

function value(value: string | number | boolean | null | undefined) {
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") return value.toLocaleString("pt-BR");
  return value ?? "";
}

function date(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "";
}

function elapsed(start: string) {
  const months = Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 2629800000));
  return `${Math.floor(months / 12)} ano(s) e ${months % 12} mês(es)`;
}

export function FichaCadastralApp({ empresas }: { empresas: EmpresaDTO[] }) {
  const [selectedId, setSelectedId] = useState(empresas[0]?.id ?? "");
  const [downloading, setDownloading] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const empresa = useMemo(() => empresas.find((item) => item.id === selectedId) ?? null, [empresas, selectedId]);
  const missing = useMemo(() => {
    if (!empresa) return ["Empresa"];
    const pending = fichaFields.filter(([key]) => {
      const field = empresa[key];
      return field === null || field === undefined || field === "";
    }).map(([, label]) => label);
    if (!empresa.socios.length) pending.push("Pelo menos um sócio vinculado");
    if ((empresa.referenciasComerciais?.length ?? 0) !== 2 || empresa.referenciasComerciais?.some((item) => !item.nome || !item.cidade || !item.uf)) pending.push("Duas referências comerciais completas");
    return pending;
  }, [empresa]);
  const ready = Boolean(empresa && !missing.length);

  async function downloadPdf() {
    if (!sheetRef.current || !empresa || !ready) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(sheetRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const pdf = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm" });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
      pdf.save(`ficha-cadastral-${empresa.cnpj.replace(/\D/g, "")}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return <div className="mt-9 grid gap-7 xl:grid-cols-[320px_minmax(0,1fr)]">
    <aside className="no-print self-start rounded-panel border border-[#d6dcd6] bg-white/75 p-5 shadow-subtle xl:sticky xl:top-24">
      <label><span className="field-label">Empresa</span><select className="field-control" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Selecione uma empresa</option>{empresas.map((item) => <option key={item.id} value={item.id}>{item.nomeFantasia ?? item.razaoSocial}</option>)}</select></label>
      {empresa ? <p className="mt-3 text-xs text-[#687269]">CNPJ {empresa.cnpj}</p> : null}
      <div className="mt-6 border-t border-[#dfe3df] pt-5">{ready ? <p className="text-sm font-semibold text-[#2c6944]">Cadastro completo</p> : <><p className="flex items-center gap-2 text-sm font-semibold text-[#85662b]"><AlertCircle size={17} /> Cadastro incompleto</p><p className="mt-3 text-xs leading-5 text-[#6f6859]">Complete em Clientes e banco de dados:</p><ul className="mt-2 space-y-1 text-xs text-[#6f6859]">{missing.map((item) => <li key={item}>• {item}</li>)}</ul></>}</div>
      <button className="primary-button mt-7 w-full" disabled={!ready} onClick={() => window.print()} type="button"><Printer size={16} /> Imprimir em A4</button>
      <button className="secondary-button mt-3 w-full" disabled={!ready || downloading} onClick={downloadPdf} type="button"><Download size={16} /> {downloading ? "Gerando PDF..." : "Baixar PDF"}</button>
    </aside>
    {empresa ? <article className="ficha-sheet" ref={sheetRef}><h1>{empresa.razaoSocial}</h1><Section title="Qualificação da empresa"><Grid rows={[["Razão social", empresa.razaoSocial], ["Nome fantasia", value(empresa.nomeFantasia)], ["CNPJ", empresa.cnpj], ["Inscrição estadual", value(empresa.inscricaoEstadual)], ["Inscrição municipal", value(empresa.inscricaoMunicipal)], ["Endereço", value(empresa.endereco)], ["Nº", value(empresa.numeroEndereco)], ["Bairro", value(empresa.bairro)], ["CEP", value(empresa.cep)], ["Cidade", value(empresa.cidade)], ["UF", value(empresa.uf)], ["E-mail", value(empresa.email)], ["Telefone", value(empresa.telefone)], ["CNAE principal", value(empresa.cnaePrincipal)], ["CNAEs secundários", value(empresa.cnaesSecundarios)], ["Ramo de atividade", value(empresa.ramoAtividade)], ["Serviço ou produto", value(empresa.servicoProduto)]]} /></Section><Section title="Titular / sócios participantes"><table><thead><tr><th>Nome</th><th>CPF</th><th>Recebe pró-labore?</th><th>%</th></tr></thead><tbody>{empresa.socios.map((item) => <tr key={item.id}><td>{item.nome}</td><td>{item.cpf}</td><td>{item.recebeProlabore ? "Sim" : "Não"}</td><td>{item.percentualParticipacao}%</td></tr>)}</tbody></table></Section><Section title="Dados adicionais e operação"><Grid rows={[["Qtd. funcionários", value(empresa.quantidadeFuncionarios)], ["Tempo de empresa", elapsed(empresa.dataInicio)], ["Data de entrada", date(empresa.dataInicio)], ["Alvarás", value(empresa.situacaoAlvaras)], ["Participa licitações", value(empresa.participaLicitacoes)], ["Contador anterior", value(empresa.contadorAnterior)], ["Regime", empresa.regimeTributario], ["Empresa baixada", empresa.dataBaixa ? "Sim" : "Não"]]} /></Section><Section title="Referências"><table><thead><tr><th>Comercial</th><th>Cidade</th><th>UF</th></tr></thead><tbody>{empresa.referenciasComerciais?.map((item) => <tr key={item.id}><td>{item.nome}</td><td>{item.cidade}</td><td>{item.uf}</td></tr>)}</tbody></table></Section><Section title="Financeiro e compliance"><Grid rows={[["Data da última atualização bancária", date(empresa.dataAtualizacaoBancaria)], ["Pendências fiscais", value(empresa.pendenciasFiscais)], ["Ranking", value(empresa.ranking)]]} /></Section><Section title="Tramitação de documentos internos"><table><thead><tr><th>Fiscal</th><th>DP</th><th>Legalização</th></tr></thead><tbody><tr><td>Data: ____/____/______</td><td>Data: ____/____/______</td><td>Data: ____/____/______</td></tr></tbody></table></Section></article> : <div className="grid min-h-[520px] place-items-center rounded-panel border border-dashed border-[#cdd4ce] text-center"><div><FileText className="mx-auto text-moss" size={30} /><p className="mt-3 text-sm">Nenhuma empresa cadastrada.</p></div></div>}
  </div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="ficha-section"><h2>{title}</h2>{children}</section>; }
function Grid({ rows }: { rows: Array<[string, string]> }) { return <div className="ficha-grid">{rows.map(([label, content]) => <div key={label}><strong>{label}</strong><span>{content || "—"}</span></div>)}</div>; }
