import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const competence = new Date("2026-07-01T12:00:00.000Z");

function hasActiveCertificate(value) {
  const normalized = String(value || "").toLocaleUpperCase("pt-BR");
  return normalized.includes("VALIDO") && !normalized.includes("VENCIDO");
}

async function importFiscalCompanies(companies) {
  const existing = await prisma.fiscalEmpresa.count();
  if (existing > 0) {
    console.log(`Empresas fiscais preservadas: ${existing} registro(s) já existem.`);
    return;
  }

  for (const company of companies) {
    const updatedAt = new Date(company.updatedAt || Date.now());
    await prisma.fiscalEmpresa.create({
      data: {
        id: company.id,
        codigo: company.code ?? null,
        nome: company.name,
        cnpj: company.cnpj,
        cnpjDigits: company.cnpjDigits,
        inscricaoEstadual: company.stateRegistration || null,
        regime: company.regime,
        responsavel: company.responsible || "Não definido",
        observacoes: company.notes || "",
        atualizadoEm: updatedAt,
        tarefas: {
          create: (company.tasks || []).map((task) => ({
            chave: task.id,
            nome: task.name,
            competencia: competence,
            status: task.status,
            valorOriginal:
              task.originalValue == null ? null : String(task.originalValue),
            statusAlteradoEm: updatedAt,
          })),
        },
      },
    });
  }

  console.log(`Empresas fiscais importadas: ${companies.length}.`);
}

async function importMeis(companies) {
  const existing = await prisma.fiscalMei.count();
  if (existing > 0) {
    console.log(`MEIs preservados: ${existing} registro(s) já existem.`);
    return;
  }

  for (const company of companies) {
    const updatedAt = new Date(company.updatedAt || Date.now());
    await prisma.fiscalMei.create({
      data: {
        id: company.id,
        nome: company.name,
        cnpj: company.cnpj,
        cnpjDigits: company.cnpjDigits,
        responsavel: company.responsible || "Não definido",
        limiteReferencia: company.referenceLimit || 81000,
        faturamentoConferido: Boolean(company.checked),
        inativo: Boolean(company.inactive),
        observacoes: company.notes || "",
        certificadoDescricao: company.certificate || null,
        certificadoAtivo: hasActiveCertificate(company.certificate),
        atualizadoEm: updatedAt,
        atividades: {
          create: (company.activities || []).map((activity) => ({
            chave: activity.id,
            nome: activity.name,
            competencia: competence,
            status: activity.status,
            statusAlteradoEm: updatedAt,
          })),
        },
        faturamentos: {
          create: Array.from({ length: 12 }, (_, index) => ({
            ano: 2026,
            mes: index + 1,
            valor: Number(company.months?.[String(index + 1)] || 0),
          })),
        },
      },
    });
  }

  console.log(`MEIs importados: ${companies.length}.`);
}

async function main() {
  const seedPath = resolve(process.cwd(), "Flex", "src", "data", "seed.json");
  const seed = JSON.parse(await readFile(seedPath, "utf8"));

  await importFiscalCompanies(seed.fiscalCompanies || []);
  await importMeis(seed.meiCompanies || []);
  await prisma.fiscalConfiguracao.upsert({
    where: { chave: "responsavelAtual" },
    update: {},
    create: { chave: "responsavelAtual", valor: "Lucas" },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
