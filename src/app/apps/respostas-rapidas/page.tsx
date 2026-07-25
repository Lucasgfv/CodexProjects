import type { Metadata } from "next";

import { QuickMessagesApp } from "@/components/messages/quick-messages-app";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Respostas rápidas" };

export default function QuickMessagesPage() {
  return (
    <div className="page-container py-10 sm:py-14">
      <PageHeader
        description="Sua biblioteca local de mensagens para atendimento."
        title="Respostas rápidas"
      />
      <QuickMessagesApp />
    </div>
  );
}
