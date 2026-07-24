import { prisma } from "../lib/prisma";

async function main() {
  if (process.env.AUTCOMPANY_CONFIRM_PURGE_CNPJ !== "REMOVER") {
    throw new Error("Defina AUTCOMPANY_CONFIRM_PURGE_CNPJ=REMOVER somente após validar um backup restaurável.");
  }

  const result = await prisma.documentoEmpresa.deleteMany({ where: { tipo: "CARTAO_CNPJ" } });
  console.log(`Cartões CNPJ removidos permanentemente: ${result.count}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Falha ao remover os cartões CNPJ.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
