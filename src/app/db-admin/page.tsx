import type { Metadata } from "next";

import { DbAdminClient } from "@/components/db-admin/db-admin-client";
import { PageHeader } from "@/components/page-header";
import { listEmpresas, listSocios } from "@/lib/repository";

export const metadata: Metadata = { title: "Clientes e banco de dados" };
export const dynamic = "force-dynamic";

export default async function DbAdminPage() {
  const [empresas, socios] = await Promise.all([
    listEmpresas(),
    listSocios(),
  ]);

  return (
    <div className="page-container py-10 sm:py-14">
      <PageHeader
        description="Cadastre empresas, sócios e vínculos em um só lugar."
        title="Clientes e banco de dados"
      />
      <DbAdminClient initialEmpresas={empresas} initialSocios={socios} />
    </div>
  );
}
