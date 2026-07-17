"use server";

import { createAudit, diffFields, type AuditChanges } from "@/lib/audit";
import { requireActionUser } from "@/lib/authz";
import {
  digits,
  isValidCpf,
  isValidPhone,
  normalizeEmail,
  optionalText,
  parseDate,
  text,
  validateCompanyForm,
  type CompanyActionState,
} from "@/lib/company-validation";
import { prisma } from "@/lib/prisma";
import { logSafeError } from "@/lib/logger";
import { detectUploadMime, validateUpload } from "@/lib/upload-validation";
import { Prisma, type TipoAlteracaoEmpresa, type TipoContatoEmpresa, type TipoDocumentoEmpresa } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const EDIT_ROLES = ["ADMIN", "OPERADOR"] as const;
const CONTACT_TYPES = new Set<TipoContatoEmpresa>(["PRINCIPAL", "SOCIETARIO", "FISCAL", "CONTABIL", "DEPARTAMENTO_PESSOAL", "FINANCEIRO", "OUTRO"]);
const CHANGE_TYPES = new Set<TipoAlteracaoEmpresa>(["ENDERECO", "ATIVIDADES", "RAZAO_SOCIAL", "CAPITAL_SOCIAL", "REGIME_TRIBUTARIO", "CONTATOS", "SOCIOS_ENTRADA", "SOCIOS_SAIDA", "SOCIOS_ENTRADA_E_SAIDA", "SEM_ALTERACAO_SOCIOS", "OUTRA"]);
const DOCUMENT_TYPES = new Set<TipoDocumentoEmpresa>(["CARTAO_CNPJ", "CONTRATO_SOCIAL", "ALTERACAO_CONTRATUAL", "BIC", "TEC", "ALVARA", "OUTRO"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMPANY_AUDIT_FIELDS = [
  "razaoSocial", "nomeFantasia", "cnpj", "inscricaoEstadual", "inscricaoMunicipal", "dataAbertura", "naturezaJuridica", "porte", "nire", "situacaoCadastral", "dataSituacaoCadastral",
  "endereco", "numero", "complemento", "bairro", "cidade", "uf", "cep", "pontoReferencia", "email", "telefone1", "telefone2", "capitalSocial", "cnaePrincipal", "cnaesSecundarios",
  "ramoAtividade", "servicoProduto", "quantidadeFuncionarios", "tempoEmpresa", "dataEntrada", "dataSaidaEscritorio", "motivoSaidaEscritorio", "responsavelInterno", "responsavelAnterior",
  "situacaoAlvaras", "participaLicitacoes", "tipoCliente", "regimeTributario", "dataBaixa", "irpfSociosNaContabilidade", "dataAtualizacaoBancaria", "pendenciasFiscais", "ranking", "observacoesInternas",
];

const HISTORY_GROUPS: Array<{ tipo: TipoAlteracaoEmpresa; titulo: string; fields: string[] }> = [
  { tipo: "ENDERECO", titulo: "Alteração de endereço", fields: ["endereco", "numero", "complemento", "bairro", "cidade", "uf", "cep", "pontoReferencia"] },
  { tipo: "ATIVIDADES", titulo: "Alteração de atividades", fields: ["cnaePrincipal", "cnaesSecundarios", "ramoAtividade", "servicoProduto"] },
  { tipo: "RAZAO_SOCIAL", titulo: "Alteração de identificação empresarial", fields: ["razaoSocial", "nomeFantasia"] },
  { tipo: "CAPITAL_SOCIAL", titulo: "Alteração de capital social", fields: ["capitalSocial"] },
  { tipo: "REGIME_TRIBUTARIO", titulo: "Alteração de regime tributário", fields: ["regimeTributario"] },
  { tipo: "CONTATOS", titulo: "Alteração dos contatos principais", fields: ["email", "telefone1", "telefone2"] },
];

function fileFrom(form: FormData, key: string) {
  const value = form.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

async function documentFromFile(file: File, tipo: TipoDocumentoEmpresa, observacoes?: string | null) {
  return {
    tipo,
    nomeArquivo: file.name.slice(0, 255),
    mimeType: await detectUploadMime(file) ?? "application/octet-stream",
    tamanho: file.size,
    conteudo: new Uint8Array(await file.arrayBuffer()),
    observacoes,
  };
}

function registrationRedirect(empresaId: string, anchor: string, kind: "mensagem" | "erro", message: string): never {
  redirect(`/empresas/${empresaId}?${kind}=${encodeURIComponent(message)}#${anchor}`);
}

function databaseErrorState(error: unknown): CompanyActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { status: "error", message: "Já existe uma empresa cadastrada com este CNPJ.", fieldErrors: { cnpj: "CNPJ já cadastrado." } };
  }
  const eventId = logSafeError("empresa.salvar", error);
  return { status: "error", message: `Não foi possível salvar o cadastro. Informe o código ${eventId} ao administrador.` };
}

function contactData(form: FormData) {
  const nome = text(form, "nomeContato");
  const telefone = digits(text(form, "telefoneContato")) || null;
  const whatsapp = digits(text(form, "whatsappContato")) || null;
  const emailRaw = text(form, "emailContato");
  const tipoRaw = text(form, "tipoContato") as TipoContatoEmpresa;
  if (!nome || (!telefone && !whatsapp && !emailRaw)) return { error: "Informe o nome e pelo menos um telefone, WhatsApp ou e-mail." } as const;
  if (emailRaw && !EMAIL_PATTERN.test(emailRaw)) return { error: "Informe um e-mail de contato válido." } as const;
  if (telefone && !isValidPhone(telefone)) return { error: "Informe telefone com DDD e 10 ou 11 dígitos." } as const;
  if (whatsapp && !isValidPhone(whatsapp)) return { error: "Informe WhatsApp com DDD e 10 ou 11 dígitos." } as const;
  if (!CONTACT_TYPES.has(tipoRaw)) return { error: "Selecione uma área de contato válida." } as const;
  return {
    data: {
      nome,
      cargo: optionalText(form, "cargoContato"),
      tipo: tipoRaw,
      telefone,
      whatsapp,
      email: emailRaw ? normalizeEmail(emailRaw) : null,
      principal: form.get("contatoPrincipal") === "on",
      observacoes: optionalText(form, "observacoesContato"),
    },
  } as const;
}

function certificateData(form: FormData) {
  const titularRaw = text(form, "titularTipo");
  if (titularRaw !== "PJ" && titularRaw !== "PF") return { error: "Selecione um titular PJ ou PF válido." } as const;
  const titularTipo = titularRaw;
  const dataEmissao = parseDate(text(form, "dataEmissao"));
  const dataVencimento = parseDate(text(form, "dataVencimento"));
  if (!dataEmissao || !dataVencimento) return { error: "Informe as datas de emissão e vencimento." } as const;
  if (dataVencimento < dataEmissao) return { error: "O vencimento não pode ser anterior à emissão." } as const;
  return { data: { titularTipo, dataEmissao, dataVencimento } } as const;
}

async function automaticHistory(tx: Prisma.TransactionClient, empresaId: string, userId: string, changes: AuditChanges) {
  for (const group of HISTORY_GROUPS) {
    const changedFields = group.fields.filter((field) => changes[field]);
    if (!changedFields.length) continue;
    await tx.alteracaoEmpresa.create({
      data: {
        empresaId,
        data: new Date(),
        tipo: group.tipo,
        descricao: `${group.titulo}: ${changedFields.join(", ")}.`,
        origem: "AUTOMATICA",
        usuarioId: userId,
      },
    });
  }
}

function refreshCompany(empresaId: string) {
  revalidatePath("/");
  revalidatePath(`/empresas/${empresaId}`);
  revalidatePath(`/empresas/${empresaId}/ficha`);
  revalidatePath("/certificados");
}

export async function createEmpresa(_previous: CompanyActionState, form: FormData): Promise<CompanyActionState> {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const result = validateCompanyForm(form);
  if (!result.ok) return result.state;
  const card = fileFrom(form, "cartaoCnpj");
  if (card) {
    const validation = await validateUpload(card);
    if (!validation.ok) return { status: "error", message: validation.error };
  }

  let empresaId: string;
  try {
    empresaId = await prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({ data: { ...result.data, historicoAlteracoes: [] } });
      if (card) {
        const document = await tx.documentoEmpresa.create({ data: { empresaId: empresa.id, ...await documentFromFile(card, "CARTAO_CNPJ") } });
        await createAudit(tx, actor, "DOCUMENTO_EMPRESA", document.id, "CRIAR", { tipo: { novo: "CARTAO_CNPJ" } });
      }
      await createAudit(tx, actor, "EMPRESA", empresa.id, "CRIAR", { cnpj: { novo: empresa.cnpj }, razaoSocial: { novo: empresa.razaoSocial } });
      return empresa.id;
    });
  } catch (error) {
    return databaseErrorState(error);
  }

  refreshCompany(empresaId);
  redirect(`/empresas/${empresaId}`);
}

export async function updateEmpresa(id: string, _previous: CompanyActionState, form: FormData): Promise<CompanyActionState> {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const result = validateCompanyForm(form);
  if (!result.ok) return result.state;
  const card = fileFrom(form, "cartaoCnpj");
  if (card) {
    const validation = await validateUpload(card);
    if (!validation.ok) return { status: "error", message: validation.error };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.empresa.findUniqueOrThrow({ where: { id } });
      const after = await tx.empresa.update({ where: { id }, data: result.data });
      const changes = diffFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>, COMPANY_AUDIT_FIELDS);
      if (Object.keys(changes).length) {
        await createAudit(tx, actor, "EMPRESA", id, "ATUALIZAR", changes);
        await automaticHistory(tx, id, actor.id, changes);
      }
      if (card) {
        const document = await tx.documentoEmpresa.create({ data: { empresaId: id, ...await documentFromFile(card, "CARTAO_CNPJ") } });
        await createAudit(tx, actor, "DOCUMENTO_EMPRESA", document.id, "CRIAR", { tipo: { novo: "CARTAO_CNPJ" } });
      }
    });
  } catch (error) {
    return databaseErrorState(error);
  }

  refreshCompany(id);
  redirect(`/empresas/${id}`);
}

export async function inactivateEmpresa(id: string, form: FormData) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const dataSaida = parseDate(text(form, "dataSaida"));
  const motivo = text(form, "motivo");
  if (!dataSaida || !motivo) registrationRedirect(id, "situacao", "erro", "Informe a data e o motivo da inativação.");
  const company = await prisma.empresa.findUnique({ where: { id }, select: { dataEntrada: true } });
  if (!company) registrationRedirect(id, "situacao", "erro", "Empresa não encontrada.");
  if (dataSaida < company.dataEntrada) registrationRedirect(id, "situacao", "erro", "A saída não pode ser anterior à entrada no escritório.");

  await prisma.$transaction(async (tx) => {
    const before = await tx.empresa.findUniqueOrThrow({ where: { id }, select: { status: true, dataSaidaEscritorio: true, motivoSaidaEscritorio: true } });
    const after = await tx.empresa.update({ where: { id }, data: { status: "INATIVA", dataSaidaEscritorio: dataSaida, motivoSaidaEscritorio: motivo, inativadaPorId: actor.id }, select: { status: true, dataSaidaEscritorio: true, motivoSaidaEscritorio: true } });
    await createAudit(tx, actor, "EMPRESA", id, "INATIVAR", diffFields(before, after, ["status", "dataSaidaEscritorio", "motivoSaidaEscritorio"]));
    await tx.alteracaoEmpresa.create({ data: { empresaId: id, data: dataSaida, tipo: "OUTRA", descricao: `Empresa inativada no escritório: ${motivo}.`, origem: "AUTOMATICA", usuarioId: actor.id } });
  });
  refreshCompany(id);
  registrationRedirect(id, "situacao", "mensagem", "Empresa inativada sem perda dos dados.");
}

export async function reactivateEmpresa(id: string) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  await prisma.$transaction(async (tx) => {
    const before = await tx.empresa.findUniqueOrThrow({ where: { id }, select: { status: true, dataSaidaEscritorio: true, motivoSaidaEscritorio: true } });
    const after = await tx.empresa.update({ where: { id }, data: { status: "ATIVA", dataSaidaEscritorio: null, motivoSaidaEscritorio: null, inativadaPorId: null }, select: { status: true, dataSaidaEscritorio: true, motivoSaidaEscritorio: true } });
    await createAudit(tx, actor, "EMPRESA", id, "REATIVAR", diffFields(before, after, ["status", "dataSaidaEscritorio", "motivoSaidaEscritorio"]));
    await tx.alteracaoEmpresa.create({ data: { empresaId: id, data: new Date(), tipo: "OUTRA", descricao: "Empresa reativada no escritório.", origem: "AUTOMATICA", usuarioId: actor.id } });
  });
  refreshCompany(id);
  registrationRedirect(id, "situacao", "mensagem", "Empresa reativada.");
}

export async function addSocio(empresaId: string, form: FormData) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const nome = text(form, "nome");
  const cpf = digits(text(form, "cpf"));
  const endereco = text(form, "enderecoSocio");
  const emailRaw = text(form, "emailSocio");
  const telefoneRaw = text(form, "telefoneSocio");
  const participacaoRaw = text(form, "participacao");
  const participacao = participacaoRaw ? Number(participacaoRaw.replace(",", ".")) : null;
  const dataEntrada = parseDate(text(form, "dataEntradaSocio"));
  const dataSaida = parseDate(text(form, "dataSaidaSocio"));

  if (!nome || !endereco || !isValidCpf(cpf)) registrationRedirect(empresaId, "socios", "erro", "Informe nome, endereço e um CPF válido para o sócio.");
  if (emailRaw && !EMAIL_PATTERN.test(emailRaw)) registrationRedirect(empresaId, "socios", "erro", "Informe um e-mail válido para o sócio.");
  if (telefoneRaw && !isValidPhone(telefoneRaw)) registrationRedirect(empresaId, "socios", "erro", "Informe telefone do sócio com DDD e 10 ou 11 dígitos.");
  if (participacao !== null && (!Number.isFinite(participacao) || participacao < 0 || participacao > 100)) registrationRedirect(empresaId, "socios", "erro", "A participação deve estar entre 0 e 100%.");
  if (dataEntrada && dataSaida && dataSaida < dataEntrada) registrationRedirect(empresaId, "socios", "erro", "A data de saída não pode ser anterior à entrada.");

  await prisma.$transaction(async (tx) => {
    const existingSocio = await tx.socio.findUnique({ where: { cpf } });
    const existingRelation = existingSocio ? await tx.empresaSocio.findUnique({ where: { empresaId_socioId: { empresaId, socioId: existingSocio.id } } }) : null;
    const socio = await tx.socio.upsert({
      where: { cpf },
      update: { nome, endereco, email: emailRaw ? normalizeEmail(emailRaw) : null, telefone: digits(telefoneRaw) || null },
      create: { nome, cpf, endereco, email: emailRaw ? normalizeEmail(emailRaw) : null, telefone: digits(telefoneRaw) || null },
    });
    if (existingSocio) {
      const socioChanges = diffFields(existingSocio as unknown as Record<string, unknown>, socio as unknown as Record<string, unknown>, ["nome", "endereco", "email", "telefone"]);
      if (Object.keys(socioChanges).length) await createAudit(tx, actor, "SOCIO", socio.id, "ATUALIZAR", socioChanges);
    } else {
      await createAudit(tx, actor, "SOCIO", socio.id, "CRIAR", { cpf: { novo: cpf }, nome: { novo: nome } });
    }
    const relationData = { cargo: optionalText(form, "cargo"), participacao, administrador: form.get("administrador") === "on", dataEntrada, dataSaida };
    const relation = await tx.empresaSocio.upsert({ where: { empresaId_socioId: { empresaId, socioId: socio.id } }, update: relationData, create: { empresaId, socioId: socio.id, ...relationData } });
    await createAudit(tx, actor, "EMPRESA_SOCIO", `${empresaId}:${socio.id}`, existingRelation ? "ATUALIZAR" : "CRIAR", existingRelation ? diffFields(existingRelation as unknown as Record<string, unknown>, relation as unknown as Record<string, unknown>, ["cargo", "participacao", "administrador", "dataEntrada", "dataSaida"]) : { socioId: { novo: socio.id } });

    const descricaoVinculo = optionalText(form, "vinculoDescricao");
    if (descricaoVinculo) {
      const vinculoRaw = text(form, "vinculoTipo");
      if (vinculoRaw !== "VINCULO_DE_INTERESSE" && vinculoRaw !== "SOCIO_EM_OUTRA_EMPRESA") throw new Error("Tipo de vínculo inválido.");
      const vinculoTipo = vinculoRaw;
      const vinculo = await tx.socioVinculo.create({ data: { socioId: socio.id, tipo: vinculoTipo, descricao: descricaoVinculo } });
      await createAudit(tx, actor, "SOCIO_VINCULO", vinculo.id, "CRIAR", { tipo: { novo: vinculoTipo } });
    }

    const tipo: TipoAlteracaoEmpresa = existingRelation ? dataSaida && !existingRelation.dataSaida ? "SOCIOS_SAIDA" : "OUTRA" : dataSaida ? "SOCIOS_ENTRADA_E_SAIDA" : "SOCIOS_ENTRADA";
    const descricao = tipo === "SOCIOS_SAIDA" ? `Saída do sócio ${nome}.` : existingRelation ? `Atualização cadastral do sócio ${nome}.` : `Entrada do sócio ${nome}.`;
    await tx.alteracaoEmpresa.create({ data: { empresaId, data: tipo === "SOCIOS_SAIDA" ? dataSaida ?? new Date() : dataEntrada ?? new Date(), tipo, descricao, origem: "AUTOMATICA", usuarioId: actor.id } });
  });

  refreshCompany(empresaId);
  registrationRedirect(empresaId, "socios", "mensagem", "Sócio salvo e registrado no histórico.");
}

export async function addContato(empresaId: string, form: FormData) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const parsed = contactData(form);
  if ("error" in parsed) registrationRedirect(empresaId, "contatos", "erro", parsed.error ?? "Dados de contato inválidos.");

  await prisma.$transaction(async (tx) => {
    if (parsed.data.principal) await tx.contatoEmpresa.updateMany({ where: { empresaId, ativo: true }, data: { principal: false } });
    const contact = await tx.contatoEmpresa.create({ data: { empresaId, ...parsed.data } });
    await createAudit(tx, actor, "CONTATO_EMPRESA", contact.id, "CRIAR", { nome: { novo: contact.nome }, tipo: { novo: contact.tipo } });
    await tx.alteracaoEmpresa.create({ data: { empresaId, data: new Date(), tipo: "CONTATOS", descricao: `Contato ${contact.nome} adicionado.`, origem: "AUTOMATICA", usuarioId: actor.id } });
  });
  refreshCompany(empresaId);
  registrationRedirect(empresaId, "contatos", "mensagem", "Contato adicionado.");
}

export async function updateContato(empresaId: string, contatoId: string, form: FormData) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const parsed = contactData(form);
  if ("error" in parsed) registrationRedirect(empresaId, "contatos", "erro", parsed.error ?? "Dados de contato inválidos.");
  await prisma.$transaction(async (tx) => {
    const before = await tx.contatoEmpresa.findFirstOrThrow({ where: { id: contatoId, empresaId } });
    if (parsed.data.principal) await tx.contatoEmpresa.updateMany({ where: { empresaId, ativo: true, id: { not: contatoId } }, data: { principal: false } });
    const after = await tx.contatoEmpresa.update({ where: { id: contatoId }, data: parsed.data });
    const changes = diffFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>, ["nome", "cargo", "tipo", "telefone", "whatsapp", "email", "principal", "observacoes"]);
    if (Object.keys(changes).length) {
      await createAudit(tx, actor, "CONTATO_EMPRESA", contatoId, "ATUALIZAR", changes);
      await tx.alteracaoEmpresa.create({ data: { empresaId, data: new Date(), tipo: "CONTATOS", descricao: `Contato ${after.nome} atualizado.`, origem: "AUTOMATICA", usuarioId: actor.id } });
    }
  });
  refreshCompany(empresaId);
  registrationRedirect(empresaId, "contatos", "mensagem", "Contato atualizado.");
}

export async function setContatoAtivo(empresaId: string, contatoId: string, ativo: boolean) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  await prisma.$transaction(async (tx) => {
    const before = await tx.contatoEmpresa.findFirstOrThrow({ where: { id: contatoId, empresaId } });
    const after = await tx.contatoEmpresa.update({ where: { id: contatoId }, data: { ativo, inativadoEm: ativo ? null : new Date(), principal: ativo ? before.principal : false } });
    await createAudit(tx, actor, "CONTATO_EMPRESA", contatoId, ativo ? "REATIVAR" : "INATIVAR", { ativo: { anterior: before.ativo, novo: after.ativo } });
    await tx.alteracaoEmpresa.create({ data: { empresaId, data: new Date(), tipo: "CONTATOS", descricao: `Contato ${after.nome} ${ativo ? "reativado" : "inativado"}.`, origem: "AUTOMATICA", usuarioId: actor.id } });
  });
  refreshCompany(empresaId);
  registrationRedirect(empresaId, "contatos", "mensagem", ativo ? "Contato reativado." : "Contato inativado.");
}

export async function addCertificado(empresaId: string, form: FormData) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const parsed = certificateData(form);
  if ("error" in parsed) registrationRedirect(empresaId, "certificados", "erro", parsed.error ?? "Dados do certificado inválidos.");
  await prisma.$transaction(async (tx) => {
    const certificate = await tx.certificadoDigital.create({ data: { empresaId, ...parsed.data } });
    await createAudit(tx, actor, "CERTIFICADO_DIGITAL", certificate.id, "CRIAR", { titularTipo: { novo: certificate.titularTipo }, dataEmissao: { novo: certificate.dataEmissao }, dataVencimento: { novo: certificate.dataVencimento } });
  });
  refreshCompany(empresaId);
  registrationRedirect(empresaId, "certificados", "mensagem", "Certificado adicionado ao controle de vencimentos.");
}

export async function updateCertificado(empresaId: string, certificadoId: string, form: FormData) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const parsed = certificateData(form);
  if ("error" in parsed) registrationRedirect(empresaId, "certificados", "erro", parsed.error ?? "Dados do certificado inválidos.");
  await prisma.$transaction(async (tx) => {
    const before = await tx.certificadoDigital.findFirstOrThrow({ where: { id: certificadoId, empresaId, removidoEm: null } });
    const after = await tx.certificadoDigital.update({ where: { id: certificadoId }, data: parsed.data });
    await createAudit(tx, actor, "CERTIFICADO_DIGITAL", certificadoId, "ATUALIZAR", diffFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>, ["titularTipo", "dataEmissao", "dataVencimento"]));
  });
  refreshCompany(empresaId);
  registrationRedirect(empresaId, "certificados", "mensagem", "Certificado atualizado.");
}

export async function removeCertificado(empresaId: string, certificadoId: string) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  await prisma.$transaction(async (tx) => {
    await tx.certificadoDigital.findFirstOrThrow({ where: { id: certificadoId, empresaId, removidoEm: null } });
    const removedAt = new Date();
    await tx.certificadoDigital.update({ where: { id: certificadoId }, data: { removidoEm: removedAt } });
    await createAudit(tx, actor, "CERTIFICADO_DIGITAL", certificadoId, "REMOVER", { removidoEm: { anterior: null, novo: removedAt } });
  });
  refreshCompany(empresaId);
  registrationRedirect(empresaId, "certificados", "mensagem", "Certificado removido do controle sem apagar o histórico.");
}

export async function addAlteracao(empresaId: string, form: FormData) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const data = parseDate(text(form, "dataAlteracao"));
  const tipoRaw = text(form, "tipoAlteracao") as TipoAlteracaoEmpresa;
  const descricao = text(form, "descricaoAlteracao");
  if (!data || !descricao) registrationRedirect(empresaId, "historico", "erro", "Informe a data e uma descrição objetiva da alteração.");
  if (!CHANGE_TYPES.has(tipoRaw)) registrationRedirect(empresaId, "historico", "erro", "Selecione um tipo de alteração válido.");
  const tipo = tipoRaw;
  await prisma.$transaction(async (tx) => {
    const change = await tx.alteracaoEmpresa.create({ data: { empresaId, data, tipo, descricao, observacoes: optionalText(form, "observacoesAlteracao"), origem: "MANUAL", usuarioId: actor.id } });
    await createAudit(tx, actor, "ALTERACAO_EMPRESA", change.id, "CRIAR", { tipo: { novo: tipo }, data: { novo: data } });
  });
  refreshCompany(empresaId);
  registrationRedirect(empresaId, "historico", "mensagem", "Alteração registrada no histórico.");
}

export async function addDocumento(empresaId: string, form: FormData) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  const file = fileFrom(form, "documento");
  const typeRaw = text(form, "tipoDocumento") as TipoDocumentoEmpresa;
  if (!file) registrationRedirect(empresaId, "documentos", "erro", "Selecione um documento.");
  const validation = await validateUpload(file);
  if (!validation.ok) registrationRedirect(empresaId, "documentos", "erro", validation.error);
  if (!DOCUMENT_TYPES.has(typeRaw)) registrationRedirect(empresaId, "documentos", "erro", "Selecione um tipo de documento válido.");
  const tipo = typeRaw;
  await prisma.$transaction(async (tx) => {
    const document = await tx.documentoEmpresa.create({ data: { empresaId, ...await documentFromFile(file, tipo, optionalText(form, "observacoesDocumento")) } });
    await createAudit(tx, actor, "DOCUMENTO_EMPRESA", document.id, "CRIAR", { tipo: { novo: tipo }, tamanho: { novo: file.size } });
  });
  refreshCompany(empresaId);
  registrationRedirect(empresaId, "documentos", "mensagem", "Documento anexado ao cadastro.");
}

export async function removeDocumento(empresaId: string, documentoId: string) {
  const actor = await requireActionUser([...EDIT_ROLES]);
  await prisma.$transaction(async (tx) => {
    const document = await tx.documentoEmpresa.findFirstOrThrow({ where: { id: documentoId, empresaId, removidoEm: null } });
    await tx.documentoEmpresa.update({ where: { id: documentoId }, data: { removidoEm: new Date() } });
    await createAudit(tx, actor, "DOCUMENTO_EMPRESA", documentoId, "REMOVER", { removidoEm: { anterior: null, novo: new Date() }, tipo: { anterior: document.tipo } });
  });
  refreshCompany(empresaId);
  registrationRedirect(empresaId, "documentos", "mensagem", "Documento removido da visualização sem apagar o histórico.");
}
