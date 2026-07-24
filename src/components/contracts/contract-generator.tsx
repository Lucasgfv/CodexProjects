"use client";

import {
  Building2,
  Check,
  FileCheck2,
  Printer,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { formatCurrency, formatDate } from "@/lib/format";
import type { EmpresaDTO } from "@/lib/types";

export function ContractGenerator({ empresas }: { empresas: EmpresaDTO[] }) {
  const [selectedId, setSelectedId] = useState(empresas[0]?.id ?? "");
  const empresa = useMemo(
    () => empresas.find((item) => item.id === selectedId) ?? null,
    [empresas, selectedId],
  );

  return (
    <div className="mt-9 grid gap-7 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="no-print self-start rounded-panel border border-[#d6dcd6] bg-white/70 p-5 sm:p-6 xl:sticky xl:top-24">
        <ol className="space-y-5">
          {[
            {
              label: "Selecionar empresa",
              description: "Escolha um cadastro da carteira.",
              icon: Building2,
            },
            {
              label: "Conferir dados",
              description: "Empresa e quadro societário.",
              icon: UsersRound,
            },
            {
              label: "Emitir contrato",
              description: "Visualize, imprima ou salve em PDF.",
              icon: FileCheck2,
            },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <li className="flex gap-3" key={step.label}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf3ee] text-moss">
                  {index === 0 ? (
                    <span className="text-xs font-bold">{index + 1}</span>
                  ) : empresa ? (
                    <Check size={16} strokeWidth={2} />
                  ) : (
                    <Icon size={16} strokeWidth={1.7} />
                  )}
                </span>
                <span>
                  <span className="block text-[13px] font-semibold">
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-5 text-[#7a847d]">
                    {step.description}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <label className="mt-7 block border-t border-[#dfe3df] pt-6">
          <span className="field-label">Empresa cadastrada</span>
          <select
            className="field-control"
            onChange={(event) => setSelectedId(event.target.value)}
            value={selectedId}
          >
            {empresas.length ? (
              empresas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nomeFantasia ?? item.razaoSocial}
                </option>
              ))
            ) : (
              <option value="">Nenhuma empresa cadastrada</option>
            )}
          </select>
        </label>

        {empresa ? (
          <div className="mt-5 space-y-3 border-t border-[#e1e5e1] pt-5">
            <DataItem label="CNPJ" value={empresa.cnpj} />
            <DataItem label="Razão social" value={empresa.razaoSocial} />
            <DataItem
              label="Endereço"
              value={
                [empresa.endereco, empresa.cidade].filter(Boolean).join(" — ") ||
                "Não informado"
              }
            />
            <DataItem
              label="Sócios"
              value={`${empresa.socios.length} vinculado${empresa.socios.length === 1 ? "" : "s"}`}
            />
          </div>
        ) : null}

        <button
          className="primary-button mt-7 w-full"
          disabled={!empresa}
          onClick={() => window.print()}
          type="button"
        >
          <Printer size={16} />
          Gerar PDF / Imprimir
        </button>
        <p className="mt-3 text-center text-[10px] leading-4 text-[#818a84]">
          Na janela de impressão, selecione “Salvar como PDF”.
        </p>
      </aside>

      {empresa ? (
        <article className="contract-sheet mx-auto w-full max-w-[920px] rounded-[4px] border border-[#d4d9d4] bg-white px-7 py-9 shadow-subtle sm:px-12 sm:py-14 lg:px-20 lg:py-16">
          <header className="border-b-2 border-ink pb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-moss">
              Instrumento particular
            </p>
            <h2 className="mt-4 text-2xl font-semibold uppercase tracking-[-0.02em]">
              Contrato de prestação de serviços contábeis
            </h2>
          </header>

          <div className="mt-9 space-y-7 font-serif text-[14px] leading-[1.9] text-[#29322c]">
            <p>
              Pelo presente instrumento particular, de um lado,{" "}
              <strong>{empresa.razaoSocial}</strong>
              {empresa.nomeFantasia ? (
                <>
                  , nome fantasia <strong>{empresa.nomeFantasia}</strong>
                </>
              ) : null}
              , inscrita no CNPJ sob o nº <strong>{empresa.cnpj}</strong>, com
              sede em{" "}
              <strong>
                {[empresa.endereco, empresa.cidade]
                  .filter(Boolean)
                  .join(", ")}
              </strong>
              , doravante denominada <strong>CONTRATANTE</strong>.
            </p>

            <Clause
              number="1"
              title="Do objeto"
              text="O presente contrato tem por objeto a prestação de serviços técnicos contábeis, fiscais e de apoio administrativo, observada a legislação aplicável e as informações fornecidas pela CONTRATANTE."
            />
            <Clause
              number="2"
              title="Das responsabilidades"
              text="A CONTRATANTE se compromete a disponibilizar documentos e informações completas dentro dos prazos acordados. A CONTRATADA manterá sigilo sobre os dados recebidos e executará os serviços com diligência técnica."
            />
            <Clause
              number="3"
              title="Da vigência"
              text={`Este instrumento entra em vigor na data de sua assinatura e permanece válido por prazo indeterminado, podendo ser rescindido mediante comunicação prévia entre as partes.`}
            />

            <section>
              <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.08em] text-ink">
                Quadro societário da contratante
              </h3>
              <div className="mt-3 overflow-hidden border-y border-[#cfd5cf]">
                {empresa.socios.map((vinculo) => (
                  <div
                    className="grid gap-1 border-b border-[#e0e4e0] py-3 last:border-b-0 sm:grid-cols-[1.4fr_1fr_auto]"
                    key={vinculo.id}
                  >
                    <span>
                      <strong>{vinculo.nome}</strong>
                      <small className="block text-[11px] text-[#667068]">
                        CPF {vinculo.cpf}
                      </small>
                    </span>
                    <span>{vinculo.cargo ?? "Sócio"}</span>
                    <span>{vinculo.percentualParticipacao}%</span>
                  </div>
                ))}
              </div>
            </section>

            <p>
              E, por estarem de acordo, as partes assinam o presente instrumento
              em duas vias de igual teor.
            </p>
          </div>

          <footer className="mt-16">
            <p className="text-center font-serif text-sm">
              {empresa.cidade?.split(" - ")[0] ?? "Local"},{" "}
              {formatDate(new Date())}.
            </p>
            <div className="mt-16 grid gap-12 text-center sm:grid-cols-2">
              <Signature
                label={empresa.razaoSocial}
                sublabel={`CNPJ ${empresa.cnpj}`}
              />
              <Signature
                label="Contratada — Serviços Contábeis"
                sublabel="Responsável técnico"
              />
            </div>
            {empresa.capitalSocial ? (
              <p className="mt-12 text-center text-[10px] text-[#7d857f]">
                Capital social cadastrado:{" "}
                {formatCurrency(empresa.capitalSocial)}
              </p>
            ) : null}
          </footer>
        </article>
      ) : (
        <div className="grid min-h-[620px] place-items-center rounded-panel border border-dashed border-[#cdd4ce] bg-white/40 text-center">
          <div className="max-w-xs">
            <Building2 className="mx-auto text-sage" size={34} strokeWidth={1.5} />
            <h2 className="mt-4 text-lg font-semibold">Cadastre uma empresa</h2>
            <p className="mt-2 text-xs leading-5 text-[#747e77]">
              O contrato será preenchido automaticamente assim que houver uma
              empresa disponível.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-[0.06em] text-[#89918c]">
        {label}
      </span>
      <span className="mt-1 block text-xs leading-5 text-[#3e4941]">
        {value}
      </span>
    </div>
  );
}

function Clause({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <section>
      <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.08em] text-ink">
        Cláusula {number}ª — {title}
      </h3>
      <p className="mt-1">{text}</p>
    </section>
  );
}

function Signature({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div className="border-t border-[#444d47] pt-3">
      <p className="text-xs font-semibold">{label}</p>
      <p className="mt-1 text-[10px] text-[#737c76]">{sublabel}</p>
    </div>
  );
}
