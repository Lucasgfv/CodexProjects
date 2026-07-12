"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (form: FormData, key: string) => text(form, key) || null;
const dateOrNull = (value: string) => (value ? new Date(`${value}T00:00:00.000Z`) : null);
const list = (value: string) => value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);

function companyData(form: FormData) {
  return {
    razaoSocial: text(form, "razaoSocial"),
    nomeFantasia: text(form, "nomeFantasia"),
    cnpj: text(form, "cnpj"),
    inscricaoEstadual: optional(form, "inscricaoEstadual"),
    inscricaoMunicipal: optional(form, "inscricaoMunicipal"),
    endereco: text(form, "endereco"),
    numero: optional(form, "numero"),
    complemento: optional(form, "complemento"),
    bairro: optional(form, "bairro"),
    cidade: text(form, "cidade"),
    uf: text(form, "uf").toUpperCase().slice(0, 2),
    cep: optional(form, "cep"),
    pontoReferencia: optional(form, "pontoReferencia"),
    email: optional(form, "email"),
    telefone1: optional(form, "telefone1"),
    telefone2: optional(form, "telefone2"),
    capitalSocial: optional(form, "capitalSocial"),
    cnaePrincipal: text(form, "cnaePrincipal"),
    cnaesSecundarios: list(text(form, "cnaesSecundarios")),
    ramoAtividade: text(form, "ramoAtividade"),
    servicoProduto: text(form, "servicoProduto"),
    quantidadeFuncionarios: Number(text(form, "quantidadeFuncionarios") || 0),
    tempoEmpresa: optional(form, "tempoEmpresa"),
    historicoAlteracoes: list(text(form, "historicoAlteracoes")),
    dataEntrada: dateOrNull(text(form, "dataEntrada")) ?? new Date(),
    responsavelAnterior: optional(form, "responsavelAnterior"),
    situacaoAlvaras: text(form, "situacaoAlvaras") as "PRONTO" | "EM_ANDAMENTO" | "PENDENTE" | "NAO_APLICAVEL",
    participaLicitacoes: form.get("participaLicitacoes") === "on",
    tipoCliente: text(form, "tipoCliente") as "PRINCIPAL" | "SECUNDARIO" | "PROSPECT" | "INATIVO",
    regimeTributario: text(form, "regimeTributario") as "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL" | "MEI" | "ISENTO",
    dataBaixa: dateOrNull(text(form, "dataBaixa")),
    irpfSociosNaContabilidade: form.get("irpfSociosNaContabilidade") === "on",
    dataAtualizacaoBancaria: dateOrNull(text(form, "dataAtualizacaoBancaria")),
    pendenciasFiscais: form.get("pendenciasFiscais") === "on",
    ranking: text(form, "ranking") as "C" | "B" | "A" | "S" | "SS",
  };
}

export async function createEmpresa(form: FormData) {
  const data = companyData(form);
  if (!data.razaoSocial || !data.cnpj || !data.cnaePrincipal || !data.ramoAtividade || !data.servicoProduto || !data.cidade || data.uf.length !== 2) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }
  const empresa = await prisma.empresa.create({ data });
  revalidatePath("/");
  redirect(`/empresas/${empresa.id}`);
}

export async function updateEmpresa(id: string, form: FormData) {
  await prisma.empresa.update({ where: { id }, data: companyData(form) });
  revalidatePath("/");
  revalidatePath(`/empresas/${id}`);
  redirect(`/empresas/${id}`);
}

export async function deleteEmpresa(id: string) {
  await prisma.empresa.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

export async function addSocio(empresaId: string, form: FormData) {
  const cpf = text(form, "cpf");
  const socio = await prisma.socio.upsert({
    where: { cpf },
    update: { nome: text(form, "nome"), endereco: text(form, "enderecoSocio") },
    create: { nome: text(form, "nome"), cpf, endereco: text(form, "enderecoSocio") },
  });
  await prisma.empresaSocio.upsert({
    where: { empresaId_socioId: { empresaId, socioId: socio.id } },
    update: { cargo: optional(form, "cargo"), participacao: optional(form, "participacao") },
    create: { empresaId, socioId: socio.id, cargo: optional(form, "cargo"), participacao: optional(form, "participacao") },
  });
  const descricao = optional(form, "vinculoDescricao");
  if (descricao) {
    await prisma.socioVinculo.create({
      data: { socioId: socio.id, tipo: text(form, "vinculoTipo") as "SOCIO_EM_OUTRA_EMPRESA" | "VINCULO_DE_INTERESSE", descricao },
    });
  }
  revalidatePath(`/empresas/${empresaId}`);
  redirect(`/empresas/${empresaId}`);
}
