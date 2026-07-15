import { Dashboard } from "@/components/dashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const companies = await prisma.empresa.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        certificados: {
          where: { revogadoEm: null },
          orderBy: { dataVencimento: "asc" },
          take: 1,
          select: { dataVencimento: true },
        },
      },
    });
    return <Dashboard companies={companies} />;
  } catch {
    return <Dashboard companies={[]} databaseUnavailable />;
  }
}
