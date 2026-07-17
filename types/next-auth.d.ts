import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      papel: "ADMIN" | "OPERADOR" | "VISUALIZADOR";
      deveTrocarSenha: boolean;
    };
  }

  interface User {
    papel: "ADMIN" | "OPERADOR" | "VISUALIZADOR";
    deveTrocarSenha: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    papel?: "ADMIN" | "OPERADOR" | "VISUALIZADOR";
    deveTrocarSenha?: boolean;
  }
}

