"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Download,
  FileCheck2,
  LoaderCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Toast } from "@/components/toast";
import {
  createServiceContractData,
  getActivePartners,
  getContractMissingFields,
  serviceProvider,
} from "@/lib/contracts/service-contract";
import { formatCurrency } from "@/lib/format";
import type { EmpresaDTO } from "@/lib/types";

type EmpresaOption = {
  id: string;
  label: string;
  cnpj: string;
};

export function ServiceContractApp({
  empresas,
}: {
  empresas: EmpresaOption[];
}) {
  const [selectedId, setSelectedId] = useState("");
  const [empresa, setEmpresa] = useState<EmpresaDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const missingFields = useMemo(
    () => (empresa ? getContractMissingFields(empresa) : []),
    [empresa],
  );
  const activePartners = useMemo(
    () => (empresa ? getActivePartners(empresa) : []),
    [empresa],
  );
  const isReady = Boolean(empresa && !missingFields.length);

  async function selectEmpresa(id: string) {
    setSelectedId(id);
    setEmpresa(null);
    setToast(null);
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/empresas/${id}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const errorData = data as { error?: string };
        throw new Error(
          errorData.error
            ? errorData.error
            : "Não foi possível carregar a empresa.",
        );
      }
      setEmpresa(data as EmpresaDTO);
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a empresa.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function generateDocument() {
    if (!empresa || !isReady) return;
    setIsGenerating(true);
    setToast(null);
    try {
      const data = createServiceContractData(empresa);
      const { createServiceContractBlob } = await import(
        "@/lib/contracts/service-contract-docx"
      );
      const blob = await createServiceContractBlob(data);
      const safeName = empresa.razaoSocial
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `contrato-contabil-${safeName || "cliente"}.docx`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setToast({
        message: "Contrato e procuração gerados com sucesso.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o documento.",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <div className="mt-9 grid gap-7 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="self-start rounded-panel border border-[#d6dcd6] bg-white/75 p-5 shadow-subtle sm:p-6 xl:sticky xl:top-24">
          <label>
            <span className="field-label">Empresa contratante</span>
            <select
              className="field-control"
              onChange={(event) => selectEmpresa(event.target.value)}
              value={selectedId}
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} — {option.cnpj}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-6 border-t border-[#dfe3df] pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#87908a]">
              Fluxo do documento
            </p>
            <ol className="mt-4 space-y-4">
              <Step
                active={Boolean(selectedId)}
                description="Escolha um cadastro existente."
                icon={Building2}
                label="Selecionar empresa"
              />
              <Step
                active={isReady}
                description="Dados jurídicos completos e revisados."
                icon={ShieldCheck}
                label="Validar informações"
              />
              <Step
                active={false}
                description="Contrato e procuração em Word."
                icon={FileCheck2}
                label="Baixar documento"
              />
            </ol>
          </div>

          <button
            className="primary-button mt-7 w-full"
            disabled={!isReady || isGenerating}
            onClick={generateDocument}
            type="button"
          >
            {isGenerating ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Download size={17} />
            )}
            {isGenerating ? "Gerando documento..." : "Gerar contrato em Word"}
          </button>
          <p className="mt-3 text-center text-[10px] leading-4 text-[#818a84]">
            O arquivo contém o contrato e a procuração.
          </p>
        </aside>

        <section className="min-h-[640px]">
          {isLoading ? (
            <StatePanel
              description="Buscando empresa, vínculos e dados jurídicos."
              icon={LoaderCircle}
              loading
              title="Carregando cadastro..."
            />
          ) : empresa ? (
            <div className="overflow-hidden rounded-panel border border-[#d6dcd6] bg-white/80 shadow-subtle">
              <header className="border-b border-[#dfe3df] px-6 py-6 sm:px-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-moss">
                      Contratante selecionada
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                      {empresa.razaoSocial}
                    </h2>
                    <p className="mt-2 text-xs text-[#707a73]">
                      CNPJ {empresa.cnpj}
                    </p>
                  </div>
                  <span
                    className={
                      isReady
                        ? "inline-flex items-center gap-2 self-start rounded-full border border-[#cfe0d3] bg-[#f0f6f1] px-3 py-1.5 text-[11px] font-semibold text-[#2c6944]"
                        : "inline-flex items-center gap-2 self-start rounded-full border border-[#ead9ba] bg-[#fff9ed] px-3 py-1.5 text-[11px] font-semibold text-[#85662b]"
                    }
                  >
                    {isReady ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <AlertCircle size={14} />
                    )}
                    {isReady ? "Pronto para gerar" : "Cadastro incompleto"}
                  </span>
                </div>
              </header>

              <div className="grid gap-px bg-[#dfe3df] md:grid-cols-3">
                <Summary
                  label="Honorário mensal"
                  value={
                    empresa.honorarioMensal
                      ? formatCurrency(empresa.honorarioMensal)
                      : "Não informado"
                  }
                />
                <Summary
                  label="Sócios ativos"
                  value={String(activePartners.length)}
                />
                <Summary
                  label="Contratada"
                  value={serviceProvider.company}
                />
              </div>

              <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_1.15fr]">
                <div>
                  <h3 className="text-sm font-semibold">Dados utilizados</h3>
                  <dl className="mt-5 space-y-4">
                    <Detail label="Razão social" value={empresa.razaoSocial} />
                    <Detail label="CNPJ" value={empresa.cnpj} />
                    <Detail
                      label="Endereço"
                      value={[
                        empresa.endereco,
                        [empresa.cidade, empresa.uf]
                          .filter(Boolean)
                          .join("/"),
                        empresa.cep ? `CEP ${empresa.cep}` : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    />
                  </dl>

                  <h3 className="mt-8 flex items-center gap-2 text-sm font-semibold">
                    <UsersRound className="text-moss" size={17} />
                    Representantes
                  </h3>
                  <div className="mt-4 space-y-3">
                    {activePartners.length ? (
                      activePartners.map((partner) => (
                        <div
                          className="rounded-xl border border-[#dde2dd] bg-[#f8faf8] px-4 py-3"
                          key={partner.id}
                        >
                          <p className="text-xs font-semibold">{partner.nome}</p>
                          <p className="mt-1 text-[10px] text-[#78827b]">
                            CPF {partner.cpf} · {partner.cargo ?? "Sócio(a)"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#7a847d]">
                        Nenhum sócio ativo vinculado.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    Verificação do cadastro
                  </h3>
                  {missingFields.length ? (
                    <div className="mt-4 rounded-panel border border-[#ead9ba] bg-[#fffaf0] p-5">
                      <p className="flex items-start gap-2 text-xs font-semibold text-[#715721]">
                        <AlertCircle className="mt-0.5 shrink-0" size={16} />
                        Complete os itens abaixo em Clientes e banco de dados:
                      </p>
                      <ul className="mt-4 space-y-2 border-t border-[#eadfca] pt-4">
                        {missingFields.map((field) => (
                          <li
                            className="flex gap-2 text-[11px] leading-5 text-[#74674e]"
                            key={field}
                          >
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#b58b3e]" />
                            {field}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-panel border border-[#cfe0d3] bg-[#f2f7f3] p-5">
                      <CheckCircle2 className="text-[#2f774b]" size={24} />
                      <p className="mt-3 text-sm font-semibold text-[#285d3d]">
                        Todos os dados obrigatórios estão completos.
                      </p>
                      <p className="mt-2 text-[11px] leading-5 text-[#5d7665]">
                        O documento será preenchido automaticamente sem alterar
                        o cadastro ou armazenar o arquivo gerado.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <StatePanel
              description="Os dados serão carregados do PostgreSQL e validados antes da geração."
              icon={Building2}
              title="Selecione uma empresa"
            />
          )}
        </section>
      </div>

      {toast ? (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
          type={toast.type}
        />
      ) : null}
    </>
  );
}

function Step({
  active,
  description,
  icon: Icon,
  label,
}: {
  active: boolean;
  description: string;
  icon: typeof Building2;
  label: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={
          active
            ? "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-moss text-white"
            : "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf3ee] text-moss"
        }
      >
        {active ? <CheckCircle2 size={16} /> : <Icon size={16} />}
      </span>
      <span>
        <span className="block text-[12px] font-semibold">{label}</span>
        <span className="mt-0.5 block text-[10px] leading-4 text-[#7a847d]">
          {description}
        </span>
      </span>
    </li>
  );
}

function StatePanel({
  description,
  icon: Icon,
  loading = false,
  title,
}: {
  description: string;
  icon: typeof Building2;
  loading?: boolean;
  title: string;
}) {
  return (
    <div className="grid min-h-[640px] place-items-center rounded-panel border border-dashed border-[#cdd4ce] bg-white/45 px-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#edf3ee] text-moss">
          <Icon className={loading ? "animate-spin" : ""} size={26} />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-2 text-xs leading-5 text-[#747e77]">{description}</p>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f8faf8] px-6 py-5 sm:px-8">
      <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#87908a]">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold text-[#303a33]">{value}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b938e]">
        {label}
      </dt>
      <dd className="mt-1 text-xs leading-5 text-[#3d4740]">
        {value || "Não informado"}
      </dd>
    </div>
  );
}
