import { Prisma } from "@prisma/client";

import {
  mockEmpresas,
  mockLancamentos,
  mockSocios,
} from "@/lib/mock-data";
import { PersistenceUnavailableError } from "@/lib/errors";
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
  referenciasComerciais: true,
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
    porte: empresa.porte,
    regimeTributario: empresa.regimeTributario,
    email: empresa.email,
    telefone: empresa.telefone,
    cep: empresa.cep,
    endereco: empresa.endereco,
    numeroEndereco: empresa.numeroEndereco,
    bairro: empresa.bairro,
    cidade: empresa.cidade,
    uf: empresa.uf,
    capitalSocial: empresa.capitalSocial
      ? Number(empresa.capitalSocial)
      : null,
    honorarioMensal: empresa.honorarioMensal
      ? Number(empresa.honorarioMensal)
      : null,
    inscricaoEstadual: empresa.inscricaoEstadual,
    inscricaoMunicipal: empresa.inscricaoMunicipal,
    cnaePrincipal: empresa.cnaePrincipal,
    cnaesSecundarios: empresa.cnaesSecundarios,
    ramoAtividade: empresa.ramoAtividade,
    servicoProduto: empresa.servicoProduto,
    quantidadeFuncionarios: empresa.quantidadeFuncionarios,
    situacaoAlvaras: empresa.situacaoAlvaras,
    participaLicitacoes: empresa.participaLicitacoes,
    contadorAnterior: empresa.contadorAnterior,
    dataAtualizacaoBancaria: empresa.dataAtualizacaoBancaria?.toISOString() ?? null,
    pendenciasFiscais: empresa.pendenciasFiscais,
    ranking: empresa.ranking,
    referenciasComerciais: empresa.referenciasComerciais.map((item) => ({
      id: item.id, nome: item.nome, cidade: item.cidade, uf: item.uf,
    })),
    dataInicio: empresa.dataInicio.toISOString(),
    dataBaixa: empresa.dataBaixa?.toISOString() ?? null,
    socios: empresa.socios.map((vinculo) => ({
      id: vinculo.id,
      socioId: vinculo.socioId,
      nome: vinculo.socio.nome,
      cpf: vinculo.socio.cpf,
      nacionalidade: vinculo.socio.nacionalidade,
      estadoCivil: vinculo.socio.estadoCivil,
      profissao: vinculo.socio.profissao,
      rg: vinculo.socio.rg,
      orgaoEmissor: vinculo.socio.orgaoEmissor,
      cep: vinculo.socio.cep,
      endereco: vinculo.socio.endereco,
      cidade: vinculo.socio.cidade,
      uf: vinculo.socio.uf,
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
    porte: input.porte || null,
    regimeTributario: input.regimeTributario,
    email: input.email || null,
    telefone: input.telefone || null,
    cep: input.cep || null,
    endereco: input.endereco || null,
    numeroEndereco: input.numeroEndereco || null,
    bairro: input.bairro || null,
    cidade: input.cidade || null,
    uf: input.uf || null,
    capitalSocial:
      input.capitalSocial === null
        ? null
        : new Prisma.Decimal(input.capitalSocial),
    honorarioMensal:
      input.honorarioMensal === null
        ? null
      : new Prisma.Decimal(input.honorarioMensal),
    inscricaoEstadual: input.inscricaoEstadual || null,
    inscricaoMunicipal: input.inscricaoMunicipal || null,
    cnaePrincipal: input.cnaePrincipal || null,
    cnaesSecundarios: input.cnaesSecundarios || null,
    ramoAtividade: input.ramoAtividade || null,
    servicoProduto: input.servicoProduto || null,
    quantidadeFuncionarios: input.quantidadeFuncionarios ?? null,
    situacaoAlvaras: input.situacaoAlvaras || null,
    participaLicitacoes: input.participaLicitacoes ?? null,
    contadorAnterior: input.contadorAnterior || null,
    dataAtualizacaoBancaria: input.dataAtualizacaoBancaria ? new Date(input.dataAtualizacaoBancaria) : null,
    pendenciasFiscais: input.pendenciasFiscais ?? null,
    ranking: input.ranking || null,
    dataInicio: new Date(input.dataInicio),
    dataBaixa: input.dataBaixa ? new Date(input.dataBaixa) : null,
  };
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  if (!hasDatabaseUrl()) {
    return {
      connected: false,
      mode: "demo",
      label: "Modo demonstração — somente leitura",
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
      label: "Indisponível — somente leitura",
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
    throw new PersistenceUnavailableError();
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
      referenciasComerciais: {
        create: (input.referenciasComerciais ?? []).map((item) => ({
          nome: item.nome, cidade: item.cidade, uf: item.uf,
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
    throw new PersistenceUnavailableError();
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
    await tx.referenciaComercial.deleteMany({ where: { empresaId: id } });
    if (input.referenciasComerciais?.length) {
      await tx.referenciaComercial.createMany({
        data: input.referenciasComerciais.map((item) => ({
          empresaId: id, nome: item.nome, cidade: item.cidade, uf: item.uf,
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

export async function deleteEmpresa(id: string) {
  if (!hasDatabaseUrl()) {
    throw new PersistenceUnavailableError();
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
    nacionalidade: socio.nacionalidade,
    estadoCivil: socio.estadoCivil,
    profissao: socio.profissao,
    rg: socio.rg,
    orgaoEmissor: socio.orgaoEmissor,
    cep: socio.cep,
    endereco: socio.endereco,
    cidade: socio.cidade,
    uf: socio.uf,
    totalEmpresas: socio._count.empresas,
  }));
}

export async function createSocio(input: SocioInput): Promise<SocioDTO> {
  if (!hasDatabaseUrl()) {
    throw new PersistenceUnavailableError();
  }

  const socio = await prisma.socio.create({
    data: {
      nome: input.nome,
      cpf: input.cpf,
      dataNascimento: new Date(input.dataNascimento),
      email: input.email || null,
      telefone: input.telefone || null,
      nacionalidade: input.nacionalidade || null,
      estadoCivil: input.estadoCivil || null,
      profissao: input.profissao || null,
      rg: input.rg || null,
      orgaoEmissor: input.orgaoEmissor || null,
      cep: input.cep || null,
      endereco: input.endereco || null,
      cidade: input.cidade || null,
      uf: input.uf || null,
    },
  });

  return {
    ...socio,
    dataNascimento: socio.dataNascimento.toISOString(),
    totalEmpresas: 0,
  };
}

export async function updateSocio(
  id: string,
  input: SocioInput,
): Promise<SocioDTO> {
  if (!hasDatabaseUrl()) {
    throw new PersistenceUnavailableError();
  }

  const socio = await prisma.socio.update({
    where: { id },
    data: {
      nome: input.nome,
      cpf: input.cpf,
      dataNascimento: new Date(input.dataNascimento),
      email: input.email || null,
      telefone: input.telefone || null,
      nacionalidade: input.nacionalidade || null,
      estadoCivil: input.estadoCivil || null,
      profissao: input.profissao || null,
      rg: input.rg || null,
      orgaoEmissor: input.orgaoEmissor || null,
      cep: input.cep || null,
      endereco: input.endereco || null,
      cidade: input.cidade || null,
      uf: input.uf || null,
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
    nacionalidade: socio.nacionalidade,
    estadoCivil: socio.estadoCivil,
    profissao: socio.profissao,
    rg: socio.rg,
    orgaoEmissor: socio.orgaoEmissor,
    cep: socio.cep,
    endereco: socio.endereco,
    cidade: socio.cidade,
    uf: socio.uf,
    totalEmpresas: socio._count.empresas,
  };
}

export async function deleteSocio(id: string) {
  if (!hasDatabaseUrl()) {
    throw new PersistenceUnavailableError();
  }
  await prisma.socio.delete({ where: { id } });
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
    throw new PersistenceUnavailableError();
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
