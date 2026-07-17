import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { PapelUsuario } from "@prisma/client";
import { cache } from "react";
import { redirect } from "next/navigation";
export { canEditCompanies } from "@/lib/permissions";

export type AuthenticatedUser = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  deveTrocarSenha: boolean;
};

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { id: true, nome: true, email: true, papel: true, ativo: true, deveTrocarSenha: true },
  });
  if (!user?.ativo) return null;
  return { id: user.id, nome: user.nome, email: user.email, papel: user.papel, deveTrocarSenha: user.deveTrocarSenha };
});

export async function requirePageUser(roles?: PapelUsuario[], allowPasswordChange = false) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.deveTrocarSenha && !allowPasswordChange) redirect("/alterar-senha");
  if (roles && !roles.includes(user.papel)) redirect("/");
  return user;
}

export async function requireActionUser(roles: PapelUsuario[]) {
  const user = await getCurrentUser();
  if (!user || user.deveTrocarSenha || !roles.includes(user.papel)) throw new Error("Acesso não autorizado.");
  return user;
}

