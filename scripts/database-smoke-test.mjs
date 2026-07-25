import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const environment = await readFile(resolve(projectRoot, ".env"), "utf8");

for (const line of environment.split(/\r?\n/)) {
  const separator = line.indexOf("=");
  if (separator < 1) continue;
  const key = line.slice(0, separator).trim();
  const value = line
    .slice(separator + 1)
    .trim()
    .replace(/^"|"$/g, "");
  if (!(key in process.env)) process.env[key] = value;
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
const markerId = "acceptance-test-company";
const uiCompanyId = "ui-test-company";
const uiPartnerId = "ui-test-partner";
const action = process.argv[2];

try {
  if (action === "insert") {
    await prisma.empresa.create({
      data: {
        id: markerId,
        razaoSocial: "Teste de persistência",
        cnpj: "00.000.000/0000-00",
        regimeTributario: "Teste",
        dataInicio: new Date(),
      },
    });
    console.log("INSERTED=true");
  } else if (action === "count") {
    const count = await prisma.empresa.count({ where: { id: markerId } });
    console.log(count);
  } else if (action === "delete") {
    await prisma.empresa.deleteMany({ where: { id: markerId } });
    console.log("DELETED=true");
  } else if (action === "seed-ui") {
    await prisma.$transaction([
      prisma.empresa.deleteMany({ where: { id: uiCompanyId } }),
      prisma.socio.deleteMany({ where: { id: uiPartnerId } }),
    ]);
    await prisma.socio.create({
      data: {
        id: uiPartnerId,
        nome: "Marina Oliveira",
        cpf: "123.456.789-09",
        dataNascimento: new Date("1988-06-12T12:00:00.000Z"),
        email: "marina@example.com",
        telefone: "(38) 99999-1000",
        nacionalidade: "brasileira",
        estadoCivil: "casada",
        profissao: "empresária",
        rg: "MG-12.345.678",
        orgaoEmissor: "PC/MG",
        cep: "38610-000",
        endereco: "Rua das Flores, 120, Bairro Centro",
        cidade: "Unaí",
        uf: "MG",
      },
    });
    await prisma.empresa.create({
      data: {
        id: uiCompanyId,
        razaoSocial: "Empresa Demonstração de Serviços Ltda.",
        nomeFantasia: "Demonstração Serviços",
        cnpj: "12.345.678/0001-90",
        tipoCliente: "Mensal",
        regimeTributario: "Simples Nacional",
        email: "contato@example.com",
        telefone: "(38) 3333-1000",
        cep: "38610-000",
        endereco: "Avenida Governador Valadares, 450, sala 3",
        cidade: "Unaí",
        uf: "MG",
        capitalSocial: 50_000,
        honorarioMensal: 850,
        dataInicio: new Date("2024-01-10T12:00:00.000Z"),
        socios: {
          create: {
            socioId: uiPartnerId,
            cargo: "Sócia administradora",
            percentualParticipacao: 100,
            recebeProlabore: true,
            valorProlabore: 3_000,
            dataEntrada: new Date("2024-01-10T12:00:00.000Z"),
          },
        },
      },
    });
    console.log("UI_SEEDED=true");
  } else if (action === "delete-ui") {
    await prisma.empresa.deleteMany({ where: { id: uiCompanyId } });
    await prisma.socio.deleteMany({ where: { id: uiPartnerId } });
    console.log("UI_DELETED=true");
  } else {
    throw new Error(
      "Use insert, count, delete, seed-ui ou delete-ui.",
    );
  }
} finally {
  await prisma.$disconnect();
}
