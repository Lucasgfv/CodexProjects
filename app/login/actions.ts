"use server";

import { signIn } from "@/auth";
import { normalizeEmail } from "@/lib/company-validation";
import { AuthError } from "next-auth";

export type LoginState = { error?: string };

export async function loginAction(_state: LoginState, form: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "E-mail ou senha inválidos, usuário bloqueado ou inativo." };
    throw error;
  }
}

