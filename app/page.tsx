import { Dashboard } from "@/components/dashboard";
import { requirePageUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { logSafeError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePageUser();
  const query = await searchParams;
  const includeInactive = query.inativos === "1";
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

  try {
    const [companies, active, inactive, recentEntries, pending] = await Promise.all([
      prisma.empresa.findMany({
        where: includeInactive ? undefined : { status: "ATIVA" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, razaoSocial: true, nomeFantasia: true, cnpj: true, cidade: true, uf: true, regimeTributario: true, ranking: true, pendenciasFiscais: true, status: true },
      }),
      prisma.empresa.count({ where: { status: "ATIVA" } }),
      prisma.empresa.count({ where: { status: "INATIVA" } }),
      prisma.empresa.count({ where: { status: "ATIVA", dataEntrada: { gte: twelveMonthsAgo } } }),
      prisma.empresa.count({ where: { status: "ATIVA", pendenciasFiscais: true } }),
    ]);
    return <Dashboard companies={companies} user={user} includeInactive={includeInactive} stats={{ active, inactive, recentEntries, pending }} />;
  } catch (error) {
    logSafeError("dashboard.carregar", error);
    return <Dashboard companies={[]} user={user} includeInactive={includeInactive} stats={{ active: 0, inactive: 0, recentEntries: 0, pending: 0 }} databaseUnavailable />;
  }
}
