"use server";

import { signIn } from "@/auth";
import { sanitizeCallbackPath } from "@/lib/auth-url";
import { normalizeEmail } from "@/lib/company-validation";
import { logSafeError } from "@/lib/logger";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type LoginState = { error?: string };

export async function loginAction(_state: LoginState, form: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const password = String(form.get("password") ?? "");
  const callbackUrl = sanitizeCallbackPath(form.get("callbackUrl"));
  if (!email || !password) return { error: "Informe e-mail e senha." };

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
    return {};
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError && error.type === "CredentialsSignin") return { error: "E-mail ou senha inválidos, usuário bloqueado ou inativo." };
    const eventId = logSafeError("autenticacao.login", error);
    return { error: `Não foi possível iniciar a sessão. Informe o código ${eventId} ao administrador.` };
  }
}
