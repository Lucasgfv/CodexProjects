import type { Metadata } from "next";

import { FichaCadastralApp } from "@/components/ficha-cadastral/ficha-cadastral-app";
import { PageHeader } from "@/components/page-header";
import { listEmpresas } from "@/lib/repository";

export const metadata: Metadata = { title: "Ficha cadastral" };
export const dynamic = "force-dynamic";

export default async function FichaCadastralPage() {
  const empresas = await listEmpresas();
  return <div className="page-container py-10 sm:py-14"><div className="no-print"><PageHeader title="Ficha cadastral" description="Revise o cadastro e emita a ficha operacional em A4." /></div><FichaCadastralApp empresas={empresas} /></div>;
}
