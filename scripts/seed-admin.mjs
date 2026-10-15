import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

function requiredValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Defina ${name} para configurar o administrador.`);
  return value;
}

async function main() {
  const name = requiredValue("ADMIN_NAME");
  const email = requiredValue("ADMIN_EMAIL").toLowerCase();
  const password = requiredValue("ADMIN_PASSWORD");

  if (password.length < 12 || password.length > 128) {
    throw new Error("ADMIN_PASSWORD deve ter entre 12 e 128 caracteres.");
  }

  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true },
  });
  const differentUser = existingUsers.find((user) => user.email !== email);

  if (differentUser) {
    throw new Error(
      "Já existe outro usuário. O Nexo está configurado para um único administrador.",
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.upsert({
      where: { email },
      create: {
        id: randomUUID(),
        name,
        email,
        emailVerified: true,
      },
      update: {
        name,
        emailVerified: true,
      },
    });

    const credentialAccount = await transaction.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    });

    if (credentialAccount) {
      await transaction.account.update({
        where: { id: credentialAccount.id },
        data: { accountId: user.id, password: passwordHash },
      });
    } else {
      await transaction.account.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          providerId: "credential",
          accountId: user.id,
          password: passwordHash,
        },
      });
    }

    await transaction.session.deleteMany({ where: { userId: user.id } });
  });

  console.info("Administrador configurado. Sessões anteriores foram encerradas.");
}

main()
  .catch((error) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Não foi possível configurar o administrador.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
