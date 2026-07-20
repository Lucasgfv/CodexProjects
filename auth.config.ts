import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: "autcompany.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const publicPath = path === "/login" || path.startsWith("/api/auth");
      const canonicalOrigin = process.env.AUTH_URL || request.nextUrl.origin;

      if (publicPath) {
        if (auth?.user && path === "/login") return Response.redirect(new URL("/", canonicalOrigin));
        return true;
      }
      if (!auth?.user) {
        const loginUrl = new URL("/login", canonicalOrigin);
        loginUrl.searchParams.set("callbackUrl", new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, canonicalOrigin).toString());
        return Response.redirect(loginUrl);
      }
      if (auth.user.deveTrocarSenha && path !== "/alterar-senha") {
        return Response.redirect(new URL("/alterar-senha", canonicalOrigin));
      }
      return true;
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
