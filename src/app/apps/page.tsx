import {
  ArrowUpRight,
  Calculator,
  FileSignature,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Hub de aplicações" };

const apps = [
  {
    title: "Gerador de contratos",
    description:
      "Selecione uma empresa, revise os dados e emita um contrato pronto para PDF.",
    href: "/apps/gerador-contratos",
    icon: FileSignature,
  },
  {
    title: "Contabilidade",
    description:
      "Controle entradas, saídas, competências e vencimentos por cliente.",
    href: "/apps/contabilidade",
    icon: Calculator,
  },
  {
    title: "Clientes e banco de dados",
    description:
      "Centralize cadastros de empresas, sócios, vínculos e alterações.",
    href: "/db-admin",
    icon: UsersRound,
  },
  {
    title: "Dashboard gerencial",
    description:
      "Explore faturamento, carteira ativa e distribuição tributária.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

export default function AppsHubPage() {
  return (
    <div className="page-container py-10 sm:py-14">
      <PageHeader
        description="Escolha um módulo para continuar sua rotina."
        title="Hub de aplicações"
      />

      <div className="mt-10 grid gap-px overflow-hidden rounded-panel border border-[#d9ded9] bg-[#d9ded9] md:grid-cols-2">
        {apps.map((app, index) => {
          const Icon = app.icon;
          return (
            <Link
              className="group min-h-[220px] bg-white/90 p-7 transition hover:bg-[#fbfcfa] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#345c4526] sm:p-9"
              href={app.href}
              key={app.href}
            >
              <div className="flex items-start justify-between">
                <span
                  className={
                    index === 2
                      ? "grid h-12 w-12 place-items-center rounded-2xl bg-lavender/15 text-[#786aa2]"
                      : "grid h-12 w-12 place-items-center rounded-2xl bg-[#edf3ee] text-moss"
                  }
                >
                  <Icon size={24} strokeWidth={1.7} />
                </span>
                <ArrowUpRight
                  className="text-[#7d877f] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-moss"
                  size={20}
                />
              </div>
              <h2 className="mt-9 text-xl font-semibold tracking-[-0.03em]">
                {app.title}
              </h2>
              <p className="mt-2 max-w-md text-[13px] leading-6 text-[#6f7972]">
                {app.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
