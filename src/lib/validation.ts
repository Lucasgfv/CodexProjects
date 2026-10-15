import { z } from "zod";

import { isValidCnpj } from "@/lib/cnpj";

const nullableText = z
  .string()
  .trim()
  .max(4000, "O texto informado é muito longo.")
  .nullable()
  .optional()
  .default(null);
const nullableNumber = z
  .number()
  .finite()
  .nullable()
  .optional()
  .default(null);
const nullableDate = z
  .string()
  .trim()
  .max(40, "Informe uma data válida.")
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Informe uma data válida.")
  .nullable()
  .optional()
  .default(null);

export const cnpjInputSchema = z
  .string()
  .trim()
  .max(18, "Informe um CNPJ válido.")
  .refine(isValidCnpj, "Informe um CNPJ válido.");

export const cpfInputSchema = z
  .string()
  .trim()
  .max(14, "Informe um CPF válido.")
  .refine(
    (value) => !value || value.replace(/\D/g, "").length === 11,
    "Informe um CPF válido.",
  );

export const empresaInputSchema = z.object({
  razaoSocial: z
    .string()
    .trim()
    .min(2, "Informe a razão social.")
    .max(160, "A razão social é muito longa."),
  nomeFantasia: nullableText,
  cnpj: cnpjInputSchema,
  tipoCliente: nullableText,
  porte: nullableText,
  regimeTributario: z
    .string()
    .trim()
    .min(2, "Informe o regime tributário.")
    .max(80, "O regime tributário é muito longo."),
  email: nullableText,
  telefone: nullableText,
  cep: nullableText,
  endereco: nullableText,
  numeroEndereco: nullableText,
  bairro: nullableText,
  cidade: nullableText,
  uf: nullableText.transform((value) => value?.toUpperCase() ?? null),
  capitalSocial: nullableNumber,
  honorarioMensal: nullableNumber,
  inscricaoEstadual: nullableText,
  inscricaoMunicipal: nullableText,
  cnaePrincipal: nullableText,
  cnaesSecundarios: nullableText,
  ramoAtividade: nullableText,
  servicoProduto: nullableText,
  quantidadeFuncionarios: z.number().int().min(0).nullable().optional().default(null),
  situacaoAlvaras: nullableText,
  participaLicitacoes: z.boolean().nullable().optional().default(null),
  contadorAnterior: nullableText,
  dataAtualizacaoBancaria: nullableDate,
  pendenciasFiscais: z.boolean().nullable().optional().default(null),
  ranking: z.enum(["A", "B", "C", "D", "S", "SS"]).nullable().optional().default(null),
  dataInicio: z
    .string()
    .min(8, "Informe a data de início.")
    .max(40, "Informe uma data válida."),
  dataBaixa: nullableText,
  sociosVinculados: z
    .array(
      z.object({
        socioId: z.string().min(1),
        cargo: nullableText,
        percentualParticipacao: z.number().min(0).max(100),
        recebeProlabore: z.boolean(),
        valorProlabore: nullableNumber,
        dataEntrada: z.string().min(8),
        dataSaida: nullableText,
      }),
    )
    .max(100, "Há sócios demais na solicitação.")
    .optional()
    .default([]),
  alteracoes: z
    .array(
      z.object({
        numeroAlteracao: z.number().int().positive().nullable().optional(),
        dataAlteracao: z.string().min(8),
        descricaoResumida: nullableText,
      }),
    )
    .max(100, "Há alterações demais na solicitação.")
    .optional()
    .default([]),
  referenciasComerciais: z.array(z.object({
    nome: z.string().trim().min(1),
    cidade: z.string().trim().min(1),
    uf: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  })).max(2).optional().default([]),
});

export const socioInputSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe o nome.")
    .max(160, "O nome é muito longo."),
  cpf: cpfInputSchema.refine(Boolean, "Informe um CPF válido."),
  dataNascimento: z
    .string()
    .min(8, "Informe a data de nascimento.")
    .max(40, "Informe uma data válida."),
  email: nullableText,
  telefone: nullableText,
  nacionalidade: nullableText,
  estadoCivil: nullableText,
  profissao: nullableText,
  rg: nullableText,
  orgaoEmissor: nullableText,
  cep: nullableText,
  endereco: nullableText,
  cidade: nullableText,
  uf: nullableText.transform((value) => value?.toUpperCase() ?? null),
});

export const lancamentoInputSchema = z.object({
  empresaId: z.string().min(1, "Selecione uma empresa.").max(64),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  descricao: z
    .string()
    .trim()
    .min(2, "Informe uma descrição.")
    .max(500, "A descrição é muito longa."),
  valor: z
    .number()
    .positive("Informe um valor maior que zero.")
    .max(1_000_000_000, "O valor informado é muito alto."),
  vencimento: z.string().min(8, "Informe o vencimento.").max(40),
  competencia: z.string().min(8, "Informe a competência.").max(40),
  pago: z.boolean(),
});
