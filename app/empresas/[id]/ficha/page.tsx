import { CompanySheet } from "@/components/company-sheet";
import { PrintButton } from "@/components/print-button";
import { requirePageUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CompanySheetPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser();
  const { id } = await params;
  const company = await prisma.empresa.findUnique({
    where: { id },
    include: {
      socios: { include: { socio: { include: { vinculos: { where: { ativo: true } } } } }, orderBy: { dataSaida: "asc" } },
      contatos: { orderBy: [{ ativo: "desc" }, { principal: "desc" }, { nome: "asc" }] },
      certificados: { where: { removidoEm: null }, orderBy: { dataVencimento: "asc" } },
      alteracoes: { orderBy: { data: "desc" } },
    },
  });
  if (!company) notFound();
  return <main><div className="print-toolbar no-print"><Link className="back" href={`/empresas/${id}`}>← Voltar para o cadastro</Link><PrintButton /></div><CompanySheet company={company} /></main>;
}

