import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: "12.345.678/0001-90" },
    update: {},
    create: {
      razaoSocial: "Batista Soluções Empresariais Ltda", nomeFantasia: "Batista Soluções", cnpj: "12.345.678/0001-90",
      inscricaoEstadual: "110.042.490.114", inscricaoMunicipal: "8.765.432-1", endereco: "Av. das Empresas", numero: "1250", complemento: "Sala 402", bairro: "Centro Empresarial", cidade: "São Paulo", uf: "SP", cep: "01010-001", pontoReferencia: "Próximo ao Fórum", email: "contato@batistasolucoes.com.br", telefone1: "(11) 3456-7890", telefone2: "(11) 99876-5432",
      capitalSocial: 150000, cnaePrincipal: "69.20-6-01 — Atividades de contabilidade", cnaesSecundarios: ["70.20-4-00 — Consultoria em gestão empresarial"], ramoAtividade: "Serviços profissionais", servicoProduto: "Contabilidade e consultoria", quantidadeFuncionarios: 18, historicoAlteracoes: ["2024 — Alteração de endereço", "2022 — Aumento do capital social"], dataEntrada: new Date("2024-02-05T00:00:00Z"), responsavelAnterior: "Almeida Contabilidade", situacaoAlvaras: "PRONTO", participaLicitacoes: true, tipoCliente: "FIXO", regimeTributario: "LUCRO_PRESUMIDO", irpfSociosNaContabilidade: true, dataAtualizacaoBancaria: new Date("2026-06-18T00:00:00Z"), pendenciasFiscais: false, ranking: "S",
    },
  });
  const socio = await prisma.socio.upsert({ where: { cpf: "123.456.789-00" }, update: {}, create: { nome: "Marina Batista", cpf: "123.456.789-00", endereco: "São Paulo/SP" } });
  await prisma.empresaSocio.upsert({ where: { empresaId_socioId: { empresaId: empresa.id, socioId: socio.id } }, update: {}, create: { empresaId: empresa.id, socioId: socio.id, participacao: 60, cargo: "Sócia administradora" } });
  const existing = await prisma.socioVinculo.findFirst({ where: { socioId: socio.id, descricao: "Sócia na empresa Batista Participações" } });
  if (!existing) await prisma.socioVinculo.create({ data: { socioId: socio.id, tipo: "SOCIO_EM_OUTRA_EMPRESA", descricao: "Sócia na empresa Batista Participações" } });
}

main().finally(() => prisma.$disconnect());
