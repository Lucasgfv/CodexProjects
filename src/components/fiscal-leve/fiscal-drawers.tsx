"use client";

import {
  CalendarCheck2,
  Check,
  CircleDollarSign,
  ClipboardList,
  Plus,
  Send,
  X,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import type {
  FiscalCompanyDTO,
  FiscalMeiDTO,
  FiscalStatus,
} from "@/lib/fiscal-leve";

import {
  companyProgress,
  currencyFormatter,
  formatCnpj,
  formatDate,
  formatDateTime,
  limitPercent,
  meiLimitTone,
  MONTHS,
  STATUS_OPTIONS,
} from "./fiscal-utils";

function DrawerShell({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        aria-label="Fechar detalhes"
        className="absolute inset-0 bg-[#17201b]/28 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-modal="true"
        className={`relative h-full w-full overflow-y-auto border-l border-[#d9ded9] bg-[#fbfcfa] shadow-panel ${wide ? "max-w-[760px]" : "max-w-[620px]"}`}
        role="dialog"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#dfe4df] bg-[#fbfcfa]/95 px-5 py-5 backdrop-blur sm:px-7">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-[-0.035em] text-ink">
              {title}
            </h2>
            <p className="mt-1 text-[11px] text-[#748078]">{subtitle}</p>
          </div>
          <button
            aria-label="Fechar"
            className="icon-button shrink-0"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex flex-col gap-5 p-5 sm:p-7">{children}</div>
      </aside>
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: FiscalStatus;
  onChange: (value: FiscalStatus) => void;
}) {
  return (
    <select
      className={`fiscal-status-select ${value}`}
      onChange={(event) => onChange(event.target.value as FiscalStatus)}
      value={value}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FiscalCompanyDrawer({
  company,
  responsibles,
  onClose,
  onProfileChange,
  onTaskChange,
  onAddTask,
}: {
  company: FiscalCompanyDTO;
  responsibles: string[];
  onClose: () => void;
  onProfileChange: (changes: { responsible?: string; notes?: string }) => void;
  onTaskChange: (taskId: string, status: FiscalStatus) => void;
  onAddTask: (name: string, status: FiscalStatus) => void;
}) {
  const [taskName, setTaskName] = useState("");
  const [taskStatus, setTaskStatus] = useState<FiscalStatus>("pending");

  function submitTask(event: FormEvent) {
    event.preventDefault();
    if (!taskName.trim()) return;
    onAddTask(taskName.trim(), taskStatus);
    setTaskName("");
    setTaskStatus("pending");
  }

  return (
    <DrawerShell
      onClose={onClose}
      subtitle={`${company.cnpj} · ${company.regime}`}
      title={company.name}
      wide
    >
      <section className="rounded-panel border border-[#dce2dc] bg-white p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7c867f]">
              Progresso da competência
            </span>
            <strong className="mt-1 block text-3xl tracking-[-0.05em] text-ink">
              {companyProgress(company)}%
            </strong>
          </div>
          <span className="text-[10px] text-[#7a837d]">
            Atualizado em {formatDateTime(company.updatedAt)}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0ed]">
          <span
            className="block h-full rounded-full bg-moss transition-all"
            style={{ width: `${companyProgress(company)}%` }}
          />
        </div>
      </section>

      <label>
        <span className="field-label">Responsável</span>
        <select
          className="field-control"
          onChange={(event) =>
            onProfileChange({ responsible: event.target.value })
          }
          value={company.responsible}
        >
          {[...new Set([...responsibles, company.responsible])].map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="text-moss" size={18} />
          <h3 className="text-sm font-semibold text-ink">
            Atividades da competência
          </h3>
        </div>
        <div className="overflow-hidden rounded-panel border border-[#dce2dc] bg-white">
          {company.tasks.map((task) => (
            <div
              className="grid gap-3 border-b border-[#e8ece8] p-4 last:border-0 sm:grid-cols-[1fr_165px_116px] sm:items-center"
              key={task.id}
            >
              <div>
                <strong className="block text-[12px] font-semibold text-ink">
                  {task.name}
                </strong>
                {task.originalValue ? (
                  <span className="mt-1 block text-[9px] text-[#8a928c]">
                    Origem: {task.originalValue}
                  </span>
                ) : null}
              </div>
              <StatusSelect
                onChange={(status) => onTaskChange(task.id, status)}
                value={task.status}
              />
              <div className="flex items-center gap-1.5 text-[10px] text-[#778079]">
                <CalendarCheck2 size={14} />
                {formatDate(task.statusChangedAt)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <form
        className="rounded-panel border border-dashed border-[#bfcac1] bg-[#f7faf7] p-4"
        onSubmit={submitTask}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Plus className="text-moss" size={17} />
          Nova atividade
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_170px_auto]">
          <input
            className="field-control"
            onChange={(event) => setTaskName(event.target.value)}
            placeholder="Ex.: Conferir notas de entrada"
            value={taskName}
          />
          <StatusSelect onChange={setTaskStatus} value={taskStatus} />
          <button className="primary-button" type="submit">
            Adicionar
          </button>
        </div>
      </form>

      <label>
        <span className="field-label">Observações</span>
        <textarea
          className="field-textarea"
          defaultValue={company.notes}
          key={company.id}
          onBlur={(event) => onProfileChange({ notes: event.target.value })}
          placeholder="Documentos pendentes, retornos ou orientações internas."
          rows={5}
        />
      </label>

      <div className="flex items-center gap-2 text-[10px] font-medium text-[#4f725a]">
        <Check size={15} />
        Alterações salvas no banco de dados do Nexo.
      </div>
    </DrawerShell>
  );
}

export function FiscalMeiDrawer({
  mei,
  responsibles,
  onClose,
  onProfileChange,
  onRevenueChange,
  onActivityChange,
  onGuideSent,
}: {
  mei: FiscalMeiDTO;
  responsibles: string[];
  onClose: () => void;
  onProfileChange: (changes: {
    responsible?: string;
    referenceLimit?: number;
    checked?: boolean;
    inactive?: boolean;
    notes?: string;
  }) => void;
  onRevenueChange: (month: number, value: number) => void;
  onActivityChange: (activityId: string, status: FiscalStatus) => void;
  onGuideSent: (activityId: string, sent: boolean) => void;
}) {
  const tone = meiLimitTone(mei);
  const guide = mei.activities.find((activity) =>
    activity.name.toLocaleLowerCase("pt-BR").includes("guia"),
  );

  return (
    <DrawerShell
      onClose={onClose}
      subtitle={`${mei.cnpj} · MEI`}
      title={mei.name}
      wide
    >
      <section className="rounded-panel border border-[#dce2dc] bg-white p-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_220px] sm:items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7c867f]">
              Faturamento acumulado
            </span>
            <strong className="mt-1 block text-3xl tracking-[-0.05em] text-ink">
              {currencyFormatter.format(mei.annualRevenue)}
            </strong>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-[10px]">
              <span className="text-[#7a837d]">Uso do limite</span>
              <strong className={`fiscal-limit-text ${tone}`}>
                {limitPercent(mei)}%
              </strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#edf0ed]">
              <span
                className={`fiscal-limit-bar ${tone}`}
                style={{ width: `${Math.min(limitPercent(mei), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Responsável</span>
          <select
            className="field-control"
            onChange={(event) =>
              onProfileChange({ responsible: event.target.value })
            }
            value={mei.responsible}
          >
            {[...new Set([...responsibles, mei.responsible])].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Limite de referência</span>
          <input
            className="field-control"
            defaultValue={mei.referenceLimit}
            key={`${mei.id}-limit`}
            min="0"
            onBlur={(event) =>
              onProfileChange({ referenceLimit: Number(event.target.value) || 0 })
            }
            step="1000"
            type="number"
          />
        </label>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <CircleDollarSign className="text-moss" size={18} />
          <h3 className="text-sm font-semibold text-ink">
            Faturamento por mês
          </h3>
        </div>
        <div className="grid gap-2 rounded-panel border border-[#dce2dc] bg-white p-4 sm:grid-cols-3">
          {MONTHS.map((month, index) => (
            <label className="grid grid-cols-[34px_1fr] items-center gap-2" key={month}>
              <span className="text-[10px] font-semibold text-[#69736c]">
                {month}
              </span>
              <input
                className="h-9 min-w-0 rounded-lg border border-[#d9dfd9] px-2 text-[11px] outline-none focus:border-moss focus:ring-2 focus:ring-[#345c4514]"
                defaultValue={mei.months[String(index + 1)] || 0}
                key={`${mei.id}-${month}`}
                min="0"
                onBlur={(event) =>
                  onRevenueChange(index + 1, Number(event.target.value) || 0)
                }
                step="100"
                type="number"
              />
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink">Rotinas do MEI</h3>
        <div className="overflow-hidden rounded-panel border border-[#dce2dc] bg-white">
          {mei.activities.map((activity) => (
            <div
              className="grid gap-3 border-b border-[#e8ece8] p-4 last:border-0 sm:grid-cols-[1fr_165px_110px] sm:items-center"
              key={activity.id}
            >
              <strong className="text-[12px] font-semibold text-ink">
                {activity.name}
              </strong>
              <StatusSelect
                onChange={(status) => onActivityChange(activity.id, status)}
                value={activity.status}
              />
              <span className="text-[10px] text-[#778079]">
                {formatDate(activity.statusChangedAt)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {guide ? (
        <section className="rounded-panel border border-[#cbd8cd] bg-[#f4f8f4] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Send className="text-moss" size={17} />
            Controle de envio da guia DAS
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className={guide.sentAt ? "secondary-button" : "primary-button"}
              onClick={() => onGuideSent(guide.id, !guide.sentAt)}
              type="button"
            >
              {guide.sentAt ? "Desmarcar envio" : "Marcar guia como enviada"}
            </button>
            <span className="text-[11px] text-[#667068]">
              {guide.sentAt
                ? `Enviada automaticamente em ${formatDateTime(guide.sentAt)}`
                : "A data será preenchida automaticamente."}
            </span>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        <label className="flex items-center gap-3 text-[12px] text-[#4f5b53]">
          <input
            checked={mei.checked}
            className="size-4 accent-[#345c45]"
            onChange={(event) =>
              onProfileChange({ checked: event.target.checked })
            }
            type="checkbox"
          />
          Faturamento conferido
        </label>
        <label>
          <span className="field-label">Observações</span>
          <textarea
            className="field-textarea"
            defaultValue={mei.notes}
            key={`${mei.id}-notes`}
            onBlur={(event) => onProfileChange({ notes: event.target.value })}
            rows={5}
          />
        </label>
      </section>
    </DrawerShell>
  );
}

export function NewMeiModal({
  responsibles,
  onClose,
  onSubmit,
}: {
  responsibles: string[];
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    cnpj: string;
    responsible: string;
  }) => Promise<void>;
}) {
  const [cnpj, setCnpj] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await onSubmit({
        name: String(form.get("name") || ""),
        cnpj,
        responsible: String(form.get("responsible") || ""),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <button
        aria-label="Fechar cadastro"
        className="absolute inset-0 bg-[#17201b]/30 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <section
        aria-modal="true"
        className="relative w-full max-w-lg rounded-panel border border-[#dce1dc] bg-white shadow-panel"
        role="dialog"
      >
        <header className="flex items-start justify-between border-b border-[#e2e6e2] p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.035em] text-ink">
              Novo MEI
            </h2>
            <p className="mt-1 text-[11px] text-[#748078]">
              Cadastro enxuto para uma carteira de alta rotatividade.
            </p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            <X size={19} />
          </button>
        </header>
        <form className="flex flex-col gap-4 p-5 sm:p-6" onSubmit={submit}>
          <label>
            <span className="field-label">Nome ou razão do MEI</span>
            <input className="field-control" name="name" required />
          </label>
          <label>
            <span className="field-label">CNPJ</span>
            <input
              className="field-control"
              inputMode="numeric"
              minLength={18}
              onChange={(event) => setCnpj(formatCnpj(event.target.value))}
              required
              value={cnpj}
            />
          </label>
          <label>
            <span className="field-label">Responsável</span>
            <select className="field-control" name="responsible" required>
              {responsibles.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <div className="mt-2 flex justify-end gap-3">
            <button className="secondary-button" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={saving} type="submit">
              <Plus size={16} />
              {saving ? "Salvando…" : "Cadastrar MEI"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
