import { requirePageUser } from "@/lib/authz";
import { PasswordForm } from "@/components/password-form";

export default async function ChangePasswordPage() {
  await requirePageUser(undefined, true);
  return <main className="login-shell"><section className="login-card">
    <div><p className="eyebrow">Segurança da conta</p><h1>Alterar senha</h1><p className="subtitle">A troca é obrigatória no primeiro acesso ou após uma redefinição pelo administrador.</p></div>
    <PasswordForm />
  </section></main>;
}

