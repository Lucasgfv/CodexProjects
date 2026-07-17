"use client";

import { loginAction, type LoginState } from "@/app/login/actions";
import { useActionState } from "react";

const INITIAL_STATE: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, INITIAL_STATE);
  return <form action={action} className="login-form">
    {state.error ? <div className="form-alert error" role="alert">{state.error}</div> : null}
    <div className="field span-12"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="username" required autoFocus /></div>
    <div className="field span-12"><label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
    <button className="button" type="submit" disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button>
  </form>;
}

