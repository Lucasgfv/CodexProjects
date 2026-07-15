"use server";

import {
  digits,
  isValidCnpj,
  isValidCpf,
  normalizeCnpj,
  normalizeEmail,
  optionalText,
  parseDate,
  text,
  validateCompanyForm,
  type CompanyActionState,
} from "@/lib/company-validation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const CONTACT_TYPES = new Set(["PRINCIPAL", "SOCIETARIO", "FISCAL", "CONTABIL", "DEPARTAMENTO_PESSOAL", "FINANCEIRO", "OUTRO"]);
const CERTIFICATE_TYPES = new Set(["A1", "A3", "NUVEM", "OUTRO"]);
const CHANGE_TYPES = new Set(["ENDERECO", "ATIVIDADES", "RAZAO_SOCIAL", "CAPITAL_SOCIAL", "REGIME_TRIBUTARIO", "CONTATOS", "SOCIOS_ENTRADA", "SOCIOS_SAIDA", "SOCIOS_ENTRADA_E_SAIDA", "SEM_ALTERACAO_SOCIOS", "OUTRA"]);
const DOCUMENT_TYPES = new Set(["CARTAO_CNPJ", "CONTRATO_SOCIAL", "ALTERACAO_CONTRATUAL", "BIC", "TEC", "ALVARA", "OUTRO"]);

function fileFrom(form: FormData, key: string) {
  const value = form.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

async function documentFromFile(file: File, type: "CARTAO_CNPJ" | "CONTRATO_SOCIAL" | "ALTERACAO_CONTRATUAL" | "BIC" | "TEC" | "ALVARA" | "OUTRO", observacoes?: string | null) {
  return {
    tipo: type,
    nomeArquivo: file.name.slice(0, 255),
    mimeType: file.type || "application/octet-stream",
    tamanho: file.size,
    conteudo: new Uint8Array(await file.arrayBuffer()),
    observacoes,
  };
}

function validateFile(file: File, pdfOnly = false) {
  if (file.size > MAX_DOCUMENT_SIZE) return "O arquivo deve ter no máximo 5 MB.";
  const name = file.name.toLocaleLowerCase("pt-BR");
  const allowed = pdfOnly
    ? file.type === "application/pdf" || name.endsWith(".pdf")
    : ["application/pdf", "image/jpeg", "image/png"].includes(file.type) || /\.(pdf|jpe?g|png)$/.test(name);
  return allowed ? null : pdfOnly ? "Envie um arquivo PDF válido." : "Envie um PDF, JPG ou PNG válido.";
}

function registrationRedirect(empresaId: string, anchor: string, kind: "mensagem" | "erro", message: string): never {
  redirect(`/empresas/${empresaId}?${kind}=${encodeURIComponent(message)}#${anchor}`);
}

function databaseErrorState(error: unknown): CompanyActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { status: "error", message: "Já existe uma empresa cadastrada com este CNPJ.", fieldErrors: { cnpj: "CNPJ já cadastrado." } };
  }
  return { status: "error", message: "Não foi possível salvar o cadastro. Tente novamente." };
}

export async function createEmpresa(_previous: CompanyActionState, form: FormData): Promise<CompanyActionState> {
  const result = validateCompanyForm(form);
  if (!result.ok) return result.state;
  const card = fileFrom(form, "cartaoCnpj");
  if (card) {
    const fileError = validateFile(card, true);
    if (fileError) return { status: "error", message: fileError };
  }

  let empresaId: string;
  try {
    empresaId = await prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({ data: { ...result.data, historicoAlteracoes: [] } });
      if (card) await tx.documentoEmpresa.create({ data: { empresaId: empresa.id, ...await documentFromFile(card, "CARTAO_CNPJ") } });
      return empresa.id;
    });
  } catch (error) {
    return databaseErrorState(error);
  }

  revalidatePath("/");
  redirect(`/empresas/${empresaId}`);
}

export async function updateEmpresa(id: string, _previous: CompanyActionState, form: FormData): Promise<CompanyActionState> {
  const result = validateCompanyForm(form);
  if (!result.ok) return result.state;
  const card = fileFrom(form, "cartaoCnpj");
  if (card) {
    const fileError = validateFile(card, true);
    if (fileError) return { status: "error", message: fileError };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.empresa.update({ where: { id }, data: result.data });
      if (card) await tx.documentoEmpresa.create({ data: { empresaId: id, ...await documentFromFile(card, "CARTAO_CNPJ") } });
    });
  } catch (error) {
    return databaseErrorState(error);
  }

  revalidatePath("/");
  revalidatePath(`/empresas/${id}`);
  redirect(`/empresas/${id}`);
}

export async function deleteEmpresa(id: string, form: FormData) {
  if (form.get("confirmarExclusao") !== "on") registrationRedirect(id, "exclusao", "erro", "Confirme a exclusão antes de continuar.");
  await prisma.empresa.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

export async function addSocio(empresaId: string, form: FormData) {
  const nome = text(form, "nome");
  const cpf = digits(text(form, "cpf"));
  const endereco = text(form, "enderecoSocio");
  const participacaoRaw = text(form, "participacao");
  const participacao = participacaoRaw ? Number(participacaoRaw.replace(",", ".")) : null;
  const dataEntrada = parseDate(text(form, "dataEntradaSocio"));
  const dataSaida = parseDate(text(form, "dataSaidaSocio"));

  if (!nome || !endereco || !isValidCpf(cpf)) registrationRedirect(empresaId, "socios", "erro", "Informe nome, endereço e um CPF válido para o sócio.");
  if (participacao !== null && (!Number.isFinite(participacao) || participacao < 0 || participacao > 100)) registrationRedirect(empresaId, "socios", "erro", "A participação deve estar entre 0 e 100%.");
  if (dataEntrada && dataSaida && dataSaida < dataEntrada) registrationRedirect(empresaId, "socios", "erro", "A data de saída não pode ser anterior à entrada.");

  await prisma.$transaction(async (tx) => {
    const existingSocio = await tx.socio.findUnique({ where: { cpf }, select: { id: true } });
    const existingRelation = existingSocio
      ? await tx.empresaSocio.findUnique({ where: { empresaId_socioId: { empresaId, socioId: existingSocio.id } } })
      : null;
    const socio = await tx.socio.upsert({
      where: { cpf },
      update: { nome, endereco, email: optionalText(form, "emailSocio") ? normalizeEmail(text(form, "emailSocio")) : null, telefone: digits(text(form, "telefoneSocio")) || null },
      create: { nome, cpf, endereco, email: optionalText(form, "emailSocio") ? normalizeEmail(text(form, "emailSocio")) : null, telefone: digits(text(form, "telefoneSocio")) || null },
    });
    await tx.empresaSocio.upsert({
      where: { empresaId_socioId: { empresaId, socioId: socio.id } },
      update: { cargo: optionalText(form, "cargo"), participacao, administrador: form.get("administrador") === "on", dataEntrada, dataSaida },
      create: { empresaId, socioId: socio.id, cargo: optionalText(form, "cargo"), participacao, administrador: form.get("administrador") === "on", dataEntrada, dataSaida },
    });
    const descricaoVinculo = optionalText(form, "vinculoDescricao");
    if (descricaoVinculo) {
      const vinculoTipo = text(form, "vinculoTipo") === "VINCULO_DE_INTERESSE" ? "VINCULO_DE_INTERESSE" : "SOCIO_EM_OUTRA_EMPRESA";
      await tx.socioVinculo.create({ data: { socioId: socio.id, tipo: vinculoTipo, descricao: descricaoVinculo } });
    }
    await tx.alteracaoEmpresa.create({
      data: {
        empresaId,
        data: dataEntrada ?? new Date(),
        tipo: existingRelation ? "OUTRA" : dataSaida ? "SOCIOS_ENTRADA_E_SAIDA" : "SOCIOS_ENTRADA",
        descricao: existingRelation ? `Atualização cadastral do sócio ${nome}.` : `Entrada do sócio ${nome}.`,
      },
    });
  });

  revalidatePath(`/empresas/${empresaId}`);
  registrationRedirect(empresaId, "socios", "mensagem", "Sócio salvo e registrado no histórico.");
}

export async function addContato(empresaId: string, form: FormData) {
  const nome = text(form, "nomeContato");
  const telefone = digits(text(form, "telefoneContato")) || null;
  const whatsapp = digits(text(form, "whatsappContato")) || null;
  const emailRaw = text(form, "emailContato");
  const tipoRaw = text(form, "tipoContato");
  if (!nome || (!telefone && !whatsapp && !emailRaw)) registrationRedirect(empresaId, "contatos", "erro", "Informe o nome e pelo menos um telefone, WhatsApp ou e-mail.");
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) registrationRedirect(empresaId, "contatos", "erro", "Informe um e-mail de contato válido.");
  const tipo = (CONTACT_TYPES.has(tipoRaw) ? tipoRaw : "OUTRO") as "PRINCIPAL" | "SOCIETARIO" | "FISCAL" | "CONTABIL" | "DEPARTAMENTO_PESSOAL" | "FINANCEIRO" | "OUTRO";

  await prisma.$transaction(async (tx) => {
    if (form.get("contatoPrincipal") === "on") await tx.contatoEmpresa.updateMany({ where: { empresaId }, data: { principal: false } });
    await tx.contatoEmpresa.create({ data: { empresaId, nome, cargo: optionalText(form, "cargoContato"), tipo, telefone, whatsapp, email: emailRaw ? normalizeEmail(emailRaw) : null, principal: form.get("contatoPrincipal") === "on", observacoes: optionalText(form, "observacoesContato") } });
  });
  revalidatePath(`/empresas/${empresaId}`);
  registrationRedirect(empresaId, "contatos", "mensagem", "Contato adicionado.");
}

export async function addCertificado(empresaId: string, form: FormData) {
  const titularTipo = text(form, "titularTipo") === "PF" ? "PF" : "PJ";
  const titularNome = text(form, "titularNome");
  const titularDocumento = titularTipo === "PF" ? digits(text(form, "titularDocumento")) : normalizeCnpj(text(form, "titularDocumento"));
  const tipoRaw = text(form, "tipoCertificado");
  const tipo = (CERTIFICATE_TYPES.has(tipoRaw) ? tipoRaw : "OUTRO") as "A1" | "A3" | "NUVEM" | "OUTRO";
  const dataEmissao = parseDate(text(form, "dataEmissao"));
  const dataVencimento = parseDate(text(form, "dataVencimento"));
  const validDocument = titularTipo === "PF" ? isValidCpf(titularDocumento) : isValidCnpj(titularDocumento);

  if (!titularNome || !validDocument || !dataVencimento) registrationRedirect(empresaId, "certificados", "erro", "Informe titular, CPF/CNPJ válido e data de vencimento.");
  if (dataEmissao && dataVencimento < dataEmissao) registrationRedirect(empresaId, "certificados", "erro", "O vencimento não pode ser anterior à emissão.");

  await prisma.certificadoDigital.create({ data: { empresaId, titularTipo, titularNome, titularDocumento, tipo, emissora: optionalText(form, "emissora"), dataEmissao, dataVencimento, observacoes: optionalText(form, "observacoesCertificado") } });
  revalidatePath("/");
  revalidatePath(`/empresas/${empresaId}`);
  registrationRedirect(empresaId, "certificados", "mensagem", "Certificado adicionado ao controle de vencimentos.");
}

export async function addAlteracao(empresaId: string, form: FormData) {
  const data = parseDate(text(form, "dataAlteracao"));
  const tipoRaw = text(form, "tipoAlteracao");
  const descricao = text(form, "descricaoAlteracao");
  if (!data || !descricao) registrationRedirect(empresaId, "historico", "erro", "Informe a data e uma descrição objetiva da alteração.");
  const tipo = (CHANGE_TYPES.has(tipoRaw) ? tipoRaw : "OUTRA") as "ENDERECO" | "ATIVIDADES" | "RAZAO_SOCIAL" | "CAPITAL_SOCIAL" | "REGIME_TRIBUTARIO" | "CONTATOS" | "SOCIOS_ENTRADA" | "SOCIOS_SAIDA" | "SOCIOS_ENTRADA_E_SAIDA" | "SEM_ALTERACAO_SOCIOS" | "OUTRA";
  await prisma.alteracaoEmpresa.create({ data: { empresaId, data, tipo, descricao, observacoes: optionalText(form, "observacoesAlteracao") } });
  revalidatePath(`/empresas/${empresaId}`);
  registrationRedirect(empresaId, "historico", "mensagem", "Alteração registrada no histórico.");
}

export async function addDocumento(empresaId: string, form: FormData) {
  const file = fileFrom(form, "documento");
  const typeRaw = text(form, "tipoDocumento");
  if (!file) registrationRedirect(empresaId, "documentos", "erro", "Selecione um documento.");
  const fileError = validateFile(file);
  if (fileError) registrationRedirect(empresaId, "documentos", "erro", fileError);
  const tipo = (DOCUMENT_TYPES.has(typeRaw) ? typeRaw : "OUTRO") as "CARTAO_CNPJ" | "CONTRATO_SOCIAL" | "ALTERACAO_CONTRATUAL" | "BIC" | "TEC" | "ALVARA" | "OUTRO";
  await prisma.documentoEmpresa.create({ data: { empresaId, ...await documentFromFile(file, tipo, optionalText(form, "observacoesDocumento")) } });
  revalidatePath(`/empresas/${empresaId}`);
  registrationRedirect(empresaId, "documentos", "mensagem", "Documento anexado ao cadastro.");
}
