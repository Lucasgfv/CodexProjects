export type CnpjCardData = Partial<{
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  dataAbertura: string;
  naturezaJuridica: string;
  porte: string;
  cnaePrincipal: string;
  cnaesSecundarios: string;
  endereco: string;
  numero: string;
  complemento: string;
  cep: string;
  bairro: string;
  cidade: string;
  uf: string;
  email: string;
  telefone1: string;
  situacaoCadastral: string;
  dataSituacaoCadastral: string;
}>;

const LABELS = {
  abertura: "DATA D[AE] ABERTURA",
  nome: "NOME EMPRESARIAL",
  fantasia: "T[IÍ]TULO DO ESTABELECIMENTO(?: [(]NOME DE FANTASIA[)])?",
  porte: "PORTE",
  principal: "C[ÓO]DIGO E DESCRI[CÇ][ÃA]O DA ATIVIDADE ECON[ÔO]MICA PRINCIPAL",
  secundarias: "C[ÓO]DIGO E DESCRI[CÇ][ÃA]O DAS ATIVIDADES ECON[ÔO]MICAS SECUND[ÁA]RIAS",
  natureza: "C[ÓO]DIGO E DESCRI[CÇ][ÃA]O DA NATUREZA JUR[ÍI]DICA",
  logradouro: "LOGRADOURO",
  numero: "N[ÚU]MERO(?!\\s+DE\\s+INSCRI[CÇ][ÃA]O)",
  complemento: "COMPLEMENTO",
  cep: "CEP",
  bairro: "BAIRRO/DISTRITO",
  municipio: "MUNIC[ÍI]PIO",
  uf: "UF",
  email: "ENDERE[CÇ]O ELETR[ÔO]NICO",
  telefone: "TELEFONE",
  situacao: "(?<!DE\\s)SITUA[CÇ][ÃA]O CADASTRAL",
  dataSituacao: "DATA DA SITUA[CÇ][ÃA]O CADASTRAL",
};

function clean(value: string | undefined) {
  return value?.replace(/\s+/g, " ").replace(/^[-:]+|[-:]+$/g, "").trim() || undefined;
}

function between(text: string, label: string, next: string[]) {
  const expression = new RegExp(`${label}\\s*:?\\s*(.*?)\\s*(?=${next.join("|")}|$)`, "is");
  return clean(text.match(expression)?.[1]);
}

function brDateToIso(value: string | undefined) {
  const match = value?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : undefined;
}

export function parseCnpjCardText(rawText: string): CnpjCardData {
  const text = rawText.replace(/\u00a0/g, " ");
  const cnpj = text.match(/[A-Z0-9]{2}\.?[A-Z0-9]{3}\.?[A-Z0-9]{3}\/[A-Z0-9]{4}-?\d{2}/i)?.[0];
  const dataAbertura = between(text, LABELS.abertura, [LABELS.nome]);
  const razaoSocial = between(text, LABELS.nome, [LABELS.fantasia]);
  const nomeFantasia = between(text, LABELS.fantasia, [LABELS.porte]);
  const porte = between(text, LABELS.porte, [LABELS.principal]);
  const cnaePrincipal = between(text, LABELS.principal, [LABELS.secundarias]);
  const cnaesSecundarios = between(text, LABELS.secundarias, [LABELS.natureza]);
  const naturezaJuridica = between(text, LABELS.natureza, [LABELS.logradouro]);
  const endereco = between(text, LABELS.logradouro, [LABELS.numero]);
  const numero = between(text, LABELS.numero, [LABELS.complemento]);
  const complemento = between(text, LABELS.complemento, [LABELS.cep]);
  const cep = between(text, LABELS.cep, [LABELS.bairro]);
  const bairro = between(text, LABELS.bairro, [LABELS.municipio]);
  const cidade = between(text, LABELS.municipio, [LABELS.uf]);
  const uf = between(text, LABELS.uf, [LABELS.email]);
  const email = between(text, LABELS.email, [LABELS.telefone]);
  const telefone1 = between(text, LABELS.telefone, ["ENTE FEDERATIVO RESPONS[ÁA]VEL", LABELS.situacao]);
  const situacaoCadastral = between(text, LABELS.situacao, [LABELS.dataSituacao]);
  const dataSituacaoCadastral = between(text, LABELS.dataSituacao, ["MOTIVO DE SITUA[CÇ][ÃA]O CADASTRAL", "SITUA[CÇ][ÃA]O ESPECIAL"]);

  return Object.fromEntries(Object.entries({
    cnpj: clean(cnpj)?.toUpperCase().replace(/[^A-Z0-9]/g, ""),
    razaoSocial,
    nomeFantasia: nomeFantasia === "********" ? undefined : nomeFantasia,
    dataAbertura: brDateToIso(dataAbertura),
    naturezaJuridica,
    porte,
    cnaePrincipal,
    cnaesSecundarios: cnaesSecundarios?.replace(/\s*;\s*/g, "\n"),
    endereco,
    numero,
    complemento,
    cep: clean(cep)?.replace(/\D/g, ""),
    bairro,
    cidade,
    uf: clean(uf)?.slice(0, 2).toUpperCase(),
    email: clean(email)?.toLocaleLowerCase("pt-BR"),
    telefone1: clean(telefone1)?.replace(/\D/g, ""),
    situacaoCadastral,
    dataSituacaoCadastral: brDateToIso(dataSituacaoCadastral),
  }).filter(([, value]) => Boolean(value))) as CnpjCardData;
}
