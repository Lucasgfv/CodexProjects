import { Prisma } from "@prisma/client";

import {
  mockEmpresas,
  mockLancamentos,
  mockSocios,
} from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import type {
  DatabaseStatus,
  EmpresaDTO,
  EmpresaInput,
  LancamentoDTO,
  LancamentoInput,
  SocioDTO,
  SocioInput,
} from "@/lib/types";

type DemoStore = {
  empresas: EmpresaDTO[];
  socios: SocioDTO[];
  lancamentos: LancamentoDTO[];
};

const globalForDemo = globalThis as unknown as {
  nexoDemoStore?: DemoStore;
};

const demoStore =
  globalForDemo.nexoDemoStore ??
  (globalForDemo.nexoDemoStore = {
    empresas: structuredClone(mockEmpresas),
    socios: structuredClone(mockSocios),
    lancamentos: structuredClone(mockLancamentos),
  });

const empresaInclude = {
  socios: { include: { socio: true } },
  alteracoesContratuais: true,
} satisfies Prisma.EmpresaInclude;

type EmpresaRecord = Prisma.EmpresaGetPayload<{
  include: typeof empresaInclude;
}>;

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.startsWith("postgres"));
}

function mapEmpresa(empresa: EmpresaRecord): EmpresaDTO {
  return {
    id: empresa.id,
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia,
    cnpj: empresa.cnpj,
    tipoCliente: empresa.tipoCliente,
    regimeTributario: empresa.regimeTributario,
    email: empresa.email,
    telefone: empresa.telefone,
    cep: empresa.cep,
    endereco: empresa.endereco,
    cidade: empresa.cidade,
    capitalSocial: empresa.capitalSocial
      ? Number(empresa.capitalSocial)
      : null,
    dataInicio: empresa.dataInicio.toISOString(),
    dataBaixa: empresa.dataBaixa?.toISOString() ?? null,
    socios: empresa.socios.map((vinculo) => ({
      id: vinculo.id,
      socioId: vinculo.socioId,
      nome: vinculo.socio.nome,
      cpf: vinculo.socio.cpf,
      cargo: vinculo.cargo,
      percentualParticipacao: Number(vinculo.percentualParticipacao),
      recebeProlabore: vinculo.recebeProlabore,
      valorProlabore: vinculo.valorProlabore
        ? Number(vinculo.valorProlabore)
        : null,
      dataEntrada: vinculo.dataEntrada.toISOString(),
      dataSaida: vinculo.dataSaida?.toISOString() ?? null,
    })),
    alteracoesContratuais: empresa.alteracoesContratuais.map(
      (alteracao) => ({
        id: alteracao.id,
        numeroAlteracao: alteracao.numeroAlteracao,
        dataAlteracao: alteracao.dataAlteracao.toISOString(),
        descricaoResumida: alteracao.descricaoResumida,
      }),
    ),
  };
}

function empresaData(input: EmpresaInput) {
  return {
    razaoSocial: input.razaoSocial,
    nomeFantasia: input.nomeFantasia || null,
    cnpj: input.cnpj,
    tipoCliente: input.tipoCliente || null,
    regimeTributario: input.regimeTributario,
    email: input.email || null,
    telefone: input.telefone || null,
    cep: input.cep || null,
    endereco: input.endereco || null,
    cidade: input.cidade || null,
    capitalSocial:
      input.capitalSocial === null
        ? null
        : new Prisma.Decimal(input.capitalSocial),
    dataInicio: new Date(input.dataInicio),
    dataBaixa: input.dataBaixa ? new Date(input.dataBaixa) : null,
  };
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  if (!hasDatabaseUrl()) {
    return {
      connected: false,
      mode: "demo",
      label: "Modo demonstração",
    };
  }

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 1800),
      ),
    ]);

    return {
      connected: true,
      mode: "postgresql",
      label: "Ativo",
    };
  } catch {
    return {
      connected: false,
      mode: "demo",
      label: "Indisponível",
    };
  }
}

export async function listEmpresas(): Promise<EmpresaDTO[]> {
  if (!hasDatabaseUrl()) return structuredClone(demoStore.empresas);

  const empresas = await prisma.empresa.findMany({
    include: empresaInclude,
    orderBy: { razaoSocial: "asc" },
  });

  return empresas.map(mapEmpresa);
}

export async function getEmpresa(id: string): Promise<EmpresaDTO | null> {
  if (!hasDatabaseUrl()) {
    return (
      structuredClone(
        demoStore.empresas.find((empresa) => empresa.id === id),
      ) ?? null
    );
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: empresaInclude,
  });

  return empresa ? mapEmpresa(empresa) : null;
}

export async function createEmpresa(
  input: EmpresaInput,
): Promise<EmpresaDTO> {
  if (!hasDatabaseUrl()) {
    const id = crypto.randomUUID();
    const empresa: EmpresaDTO = {
      id,
      ...input,
      socios: (input.sociosVinculados ?? []).map((vinculo) => {
        const socio = demoStore.socios.find(
          (item) => item.id === vinculo.socioId,
        );
        return {
          id: crypto.randomUUID(),
          socioId: vinculo.socioId,
          nome: socio?.nome ?? "Sócio",
          cpf: socio?.cpf ?? "",
          cargo: vinculo.cargo ?? null,
          percentualParticipacao: vinculo.percentualParticipacao,
          recebeProlabore: vinculo.recebeProlabore,
          valorProlabore: vinculo.valorProlabore ?? null,
          dataEntrada: vinculo.dataEntrada,
          dataSaida: vinculo.dataSaida ?? null,
        };
      }),
      alteracoesContratuais: (input.alteracoes ?? []).map((alteracao) => ({
        id: crypto.randomUUID(),
        numeroAlteracao: alteracao.numeroAlteracao ?? null,
        dataAlteracao: alteracao.dataAlteracao,
        descricaoResumida: alteracao.descricaoResumida ?? null,
      })),
    };
    demoStore.empresas.unshift(empresa);
    syncDemoSocioCounts();
    return structuredClone(empresa);
  }

  const empresa = await prisma.empresa.create({
    data: {
      ...empresaData(input),
      socios: {
        create: (input.sociosVinculados ?? []).map((vinculo) => ({
          socio: { connect: { id: vinculo.socioId } },
          cargo: vinculo.cargo || null,
          percentualParticipacao: new Prisma.Decimal(
            vinculo.percentualParticipacao,
          ),
          recebeProlabore: vinculo.recebeProlabore,
          valorProlabore:
            vinculo.valorProlabore === null ||
            vinculo.valorProlabore === undefined
              ? null
              : new Prisma.Decimal(vinculo.valorProlabore),
          dataEntrada: new Date(vinculo.dataEntrada),
          dataSaida: vinculo.dataSaida
            ? new Date(vinculo.dataSaida)
            : null,
        })),
      },
      alteracoesContratuais: {
        create: (input.alteracoes ?? []).map((alteracao) => ({
          numeroAlteracao: alteracao.numeroAlteracao ?? null,
          dataAlteracao: new Date(alteracao.dataAlteracao),
          descricaoResumida: alteracao.descricaoResumida || null,
        })),
      },
    },
    include: empresaInclude,
  });

  return mapEmpresa(empresa);
}

export async function updateEmpresa(
  id: string,
  input: EmpresaInput,
): Promise<EmpresaDTO> {
  if (!hasDatabaseUrl()) {
    const index = demoStore.empresas.findIndex((empresa) => empresa.id === id);
    if (index < 0) throw new Error("Empresa não encontrada.");
    const replacement = await buildDemoEmpresa(id, input);
    demoStore.empresas[index] = replacement;
    syncDemoSocioCounts();
    return structuredClone(replacement);
  }

  await prisma.$transaction(async (tx) => {
    await tx.empresa.update({
      where: { id },
      data: empresaData(input),
    });
    await tx.empresaSocio.deleteMany({ where: { empresaId: id } });
    if (input.sociosVinculados?.length) {
      await tx.empresaSocio.createMany({
        data: input.sociosVinculados.map((vinculo) => ({
          empresaId: id,
          socioId: vinculo.socioId,
          cargo: vinculo.cargo || null,
          percentualParticipacao: new Prisma.Decimal(
            vinculo.percentualParticipacao,
          ),
          recebeProlabore: vinculo.recebeProlabore,
          valorProlabore:
            vinculo.valorProlabore === null ||
            vinculo.valorProlabore === undefined
              ? null
              : new Prisma.Decimal(vinculo.valorProlabore),
          dataEntrada: new Date(vinculo.dataEntrada),
          dataSaida: vinculo.dataSaida
            ? new Date(vinculo.dataSaida)
            : null,
        })),
      });
    }
    await tx.alteracaoContratual.deleteMany({ where: { empresaId: id } });
    if (input.alteracoes?.length) {
      await tx.alteracaoContratual.createMany({
        data: input.alteracoes.map((alteracao) => ({
          empresaId: id,
          numeroAlteracao: alteracao.numeroAlteracao ?? null,
          dataAlteracao: new Date(alteracao.dataAlteracao),
          descricaoResumida: alteracao.descricaoResumida || null,
        })),
      });
    }
  });

  const empresa = await prisma.empresa.findUniqueOrThrow({
    where: { id },
    include: empresaInclude,
  });
  return mapEmpresa(empresa);
}

async function buildDemoEmpresa(
  id: string,
  input: EmpresaInput,
): Promise<EmpresaDTO> {
  return {
    id,
    razaoSocial: input.razaoSocial,
    nomeFantasia: input.nomeFantasia,
    cnpj: input.cnpj,
    tipoCliente: input.tipoCliente,
    regimeTributario: input.regimeTributario,
    email: input.email,
    telefone: input.telefone,
    cep: input.cep,
    endereco: input.endereco,
    cidade: input.cidade,
    capitalSocial: input.capitalSocial,
    dataInicio: input.dataInicio,
    dataBaixa: input.dataBaixa,
    socios: (input.sociosVinculados ?? []).map((vinculo) => {
      const socio = demoStore.socios.find(
        (item) => item.id === vinculo.socioId,
      );
      return {
        id: crypto.randomUUID(),
        socioId: vinculo.socioId,
        nome: socio?.nome ?? "Sócio",
        cpf: socio?.cpf ?? "",
        cargo: vinculo.cargo ?? null,
        percentualParticipacao: vinculo.percentualParticipacao,
        recebeProlabore: vinculo.recebeProlabore,
        valorProlabore: vinculo.valorProlabore ?? null,
        dataEntrada: vinculo.dataEntrada,
        dataSaida: vinculo.dataSaida ?? null,
      };
    }),
    alteracoesContratuais: (input.alteracoes ?? []).map((alteracao) => ({
      id: crypto.randomUUID(),
      numeroAlteracao: alteracao.numeroAlteracao ?? null,
      dataAlteracao: alteracao.dataAlteracao,
      descricaoResumida: alteracao.descricaoResumida ?? null,
    })),
  };
}

export async function deleteEmpresa(id: string) {
  if (!hasDatabaseUrl()) {
    demoStore.empresas = demoStore.empresas.filter(
      (empresa) => empresa.id !== id,
    );
    demoStore.lancamentos = demoStore.lancamentos.filter(
      (lancamento) => lancamento.empresaId !== id,
    );
    syncDemoSocioCounts();
    return;
  }
  await prisma.empresa.delete({ where: { id } });
}

export async function listSocios(): Promise<SocioDTO[]> {
  if (!hasDatabaseUrl()) return structuredClone(demoStore.socios);

  const socios = await prisma.socio.findMany({
    include: { _count: { select: { empresas: true } } },
    orderBy: { nome: "asc" },
  });

  return socios.map((socio) => ({
    id: socio.id,
    nome: socio.nome,
    cpf: socio.cpf,
    dataNascimento: socio.dataNascimento.toISOString(),
    email: socio.email,
    telefone: socio.telefone,
    totalEmpresas: socio._count.empresas,
  }));
}

export async function createSocio(input: SocioInput): Promise<SocioDTO> {
  if (!hasDatabaseUrl()) {
    const socio: SocioDTO = {
      id: crypto.randomUUID(),
      ...input,
      totalEmpresas: 0,
    };
    demoStore.socios.unshift(socio);
    return structuredClone(socio);
  }

  const socio = await prisma.socio.create({
    data: {
      nome: input.nome,
      cpf: input.cpf,
      dataNascimento: new Date(input.dataNascimento),
      email: input.email || null,
      telefone: input.telefone || null,
    },
  });

  return { ...socio, dataNascimento: socio.dataNascimento.toISOString(), totalEmpresas: 0 };
}

export async function updateSocio(
  id: string,
  input: SocioInput,
): Promise<SocioDTO> {
  if (!hasDatabaseUrl()) {
    const index = demoStore.socios.findIndex((socio) => socio.id === id);
    if (index < 0) throw new Error("Sócio não encontrado.");
    demoStore.socios[index] = {
      id,
      ...input,
      totalEmpresas: demoStore.socios[index].totalEmpresas,
    };
    demoStore.empresas = demoStore.empresas.map((empresa) => ({
      ...empresa,
      socios: empresa.socios.map((vinculo) =>
        vinculo.socioId === id
          ? { ...vinculo, nome: input.nome, cpf: input.cpf }
          : vinculo,
      ),
    }));
    return structuredClone(demoStore.socios[index]);
  }

  const socio = await prisma.socio.update({
    where: { id },
    data: {
      nome: input.nome,
      cpf: input.cpf,
      dataNascimento: new Date(input.dataNascimento),
      email: input.email || null,
      telefone: input.telefone || null,
    },
    include: { _count: { select: { empresas: true } } },
  });

  return {
    id: socio.id,
    nome: socio.nome,
    cpf: socio.cpf,
    dataNascimento: socio.dataNascimento.toISOString(),
    email: socio.email,
    telefone: socio.telefone,
    totalEmpresas: socio._count.empresas,
  };
}

export async function deleteSocio(id: string) {
  if (!hasDatabaseUrl()) {
    demoStore.socios = demoStore.socios.filter((socio) => socio.id !== id);
    demoStore.empresas = demoStore.empresas.map((empresa) => ({
      ...empresa,
      socios: empresa.socios.filter((vinculo) => vinculo.socioId !== id),
    }));
    syncDemoSocioCounts();
    return;
  }
  await prisma.socio.delete({ where: { id } });
}

function syncDemoSocioCounts() {
  demoStore.socios = demoStore.socios.map((socio) => ({
    ...socio,
    totalEmpresas: demoStore.empresas.filter((empresa) =>
      empresa.socios.some((vinculo) => vinculo.socioId === socio.id),
    ).length,
  }));
}

export async function listLancamentos(): Promise<LancamentoDTO[]> {
  if (!hasDatabaseUrl()) {
    return structuredClone(demoStore.lancamentos).sort((a, b) =>
      b.vencimento.localeCompare(a.vencimento),
    );
  }

  const lancamentos = await prisma.lancamento.findMany({
    include: { empresa: true },
    orderBy: { vencimento: "desc" },
  });

  return lancamentos.map((lancamento) => ({
    id: lancamento.id,
    empresaId: lancamento.empresaId,
    empresaNome:
      lancamento.empresa.nomeFantasia ?? lancamento.empresa.razaoSocial,
    tipo: lancamento.tipo as "ENTRADA" | "SAIDA",
    descricao: lancamento.descricao,
    valor: Number(lancamento.valor),
    vencimento: lancamento.vencimento.toISOString(),
    competencia: lancamento.competencia.toISOString(),
    pago: lancamento.pago,
  }));
}

export async function createLancamento(
  input: LancamentoInput,
): Promise<LancamentoDTO> {
  if (!hasDatabaseUrl()) {
    const empresa = demoStore.empresas.find(
      (item) => item.id === input.empresaId,
    );
    if (!empresa) throw new Error("Empresa não encontrada.");
    const lancamento: LancamentoDTO = {
      id: crypto.randomUUID(),
      ...input,
      empresaNome: empresa.nomeFantasia ?? empresa.razaoSocial,
    };
    demoStore.lancamentos.unshift(lancamento);
    return structuredClone(lancamento);
  }

  const lancamento = await prisma.lancamento.create({
    data: {
      empresaId: input.empresaId,
      tipo: input.tipo,
      descricao: input.descricao,
      valor: new Prisma.Decimal(input.valor),
      vencimento: new Date(input.vencimento),
      competencia: new Date(input.competencia),
      pago: input.pago,
    },
    include: { empresa: true },
  });

  return {
    id: lancamento.id,
    empresaId: lancamento.empresaId,
    empresaNome:
      lancamento.empresa.nomeFantasia ?? lancamento.empresa.razaoSocial,
    tipo: lancamento.tipo as "ENTRADA" | "SAIDA",
    descricao: lancamento.descricao,
    valor: Number(lancamento.valor),
    vencimento: lancamento.vencimento.toISOString(),
    competencia: lancamento.competencia.toISOString(),
    pago: lancamento.pago,
  };
}
