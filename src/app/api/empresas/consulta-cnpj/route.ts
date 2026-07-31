import { NextResponse } from "next/server";

import {
  formatCnpj,
  isValidCnpj,
  normalizeCnpj,
} from "@/lib/cnpj";

type BrasilApiCompany = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  descricao_porte?: string;
  porte?: string;
  data_inicio_atividade?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  telefone?: string;
  email?: string;
};

type ReceitaWsCompany = {
  status?: string;
  cnpj?: string;
  nome?: string;
  fantasia?: string;
  porte?: string;
  abertura?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
};

function normalizeCompanyData(
  company: BrasilApiCompany | ReceitaWsCompany,
  provider: "brasilapi" | "receitaws",
) {
  const isReceitaWs = provider === "receitaws";
  const data = company as BrasilApiCompany & ReceitaWsCompany;
  const address = [
    data.logradouro,
    data.numero,
    data.complemento,
    data.bairro,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    cnpj: formatCnpj(data.cnpj ?? ""),
    razaoSocial: isReceitaWs ? data.nome ?? "" : data.razao_social ?? "",
    nomeFantasia: isReceitaWs
      ? data.fantasia || null
      : data.nome_fantasia || null,
    porte: isReceitaWs
      ? data.porte || null
      : data.descricao_porte ?? data.porte ?? null,
    dataInicio: isReceitaWs
      ? data.abertura ?? null
      : data.data_inicio_atividade ?? null,
    endereco: address || null,
    cep: data.cep || null,
    cidade: data.municipio || null,
    uf: data.uf || null,
    telefone: isReceitaWs
      ? data.telefone ?? null
      : data.ddd_telefone_1 ?? data.telefone ?? null,
    email: data.email || null,
  };
}

export async function GET(request: Request) {
  const cnpj = normalizeCnpj(
    new URL(request.url).searchParams.get("cnpj") ?? "",
  );

  if (!isValidCnpj(cnpj)) {
    return NextResponse.json(
      { error: "Informe um CNPJ válido para consulta." },
      { status: 400 },
    );
  }

  const providers = [
    {
      name: "brasilapi" as const,
      url: `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
    },
    {
      name: "receitaws" as const,
      url: `https://www.receitaws.com.br/v1/cnpj/${cnpj}`,
    },
  ];

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) continue;

      const company = (await response.json()) as
        | BrasilApiCompany
        | ReceitaWsCompany;
      if ("status" in company && company.status?.toLowerCase() === "error") {
        continue;
      }
      const normalized = normalizeCompanyData(company, provider.name);
      if (normalized.razaoSocial) return NextResponse.json(normalized);
    } catch {
      // Tente a próxima fonte pública sem expor detalhes da rede ao usuário.
    }
  }

  return NextResponse.json(
    { error: "A consulta pública demorou ou está indisponível. Tente novamente." },
    { status: 502 },
  );
}
