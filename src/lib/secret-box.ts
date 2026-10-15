import { createCipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1";

function encryptionKey() {
  const configuredKey = process.env.FISCAL_CREDENTIALS_KEY?.trim();
  const source =
    configuredKey ||
    (process.env.NODE_ENV === "production" ? "" : process.env.DATABASE_URL);

  if (
    !source ||
    source.length < 32 ||
    (process.env.NODE_ENV === "production" &&
      source.includes("gere-uma-chave"))
  ) {
    throw new Error(
      "FISCAL_CREDENTIALS_KEY ausente ou inválida.",
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
