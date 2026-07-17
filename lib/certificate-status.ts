export type CertificateStatus = "VENCIDO" | "PROXIMO" | "EM_DIA";

function saoPauloTodayUtc(reference: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(reference);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day));
}

function calendarDateUtc(value: Date | string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function certificateDaysUntil(expiration: Date | string, reference = new Date()) {
  return Math.round((calendarDateUtc(expiration) - saoPauloTodayUtc(reference)) / 86_400_000);
}

export function certificateStatus(expiration: Date | string, reference = new Date()): CertificateStatus {
  const days = certificateDaysUntil(expiration, reference);
  if (days < 0) return "VENCIDO";
  if (days <= 30) return "PROXIMO";
  return "EM_DIA";
}

