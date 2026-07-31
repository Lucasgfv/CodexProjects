"use client";

import {
  Building2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from "react";

import { EmpresaDrawer } from "@/components/db-admin/empresa-drawer";
import { SocioDrawer } from "@/components/db-admin/socio-drawer";
import { Toast } from "@/components/toast";
import { formatDate, initials } from "@/lib/format";
import type { EmpresaDTO, SocioDTO } from "@/lib/types";

type Tab = "empresas" | "socios";
type Message = { text: string; type: "success" | "error" };

export function DbAdminClient({
  initialEmpresas,
  initialSocios,
}: {
  initialEmpresas: EmpresaDTO[];
  initialSocios: SocioDTO[];
}) {
  const [tab, setTab] = useState<Tab>("empresas");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [empresas, setEmpresas] = useState(initialEmpresas);
  const [socios, setSocios] = useState(initialSocios);
  const [empresaDrawer, setEmpresaDrawer] = useState<
    EmpresaDTO | "new" | null
  >(null);
  const [socioDrawer, setSocioDrawer] = useState<SocioDTO | "new" | null>(
    null,
  );
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalized = deferredQuery.trim().toLocaleLowerCase("pt-BR");
  const filteredEmpresas = useMemo(
    () =>
      empresas.filter((empresa) =>
        [
          empresa.razaoSocial,
          empresa.nomeFantasia,
          empresa.cnpj,
          empresa.regimeTributario,
        ]
          .filter(Boolean)
          .some((value) =>
            value!.toLocaleLowerCase("pt-BR").includes(normalized),
          ),
      ),
    [empresas, normalized],
  );
  const filteredSocios = useMemo(
    () =>
      socios.filter((socio) =>
        [socio.nome, socio.cpf, socio.email]
          .filter(Boolean)
          .some((value) =>
            value!.toLocaleLowerCase("pt-BR").includes(normalized),
          ),
      ),
    [socios, normalized],
  );

  function showError(text: string) {
    setMessage({ text, type: "error" });
  }

  function removeEmpresa(empresa: EmpresaDTO) {
    if (
      !window.confirm(
        `Excluir ${empresa.razaoSocial}? Os vínculos e lançamentos relacionados também serão removidos.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/empresas/${empresa.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        showError(data.error ?? "Não foi possível excluir a empresa.");
        return;
      }
      setEmpresas((current) =>
        current.filter((item) => item.id !== empresa.id),
      );
      setMessage({ text: "Empresa excluída.", type: "success" });
    });
  }

  function removeSocio(socio: SocioDTO) {
    if (
      !window.confirm(
        `Excluir ${socio.nome}? Os vínculos societários serão removidos.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/socios/${socio.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        showError(data.error ?? "Não foi possível excluir o sócio.");
        return;
      }
      setSocios((current) => current.filter((item) => item.id !== socio.id));
      setEmpresas((current) =>
        current.map((empresa) => ({
          ...empresa,
          socios: empresa.socios.filter(
            (vinculo) => vinculo.socioId !== socio.id,
          ),
        })),
      );
      setMessage({ text: "Sócio excluído.", type: "success" });
    });
  }

  return (
    <>
      <div className="mt-9 border-b border-[#d9ded9]">
        <div className="flex gap-8">
          {(["empresas", "socios"] as const).map((item) => (
            <button
              className={
                tab === item
                  ? "relative px-1 pb-4 text-[13px] font-semibold capitalize text-moss after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-moss"
                  : "px-1 pb-4 text-[13px] font-medium capitalize text-[#6e7871] transition hover:text-ink"
              }
              key={item}
              onClick={() => {
                setTab(item);
                setQuery("");
              }}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-[#dfe3df] py-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-3 text-[#7b857e]"
            size={17}
          />
          <input
            aria-label={
              tab === "empresas"
                ? "Buscar por razão social ou CNPJ"
                : "Buscar por nome ou CPF"
            }
            className="field-control pl-10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              tab === "empresas"
                ? "Buscar por razão social ou CNPJ"
                : "Buscar por nome ou CPF"
            }
            value={query}
          />
        </label>
        <button
          className="primary-button"
          onClick={() =>
            tab === "empresas"
              ? setEmpresaDrawer("new")
              : setSocioDrawer("new")
          }
          type="button"
        >
          <Plus size={16} />
          {tab === "empresas" ? "Nova empresa" : "Novo sócio"}
        </button>
      </div>

      <div
        className={
          isPending
            ? "mt-1 overflow-x-auto opacity-55 transition"
            : "mt-1 overflow-x-auto transition"
        }
      >
        {tab === "empresas" ? (
          <table className="data-table min-w-[860px]">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>CNPJ</th>
                <th>Regime</th>
                <th>Tipo</th>
                <th>Sócios</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmpresas.map((empresa) => (
                <tr
                  className="group transition hover:bg-white/70"
                  key={empresa.id}
                >
                  <td className="relative min-w-[255px]">
                    <span className="absolute inset-y-0 left-0 w-[3px] scale-y-0 rounded-full bg-moss transition group-hover:scale-y-100" />
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf3ee] text-moss">
                        <Building2 size={17} strokeWidth={1.7} />
                      </span>
                      <span>
                        <span className="block font-semibold text-ink">
                          {empresa.razaoSocial}
                        </span>
                        {empresa.nomeFantasia ? (
                          <span className="mt-0.5 block text-[10px] text-[#818a84]">
                            {empresa.nomeFantasia}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </td>
                  <td>{empresa.cnpj}</td>
                  <td>{empresa.regimeTributario}</td>
                  <td>{empresa.tipoCliente ?? "—"}</td>
                  <td>{empresa.socios.length}</td>
                  <td>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#d5e2d8] bg-[#f0f6f1] px-2.5 py-1 text-[10px] font-semibold text-[#2c6944]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2f7c4f]" />
                      {empresa.dataBaixa ? "Baixada" : "Ativa"}
                    </span>
                  </td>
                  <td>
                    <span className="flex justify-end gap-1">
                      <button
                        aria-label={`Editar ${empresa.razaoSocial}`}
                        className="icon-button"
                        onClick={() => setEmpresaDrawer(empresa)}
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        aria-label={`Excluir ${empresa.razaoSocial}`}
                        className="icon-button hover:text-coral"
                        onClick={() => removeEmpresa(empresa)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>Sócio</th>
                <th>CPF</th>
                <th>Nascimento</th>
                <th>Contato</th>
                <th>Empresas</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSocios.map((socio) => (
                <tr
                  className="group transition hover:bg-white/70"
                  key={socio.id}
                >
                  <td className="min-w-[220px]">
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-lavender/20 text-[10px] font-semibold text-[#675b8a]">
                        {initials(socio.nome)}
                      </span>
                      <span className="font-semibold text-ink">
                        {socio.nome}
                      </span>
                    </span>
                  </td>
                  <td>{socio.cpf}</td>
                  <td>{formatDate(socio.dataNascimento)}</td>
                  <td>
                    <span className="block">{socio.email ?? "—"}</span>
                    <span className="mt-0.5 block text-[10px] text-[#818a84]">
                      {socio.telefone ?? ""}
                    </span>
                  </td>
                  <td>{socio.totalEmpresas}</td>
                  <td>
                    <span className="flex justify-end gap-1">
                      <button
                        aria-label={`Editar ${socio.nome}`}
                        className="icon-button"
                        onClick={() => setSocioDrawer(socio)}
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        aria-label={`Excluir ${socio.nome}`}
                        className="icon-button hover:text-coral"
                        onClick={() => removeSocio(socio)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "empresas" && !filteredEmpresas.length ? (
          <EmptyState icon={Building2} label="Nenhuma empresa encontrada." />
        ) : null}
        {tab === "socios" && !filteredSocios.length ? (
          <EmptyState icon={UserRound} label="Nenhum sócio encontrado." />
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[#dfe3df] pt-4 text-[11px] text-[#78827b]">
        <span>
          Mostrando{" "}
          {tab === "empresas"
            ? filteredEmpresas.length
            : filteredSocios.length}{" "}
          de {tab === "empresas" ? empresas.length : socios.length} {tab}
        </span>
        <span>Página 1 de 1</span>
      </div>

      {empresaDrawer ? (
        <EmpresaDrawer
          empresa={empresaDrawer === "new" ? null : empresaDrawer}
          onClose={() => setEmpresaDrawer(null)}
          onCreateSocio={() => setSocioDrawer("new")}
          onError={showError}
          onSaved={(saved) => {
            const exists = empresas.some((item) => item.id === saved.id);
            const nextEmpresas = exists
              ? empresas.map((item) => (item.id === saved.id ? saved : item))
              : [saved, ...empresas];
            setEmpresas(nextEmpresas);
            setSocios((current) =>
              current.map((socio) => ({
                ...socio,
                totalEmpresas: nextEmpresas.filter((empresa) =>
                  empresa.socios.some(
                    (vinculo) => vinculo.socioId === socio.id,
                  ),
                ).length,
              })),
            );
            setEmpresaDrawer(null);
            setMessage({
              text: empresaDrawer === "new"
                ? "Empresa cadastrada."
                : "Empresa atualizada.",
              type: "success",
            });
          }}
          socios={socios}
        />
      ) : null}

      {socioDrawer ? (
        <SocioDrawer
          onClose={() => setSocioDrawer(null)}
          onError={showError}
          onSaved={(saved) => {
            setSocios((current) => {
              const exists = current.some((item) => item.id === saved.id);
              return exists
                ? current.map((item) => (item.id === saved.id ? saved : item))
                : [saved, ...current];
            });
            setSocioDrawer(null);
            setMessage({
              text:
                socioDrawer === "new"
                  ? "Sócio cadastrado."
                  : "Sócio atualizado.",
              type: "success",
            });
          }}
          socio={socioDrawer === "new" ? null : socioDrawer}
        />
      ) : null}

      {message ? (
        <Toast
          message={message.text}
          onClose={() => setMessage(null)}
          type={message.type}
        />
      ) : null}
    </>
  );
}

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: typeof Building2;
  label: string;
}) {
  return (
    <div className="grid min-h-56 place-items-center border-b border-[#e5e8e5] text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf3ee] text-moss">
          <Icon size={21} strokeWidth={1.7} />
        </span>
        <p className="mt-3 text-xs text-[#737d76]">{label}</p>
      </div>
    </div>
  );
}
