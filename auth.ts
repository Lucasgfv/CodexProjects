import { authConfig } from "@/auth.config";
import { normalizeEmail } from "@/lib/company-validation";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const LOCK_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(typeof credentials?.email === "string" ? credentials.email : "");
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.usuario.findUnique({ where: { email } });
        if (!user || !user.ativo) return null;

        const now = new Date();
        if (user.bloqueadoAte && user.bloqueadoAte > now) return null;

        const valid = await compare(password, user.senhaHash);
        if (!valid) {
          const attempts = user.bloqueadoAte && user.bloqueadoAte <= now ? 1 : user.tentativasFalhas + 1;
          await prisma.usuario.update({
            where: { id: user.id },
            data: {
              tentativasFalhas: attempts >= MAX_ATTEMPTS ? 0 : attempts,
              bloqueadoAte: attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + LOCK_MINUTES * 60_000) : null,
            },
          });
          return null;
        }

        await prisma.usuario.update({
          where: { id: user.id },
          data: { tentativasFalhas: 0, bloqueadoAte: null, ultimoAcessoEm: now },
        });

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          papel: user.papel,
          deveTrocarSenha: user.deveTrocarSenha,
        };
      },
    }),
  ],
});

