import type { Metadata } from "next";

import { ContractGenerator } from "@/components/contracts/contract-generator";
import { PageHeader } from "@/components/page-header";
import { listEmpresas } from "@/lib/repository";

export const metadata: Metadata = { title: "Gerador de contratos" };
export const dynamic = "force-dynamic";

export default async function GeradorContratosPage() {
  const empresas = await listEmpresas();

  return (
    <div className="page-container py-10 sm:py-14">
      <div className="no-print">
        <PageHeader
          description="Selecione uma empresa, confira os dados e emita o documento."
          title="Gerador de contratos"
        />
      </div>
      <ContractGenerator empresas={empresas} />
    </div>
  );
}
