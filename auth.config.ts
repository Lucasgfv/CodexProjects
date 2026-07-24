import { getAuthOrigin, sanitizeCallbackPath, usesSecureAuthCookies } from "@/lib/auth-url";
import { logSafeError } from "@/lib/logger";
import type { NextAuthConfig } from "next-auth";

const authOrigin = getAuthOrigin();
const secureCookies = usesSecureAuthCookies();
const securePrefix = secureCookies ? "__Secure-" : "";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  useSecureCookies: secureCookies,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: `${securePrefix}autcompany.session-token.v2`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
    callbackUrl: {
      name: `${securePrefix}autcompany.callback-url.v2`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
    csrfToken: {
      name: `${secureCookies ? "__Host-" : ""}autcompany.csrf-token.v2`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
  },
  logger: {
    error(error) {
      logSafeError("autenticacao.authjs", error);
    },
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      if (process.env.AUTH_DISABLED === "true") return true;

      const path = request.nextUrl.pathname;
      const publicPath = path === "/login" || path.startsWith("/api/auth");

      if (publicPath) {
        if (auth?.user && path === "/login") return Response.redirect(new URL("/", authOrigin));
        return true;
      }
      if (!auth?.user) {
        const loginUrl = new URL("/login", authOrigin);
        loginUrl.searchParams.set("callbackUrl", sanitizeCallbackPath(`${request.nextUrl.pathname}${request.nextUrl.search}`));
        return Response.redirect(loginUrl);
      }
      if (auth.user.deveTrocarSenha && path !== "/alterar-senha") {
        return Response.redirect(new URL("/alterar-senha", authOrigin));
      }
      return true;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return new URL(sanitizeCallbackPath(url, "/", true), baseUrl).toString();
      try {
        const destination = new URL(url);
        return destination.origin === new URL(baseUrl).origin ? destination.toString() : baseUrl;
      } catch {
        return baseUrl;
      }
    },
    jwt({ token, user }) {
      if (user) {
        token.papel = user.papel;
        token.deveTrocarSenha = user.deveTrocarSenha;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.papel = token.papel === "ADMIN" || token.papel === "OPERADOR" || token.papel === "VISUALIZADOR" ? token.papel : "VISUALIZADOR";
      session.user.deveTrocarSenha = token.deveTrocarSenha === true;
      return session;
    },
  },
} satisfies NextAuthConfig;
