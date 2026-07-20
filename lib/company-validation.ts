const UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
]);

const SITUACOES_ALVARA = new Set(["PRONTO", "EM_ANDAMENTO", "PENDENTE", "NAO_APLICAVEL"]);
const TIPOS_CLIENTE = new Set(["FIXO", "AVULSO", "IRPF"]);
const REGIMES = new Set(["SIMPLES_NACIONAL", "LUCRO_PRESUMIDO", "LUCRO_REAL", "MEI", "ISENTO"]);
const RANKINGS = new Set(["C", "B", "A", "S", "SS"]);

export type CompanyActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const INITIAL_COMPANY_ACTION_STATE: CompanyActionState = { status: "idle" };

export const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
export const optionalText = (form: FormData, key: string) => text(form, key) || null;
export const digits = (value: string) => value.replace(/\D/g, "");
export const normalizeCnpj = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const normalizeEmail = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

export function parseDate(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : parsed;
}

export function isValidCpf(value: string) {
  const cpf = digits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calculate = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return calculate(9) === Number(cpf[9]) && calculate(10) === Number(cpf[10]);
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeCnpj(value);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const charValue = (character: string) => character.charCodeAt(0) - 48;
  const digit = (base: string, offset: number) => {
    const sum = [...base].reduce((total, character, index) => total + charValue(character) * weights[index + offset], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = digit(cnpj.slice(0, 12), 1);
  const second = digit(`${cnpj.slice(0, 12)}${first}`, 0);
  return cnpj.endsWith(`${first}${second}`);
}

function parseNonNegativeInteger(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseDecimal(value: string) {
  if (!value) return null;
  const normalized = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? normalized : null;
}

function list(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

export function isValidPhone(value: string) {
  const normalized = digits(value);
  return normalized.length === 10 || normalized.length === 11;
}

export function isValidCnae(value: string) {
  return /^\d{2}\.?\d{2}-?\d-?\d{2}(?:\s|$)/.test(value.trim());
}

function normalizeCnae(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})\.?([0-9]{2})-?(\d)-?(\d{2})(.*)$/);
  if (!match) return trimmed;
  const description = match[5].replace(/^\s*-?\s*/, "").trim();
  return `${match[1]}.${match[2]}-${match[3]}-${match[4]}${description ? ` - ${description}` : ""}`;
}

export function validateCompanyForm(form: FormData) {
  const fieldErrors: Record<string, string> = {};
  const cnpj = normalizeCnpj(text(form, "cnpj"));
  const uf = text(form, "uf").toUpperCase();
  const cepRaw = text(form, "cep");
  const cep = cepRaw ? digits(cepRaw) : null;
  const emailRaw = text(form, "email");
  const quantidadeRaw = text(form, "quantidadeFuncionarios") || "0";
  const capitalRaw = text(form, "capitalSocial");
  const dataEntradaRaw = text(form, "dataEntrada");
  const cnaePrincipalRaw = text(form, "cnaePrincipal");
  const cnaesSecundariosRaw = list(text(form, "cnaesSecundarios"));
  const situacaoAlvarasRaw = text(form, "situacaoAlvaras");
  const tipoClienteRaw = text(form, "tipoCliente");
  const regimeTributarioRaw = text(form, "regimeTributario");
  const rankingRaw = text(form, "ranking");

  const required: Array<[string, string]> = [
    ["razaoSocial", "Informe a razão social."],
    ["nomeFantasia", "Informe o nome fantasia."],
    ["cnpj", "Informe o CNPJ."],
    ["endereco", "Informe o logradouro."],
    ["cidade", "Informe a cidade."],
    ["uf", "Informe a UF."],
    ["cnaePrincipal", "Informe o CNAE principal."],
    ["ramoAtividade", "Informe o ramo de atividade."],
    ["servicoProduto", "Informe o serviço ou produto."],
    ["dataEntrada", "Informe a data de entrada no escritório."],
  ];
  for (const [key, message] of required) if (!text(form, key)) fieldErrors[key] = message;

  if (cnpj && !isValidCnpj(cnpj)) fieldErrors.cnpj = "Informe um CNPJ válido, numérico ou alfanumérico.";
  if (uf && !UFS.has(uf)) fieldErrors.uf = "Selecione uma UF válida.";
  if (cepRaw && cep?.length !== 8) fieldErrors.cep = "O CEP deve ter 8 dígitos.";
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) fieldErrors.email = "Informe um e-mail válido.";
  for (const key of ["telefone1", "telefone2"] as const) {
    if (text(form, key) && !isValidPhone(text(form, key))) fieldErrors[key] = "Informe telefone com DDD e 10 ou 11 dígitos.";
  }
  if (parseNonNegativeInteger(quantidadeRaw) === null) fieldErrors.quantidadeFuncionarios = "Informe uma quantidade válida.";
  if (capitalRaw && parseDecimal(capitalRaw) === null) fieldErrors.capitalSocial = "Informe o capital com até duas casas decimais.";
  if (dataEntradaRaw && !parseDate(dataEntradaRaw)) fieldErrors.dataEntrada = "Informe uma data de entrada válida.";
  if (cnaePrincipalRaw && !isValidCnae(cnaePrincipalRaw)) fieldErrors.cnaePrincipal = "Informe um CNAE válido com 7 dígitos.";
  if (!SITUACOES_ALVARA.has(situacaoAlvarasRaw)) fieldErrors.situacaoAlvaras = "Selecione uma situação de alvará válida.";
  if (!TIPOS_CLIENTE.has(tipoClienteRaw)) fieldErrors.tipoCliente = "Selecione um tipo de cliente válido.";
  if (!REGIMES.has(regimeTributarioRaw)) fieldErrors.regimeTributario = "Selecione um regime tributário válido.";
  if (!RANKINGS.has(rankingRaw)) fieldErrors.ranking = "Selecione um ranking válido.";

  const optionalDates = ["dataAbertura", "dataSituacaoCadastral", "dataBaixa", "dataAtualizacaoBancaria"];
  for (const key of optionalDates) if (text(form, key) && !parseDate(text(form, key))) fieldErrors[key] = "Informe uma data válida.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false as const, state: { status: "error" as const, message: "Revise os campos destacados.", fieldErrors } };
  }

  return {
    ok: true as const,
    data: {
      razaoSocial: text(form, "razaoSocial"),
      nomeFantasia: text(form, "nomeFantasia"),
      cnpj,
      inscricaoEstadual: optionalText(form, "inscricaoEstadual"),
      inscricaoMunicipal: optionalText(form, "inscricaoMunicipal"),
      dataAbertura: parseDate(text(form, "dataAbertura")),
      naturezaJuridica: optionalText(form, "naturezaJuridica"),
      porte: optionalText(form, "porte"),
      nire: optionalText(form, "nire"),
      situacaoCadastral: optionalText(form, "situacaoCadastral"),
      dataSituacaoCadastral: parseDate(text(form, "dataSituacaoCadastral")),
      endereco: text(form, "endereco"),
      numero: optionalText(form, "numero"),
      complemento: optionalText(form, "complemento"),
      bairro: optionalText(form, "bairro"),
      cidade: text(form, "cidade"),
      uf,
      cep,
      pontoReferencia: optionalText(form, "pontoReferencia"),
      email: emailRaw ? normalizeEmail(emailRaw) : null,
      telefone1: digits(text(form, "telefone1")) || null,
      telefone2: digits(text(form, "telefone2")) || null,
      capitalSocial: capitalRaw ? parseDecimal(capitalRaw) : null,
      cnaePrincipal: normalizeCnae(cnaePrincipalRaw),
      cnaesSecundarios: cnaesSecundariosRaw,
      ramoAtividade: text(form, "ramoAtividade"),
      servicoProduto: text(form, "servicoProduto"),
      quantidadeFuncionarios: parseNonNegativeInteger(quantidadeRaw) ?? 0,
      dataEntrada: parseDate(dataEntradaRaw)!,
      responsavelInterno: optionalText(form, "responsavelInterno"),
      responsavelAnterior: optionalText(form, "responsavelAnterior"),
      situacaoAlvaras: situacaoAlvarasRaw as "PRONTO" | "EM_ANDAMENTO" | "PENDENTE" | "NAO_APLICAVEL",
      participaLicitacoes: form.get("participaLicitacoes") === "on",
      tipoCliente: tipoClienteRaw as "FIXO" | "AVULSO" | "IRPF",
      regimeTributario: regimeTributarioRaw as "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL" | "MEI" | "ISENTO",
      dataBaixa: parseDate(text(form, "dataBaixa")),
      irpfSociosNaContabilidade: form.get("irpfSociosNaContabilidade") === "on",
      dataAtualizacaoBancaria: parseDate(text(form, "dataAtualizacaoBancaria")),
      pendenciasFiscais: form.get("pendenciasFiscais") === "on",
      ranking: rankingRaw as "C" | "B" | "A" | "S" | "SS",
      observacoesInternas: optionalText(form, "observacoesInternas"),
    },
  };
}
