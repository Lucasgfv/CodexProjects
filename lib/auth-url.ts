const LOCAL_AUTH_ORIGIN = "http://127.0.0.1:3000";

export function getAuthOrigin(value = process.env.AUTCOMPANY_PUBLIC_URL) {
  if (!value) return LOCAL_AUTH_ORIGIN;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : LOCAL_AUTH_ORIGIN;
  } catch {
    return LOCAL_AUTH_ORIGIN;
  }
}

export function usesSecureAuthCookies(value = process.env.AUTCOMPANY_PUBLIC_URL) {
  return getAuthOrigin(value).startsWith("https://");
}

export function sanitizeCallbackPath(value: unknown, fallback = "/", allowLogin = false) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const parsed = new URL(value, LOCAL_AUTH_ORIGIN);
    if (parsed.origin !== LOCAL_AUTH_ORIGIN || (!allowLogin && parsed.pathname === "/login") || parsed.pathname.startsWith("/api/auth")) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
