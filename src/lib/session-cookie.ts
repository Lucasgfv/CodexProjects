const SESSION_COOKIE_NAMES = new Set([
  "better-auth.session_token",
  "better-auth-session_token",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth-session_token",
]);

export function hasSessionCookie(headers: Headers) {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return false;

  return cookieHeader.split(";").some((cookie) => {
    const separator = cookie.indexOf("=");
    const name = (separator === -1 ? cookie : cookie.slice(0, separator)).trim();
    return SESSION_COOKIE_NAMES.has(name);
  });
}
