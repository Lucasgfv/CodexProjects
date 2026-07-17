import { createAudit } from "../lib/audit";
import { normalizeEmail } from "../lib/company-validation";
import { hashPassword, validatePassword } from "../lib/password";
import { prisma } from "../lib/prisma";

async function main() {
  const email = normalizeEmail(process.argv[2] ?? "");
  const nome = String(process.argv[3] ?? "Administrador").trim();
  const password = process.env.AUTCOMPANY_BOOTSTRAP_PASSWORD ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Uso: pnpm user:bootstrap email@dominio \"Nome\"");
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(`Defina AUTCOMPANY_BOOTSTRAP_PASSWORD. ${passwordError}`);
  const existingAdmin = await prisma.usuario.findFirst({ where: { papel: "ADMIN" } });
  if (existingAdmin) throw new Error("Já existe um administrador. Use a tela /usuarios.");
  const senhaHash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    const user = await tx.usuario.create({ data: { nome, email, senhaHash, papel: "ADMIN", deveTrocarSenha: true } });
    await createAudit(tx, user, "USUARIO", user.id, "BOOTSTRAP_ADMIN", { email: { novo: email }, papel: { novo: "ADMIN" } });
  });
  console.log("Administrador criado. A troca da senha temporária será exigida no primeiro acesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha ao criar administrador.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());

