"use client";

import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      });

      if (result.error) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      window.location.assign(nextPath);
    } catch {
      setError("Não foi possível entrar agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute -left-32 top-16 h-80 w-80 rounded-full bg-moss/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-10 h-72 w-72 rounded-full bg-lavender/15 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-line bg-white shadow-panel lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-moss p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <BrandMark className="bg-white text-moss" />
            <p className="mt-5 text-sm font-semibold tracking-[0.12em] text-white/70">
              NEXO CONTÁBIL
            </p>
          </div>

          <div className="my-16">
            <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-[-0.045em]">
              Sua operação contábil protegida em um único lugar.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
              Acesse dados fiscais, clientes e rotinas usando sua conta administrativa.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/70">
            <ShieldCheck size={18} />
            Sessão protegida e dados restritos
          </div>
        </section>

        <section className="px-6 py-10 sm:px-12 sm:py-14">
          <div className="lg:hidden">
            <BrandMark />
          </div>

          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-moss">
              Acesso administrativo
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">
              Entre no Nexo
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Informe o e-mail e a senha cadastrados para continuar.
            </p>
          </div>

          <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="email">
                E-mail
              </label>
              <input
                autoComplete="username"
                autoFocus
                className="field-control"
                id="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@empresa.com.br"
                required
                type="email"
                value={email}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className="field-control pr-12"
                  id="password"
                  minLength={12}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-1 grid w-10 place-items-center text-muted transition hover:text-moss"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted">
              <input
                checked={rememberMe}
                className="field-checkbox"
                onChange={(event) => setRememberMe(event.target.checked)}
                type="checkbox"
              />
              Manter conectado neste dispositivo
            </label>

            {error ? (
              <p aria-live="polite" className="rounded-control bg-danger-subtle px-3.5 py-3 text-xs text-danger">
                {error}
              </p>
            ) : null}

            <button className="primary-button w-full" disabled={submitting} type="submit">
              {submitting ? <span aria-hidden="true" className="button-spinner" /> : <LockKeyhole size={17} />}
              {submitting ? "Entrando..." : "Entrar com segurança"}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] leading-5 text-[#8a938c]">
            O cadastro de novos usuários está desativado.
          </p>
        </section>
      </div>
    </div>
  );
}
