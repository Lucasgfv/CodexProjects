"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Plus,
  Scale,
} from "lucide-react";
import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";

import { Toast } from "@/components/toast";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  EmpresaDTO,
  LancamentoDTO,
  LancamentoInput,
} from "@/lib/types";

type Message = { text: string; type: "success" | "error" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AccountingClient({
  empresas,
  initialLancamentos,
}: {
  empresas: EmpresaDTO[];
  initialLancamentos: LancamentoDTO[];
}) {
  const [lancamentos, setLancamentos] = useState(initialLancamentos);
  const [empresaFilter, setEmpresaFilter] = useState("Todas");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    empresaId: empresas[0]?.id ?? "",
    tipo: "ENTRADA" as "ENTRADA" | "SAIDA",
    descricao: "",
    valor: "",
    vencimento: today(),
    competencia: today().slice(0, 7) + "-01",
    pago: false,
  });

  const filtered = useMemo(
    () =>
      lancamentos.filter(
        (item) =>
          (empresaFilter === "Todas" ||
            item.empresaId === empresaFilter) &&
          (tipoFilter === "Todos" || item.tipo === tipoFilter),
      ),
    [empresaFilter, lancamentos, tipoFilter],
  );
  const totals = useMemo(
    () =>
      filtered.reduce(
        (result, item) => {
          result[item.tipo] += item.valor;
          return result;
        },
        { ENTRADA: 0, SAIDA: 0 },
      ),
    [filtered],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    const payload: LancamentoInput = {
      ...form,
      valor: Number(form.valor.replace(",", ".")),
    };
    startTransition(async () => {
      try {
        const response = await fetch("/api/lancamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as
          | LancamentoDTO
          | { error: string };
        if (!response.ok) {
          throw new Error(
            "error" in data ? data.error : "Não foi possível salvar.",
          );
        }
        setLancamentos((current) => [data as LancamentoDTO, ...current]);
        setForm((current) => ({
          ...current,
          descricao: "",
          valor: "",
          pago: false,
        }));
        setMessage({
          text: "Lançamento registrado com sucesso.",
          type: "success",
        });
      } catch (error) {
        setMessage({
          text:
            error instanceof Error
              ? error.message
              : "Não foi possível registrar o lançamento.",
          type: "error",
        });
      }
    });
  }

  return (
    <>
      <section className="mt-9 grid border-y border-[#d9ded9] py-5 sm:grid-cols-3">
        <Summary
          icon={ArrowUpRight}
          label="Total de entradas"
          tone="green"
          value={formatCurrency(totals.ENTRADA)}
        />
        <Summary
          icon={ArrowDownLeft}
          label="Total de saídas"
          tone="coral"
          value={formatCurrency(totals.SAIDA)}
        />
        <Summary
          icon={Scale}
          label="Saldo"
          tone="green"
          value={formatCurrency(totals.ENTRADA - totals.SAIDA)}
        />
      </section>

      <div className="mt-7 grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form
          className="self-start rounded-panel border border-[#d7ddd7] bg-white/75 p-5 sm:p-6 xl:sticky xl:top-24"
          onSubmit={submit}
        >
          <div className="section-rule">
            <h2 className="text-lg font-semibold tracking-[-0.025em]">
              Novo lançamento
            </h2>
            <p className="mt-1 text-xs text-[#7a837d]">
              Registre uma entrada ou saída por empresa.
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <label>
              <span className="field-label">Empresa</span>
              <select
                className="field-control"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    empresaId: event.target.value,
                  }))
                }
                required
                value={form.empresaId}
              >
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nomeFantasia ?? empresa.razaoSocial}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="field-label">Tipo</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["ENTRADA", "SAIDA"] as const).map((tipo) => (
                  <button
                    aria-pressed={form.tipo === tipo}
                    className={
                      form.tipo === tipo
                        ? "h-10 rounded-xl border border-moss bg-[#edf3ee] text-xs font-semibold text-moss"
                        : "h-10 rounded-xl border border-[#d9ded9] bg-white text-xs font-medium text-[#68736b] transition hover:border-[#b8c3ba]"
                    }
                    key={tipo}
                    onClick={() =>
                      setForm((current) => ({ ...current, tipo }))
                    }
                    type="button"
                  >
                    {tipo === "ENTRADA" ? "Entrada" : "Saída"}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>
              <span className="field-label">Descrição</span>
              <input
                className="field-control"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descricao: event.target.value,
                  }))
                }
                placeholder="Ex.: honorários mensais"
                required
                value={form.descricao}
              />
            </label>
            <label>
              <span className="field-label">Valor (R$)</span>
              <input
                className="field-control"
                min="0.01"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    valor: event.target.value,
                  }))
                }
                placeholder="0,00"
                required
                step="0.01"
                type="number"
                value={form.valor}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="field-label">Vencimento</span>
                <input
                  className="field-control px-2"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      vencimento: event.target.value,
                    }))
                  }
                  required
                  type="date"
                  value={form.vencimento}
                />
              </label>
              <label>
                <span className="field-label">Competência</span>
                <input
                  className="field-control px-2"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      competencia: `${event.target.value}-01`,
                    }))
                  }
                  required
                  type="month"
                  value={form.competencia.slice(0, 7)}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-[#dfe3df] bg-[#f7f9f7] p-3">
              <input
                checked={form.pago}
                className="h-4 w-4 accent-[#345c45]"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pago: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span className="text-xs font-medium text-[#536058]">
                Marcar como pago
              </span>
            </label>
            <button
              className="primary-button w-full"
              disabled={isPending || !empresas.length}
              type="submit"
            >
              <Plus size={16} />
              {isPending ? "Registrando..." : "Registrar lançamento"}
            </button>
          </div>
        </form>

        <section className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="section-rule">
              <h2 className="text-lg font-semibold tracking-[-0.025em]">
                Movimentações
              </h2>
              <p className="mt-1 text-xs text-[#7a837d]">
                {filtered.length} lançamento{filtered.length === 1 ? "" : "s"}{" "}
                no filtro atual.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="field-label">Empresa</span>
                <select
                  className="field-control h-10 min-w-0 sm:min-w-[170px]"
                  onChange={(event) => setEmpresaFilter(event.target.value)}
                  value={empresaFilter}
                >
                  <option>Todas</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nomeFantasia ?? empresa.razaoSocial}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Tipo</span>
                <select
                  className="field-control h-10"
                  onChange={(event) => setTipoFilter(event.target.value)}
                  value={tipoFilter}
                >
                  <option>Todos</option>
                  <option value="ENTRADA">Entradas</option>
                  <option value="SAIDA">Saídas</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-panel border border-[#d9ded9] bg-white/65">
            <table className="data-table min-w-[770px]">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Empresa</th>
                  <th>Competência</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr className="transition hover:bg-white" key={item.id}>
                    <td className="min-w-[190px]">
                      <span className="flex items-center gap-3">
                        <span
                          className={
                            item.tipo === "ENTRADA"
                              ? "grid h-8 w-8 place-items-center rounded-lg bg-[#edf3ee] text-moss"
                              : "grid h-8 w-8 place-items-center rounded-lg bg-[#fff0ec] text-coral"
                          }
                        >
                          {item.tipo === "ENTRADA" ? (
                            <ArrowUpRight size={15} />
                          ) : (
                            <ArrowDownLeft size={15} />
                          )}
                        </span>
                        <span className="font-semibold text-ink">
                          {item.descricao}
                        </span>
                      </span>
                    </td>
                    <td>{item.empresaNome}</td>
                    <td>
                      {new Intl.DateTimeFormat("pt-BR", {
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(item.competencia))}
                    </td>
                    <td>{formatDate(item.vencimento)}</td>
                    <td>
                      <span
                        className={
                          item.pago
                            ? "inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#33714b]"
                            : "inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#8a6d35]"
                        }
                      >
                        {item.pago ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <CalendarDays size={14} />
                        )}
                        {item.pago ? "Pago" : "Pendente"}
                      </span>
                    </td>
                    <td
                      className={
                        item.tipo === "ENTRADA"
                          ? "text-right font-semibold text-moss"
                          : "text-right font-semibold text-coral"
                      }
                    >
                      {item.tipo === "ENTRADA" ? "+" : "−"}{" "}
                      {formatCurrency(item.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length ? (
              <div className="grid min-h-56 place-items-center text-center text-xs text-[#7b857e]">
                Nenhum lançamento encontrado.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {message ? (
        <Toast
          message={message.text}
          onClose={() => setMessage(null)}
          type={message.type}
        />
      ) : null}
    </>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ArrowUpRight;
  label: string;
  value: string;
  tone: "green" | "coral";
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#e2e6e2] px-2 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-2 sm:last:border-r-0">
      <span
        className={
          tone === "green"
            ? "grid h-11 w-11 place-items-center rounded-full bg-[#edf3ee] text-moss"
            : "grid h-11 w-11 place-items-center rounded-full bg-[#fff0ec] text-coral"
        }
      >
        <Icon size={19} strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-[11px] text-[#6d766f]">{label}</span>
        <span className="mt-1 block text-xl font-semibold tracking-[-0.035em]">
          {value}
        </span>
      </span>
    </div>
  );
}
