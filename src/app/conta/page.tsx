import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageHeader } from "@/components/page-header";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const session = await getSession(await headers());
  if (!session) redirect("/login");

  return (
    <div className="page-container py-10 sm:py-14">
      <PageHeader
        description="Revise seu acesso administrativo e atualize sua senha."
        title="Minha conta"
      />
      <div className="mt-10 grid max-w-4xl gap-6 md:grid-cols-[0.8fr_1.2fr]">
        <section className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Administrador
          </p>
          <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">
            {session.user.name}
          </h2>
          <p className="mt-2 break-all text-sm text-muted">{session.user.email}</p>
          <span className="status-badge-success mt-5">Acesso ativo</span>
        </section>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
