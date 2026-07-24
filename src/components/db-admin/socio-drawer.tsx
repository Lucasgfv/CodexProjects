"use client";

import { Save } from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";

import { DrawerShell } from "@/components/db-admin/drawer-shell";
import { toInputDate } from "@/lib/format";
import type { SocioDTO, SocioInput } from "@/lib/types";

async function readResponse(response: Response) {
  const data = (await response.json()) as SocioDTO | { error: string };
  if (!response.ok) {
    throw new Error("error" in data ? data.error : "Não foi possível salvar.");
  }
  return data as SocioDTO;
}

export function SocioDrawer({
  socio,
  onClose,
  onSaved,
  onError,
}: {
  socio?: SocioDTO | null;
  onClose: () => void;
  onSaved: (socio: SocioDTO) => void;
  onError: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nome: socio?.nome ?? "",
    cpf: socio?.cpf ?? "",
    dataNascimento: toInputDate(socio?.dataNascimento) || "1990-01-01",
    email: socio?.email ?? "",
    telefone: socio?.telefone ?? "",
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const payload: SocioInput = {
      ...form,
      email: form.email || null,
      telefone: form.telefone || null,
    };
    startTransition(async () => {
      try {
        const response = await fetch(
          socio ? `/api/socios/${socio.id}` : "/api/socios",
          {
            method: socio ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        onSaved(await readResponse(response));
      } catch (error) {
        onError(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o sócio.",
        );
      }
    });
  }

  return (
    <form id="socio-form" onSubmit={submit}>
      <DrawerShell
        description="Dados pessoais e de contato usados nos vínculos societários."
        footer={
          <>
            <button
              className="secondary-button"
              disabled={isPending}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="primary-button min-w-[140px]"
              disabled={isPending}
              form="socio-form"
              type="submit"
            >
              <Save size={16} />
              {isPending ? "Salvando..." : "Salvar sócio"}
            </button>
          </>
        }
        onClose={onClose}
        title={socio ? "Editar sócio" : "Novo sócio"}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="field-label">
              Nome completo <span className="text-coral">*</span>
            </span>
            <input
              autoFocus
              className="field-control"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nome: event.target.value,
                }))
              }
              required
              value={form.nome}
            />
          </label>
          <label>
            <span className="field-label">
              CPF <span className="text-coral">*</span>
            </span>
            <input
              className="field-control"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cpf: event.target.value,
                }))
              }
              required
              value={form.cpf}
            />
          </label>
          <label>
            <span className="field-label">
              Data de nascimento <span className="text-coral">*</span>
            </span>
            <input
              className="field-control"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dataNascimento: event.target.value,
                }))
              }
              required
              type="date"
              value={form.dataNascimento}
            />
          </label>
          <label>
            <span className="field-label">E-mail</span>
            <input
              className="field-control"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              type="email"
              value={form.email}
            />
          </label>
          <label>
            <span className="field-label">Telefone</span>
            <input
              className="field-control"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  telefone: event.target.value,
                }))
              }
              value={form.telefone}
            />
          </label>
        </div>

        {socio ? (
          <div className="mt-8 rounded-panel border border-[#dce1dc] bg-[#f4f7f4] p-5">
            <p className="text-xs font-semibold text-[#465148]">
              Vínculos ativos
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-moss">
              {socio.totalEmpresas}
            </p>
            <p className="mt-1 text-[11px] text-[#768079]">
              empresa{socio.totalEmpresas === 1 ? "" : "s"} relacionada
              {socio.totalEmpresas === 1 ? "" : "s"} a este cadastro.
            </p>
          </div>
        ) : null}
      </DrawerShell>
    </form>
  );
}
