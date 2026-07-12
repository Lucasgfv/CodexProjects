import { Dashboard } from "@/components/dashboard";
import { demoEmpresa } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const companies = await prisma.empresa.findMany({ orderBy: { updatedAt: "desc" } });
    return <Dashboard companies={companies} />;
  } catch {
    return <Dashboard companies={[demoEmpresa]} isDemo />;
  }
}
