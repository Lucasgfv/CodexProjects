"use server";

import { signOut } from "@/auth";
import { createAudit } from "@/lib/audit";
import { requirePageUser } from "@/lib/authz";
import { hashPassword, validatePassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export type PasswordState = { error?: string };

export async function changePasswordAction(_state: PasswordState, form: FormData): Promise<PasswordState> {
  const user = await requirePageUser(undefined, true);
  const currentPassword = String(form.get("senhaAtual") ?? "");
  const nextPassword = String(form.get("novaSenha") ?? "");
  const confirmation = String(form.get("confirmacao") ?? "");
  const validationError = validatePassword(nextPassword);
  if (!currentPassword) return { error: "Informe a senha atual." };
  if (validationError) return { error: validationError };
  if (nextPassword !== confirmation) return { error: "A confirmação da nova senha não confere." };
  if (currentPassword === nextPassword) return { error: "A nova senha deve ser diferente da senha atual." };

  const record = await prisma.usuario.findUnique({ where: { id: user.id }, select: { senhaHash: true } });
  if (!record || !await compare(currentPassword, record.senhaHash)) return { error: "A senha atual está incorreta." };
  const senhaHash = await hashPassword(nextPassword);

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id: user.id }, data: { senhaHash, deveTrocarSenha: false, tentativasFalhas: 0, bloqueadoAte: null } });
    await createAudit(tx, user, "USUARIO", user.id, "ALTERAR_SENHA");
  });
  await signOut({ redirectTo: "/login?senha=alterada" });
  return {};
}

