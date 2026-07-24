import type { Metadata } from "next";

import { AccountingClient } from "@/components/accounting/accounting-client";
import { PageHeader } from "@/components/page-header";
import { listEmpresas, listLancamentos } from "@/lib/repository";

export const metadata: Metadata = { title: "Contabilidade" };
export const dynamic = "force-dynamic";

export default async function ContabilidadePage() {
  const [empresas, lancamentos] = await Promise.all([
    listEmpresas(),
    listLancamentos(),
  ]);

  return (
    <div className="page-container py-10 sm:py-14">
      <PageHeader
        description="Controle entradas, saídas e vencimentos por empresa."
        title="Contabilidade"
      />
      <AccountingClient
        empresas={empresas}
        initialLancamentos={lancamentos}
      />
    </div>
  );
}
