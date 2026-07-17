import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const publicPath = path === "/login" || path.startsWith("/api/auth");

      if (publicPath) {
        if (auth?.user && path === "/login") return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }
      if (!auth?.user) return false;
      if (auth.user.deveTrocarSenha && path !== "/alterar-senha") {
        return Response.redirect(new URL("/alterar-senha", request.nextUrl));
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
