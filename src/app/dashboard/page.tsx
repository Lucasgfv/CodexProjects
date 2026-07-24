import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageHeader } from "@/components/page-header";
import {
  listEmpresas,
  listLancamentos,
  listSocios,
} from "@/lib/repository";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [empresas, socios, lancamentos] = await Promise.all([
    listEmpresas(),
    listSocios(),
    listLancamentos(),
  ]);

  return (
    <div className="page-container py-10 sm:py-14">
      <PageHeader
        description="Acompanhe o desempenho da sua carteira."
        title="Visão geral"
      />
      <DashboardClient
        empresas={empresas}
        lancamentos={lancamentos}
        socios={socios}
      />
    </div>
  );
}
