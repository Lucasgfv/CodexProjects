import { z } from "zod";

const nullableText = z
  .string()
  .trim()
  .nullable()
  .optional()
  .default(null);
const nullableNumber = z
  .number()
  .finite()
  .nullable()
  .optional()
  .default(null);

export const empresaInputSchema = z.object({
  razaoSocial: z.string().trim().min(2, "Informe a razão social."),
  nomeFantasia: nullableText,
  cnpj: z.string().trim().min(14, "Informe um CNPJ válido."),
  tipoCliente: nullableText,
  regimeTributario: z.string().trim().min(2, "Informe o regime tributário."),
  email: nullableText,
  telefone: nullableText,
  cep: nullableText,
  endereco: nullableText,
  cidade: nullableText,
  capitalSocial: nullableNumber,
  dataInicio: z.string().min(8, "Informe a data de início."),
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
    .optional()
    .default([]),
});

export const socioInputSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome."),
  cpf: z.string().trim().min(11, "Informe um CPF válido."),
  dataNascimento: z.string().min(8, "Informe a data de nascimento."),
  email: nullableText,
  telefone: nullableText,
});

export const lancamentoInputSchema = z.object({
  empresaId: z.string().min(1, "Selecione uma empresa."),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  descricao: z.string().trim().min(2, "Informe uma descrição."),
  valor: z.number().positive("Informe um valor maior que zero."),
  vencimento: z.string().min(8, "Informe o vencimento."),
  competencia: z.string().min(8, "Informe a competência."),
  pago: z.boolean(),
});

export function getErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Revise os dados informados.";
  }
  if (error instanceof Error) return error.message;
  return "Não foi possível concluir a operação.";
}
