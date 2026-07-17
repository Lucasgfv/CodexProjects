export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export type SupportedUploadMime = "application/pdf" | "image/jpeg" | "image/png";

export async function detectUploadMime(file: File): Promise<SupportedUploadMime | null> {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])) return "image/png";
  return null;
}

export async function validateUpload(file: File, pdfOnly = false): Promise<{ ok: true; mimeType: SupportedUploadMime } | { ok: false; error: string }> {
  if (file.size > MAX_UPLOAD_SIZE) return { ok: false, error: "O arquivo deve ter no máximo 5 MB." };
  const mimeType = await detectUploadMime(file);
  if (!mimeType || (pdfOnly && mimeType !== "application/pdf")) {
    return { ok: false, error: pdfOnly ? "Envie um arquivo PDF válido." : "Envie um PDF, JPG ou PNG válido." };
  }
  return { ok: true, mimeType };
}
