import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const source = resolve(
  projectRoot,
  "docs",
  "legacy",
  "indexx",
  "Contrato de servico index.html",
);
const destination = resolve(projectRoot, "public", "autcontabil-logo.jpg");
const html = await readFile(source, "utf8");
const match = html.match(/const LOGO_BASE64 = '([^']+)'/);

if (!match) {
  throw new Error("Logo base64 não encontrado no HTML legado.");
}

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, Buffer.from(match[1], "base64"));
console.log(`Ativo extraído para ${destination}`);
