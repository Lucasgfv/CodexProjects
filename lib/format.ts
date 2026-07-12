export const currency = (value: unknown) =>
  value == null || value === ""
    ? "—"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

export const date = (value: Date | string | null | undefined) =>
  value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value)) : "—";

export const enumLabel = (value: string | null | undefined) =>
  value ? value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : "—";
