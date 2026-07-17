import type { Prisma } from "@prisma/client";

export type AuditActor = { id: string };
export type AuditChanges = Record<string, { anterior?: unknown; novo?: unknown }>;

function jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (item instanceof Date) return item.toISOString();
    if (typeof item === "bigint") return item.toString();
    return item;
  })) as Prisma.InputJsonValue;
}

export async function createAudit(
  tx: Prisma.TransactionClient,
  actor: AuditActor | null,
  entidade: string,
  entidadeId: string,
  acao: string,
  alteracoes?: AuditChanges,
) {
  await tx.auditoria.create({
    data: {
      usuarioId: actor?.id ?? null,
      entidade,
      entidadeId,
      acao,
      alteracoes: jsonValue(alteracoes),
    },
  });
}

export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>, fields: string[]) {
  const changes: AuditChanges = {};
  for (const field of fields) {
    const oldValue = jsonValue(before[field]);
    const newValue = jsonValue(after[field]);
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) changes[field] = { anterior: oldValue, novo: newValue };
  }
  return changes;
}

