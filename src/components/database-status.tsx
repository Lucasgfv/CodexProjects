"use client";

import { Database } from "lucide-react";
import { useEffect, useState } from "react";

import type { DatabaseStatus as DatabaseStatusType } from "@/lib/types";

const initialStatus: DatabaseStatusType = {
  connected: false,
  mode: "demo",
  label: "Verificando",
};

export function DatabaseStatus() {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/health", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: DatabaseStatusType) => setStatus(data))
      .catch(() =>
        setStatus({
          connected: false,
          mode: "demo",
          label: "Modo demonstração",
        }),
      );

    return () => controller.abort();
  }, []);

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe3df]/90 bg-[#f7f8f5]/94 backdrop-blur-xl">
      <div className="page-container flex h-10 items-center gap-2 text-[11px] text-[#59635c]">
        <Database aria-hidden="true" className="text-moss" size={15} />
        <span>Banco de Dados:</span>
        <span className="status-dot" />
        <span
          className={
            status.connected
              ? "font-semibold text-[#277447]"
              : "font-semibold text-[#7b6943]"
          }
        >
          {status.label}
        </span>
        {status.mode === "demo" && status.label !== "Verificando" ? (
          <span className="hidden text-[#8a928d] sm:inline">
            — defina DATABASE_URL para usar PostgreSQL
          </span>
        ) : null}
      </div>
    </div>
  );
}
