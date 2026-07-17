import { createUser, resetUserPassword, updateUser } from "@/app/usuarios/actions";
import { requirePageUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePageUser(["ADMIN"]);
  const query = await searchParams;
  const users = await prisma.usuario.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }], select: { id: true, nome: true, email: true, papel: true, ativo: true, deveTrocarSenha: true, ultimoAcessoEm: true } });
  const flash = typeof query.erro === "string" ? { error: true, text: query.erro } : typeof query.mensagem === "string" ? { error: false, text: query.mensagem } : null;

  return <main className="form-shell users-shell">
    <Link className="back" href="/">← Voltar para o dashboard</Link>
    <div><p className="eyebrow">Administração</p><h1>Usuários e permissões</h1><p className="subtitle">Contas são bloqueadas, nunca excluídas. Toda alteração fica registrada na auditoria.</p></div>
    {flash ? <div className={`form-alert ${flash.error ? "error" : ""}`} role="status">{flash.text}</div> : null}
    <section className="registration-panel"><h2 className="panel-title">Criar usuário</h2><form action={createUser} className="form-grid compact-form">
      <div className="field span-6"><label htmlFor="novoNome">Nome</label><input id="novoNome" name="nome" required /></div>
      <div className="field span-6"><label htmlFor="novoEmail">E-mail</label><input id="novoEmail" name="email" type="email" required /></div>
      <div className="field"><label htmlFor="novoPapel">Papel</label><select id="novoPapel" name="papel"><option value="VISUALIZADOR">Visualizador</option><option value="OPERADOR">Operador</option><option value="ADMIN">Administrador</option></select></div>
      <div className="field span-6"><label htmlFor="novaSenha">Senha temporária</label><input id="novaSenha" name="senhaTemporaria" type="password" minLength={12} required /></div>
      <div className="form-actions span-12"><button className="button" type="submit">Criar usuário</button></div>
    </form></section>
    <section className="registration-panel"><h2 className="panel-title">Contas cadastradas</h2><div className="user-list">{users.map((user) => <article className="user-card" key={user.id}>
      <div><strong>{user.nome}</strong><span>{user.email}</span><small>{user.deveTrocarSenha ? "Troca de senha pendente" : user.ultimoAcessoEm ? `Último acesso: ${user.ultimoAcessoEm.toLocaleString("pt-BR")}` : "Ainda não acessou"}</small></div>
      <form action={updateUser.bind(null, user.id)} className="user-edit-form">
        <label><span>Nome</span><input name="nome" defaultValue={user.nome} required /></label>
        <label><span>Papel</span><select name="papel" defaultValue={user.papel}><option value="VISUALIZADOR">Visualizador</option><option value="OPERADOR">Operador</option><option value="ADMIN">Administrador</option></select></label>
        <label className="inline-check"><input name="ativo" type="checkbox" defaultChecked={user.ativo} /> Ativo</label>
        <button className="button secondary" type="submit">Salvar</button>
      </form>
      <form action={resetUserPassword.bind(null, user.id)} className="reset-form"><label><span>Nova senha temporária</span><input name="senhaTemporaria" type="password" minLength={12} required /></label><button className="button secondary" type="submit">Redefinir senha</button></form>
    </article>)}</div></section>
  </main>;
}

