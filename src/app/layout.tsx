import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { DatabaseStatus } from "@/components/database-status";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nexo Contábil",
    template: "%s | Nexo Contábil",
  },
  description:
    "Gestão contábil modular para empresas, sócios, contratos e lançamentos.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppHeader />
        <main className="min-h-screen pb-16 pt-[72px]">{children}</main>
        <DatabaseStatus />
      </body>
    </html>
  );
}
