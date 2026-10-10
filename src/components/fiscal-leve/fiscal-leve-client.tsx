"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  EyeOff,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Plus,
  RotateCcw,
  Search,
  Store,
  UsersRound,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Toast } from "@/components/toast";
import type {
  FiscalCompanyDTO,
  FiscalMeiDTO,
  FiscalSnapshot,
  FiscalStatus,
} from "@/lib/fiscal-leve";
import { cn } from "@/lib/format";

import {
  FiscalCompanyDrawer,
  FiscalMeiDrawer,
  NewMeiModal,
} from "./fiscal-drawers";
import {
  apiMutation,
  companyProgress,
  currencyFormatter,
  formatDate,
  formatDateTime,
  limitPercent,
  matchesCompany,
  meiLimitTone,
  openTasks,
  statusLabel,
} from "./fiscal-utils";

const FiscalOverview = dynamic(
  () => import("./fiscal-overview").then((module) => module.FiscalOverview),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[500px] place-items-center rounded-panel border border-[#dce1dc] bg-white text-sm text-[#6c766f]">
        Preparando indicadores…
      </div>
    ),
  },
);

type View = "overview" | "routine" | "mei" | "access" | "team";

const NAV_ITEMS = [
  { id: "overview" as const, label: "Visão geral", icon: LayoutDashboard },
  { id: "routine" as const, label: "Rotina fiscal", icon: ClipboardCheck },
  { id: "mei" as const, label: "MEI e limite", icon: Store },
  { id: "access" as const, label: "Certificados e acessos", icon: LockKeyhole },
  { id: "team" as const, label: "Equipe", icon: UsersRound },
];

const VIEW_COPY: Record<View, { title: string; description: string }> = {
  overview: {
    title: "Visão geral fiscal",
    description:
      "Acompanhe apurações, entregas e os principais pontos de atenção da carteira.",
  },
  routine: {
    title: "Rotina fiscal",
    description:
      "Gerencie obrigações por empresa com registro automático da data de cada ação.",
  },
  mei: {
    title: "MEI e limite",
    description:
      "Acompanhe o faturamento anual e o envio de guias dos microempreendedores.",
  },
  access: {
    title: "Certificados e acessos",
    description:
      "Consulte validade de certificados e mantenha os acessos manuais protegidos.",
  },
  team: {
    title: "Equipe",
    description: "Visualize a distribuição das carteiras e o andamento por responsável.",
  },
};

function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => setPage((value) => Math.min(value, pageCount)), [pageCount]);
  const visible = items.slice((page - 1) * pageSize, page * pageSize);
  return { page, setPage, pageCount, visible };
}

function Pagination({
  page,
  pageCount,
  count,
  onPage,
  label,
}: {
  page: number;
  pageCount: number;
  count: number;
  onPage: (page: number) => void;
  label: string;
}) {
  return (
    <footer className="flex flex-col gap-3 border-t border-[#e3e7e3] px-4 py-3 text-[10px] text-[#727c75] sm:flex-row sm:items-center sm:justify-between">
      <span>
        {count} {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          aria-label="Página anterior"
          className="fiscal-page-button"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          type="button"
        >
          <ChevronLeft size={15} />
        </button>
        <span>
          Página {page} de {pageCount}
        </span>
        <button
          aria-label="Próxima página"
          className="fiscal-page-button"
          disabled={page === pageCount}
          onClick={() => onPage(page + 1)}
          type="button"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </footer>
  );
}

function Progress({ value }: { value: number }) {
  const tone = value === 100 ? "done" : value < 25 ? "danger" : "active";
  return (
    <div className="flex min-w-[118px] items-center gap-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8ece8]">
        <i
          className={cn(
            "block h-full rounded-full",
            tone === "done" && "bg-[#3f8359]",
            tone === "active" && "bg-[#d39a25]",
            tone === "danger" && "bg-coral",
          )}
          style={{ width: `${value}%` }}
        />
      </span>
      <strong className="w-8 text-right text-[10px] text-ink">{value}%</strong>
    </div>
  );
}

function RoutineView({
  companies,
  onOpen,
}: {
  companies: FiscalCompanyDTO[];
  onOpen: (id: string) => void;
}) {
  const ordered = useMemo(
    () =>
      [...companies].sort(
        (a, b) =>
          openTasks(b).length - openTasks(a).length ||
          a.name.localeCompare(b.name, "pt-BR"),
      ),
    [companies],
  );
  const pagination = usePagination(ordered, 16);

  return (
    <section className="overflow-hidden rounded-panel border border-[#dce1dc] bg-white shadow-[0_10px_30px_rgba(23,32,27,0.035)]">
      <div className="overflow-x-auto">
        <table className="data-table min-w-[980px]">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Regime</th>
              <th>Responsável</th>
              <th>Progresso</th>
              <th>Pendências</th>
              <th>Última ação</th>
              <th aria-label="Ação" />
            </tr>
          </thead>
          <tbody>
            {pagination.visible.map((company) => {
              const pending = openTasks(company);
              const latest = company.tasks.reduce(
                (value, task) =>
                  task.statusChangedAt > value ? task.statusChangedAt : value,
                "",
              );
              return (
                <tr key={company.id}>
                  <td>
                    <button
                      className="text-left"
                      onClick={() => onOpen(company.id)}
                      type="button"
                    >
                      <strong className="block max-w-[280px] truncate text-[12px] font-semibold text-ink">
                        {company.name}
                      </strong>
                      <span className="mt-1 block text-[9px] text-[#879088]">
                        {company.cnpj}
                      </span>
                    </button>
                  </td>
                  <td>{company.regime}</td>
                  <td>{company.responsible}</td>
                  <td>
                    <Progress value={companyProgress(company)} />
                  </td>
                  <td>
                    <div className="flex max-w-[270px] flex-wrap gap-1.5">
                      {pending.slice(0, 2).map((task) => (
                        <span className="fiscal-task-chip" key={task.id}>
                          {task.name}
                        </span>
                      ))}
                      {pending.length > 2 ? (
                        <span className="text-[9px] font-semibold text-[#7d877f]">
                          +{pending.length - 2}
                        </span>
                      ) : null}
                      {!pending.length ? (
                        <span className="text-[10px] text-[#4f825f]">Em dia</span>
                      ) : null}
                    </div>
                  </td>
                  <td>{formatDateTime(latest || company.updatedAt)}</td>
                  <td>
                    <button
                      aria-label={`Abrir ${company.name}`}
                      className="icon-button"
                      onClick={() => onOpen(company.id)}
                      type="button"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        count={ordered.length}
        label="empresas"
        onPage={pagination.setPage}
        page={pagination.page}
        pageCount={pagination.pageCount}
      />
    </section>
  );
}

function LimitIndicator({ mei }: { mei: FiscalMeiDTO }) {
  const tone = meiLimitTone(mei);
  const percent = limitPercent(mei);
  return (
    <div className="flex min-w-[135px] items-center gap-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8ece8]">
        <i
          className={`fiscal-limit-bar ${tone}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </span>
      <strong className={`fiscal-limit-text ${tone}`}>{percent}%</strong>
    </div>
  );
}

function MeiView({
  meis,
  onOpen,
  onNew,
}: {
  meis: FiscalMeiDTO[];
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const ordered = useMemo(
    () => [...meis].sort((a, b) => limitPercent(b) - limitPercent(a)),
    [meis],
  );
  const pagination = usePagination(ordered, 16);

  return (
    <section className="overflow-hidden rounded-panel border border-[#dce1dc] bg-white shadow-[0_10px_30px_rgba(23,32,27,0.035)]">
      <header className="flex flex-col gap-4 border-b border-[#e4e8e4] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.025em] text-ink">
            Acompanhamento anual do MEI
          </h2>
          <p className="mt-1 text-[11px] text-[#778079]">
            Clique em um MEI para abrir o faturamento mensal e o controle de guia.
          </p>
        </div>
        <button className="primary-button" onClick={onNew} type="button">
          <Plus size={16} />
          Novo MEI
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[900px]">
          <thead>
            <tr>
              <th>MEI</th>
              <th>Responsável</th>
              <th>Faturamento</th>
              <th>Status do limite</th>
              <th>Guia DAS</th>
              <th>Data de envio</th>
              <th aria-label="Ação" />
            </tr>
          </thead>
          <tbody>
            {pagination.visible.map((mei) => {
              const guide = mei.activities.find((activity) =>
                activity.name.toLocaleLowerCase("pt-BR").includes("guia"),
              );
              return (
                <tr key={mei.id}>
                  <td>
                    <button
                      className="text-left"
                      onClick={() => onOpen(mei.id)}
                      type="button"
                    >
                      <strong className="block max-w-[280px] truncate text-[12px] font-semibold text-ink">
                        {mei.name}
                      </strong>
                      <span className="mt-1 block text-[9px] text-[#879088]">
                        {mei.cnpj}
                      </span>
                    </button>
                  </td>
                  <td>{mei.responsible}</td>
                  <td className="font-semibold text-ink">
                    {currencyFormatter.format(mei.annualRevenue)}
                  </td>
                  <td>
                    <LimitIndicator mei={mei} />
                  </td>
                  <td>
                    <span
                      className={cn(
                        "fiscal-state",
                        guide?.sentAt ? "success" : "warning",
                      )}
                    >
                      {guide?.sentAt ? "Enviada" : statusLabel(guide?.status || "pending")}
                    </span>
                  </td>
                  <td>{formatDate(guide?.sentAt || null)}</td>
                  <td>
                    <button
                      aria-label={`Abrir ${mei.name}`}
                      className="icon-button"
                      onClick={() => onOpen(mei.id)}
                      type="button"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        count={ordered.length}
        label="MEIs"
        onPage={pagination.setPage}
        page={pagination.page}
        pageCount={pagination.pageCount}
      />
    </section>
  );
}

function isCertificateActive(mei: FiscalMeiDTO) {
  if (!mei.certificateActive) return false;
  return !mei.certificateExpiresAt || new Date(mei.certificateExpiresAt) >= new Date();
}

function AccessRow({
  mei,
  onSave,
}: {
  mei: FiscalMeiDTO;
  onSave: (
    id: string,
    values: {
      certificateDescription: string;
      certificateActive: boolean;
      certificateExpiresAt: string | null;
      accessCpf: string;
      accessPassword: string;
    },
  ) => Promise<void>;
}) {
  const [active, setActive] = useState(isCertificateActive(mei));
  const [description, setDescription] = useState(mei.certificateDescription);
  const [expiresAt, setExpiresAt] = useState(
    mei.certificateExpiresAt?.slice(0, 10) || "",
  );
  const [cpf, setCpf] = useState(mei.accessCpf);
  const [password, setPassword] = useState(mei.accessPassword);
  const [reveal, setReveal] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(mei.id, {
        certificateDescription: description,
        certificateActive: active,
        certificateExpiresAt: expiresAt || null,
        accessCpf: cpf,
        accessPassword: password,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <strong className="block max-w-[240px] truncate text-[12px] font-semibold text-ink">
          {mei.name}
        </strong>
        <span className="mt-1 block text-[9px] text-[#879088]">{mei.cnpj}</span>
      </td>
      <td>{mei.responsible}</td>
      <td>
        <button
          className={cn("fiscal-state", active ? "success" : "danger")}
          onClick={() => setActive((value) => !value)}
          type="button"
        >
          {active ? "Ativo" : "Inativo / vencido"}
        </button>
      </td>
      <td>
        <input
          className="fiscal-inline-input min-w-[150px]"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tipo / observação"
          value={description}
        />
      </td>
      <td>
        <input
          className="fiscal-inline-input min-w-[126px]"
          onChange={(event) => setExpiresAt(event.target.value)}
          type="date"
          value={expiresAt}
        />
      </td>
      <td>
        <input
          className="fiscal-inline-input min-w-[138px]"
          onChange={(event) => setCpf(event.target.value)}
          placeholder="CPF de acesso"
          value={cpf}
        />
      </td>
      <td>
        <label className="relative block min-w-[150px]">
          <input
            className="fiscal-inline-input w-full pr-9"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            type={reveal ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={reveal ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#758078]"
            onClick={() => setReveal((value) => !value)}
            type="button"
          >
            {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </label>
      </td>
      <td>
        <button
          className="secondary-button h-9 px-3"
          disabled={saving}
          onClick={save}
          type="button"
        >
          <Check size={14} />
          {saving ? "Salvando" : "Salvar"}
        </button>
      </td>
    </tr>
  );
}

function AccessView({
  meis,
  onSave,
}: {
  meis: FiscalMeiDTO[];
  onSave: Parameters<typeof AccessRow>[0]["onSave"];
}) {
  const pagination = usePagination(meis, 12);
  const active = meis.filter(isCertificateActive).length;

  return (
    <div className="flex flex-col gap-4">
      <section className="grid overflow-hidden rounded-panel border border-[#dce1dc] bg-white sm:grid-cols-3">
        <div className="flex items-center gap-4 border-b border-[#e4e8e4] p-5 sm:border-b-0 sm:border-r">
          <span className="grid size-11 place-items-center rounded-full bg-[#eaf3ec] text-moss">
            <KeyRound size={20} />
          </span>
          <div>
            <strong className="block text-2xl tracking-[-0.04em]">{active}</strong>
            <span className="text-[10px] text-[#707a73]">certificados ativos</span>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b border-[#e4e8e4] p-5 sm:border-b-0 sm:border-r">
          <span className="grid size-11 place-items-center rounded-full bg-[#fdeceb] text-coral">
            <LockKeyhole size={20} />
          </span>
          <div>
            <strong className="block text-2xl tracking-[-0.04em]">
              {meis.length - active}
            </strong>
            <span className="text-[10px] text-[#707a73]">inativos ou vencidos</span>
          </div>
        </div>
        <div className="flex items-center gap-4 p-5">
          <span className="grid size-11 place-items-center rounded-full bg-[#f2effa] text-[#786aa2]">
            <Store size={20} />
          </span>
          <div>
            <strong className="block text-2xl tracking-[-0.04em]">{meis.length}</strong>
            <span className="text-[10px] text-[#707a73]">MEIs monitorados</span>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-panel border border-[#dce1dc] bg-white shadow-[0_10px_30px_rgba(23,32,27,0.035)]">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[1320px]">
            <thead>
              <tr>
                <th>MEI</th>
                <th>Responsável</th>
                <th>Certificado</th>
                <th>Identificação</th>
                <th>Validade</th>
                <th>CPF de acesso</th>
                <th>Senha</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {pagination.visible.map((mei) => (
                <AccessRow key={mei.id} mei={mei} onSave={onSave} />
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          count={meis.length}
          label="MEIs"
          onPage={pagination.setPage}
          page={pagination.page}
          pageCount={pagination.pageCount}
        />
      </section>
    </div>
  );
}

function TeamView({
  companies,
  meis,
  currentResponsible,
  onSelect,
}: {
  companies: FiscalCompanyDTO[];
  meis: FiscalMeiDTO[];
  currentResponsible: string;
  onSelect: (name: string) => void;
}) {
  const rows = useMemo(() => {
    const names = [...new Set([
      ...companies.map((company) => company.responsible),
      ...meis.map((mei) => mei.responsible),
    ])]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    return names.map((name) => {
      const fiscal = companies.filter((company) => company.responsible === name);
      const meiRows = meis.filter((mei) => mei.responsible === name);
      const tasks = fiscal.flatMap((company) => company.tasks);
      const meiTasks = meiRows.flatMap((mei) => mei.activities);
      const applicable = [...tasks, ...meiTasks].filter(
        (task) => task.status !== "not_applicable",
      );
      const done = applicable.filter((task) => task.status === "done").length;
      return {
        name,
        fiscalCount: fiscal.length,
        meiCount: meiRows.length,
        pending: applicable.length - done,
        progress: applicable.length ? Math.round((done / applicable.length) * 100) : 0,
      };
    });
  }, [companies, meis]);

  return (
    <section className="overflow-hidden rounded-panel border border-[#dce1dc] bg-white shadow-[0_10px_30px_rgba(23,32,27,0.035)]">
      <div className="overflow-x-auto">
        <table className="data-table min-w-[760px]">
          <thead>
            <tr>
              <th>Responsável</th>
              <th>Empresas fiscais</th>
              <th>MEIs</th>
              <th>Progresso</th>
              <th>Pendências</th>
              <th>Minha carteira</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-[#eaf1eb] text-[10px] font-bold text-moss">
                      {row.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <strong className="text-[12px] text-ink">{row.name}</strong>
                  </div>
                </td>
                <td>{row.fiscalCount}</td>
                <td>{row.meiCount}</td>
                <td>
                  <Progress value={row.progress} />
                </td>
                <td>{row.pending}</td>
                <td>
                  <button
                    className={cn(
                      "secondary-button h-9 px-3",
                      currentResponsible === row.name &&
                        "border-[#a9c0ad] bg-[#edf4ee] text-moss",
                    )}
                    onClick={() => onSelect(row.name)}
                    type="button"
                  >
                    {currentResponsible === row.name ? <Check size={14} /> : null}
                    {currentResponsible === row.name ? "Selecionada" : "Selecionar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FiscalLeveClient({ initialData }: { initialData: FiscalSnapshot }) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [responsible, setResponsible] = useState("");
  const [regime, setRegime] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedMeiId, setSelectedMeiId] = useState<string | null>(null);
  const [newMeiOpen, setNewMeiOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const responsibles = useMemo(
    () =>
      [...new Set([
        ...data.fiscalCompanies.map((company) => company.responsible),
        ...data.meiCompanies.map((mei) => mei.responsible),
      ])]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [data.fiscalCompanies, data.meiCompanies],
  );
  const regimes = useMemo(
    () =>
      [...new Set(data.fiscalCompanies.map((company) => company.regime))].sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [data.fiscalCompanies],
  );

  const filteredCompanies = useMemo(
    () =>
      data.fiscalCompanies.filter(
        (company) =>
          matchesCompany(company, search) &&
          (!responsible || company.responsible === responsible) &&
          (!regime || company.regime === regime),
      ),
    [data.fiscalCompanies, regime, responsible, search],
  );
  const filteredMeis = useMemo(
    () =>
      data.meiCompanies.filter(
        (mei) =>
          matchesCompany(mei, search) &&
          (!responsible || mei.responsible === responsible),
      ),
    [data.meiCompanies, responsible, search],
  );

  const selectedCompany = data.fiscalCompanies.find(
    (company) => company.id === selectedCompanyId,
  );
  const selectedMei = data.meiCompanies.find((mei) => mei.id === selectedMeiId);

  function replaceCompany(company: FiscalCompanyDTO) {
    startTransition(() => {
      setData((current) => ({
        ...current,
        fiscalCompanies: current.fiscalCompanies.map((item) =>
          item.id === company.id ? company : item,
        ),
      }));
    });
  }

  function replaceMei(mei: FiscalMeiDTO) {
    startTransition(() => {
      setData((current) => ({
        ...current,
        meiCompanies: current.meiCompanies.map((item) =>
          item.id === mei.id ? mei : item,
        ),
      }));
    });
  }

  async function mutateCompany(id: string, body: unknown) {
    try {
      replaceCompany(
        await apiMutation<FiscalCompanyDTO>(
          `/api/fiscal-leve/companies/${id}`,
          body,
        ),
      );
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Não foi possível salvar.",
        type: "error",
      });
    }
  }

  async function mutateMei(id: string, body: unknown, success?: string) {
    try {
      replaceMei(
        await apiMutation<FiscalMeiDTO>(`/api/fiscal-leve/meis/${id}`, body),
      );
      if (success) setToast({ message: success, type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Não foi possível salvar.",
        type: "error",
      });
      throw error;
    }
  }

  async function createMei(input: {
    name: string;
    cnpj: string;
    responsible: string;
  }) {
    const response = await fetch("/api/fiscal-leve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = (await response.json()) as FiscalMeiDTO & { error?: string };
    if (!response.ok) {
      const error = new Error(result.error || "Não foi possível cadastrar o MEI.");
      setToast({ message: error.message, type: "error" });
      throw error;
    }
    setData((current) => ({
      ...current,
      meiCompanies: [...current.meiCompanies, result].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      ),
    }));
    setNewMeiOpen(false);
    setSelectedMeiId(result.id);
    setToast({ message: "MEI cadastrado no banco do Nexo.", type: "success" });
  }

  async function updateResponsible(name: string) {
    try {
      const result = await apiMutation<{ currentResponsible: string }>(
        "/api/fiscal-leve/settings",
        { currentResponsible: name },
      );
      setData((current) => ({
        ...current,
        currentResponsible: result.currentResponsible,
      }));
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Não foi possível salvar.",
        type: "error",
      });
    }
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexo-fiscal-leve-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const copy = VIEW_COPY[view];

  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <nav
        aria-label="Navegação do Fiscal Leve"
        className="sticky top-[72px] z-30 border-b border-[#dfe4df] bg-[#f7f8f5]/95 backdrop-blur-xl"
      >
        <div className="page-container flex items-center gap-2 overflow-x-auto">
          <div className="mr-3 hidden shrink-0 items-center gap-2 border-r border-[#d9ded9] pr-5 text-sm font-semibold text-ink lg:flex">
            <Gauge className="text-moss" size={18} />
            Fiscal Leve
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                aria-current={view === item.id ? "page" : undefined}
                className={cn(
                  "relative flex h-[58px] shrink-0 items-center gap-2 px-3 text-[11px] font-medium text-[#637069] transition hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#345c4520] sm:px-4",
                  view === item.id && "font-semibold text-moss",
                )}
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setSearch("");
                  setResponsible("");
                  setRegime("");
                }}
                type="button"
              >
                <Icon size={16} />
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-moss transition-transform",
                    view === item.id ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            );
          })}
          <button
            className="ml-auto hidden h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-[10px] font-semibold text-[#637069] transition hover:bg-white hover:text-moss xl:flex"
            onClick={exportBackup}
            type="button"
          >
            <Download size={14} />
            Exportar backup
          </button>
        </div>
      </nav>

      <div className="page-container py-8 sm:py-10">
        <header className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <div>
            <h1 className="page-heading">{copy.title}</h1>
            <p className="page-subtitle">{copy.description}</p>
          </div>
          <div className="flex h-14 min-w-[195px] items-center gap-3 rounded-xl border border-[#dce1dc] bg-white px-4">
            <CalendarDays className="text-moss" size={18} />
            <span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-[#879089]">
                Competência
              </span>
              <strong className="mt-0.5 block text-[12px] text-ink">Julho 2026</strong>
            </span>
          </div>
          <div className="flex h-14 min-w-[210px] items-center gap-3 rounded-xl border border-[#dce1dc] bg-white px-4">
            <UsersRound className="text-moss" size={20} />
            <strong className="text-2xl tracking-[-0.04em] text-ink">
              {data.fiscalCompanies.length + data.meiCompanies.length}
            </strong>
            <span className="text-[10px] leading-4 text-[#768078]">
              clientes
              <br />
              {data.fiscalCompanies.length} fiscais · {data.meiCompanies.length} MEIs
            </span>
          </div>
        </header>

        {view !== "team" ? (
          <section className="my-6 grid gap-3 rounded-panel border border-[#e0e5e0] bg-white p-3 shadow-[0_8px_24px_rgba(23,32,27,0.025)] sm:grid-cols-2 xl:grid-cols-[minmax(280px,1.5fr)_220px_210px_auto]">
            <label className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7e8981]"
                size={17}
              />
              <input
                className="field-control pl-10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou CNPJ"
                type="search"
                value={search}
              />
            </label>
            <select
              className="field-control"
              onChange={(event) => setResponsible(event.target.value)}
              value={responsible}
            >
              <option value="">Todos os responsáveis</option>
              {responsibles.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            {view === "overview" || view === "routine" ? (
              <select
                className="field-control"
                onChange={(event) => setRegime(event.target.value)}
                value={regime}
              >
                <option value="">Todos os regimes</option>
                {regimes.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            ) : (
              <div className="hidden xl:block" />
            )}
            <button
              className="secondary-button border-transparent bg-transparent px-3 shadow-none"
              onClick={() => {
                setSearch("");
                setResponsible("");
                setRegime("");
              }}
              type="button"
            >
              <RotateCcw size={14} />
              Limpar filtros
            </button>
          </section>
        ) : (
          <div className="my-6" />
        )}

        {view === "overview" ? (
          <FiscalOverview
            companies={filteredCompanies}
            meis={filteredMeis}
            onOpenCompany={setSelectedCompanyId}
            onOpenMei={setSelectedMeiId}
          />
        ) : null}
        {view === "routine" ? (
          <RoutineView companies={filteredCompanies} onOpen={setSelectedCompanyId} />
        ) : null}
        {view === "mei" ? (
          <MeiView
            meis={filteredMeis}
            onNew={() => setNewMeiOpen(true)}
            onOpen={setSelectedMeiId}
          />
        ) : null}
        {view === "access" ? (
          <AccessView
            meis={filteredMeis}
            onSave={(id, values) =>
              mutateMei(
                id,
                { type: "access", ...values },
                "Certificado e acesso salvos com segurança.",
              )
            }
          />
        ) : null}
        {view === "team" ? (
          <TeamView
            companies={data.fiscalCompanies}
            currentResponsible={data.currentResponsible}
            meis={data.meiCompanies}
            onSelect={updateResponsible}
          />
        ) : null}
      </div>

      {selectedCompany ? (
        <FiscalCompanyDrawer
          company={selectedCompany}
          onAddTask={(name, status) =>
            mutateCompany(selectedCompany.id, { type: "addTask", name, status })
          }
          onClose={() => setSelectedCompanyId(null)}
          onProfileChange={(changes) =>
            mutateCompany(selectedCompany.id, { type: "profile", ...changes })
          }
          onTaskChange={(taskId, status) =>
            mutateCompany(selectedCompany.id, {
              type: "taskStatus",
              taskId,
              status,
            })
          }
          responsibles={responsibles}
        />
      ) : null}

      {selectedMei ? (
        <FiscalMeiDrawer
          mei={selectedMei}
          onActivityChange={(activityId: string, status: FiscalStatus) =>
            mutateMei(selectedMei.id, {
              type: "activityStatus",
              activityId,
              status,
            })
          }
          onClose={() => setSelectedMeiId(null)}
          onGuideSent={(activityId, sent) =>
            mutateMei(
              selectedMei.id,
              { type: "guideSent", activityId, sent },
              sent ? "Guia marcada como enviada." : "Envio da guia desmarcado.",
            )
          }
          onProfileChange={(changes) =>
            mutateMei(selectedMei.id, { type: "profile", ...changes })
          }
          onRevenueChange={(month, value) =>
            mutateMei(selectedMei.id, {
              type: "revenue",
              year: 2026,
              month,
              value,
            })
          }
          responsibles={responsibles}
        />
      ) : null}

      {newMeiOpen ? (
        <NewMeiModal
          onClose={() => setNewMeiOpen(false)}
          onSubmit={createMei}
          responsibles={responsibles.length ? responsibles : ["Não definido"]}
        />
      ) : null}

      {toast ? (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
          type={toast.type}
        />
      ) : null}
    </div>
  );
}
