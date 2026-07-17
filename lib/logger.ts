import { randomUUID } from "node:crypto";

export function logSafeError(area: string, error: unknown) {
  const eventId = randomUUID();
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorCode = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;
  console.error(JSON.stringify({ level: "error", eventId, area, errorName, errorCode, timestamp: new Date().toISOString() }));
  return eventId;
}

