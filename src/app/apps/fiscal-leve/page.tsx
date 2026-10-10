import type { Metadata } from "next";

import { FiscalLeveClient } from "@/components/fiscal-leve/fiscal-leve-client";
import { getFiscalSnapshot } from "@/lib/fiscal-leve";

export const metadata: Metadata = { title: "Fiscal Leve" };
export const dynamic = "force-dynamic";

export default async function FiscalLevePage() {
  const data = await getFiscalSnapshot();
  return <FiscalLeveClient initialData={data} />;
}
