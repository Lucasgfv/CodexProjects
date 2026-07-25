import type { EmpresaDTO, EmpresaSocioDTO } from "@/lib/types";

export const serviceProvider = Object.freeze({
  company: "AUTCONTÁBIL ASSESSORIA LTDA",
  cnpj: "22.867.591/0001-31",
  address:
    "Rua Mato Grosso, nº 70, Bairro Primavera, CEP 38612-116, Unaí/MG",
  crc: "016534/O-5",
  technician: "WENIARLEI BOTELHO LUIZ BRANDÃO",
  technicianCrc: "110687/O",
  phone: "3832208670",
  formattedPhone: "(38) 3220-8670",
  email: "autcontabil@gmail.com",
});

export type ServiceContractPartner = {
  name: string;
  nationality: string;
  civilStatus: string;
  profession: string;
  cpf: string;
  rg: string;
  issuer: string;
  address: string;
};

export type ServiceContractData = {
  company: string;
  cnpj: string;
  address: string;
  feeNumber: string;
  feeWords: string;
  date: string;
  partners: ServiceContractPartner[];
};

const units = [
  "",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
];
const teens = [
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];
const tens = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
];
const hundreds = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

function groupToWords(number: number) {
  if (number === 0) return "";
  if (number === 100) return "cem";
  const parts: string[] = [];
  const hundred = Math.floor(number / 100);
  const rest = number % 100;
  if (hundred) parts.push(hundreds[hundred]);
  if (rest >= 10 && rest < 20) {
    parts.push(teens[rest - 10]);
  } else {
    const ten = Math.floor(rest / 10);
    const unit = rest % 10;
    if (ten) parts.push(tens[ten]);
    if (unit) parts.push(units[unit]);
  }
  return parts.join(" e ");
}

function integerToWords(number: number) {
  if (number === 0) return "zero";
  const scales = [
    { value: 1_000_000_000, singular: "bilhão", plural: "bilhões" },
    { value: 1_000_000, singular: "milhão", plural: "milhões" },
    { value: 1_000, singular: "mil", plural: "mil" },
    { value: 1, singular: "", plural: "" },
  ];
  const result: string[] = [];
  let remainder = number;
  for (const scale of scales) {
    const group = Math.floor(remainder / scale.value);
    if (!group) continue;
    remainder %= scale.value;
    if (scale.value === 1_000 && group === 1) {
      result.push("mil");
    } else {
      result.push(
        `${groupToWords(group)}${
          scale.singular
            ? ` ${group === 1 ? scale.singular : scale.plural}`
            : ""
        }`,
      );
    }
  }
  if (result.length <= 1) return result[0];
  const last = result.pop();
  return `${result.join(", ")}${
    remainder < 100 || remainder % 100 === 0 ? " e " : ", "
  }${last}`;
}

export function moneyToWords(value: number) {
  const rounded = Math.round(Math.max(0, value) * 100);
  const reais = Math.floor(rounded / 100);
  const cents = rounded % 100;
  const parts: string[] = [];
  if (reais) {
    parts.push(
      `${integerToWords(reais)} ${reais === 1 ? "real" : "reais"}`,
    );
  }
  if (cents) {
    parts.push(
      `${integerToWords(cents)} ${cents === 1 ? "centavo" : "centavos"}`,
    );
  }
  return parts.length ? parts.join(" e ") : "zero reais";
}

export function getActivePartners(
  empresa: EmpresaDTO,
  referenceDate = new Date(),
) {
  const timestamp = referenceDate.getTime();
  return empresa.socios.filter((partner) => {
    const hasStarted = new Date(partner.dataEntrada).getTime() <= timestamp;
    const hasNotLeft =
      !partner.dataSaida || new Date(partner.dataSaida).getTime() > timestamp;
    return hasStarted && hasNotLeft;
  });
}

function addMissing(
  missing: string[],
  label: string,
  value: string | number | null | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim()) ||
    (typeof value === "number" && value <= 0)
  ) {
    missing.push(label);
  }
}

export function getContractMissingFields(empresa: EmpresaDTO) {
  const missing: string[] = [];
  addMissing(missing, "Razão social", empresa.razaoSocial);
  addMissing(missing, "CNPJ", empresa.cnpj);
  addMissing(missing, "Endereço da empresa", empresa.endereco);
  addMissing(missing, "CEP da empresa", empresa.cep);
  addMissing(missing, "Cidade da empresa", empresa.cidade);
  addMissing(missing, "UF da empresa", empresa.uf);
  addMissing(missing, "Honorário mensal", empresa.honorarioMensal);

  const partners = getActivePartners(empresa);
  if (!partners.length) {
    missing.push("Ao menos um sócio ativo");
  }

  partners.forEach((partner, index) => {
    const prefix = `Sócio ${index + 1} (${partner.nome})`;
    addMissing(missing, `${prefix}: nome`, partner.nome);
    addMissing(missing, `${prefix}: CPF`, partner.cpf);
    addMissing(missing, `${prefix}: nacionalidade`, partner.nacionalidade);
    addMissing(missing, `${prefix}: estado civil`, partner.estadoCivil);
    addMissing(missing, `${prefix}: profissão`, partner.profissao);
    addMissing(missing, `${prefix}: RG`, partner.rg);
    addMissing(missing, `${prefix}: órgão emissor`, partner.orgaoEmissor);
    addMissing(missing, `${prefix}: endereço`, partner.endereco);
    addMissing(missing, `${prefix}: CEP`, partner.cep);
    addMissing(missing, `${prefix}: cidade`, partner.cidade);
    addMissing(missing, `${prefix}: UF`, partner.uf);
  });

  return missing;
}

function formatAddress({
  endereco,
  cep,
  cidade,
  uf,
}: Pick<EmpresaDTO | EmpresaSocioDTO, "endereco" | "cep" | "cidade" | "uf">) {
  return [
    endereco,
    [cidade, uf].filter(Boolean).join("/"),
    cep ? `CEP ${cep}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

export function createServiceContractData(
  empresa: EmpresaDTO,
  date = new Date(),
): ServiceContractData {
  const missing = getContractMissingFields(empresa);
  if (missing.length) {
    throw new Error(
      `O cadastro ainda não está completo: ${missing.join("; ")}.`,
    );
  }

  const fee = empresa.honorarioMensal as number;
  return {
    company: empresa.razaoSocial,
    cnpj: empresa.cnpj,
    address: formatAddress(empresa),
    feeNumber: new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(fee),
    feeWords: moneyToWords(fee),
    date: new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
    partners: getActivePartners(empresa).map((partner) => ({
      name: partner.nome,
      nationality: partner.nacionalidade as string,
      civilStatus: partner.estadoCivil as string,
      profession: partner.profissao as string,
      cpf: partner.cpf,
      rg: partner.rg as string,
      issuer: partner.orgaoEmissor as string,
      address: formatAddress(partner),
    })),
  };
}
