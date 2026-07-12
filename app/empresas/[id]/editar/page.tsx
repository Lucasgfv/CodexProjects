import { updateEmpresa } from "@/app/actions";
import { CompanyForm } from "@/components/company-form";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditarEmpresa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.empresa.findUnique({ where: { id } });
  if (!company) notFound();
  const action = updateEmpresa.bind(null, id);
  return <main className="form-shell"><Link className="back" href={`/empresas/${id}`}>← Voltar para ficha</Link><CompanyForm action={action} company={company as unknown as Record<string, unknown>} /></main>;
}
