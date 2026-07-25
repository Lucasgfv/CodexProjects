"use client";

import {
  Check,
  Clipboard,
  Download,
  FileJson,
  MessageSquareText,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";

import { Toast } from "@/components/toast";
import {
  demoQuickMessages,
  type ExportedQuickMessageLibrary,
  normalizeQuickMessageShortcut,
  normalizeQuickMessageText,
  parseQuickMessageLibrary,
  type QuickMessage,
  quickMessagesStorageKey,
  type StoredQuickMessageLibrary,
} from "@/lib/messages/quick-messages";

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy failed");
}

export function QuickMessagesApp() {
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(quickMessagesStorageKey);
      if (raw === null) {
        const library: StoredQuickMessageLibrary = {
          schemaVersion: 1,
          messages: demoQuickMessages,
        };
        window.localStorage.setItem(
          quickMessagesStorageKey,
          JSON.stringify(library),
        );
        setMessages(demoQuickMessages);
      } else {
        setMessages(parseQuickMessageLibrary(JSON.parse(raw)));
      }
    } catch {
      setToast({
        message:
          "Não foi possível ler as mensagens salvas. O conteúdo existente não foi sobrescrito.",
        type: "error",
      });
    } finally {
      setLoaded(true);
    }
  }, []);

  const visibleMessages = useMemo(() => {
    const normalizedQuery = normalizeQuickMessageText(query);
    if (!normalizedQuery) return messages;
    return messages.filter((message) =>
      normalizeQuickMessageText(
        `${message.title} ${message.shortcut} ${message.content}`,
      ).includes(normalizedQuery),
    );
  }, [messages, query]);

  function persist(next: QuickMessage[]) {
    try {
      const library: StoredQuickMessageLibrary = {
        schemaVersion: 1,
        messages: next,
      };
      window.localStorage.setItem(
        quickMessagesStorageKey,
        JSON.stringify(library),
      );
      setMessages(next);
      return true;
    } catch {
      setToast({
        message:
          "O navegador não permitiu salvar as alterações. Nenhuma mensagem foi modificada.",
        type: "error",
      });
      return false;
    }
  }

  function addMessage(event: FormEvent) {
    event.preventDefault();
    const values = {
      title: title.trim(),
      shortcut: normalizeQuickMessageShortcut(shortcut),
      content: content.trim(),
    };
    if (!values.title || !shortcut.trim() || !values.content) {
      setToast({
        message: "Preencha título, atalho e conteúdo.",
        type: "error",
      });
      return;
    }
    const shortcutExists = messages.some(
      (message) =>
        normalizeQuickMessageText(message.shortcut) ===
        normalizeQuickMessageText(values.shortcut),
    );
    if (shortcutExists) {
      setToast({
        message: `O atalho ${values.shortcut} já está em uso.`,
        type: "error",
      });
      return;
    }
    const next = [
      {
        id: crypto.randomUUID(),
        ...values,
        createdAt: Date.now(),
      },
      ...messages,
    ];
    if (!persist(next)) return;
    setTitle("");
    setShortcut("");
    setContent("");
    setQuery("");
    setToast({ message: "Mensagem salva com sucesso.", type: "success" });
  }

  async function copyMessage(message: QuickMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message.content);
      } else {
        fallbackCopy(message.content);
      }
      setCopiedId(message.id);
      window.setTimeout(
        () =>
          setCopiedId((current) =>
            current === message.id ? null : current,
          ),
        1_700,
      );
    } catch {
      setToast({
        message: "Não foi possível copiar. Selecione o texto manualmente.",
        type: "error",
      });
    }
  }

  function deleteMessage(message: QuickMessage) {
    if (!window.confirm(`Excluir a mensagem “${message.title}”?`)) return;
    if (!persist(messages.filter((item) => item.id !== message.id))) return;
    setToast({ message: "Mensagem excluída.", type: "success" });
  }

  function exportLibrary() {
    const payload: ExportedQuickMessageLibrary = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      messages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `respostas-rapidas-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setToast({ message: "Backup JSON exportado.", type: "success" });
  }

  async function importLibrary(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const imported = parseQuickMessageLibrary(parsed);
      const confirmed = window.confirm(
        `O backup contém ${imported.length} ${
          imported.length === 1 ? "mensagem" : "mensagens"
        }. Substituir a biblioteca atual?`,
      );
      if (!confirmed) return;
      if (!persist(imported)) return;
      setQuery("");
      setToast({
        message: `${imported.length} ${
          imported.length === 1 ? "mensagem importada" : "mensagens importadas"
        } com sucesso.`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível importar o backup.",
        type: "error",
      });
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  }

  return (
    <>
      <div className="mt-9 grid items-start gap-7 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="rounded-panel border border-[#d6dcd6] bg-white/75 p-5 shadow-subtle sm:p-7 xl:sticky xl:top-24">
          <div className="section-rule">
            <h2 className="text-lg font-semibold tracking-[-0.025em]">
              Nova mensagem
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-[#768079]">
              Crie uma resposta para copiar durante o atendimento.
            </p>
          </div>

          <form className="mt-7 space-y-5" onSubmit={addMessage}>
            <label>
              <span className="field-label">
                Título <span className="text-coral">*</span>
              </span>
              <input
                className="field-control"
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Saudação inicial"
                required
                value={title}
              />
            </label>
            <label>
              <span className="field-label">
                Abreviação / atalho <span className="text-coral">*</span>
              </span>
              <input
                className="field-control"
                maxLength={30}
                onChange={(event) => setShortcut(event.target.value)}
                placeholder="/oi"
                required
                spellCheck={false}
                value={shortcut}
              />
            </label>
            <label>
              <span className="field-label">
                Conteúdo da mensagem <span className="text-coral">*</span>
              </span>
              <textarea
                className="field-textarea min-h-[170px]"
                maxLength={2_000}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Olá! Como posso ajudar você hoje?"
                required
                value={content}
              />
              <span className="mt-1.5 block text-right text-[10px] text-[#8a928d]">
                {content.length}/2.000
              </span>
            </label>
            <button className="primary-button w-full" type="submit">
              <Plus size={17} />
              Salvar mensagem
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-panel border border-[#d6dcd6] bg-white/75 shadow-subtle">
          <header className="border-b border-[#dfe3df] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.025em]">
                  Mensagens salvas
                </h2>
                <p className="mt-1 text-[11px] text-[#78827b]">
                  {query
                    ? `${visibleMessages.length} de ${messages.length} encontradas`
                    : `${messages.length} ${
                        messages.length === 1 ? "mensagem" : "mensagens"
                      }`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(event) => importLibrary(event.target.files?.[0])}
                  ref={importInput}
                  type="file"
                />
                <button
                  className="secondary-button h-10 px-3"
                  onClick={() => importInput.current?.click()}
                  type="button"
                >
                  <Upload size={15} />
                  Importar
                </button>
                <button
                  className="secondary-button h-10 px-3"
                  disabled={!loaded}
                  onClick={exportLibrary}
                  type="button"
                >
                  <Download size={15} />
                  Exportar JSON
                </button>
              </div>
            </div>

            <label className="relative mt-5 block">
              <Search
                className="absolute left-3.5 top-3.5 text-[#7d877f]"
                size={17}
              />
              <input
                aria-label="Buscar mensagens"
                className="field-control pl-10 pr-10"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por título, atalho ou conteúdo"
                type="search"
                value={query}
              />
              {query ? (
                <button
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1 grid h-9 w-9 place-items-center rounded-full text-[#7d877f] transition hover:bg-[#eef2ee] hover:text-ink"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  <X size={16} />
                </button>
              ) : null}
            </label>
          </header>

          <div className="min-h-[520px] p-4 sm:p-6">
            {!loaded ? (
              <EmptyLibrary
                description="Lendo o armazenamento deste navegador."
                icon={FileJson}
                title="Carregando mensagens..."
              />
            ) : visibleMessages.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleMessages.map((message) => (
                  <article
                    className="[content-visibility:auto] flex min-h-[230px] flex-col rounded-panel border border-[#dde2dd] bg-[#fbfcfb] p-5 transition hover:border-[#c4cec6] hover:bg-white"
                    key={message.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {message.title}
                        </h3>
                        <span className="mt-2 inline-flex rounded-lg bg-[#edf3ee] px-2 py-1 font-mono text-[10px] font-semibold text-moss">
                          {message.shortcut}
                        </span>
                      </div>
                      <button
                        aria-label={`Excluir ${message.title}`}
                        className="icon-button shrink-0 hover:text-coral"
                        onClick={() => deleteMessage(message)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="mt-5 flex-1 whitespace-pre-wrap text-[12px] leading-6 text-[#4e5951]">
                      {message.content}
                    </p>
                    <button
                      className={
                        copiedId === message.id
                          ? "mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#edf6ef] px-4 text-[12px] font-semibold text-[#2d7047]"
                          : "secondary-button mt-5 h-10 w-full"
                      }
                      onClick={() => copyMessage(message)}
                      type="button"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check size={15} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Clipboard size={15} />
                          Copiar mensagem
                        </>
                      )}
                    </button>
                  </article>
                ))}
              </div>
            ) : query ? (
              <EmptyLibrary
                description="Tente outro título, atalho ou trecho da mensagem."
                icon={Search}
                title="Nenhuma mensagem encontrada"
              />
            ) : (
              <EmptyLibrary
                description="Cadastre sua primeira resposta no formulário ao lado."
                icon={MessageSquareText}
                title="Sua biblioteca está vazia"
              />
            )}
          </div>
        </section>
      </div>

      {toast ? (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
          type={toast.type}
        />
      ) : null}
    </>
  );
}

function EmptyLibrary({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof MessageSquareText;
  title: string;
}) {
  return (
    <div className="grid min-h-[470px] place-items-center text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#edf3ee] text-moss">
          <Icon size={25} strokeWidth={1.7} />
        </span>
        <h3 className="mt-5 text-lg font-semibold tracking-[-0.025em]">
          {title}
        </h3>
        <p className="mt-2 text-xs leading-5 text-[#78827b]">{description}</p>
      </div>
    </div>
  );
}
