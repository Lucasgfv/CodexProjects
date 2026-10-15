"use client";

import { KeyRound } from "lucide-react";
import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < 12) {
      setMessage({ type: "error", text: "A nova senha deve ter pelo menos 12 caracteres." });
      return;
    }
    if (newPassword !== confirmation) {
      setMessage({ type: "error", text: "A confirmação não corresponde à nova senha." });
      return;
    }

    setSubmitting(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        setMessage({ type: "error", text: "A senha atual não foi confirmada." });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setMessage({ type: "success", text: "Senha alterada com segurança." });
    } catch {
      setMessage({ type: "error", text: "Não foi possível alterar a senha agora." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="surface-card p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-moss-subtle text-moss">
          <KeyRound size={19} />
        </span>
        <div>
          <h2 className="font-semibold tracking-[-0.02em]">Alterar senha</h2>
          <p className="mt-0.5 text-xs text-muted">Use pelo menos 12 caracteres.</p>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="field-label" htmlFor="current-password">Senha atual</label>
          <input
            autoComplete="current-password"
            className="field-control"
            id="current-password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="new-password">Nova senha</label>
            <input
              autoComplete="new-password"
              className="field-control"
              id="new-password"
              minLength={12}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="confirm-password">Confirmar senha</label>
            <input
              autoComplete="new-password"
              className="field-control"
              id="confirm-password"
              minLength={12}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              type="password"
              value={confirmation}
            />
          </div>
        </div>

        {message ? (
          <p
            aria-live="polite"
            className={message.type === "success" ? "rounded-control bg-success-subtle px-3.5 py-3 text-xs text-success" : "rounded-control bg-danger-subtle px-3.5 py-3 text-xs text-danger"}
          >
            {message.text}
          </p>
        ) : null}

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? <span aria-hidden="true" className="button-spinner" /> : null}
          {submitting ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </section>
  );
}
