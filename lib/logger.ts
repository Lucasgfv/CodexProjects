export function logSafeError(area: string, error: unknown) {
  const eventId = typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `evt-${Date.now().toString(36)}`;
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorCode = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;
  const errorType = typeof error === "object" && error !== null && "type" in error && typeof error.type === "string" ? error.type : undefined;
  console.error(JSON.stringify({ level: "error", eventId, area, errorName, errorCode, errorType, timestamp: new Date().toISOString() }));
  return eventId;
}
