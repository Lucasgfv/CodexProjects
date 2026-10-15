import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { DatabaseStatus } from "@/components/database-status";
import { getSession } from "@/lib/auth";
import { hasSessionCookie } from "@/lib/session-cookie";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nexo Contábil",
    template: "%s | Nexo Contábil",
  },
  description:
    "Gestão contábil modular para empresas, sócios, contratos e lançamentos.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-nexo-pathname") ?? "/";
  const isLoginPage = pathname === "/login";
  const session = hasSessionCookie(requestHeaders)
    ? await getSession(requestHeaders)
    : null;

  if (!isLoginPage && !session) {
    const nextPath = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    redirect(`/login${nextPath}`);
  }

  if (isLoginPage && session) redirect("/");

  return (
    <html lang="pt-BR">
      <body>
        {isLoginPage ? null : <AppHeader userName={session?.user.name ?? "Administrador"} />}
        <main className={isLoginPage ? "min-h-screen" : "min-h-screen pb-16 pt-[72px]"}>
          {children}
        </main>
        {isLoginPage ? null : <DatabaseStatus />}
      </body>
    </html>
  );
}
