import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1";

function encryptionKey() {
  const source =
    process.env.FISCAL_CREDENTIALS_KEY ||
    (process.env.NODE_ENV === "production" ? "" : process.env.DATABASE_URL);

  if (!source) {
    throw new Error(
      "Configure FISCAL_CREDENTIALS_KEY para proteger as senhas de acesso fiscal.",
    );
  }

  return createHash("sha256").update(source).digest();
}

export function sealSecret(value: string | null | undefined) {
  if (!value) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function openSecret(value: string | null | undefined) {
  if (!value) return "";
  if (!value.startsWith(`${PREFIX}:`)) return value;

  const [, , ivValue, tagValue, encryptedValue] = value.split(":");
  if (!ivValue || !tagValue || !encryptedValue) return "";

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivValue, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}
