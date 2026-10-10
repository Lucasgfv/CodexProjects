import type {
  FiscalCompanyDTO,
  FiscalMeiDTO,
  FiscalStatus,
} from "@/lib/fiscal-leve";

export const STATUS_OPTIONS: Array<{ value: FiscalStatus; label: string }> = [
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em andamento" },
  { value: "done", label: "Concluído" },
  { value: "not_applicable", label: "Não se aplica" },
];

export const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

export function companyProgress(company: FiscalCompanyDTO) {
  const applicable = company.tasks.filter(
    (task) => task.status !== "not_applicable",
  );
  if (!applicable.length) return 0;
  return Math.round(
    (applicable.filter((task) => task.status === "done").length /
      applicable.length) *
      100,
  );
}

export function openTasks(company: FiscalCompanyDTO) {
  return company.tasks.filter(
    (task) => task.status === "pending" || task.status === "in_progress",
  );
}

export function limitPercent(mei: FiscalMeiDTO) {
  if (!mei.referenceLimit) return 0;
  return Math.round((mei.annualRevenue / mei.referenceLimit) * 100);
}

export function meiLimitTone(mei: FiscalMeiDTO) {
  if (mei.annualRevenue > mei.referenceLimit) return "danger" as const;
  if (mei.annualRevenue >= 64800) return "attention" as const;
  return "safe" as const;
}

export function matchesCompany(
  item: Pick<FiscalCompanyDTO | FiscalMeiDTO, "name" | "cnpj" | "cnpjDigits">,
  search: string,
) {
  const text = search.trim().toLocaleLowerCase("pt-BR");
  if (!text) return true;
  const digits = search.replace(/\D/g, "");
  return (
    item.name.toLocaleLowerCase("pt-BR").includes(text) ||
    item.cnpj.toLocaleLowerCase("pt-BR").includes(text) ||
    Boolean(digits && item.cnpjDigits.includes(digits))
  );
}

export function statusLabel(status: FiscalStatus) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.label || status
  );
}

export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export async function apiMutation<T>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
  return data;
}
