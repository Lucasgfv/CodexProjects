import { LoginForm } from "@/components/login-form";
import { Building2 } from "lucide-react";

export default function LoginPage() {
  return <main className="login-shell">
    <section className="login-card">
      <div className="login-brand"><span className="brand-mark"><Building2 size={22} /></span><div><strong>AutCompany</strong><small>Gestão contábil interna</small></div></div>
      <div><p className="eyebrow">Acesso protegido</p><h1>Entrar no sistema</h1><p className="subtitle">Use a conta criada pelo administrador do escritório.</p></div>
      <LoginForm />
    </section>
  </main>;
}

