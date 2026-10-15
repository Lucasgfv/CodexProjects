import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sealSecret } from "@/lib/secret-box";

export type FiscalStatus =
  | "pending"
  | "in_progress"
  | "done"
  | "not_applicable";

export type FiscalTaskDTO = {
  id: string;
  key: string;
  name: string;
  competence: string;
  status: FiscalStatus;
  originalValue: string | null;
  statusChangedAt: string;
};

export type FiscalCompanyDTO = {
  id: string;
  code: number | null;
  name: string;
  cnpj: string;
  cnpjDigits: string;
  stateRegistration: string | null;
  regime: string;
  responsible: string;
  notes: string;
  updatedAt: string;
  tasks: FiscalTaskDTO[];
};

export type FiscalMeiActivityDTO = {
  id: string;
  key: string;
  name: string;
  competence: string;
  status: FiscalStatus;
  statusChangedAt: string;
  sentAt: string | null;
};

export type FiscalMeiDTO = {
  id: string;
  name: string;
  cnpj: string;
  cnpjDigits: string;
  responsible: string;
  referenceLimit: number;
  annualRevenue: number;
  months: Record<string, number>;
  checked: boolean;
  inactive: boolean;
  notes: string;
  certificateDescription: string;
  certificateActive: boolean;
  certificateExpiresAt: string | null;
  accessCpf: string;
  activities: FiscalMeiActivityDTO[];
  updatedAt: string;
};

export type FiscalSnapshot = {
  competence: string;
  currentResponsible: string;
  fiscalCompanies: FiscalCompanyDTO[];
  meiCompanies: FiscalMeiDTO[];
};

const companyInclude = {
  tarefas: { orderBy: { nome: "asc" } },
} satisfies Prisma.FiscalEmpresaInclude;

const meiSelect = {
  id: true,
  nome: true,
  cnpj: true,
  cnpjDigits: true,
  responsavel: true,
  limiteReferencia: true,
  faturamentoConferido: true,
  inativo: true,
  observacoes: true,
  certificadoDescricao: true,
  certificadoAtivo: true,
  certificadoValidoAte: true,
  acessoCpf: true,
  atualizadoEm: true,
  atividades: { orderBy: { nome: "asc" } },
  faturamentos: { orderBy: [{ ano: "asc" }, { mes: "asc" }] },
} satisfies Prisma.FiscalMeiSelect;

type CompanyRecord = Prisma.FiscalEmpresaGetPayload<{
  include: typeof companyInclude;
}>;

type MeiRecord = Prisma.FiscalMeiGetPayload<{
  select: typeof meiSelect;
}>;

function mapCompany(company: CompanyRecord): FiscalCompanyDTO {
  return {
    id: company.id,
    code: company.codigo,
    name: company.nome,
    cnpj: company.cnpj,
    cnpjDigits: company.cnpjDigits,
    stateRegistration: company.inscricaoEstadual,
    regime: company.regime,
    responsible: company.responsavel,
    notes: company.observacoes,
    updatedAt: company.atualizadoEm.toISOString(),
    tasks: company.tarefas.map((task) => ({
      id: task.id,
      key: task.chave,
      name: task.nome,
      competence: task.competencia.toISOString(),
      status: task.status as FiscalStatus,
      originalValue: task.valorOriginal,
      statusChangedAt: task.statusAlteradoEm.toISOString(),
    })),
  };
}

function mapMei(mei: MeiRecord): FiscalMeiDTO {
  const months: Record<string, number> = {};
  let annualRevenue = 0;
  for (const entry of mei.faturamentos) {
    const value = Number(entry.valor);
    if (entry.ano === 2026) months[String(entry.mes)] = value;
    if (entry.ano === 2026) annualRevenue += value;
  }

  return {
    id: mei.id,
    name: mei.nome,
    cnpj: mei.cnpj,
    cnpjDigits: mei.cnpjDigits,
    responsible: mei.responsavel,
    referenceLimit: Number(mei.limiteReferencia),
    annualRevenue,
    months,
    checked: mei.faturamentoConferido,
    inactive: mei.inativo,
    notes: mei.observacoes,
    certificateDescription: mei.certificadoDescricao || "",
    certificateActive: mei.certificadoAtivo,
    certificateExpiresAt: mei.certificadoValidoAte?.toISOString() ?? null,
    accessCpf: mei.acessoCpf || "",
    activities: mei.atividades.map((activity) => ({
      id: activity.id,
      key: activity.chave,
      name: activity.nome,
      competence: activity.competencia.toISOString(),
      status: activity.status as FiscalStatus,
      statusChangedAt: activity.statusAlteradoEm.toISOString(),
      sentAt: activity.enviadoEm?.toISOString() ?? null,
    })),
    updatedAt: mei.atualizadoEm.toISOString(),
  };
}

async function findCompany(id: string) {
  const company = await prisma.fiscalEmpresa.findUniqueOrThrow({
    where: { id },
    include: companyInclude,
  });
  return mapCompany(company);
}

async function findMei(id: string) {
  const mei = await prisma.fiscalMei.findUniqueOrThrow({
    where: { id },
    select: meiSelect,
  });
  return mapMei(mei);
}

export async function getFiscalSnapshot(): Promise<FiscalSnapshot> {
  const [fiscalCompanies, meiCompanies, responsible] = await Promise.all([
    prisma.fiscalEmpresa.findMany({
      include: companyInclude,
      orderBy: { nome: "asc" },
    }),
    prisma.fiscalMei.findMany({
      select: meiSelect,
      orderBy: { nome: "asc" },
    }),
    prisma.fiscalConfiguracao.findUnique({
      where: { chave: "responsavelAtual" },
    }),
  ]);

  return {
    competence: "2026-07-01T12:00:00.000Z",
    currentResponsible: responsible?.valor || "Lucas",
    fiscalCompanies: fiscalCompanies.map(mapCompany),
    meiCompanies: meiCompanies.map(mapMei),
  };
}

export async function updateFiscalCompany(
  id: string,
  input: { responsible?: string; notes?: string },
) {
  await prisma.fiscalEmpresa.update({
    where: { id },
    data: {
      ...(input.responsible !== undefined
        ? { responsavel: input.responsible }
        : {}),
      ...(input.notes !== undefined ? { observacoes: input.notes } : {}),
    },
  });
  return findCompany(id);
}

export async function updateFiscalTask(
  companyId: string,
  taskId: string,
  status: FiscalStatus,
) {
  await prisma.fiscalTarefa.update({
    where: { id: taskId, empresaId: companyId },
    data: { status, statusAlteradoEm: new Date() },
  });
  return findCompany(companyId);
}

export async function addFiscalTask(
  companyId: string,
  name: string,
  status: FiscalStatus,
) {
  const key = `${name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now()}`;

  await prisma.fiscalTarefa.create({
    data: {
      empresaId: companyId,
      chave: key,
      nome: name,
      competencia: new Date("2026-07-01T12:00:00.000Z"),
      status,
      statusAlteradoEm: new Date(),
    },
  });
  return findCompany(companyId);
}

export async function createFiscalMei(input: {
  name: string;
  cnpj: string;
  responsible: string;
}) {
  const cnpjDigits = input.cnpj.replace(/\D/g, "");
  const mei = await prisma.fiscalMei.create({
    data: {
      nome: input.name,
      cnpj: input.cnpj,
      cnpjDigits,
      responsavel: input.responsible,
      atividades: {
        create: [
          {
            chave: "guia-das",
            nome: "Guia DAS",
            competencia: new Date("2026-07-01T12:00:00.000Z"),
            status: "pending",
          },
        ],
      },
      faturamentos: {
        create: Array.from({ length: 12 }, (_, index) => ({
          ano: 2026,
          mes: index + 1,
          valor: 0,
        })),
      },
    },
    select: meiSelect,
  });
  return mapMei(mei);
}

export async function updateFiscalMeiProfile(
  id: string,
  input: {
    responsible?: string;
    referenceLimit?: number;
    checked?: boolean;
    inactive?: boolean;
    notes?: string;
  },
) {
  await prisma.fiscalMei.update({
    where: { id },
    data: {
      ...(input.responsible !== undefined
        ? { responsavel: input.responsible }
        : {}),
      ...(input.referenceLimit !== undefined
        ? { limiteReferencia: input.referenceLimit }
        : {}),
      ...(input.checked !== undefined
        ? { faturamentoConferido: input.checked }
        : {}),
      ...(input.inactive !== undefined ? { inativo: input.inactive } : {}),
      ...(input.notes !== undefined ? { observacoes: input.notes } : {}),
    },
  });
  return findMei(id);
}

export async function updateFiscalMeiRevenue(
  id: string,
  year: number,
  month: number,
  value: number,
) {
  await prisma.fiscalMeiFaturamento.upsert({
    where: { meiId_ano_mes: { meiId: id, ano: year, mes: month } },
    update: { valor: value },
    create: { meiId: id, ano: year, mes: month, valor: value },
  });
  return findMei(id);
}

export async function updateFiscalMeiActivity(
  meiId: string,
  activityId: string,
  status: FiscalStatus,
) {
  await prisma.fiscalMeiAtividade.update({
    where: { id: activityId, meiId },
    data: { status, statusAlteradoEm: new Date() },
  });
  return findMei(meiId);
}

export async function setFiscalMeiGuideSent(
  meiId: string,
  activityId: string,
  sent: boolean,
) {
  await prisma.fiscalMeiAtividade.update({
    where: { id: activityId, meiId },
    data: {
      enviadoEm: sent ? new Date() : null,
      status: sent ? "done" : "pending",
      statusAlteradoEm: new Date(),
    },
  });
  return findMei(meiId);
}

export async function updateFiscalMeiAccess(
  id: string,
  input: {
    certificateDescription: string;
    certificateActive: boolean;
    certificateExpiresAt: string | null;
    accessCpf: string;
    accessPassword?: string;
  },
) {
  await prisma.fiscalMei.update({
    where: { id },
    data: {
      certificadoDescricao: input.certificateDescription || null,
      certificadoAtivo: input.certificateActive,
      certificadoValidoAte: input.certificateExpiresAt
        ? new Date(input.certificateExpiresAt)
        : null,
      acessoCpf: input.accessCpf || null,
      ...(input.accessPassword !== undefined
        ? { acessoSenha: sealSecret(input.accessPassword) }
        : {}),
    },
  });
  return findMei(id);
}

export async function updateCurrentResponsible(value: string) {
  await prisma.fiscalConfiguracao.upsert({
    where: { chave: "responsavelAtual" },
    update: { valor: value },
    create: { chave: "responsavelAtual", valor: value },
  });
  return value;
}
