"use server";

import { createAudit, diffFields } from "@/lib/audit";
import { requireActionUser } from "@/lib/authz";
import { normalizeEmail } from "@/lib/company-validation";
import { hashPassword, validatePassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import type { PapelUsuario } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ROLES = new Set<PapelUsuario>(["ADMIN", "OPERADOR", "VISUALIZADOR"]);
const message = (kind: "mensagem" | "erro", value: string): never => redirect(`/usuarios?${kind}=${encodeURIComponent(value)}`);

export async function createUser(form: FormData) {
  const actor = await requireActionUser(["ADMIN"]);
  const nome = String(form.get("nome") ?? "").trim();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const password = String(form.get("senhaTemporaria") ?? "");
  const roleRaw = String(form.get("papel") ?? "VISUALIZADOR") as PapelUsuario;
  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) message("erro", "Informe nome e e-mail válidos.");
  if (!ROLES.has(roleRaw)) message("erro", "Selecione um papel válido.");
  const papel = roleRaw;
  const passwordError = validatePassword(password);
  if (passwordError) message("erro", passwordError);
  const senhaHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({ data: { nome, email, senhaHash, papel, deveTrocarSenha: true } });
      await createAudit(tx, actor, "USUARIO", user.id, "CRIAR", { nome: { novo: nome }, email: { novo: email }, papel: { novo: papel } });
    });
  } catch {
    message("erro", "Não foi possível criar o usuário. Verifique se o e-mail já está cadastrado.");
  }
  revalidatePath("/usuarios");
  message("mensagem", "Usuário criado. Ele deverá trocar a senha temporária no primeiro acesso.");
}

export async function updateUser(id: string, form: FormData) {
  const actor = await requireActionUser(["ADMIN"]);
  const nome = String(form.get("nome") ?? "").trim();
  const roleRaw = String(form.get("papel") ?? "VISUALIZADOR") as PapelUsuario;
  const ativo = form.get("ativo") === "on";
  if (!nome) message("erro", "Informe o nome do usuário.");
  if (!ROLES.has(roleRaw)) message("erro", "Selecione um papel válido.");
  const papel = roleRaw;
  if (id === actor.id && (!ativo || papel !== "ADMIN")) message("erro", "Você não pode remover seu próprio acesso administrativo.");

  await prisma.$transaction(async (tx) => {
    const before = await tx.usuario.findUniqueOrThrow({ where: { id }, select: { nome: true, papel: true, ativo: true } });
    if (before.papel === "ADMIN" && before.ativo && (!ativo || papel !== "ADMIN")) {
      const admins = await tx.usuario.count({ where: { papel: "ADMIN", ativo: true } });
      if (admins <= 1) throw new Error("LAST_ADMIN");
    }
    const after = await tx.usuario.update({ where: { id }, data: { nome, papel, ativo }, select: { nome: true, papel: true, ativo: true } });
    await createAudit(tx, actor, "USUARIO", id, "ATUALIZAR", diffFields(before, after, ["nome", "papel", "ativo"]));
  }).catch((error) => {
    if (error instanceof Error && error.message === "LAST_ADMIN") message("erro", "O último administrador ativo não pode ser bloqueado.");
    throw error;
  });
  revalidatePath("/usuarios");
  message("mensagem", "Usuário atualizado.");
}

export async function resetUserPassword(id: string, form: FormData) {
  const actor = await requireActionUser(["ADMIN"]);
  const password = String(form.get("senhaTemporaria") ?? "");
  const passwordError = validatePassword(password);
  if (passwordError) message("erro", passwordError);
  const senhaHash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id }, data: { senhaHash, deveTrocarSenha: true, tentativasFalhas: 0, bloqueadoAte: null } });
    await createAudit(tx, actor, "USUARIO", id, "REDEFINIR_SENHA");
  });
  revalidatePath("/usuarios");
  message("mensagem", "Senha temporária redefinida.");
}
