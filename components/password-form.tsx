"use client";

import { changePasswordAction, type PasswordState } from "@/app/alterar-senha/actions";
import { useActionState } from "react";

const INITIAL_STATE: PasswordState = {};

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, INITIAL_STATE);
  return <form action={action} className="login-form">
    {state.error ? <div className="form-alert error" role="alert">{state.error}</div> : null}
    <div className="field span-12"><label htmlFor="senhaAtual">Senha atual</label><input id="senhaAtual" name="senhaAtual" type="password" autoComplete="current-password" required /></div>
    <div className="field span-12"><label htmlFor="novaSenha">Nova senha</label><input id="novaSenha" name="novaSenha" type="password" autoComplete="new-password" minLength={12} required /></div>
    <div className="field span-12"><label htmlFor="confirmacao">Confirmar nova senha</label><input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" minLength={12} required /></div>
    <p className="password-hint">Use pelo menos 12 caracteres, com maiúscula, minúscula e número.</p>
    <button className="button" type="submit" disabled={pending}>{pending ? "Alterando..." : "Alterar senha"}</button>
  </form>;
}

