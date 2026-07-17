import { validateUpload } from "../lib/upload-validation";
import assert from "node:assert/strict";
import test from "node:test";

test("aceita arquivos pela assinatura real, não apenas pelo nome", async () => {
  const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])], "cartao.bin", { type: "application/octet-stream" });
  assert.deepEqual(await validateUpload(pdf), { ok: true, mimeType: "application/pdf" });
});

test("rejeita conteúdo inválido mesmo com extensão permitida", async () => {
  const fake = new File(["<script>alert(1)</script>"], "cartao.pdf", { type: "application/pdf" });
  const result = await validateUpload(fake);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /PDF, JPG ou PNG válido/);
});
