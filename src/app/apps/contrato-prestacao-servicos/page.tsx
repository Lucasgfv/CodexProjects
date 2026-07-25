import type { Metadata } from "next";

import { ServiceContractApp } from "@/components/contracts/service-contract-app";
import { PageHeader } from "@/components/page-header";
import { listEmpresas } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Contrato de prestação de serviços",
};
export const dynamic = "force-dynamic";

export default async function ServiceContractPage() {
  const empresas = (await listEmpresas()).map((empresa) => ({
    id: empresa.id,
    label: empresa.nomeFantasia ?? empresa.razaoSocial,
    cnpj: empresa.cnpj,
  }));

  return (
    <div className="page-container py-10 sm:py-14">
      <PageHeader
        description="Escolha uma empresa, valide os dados e gere o contrato e a procuração em Word."
        title="Contrato de prestação de serviços"
      />
      <ServiceContractApp empresas={empresas} />
    </div>
  );
}
