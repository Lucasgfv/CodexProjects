export type QuickMessage = {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  createdAt: number;
};

export type StoredQuickMessageLibrary = {
  schemaVersion: 1;
  messages: QuickMessage[];
};

export type ExportedQuickMessageLibrary = StoredQuickMessageLibrary & {
  exportedAt: string;
};

export const quickMessagesStorageKey = "nexo:quick-messages:v1";

export const demoQuickMessages: QuickMessage[] = [
  {
    id: "demo-welcome",
    title: "Boas-vindas",
    shortcut: "/oi",
    content:
      "Olá! 👋 Bem-vindo(a) ao nosso atendimento. Como posso ajudar você hoje?",
    createdAt: 1,
  },
  {
    id: "demo-deadline",
    title: "Prazo de retorno",
    shortcut: "/prazo",
    content:
      "Nosso prazo de retorno é de até 24 horas úteis. Agradecemos pela sua paciência!",
    createdAt: 2,
  },
];

export function normalizeQuickMessageText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizeQuickMessageShortcut(value: string) {
  const withoutSpaces = value.trim().replace(/\s+/g, "-");
  return withoutSpaces.startsWith("/")
    ? withoutSpaces
    : `/${withoutSpaces}`;
}

function isQuickMessage(value: unknown): value is QuickMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    item.title.length <= 80 &&
    typeof item.shortcut === "string" &&
    item.shortcut.trim().length > 0 &&
    item.shortcut.length <= 30 &&
    typeof item.content === "string" &&
    item.content.trim().length > 0 &&
    item.content.length <= 2_000 &&
    typeof item.createdAt === "number" &&
    Number.isFinite(item.createdAt)
  );
}

export function parseQuickMessageLibrary(value: unknown): QuickMessage[] {
  if (!value || typeof value !== "object") {
    throw new Error("O arquivo não contém uma biblioteca de mensagens.");
  }
  const library = value as Record<string, unknown>;
  if (library.schemaVersion !== 1 || !Array.isArray(library.messages)) {
    throw new Error("Versão de backup incompatível.");
  }
  if (!library.messages.every(isQuickMessage)) {
    throw new Error("O backup contém mensagens inválidas ou incompletas.");
  }

  const shortcuts = new Set<string>();
  const ids = new Set<string>();
  for (const message of library.messages) {
    const shortcut = normalizeQuickMessageText(
      normalizeQuickMessageShortcut(message.shortcut),
    );
    if (shortcuts.has(shortcut)) {
      throw new Error(`O atalho ${message.shortcut} aparece mais de uma vez.`);
    }
    if (ids.has(message.id)) {
      throw new Error("O backup contém identificadores duplicados.");
    }
    shortcuts.add(shortcut);
    ids.add(message.id);
  }

  return library.messages.map((message) => ({
    ...message,
    title: message.title.trim(),
    shortcut: normalizeQuickMessageShortcut(message.shortcut),
    content: message.content.trim(),
  }));
}
