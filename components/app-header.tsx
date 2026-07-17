import { logoutAction } from "@/app/auth-actions";
import { Building2, FileClock, LogOut, Plus, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

type HeaderUser = { nome: string; papel: "ADMIN" | "OPERADOR" | "VISUALIZADOR" };

export function AppHeader({ user }: { user: HeaderUser }) {
  const canEdit = user.papel === "ADMIN" || user.papel === "OPERADOR";
  return <header className="topbar no-print">
    <Link className="brand" href="/"><span className="brand-mark"><Building2 size={19} /></span><span>AutCompany<small>Gestão contábil</small></span></Link>
    <nav className="top-actions" aria-label="Navegação principal">
      <Link className="top-link" href="/certificados"><ShieldCheck size={16} /> Certificados</Link>
      {user.papel === "ADMIN" ? <Link className="top-link" href="/auditoria"><FileClock size={16} /> Auditoria</Link> : null}
      {user.papel === "ADMIN" ? <Link className="top-link" href="/usuarios"><Users size={16} /> Usuários</Link> : null}
      {canEdit ? <Link className="button header-button" href="/empresas/nova"><Plus size={17} /> Nova empresa</Link> : null}
      <span className="user-summary"><strong>{user.nome}</strong><small>{user.papel.toLocaleLowerCase("pt-BR")}</small></span>
      <form action={logoutAction}><button className="icon-button" type="submit" title="Sair" aria-label="Sair"><LogOut size={17} /></button></form>
    </nav>
  </header>;
}

