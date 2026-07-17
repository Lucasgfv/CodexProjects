import { extractCnpjCard, ocrReviewWarning } from "../lib/cnpj-ocr";
import { createCanvas, loadImage, PDFDocument } from "@napi-rs/canvas";
import assert from "node:assert/strict";
import test from "node:test";

const lines = [
  "NÚMERO DE INSCRIÇÃO 11.222.333/0001-81",
  "NOME EMPRESARIAL EMPRESA TESTE LTDA",
  "TÍTULO DO ESTABELECIMENTO (NOME DE FANTASIA) EMPRESA TESTE",
  "PORTE DEMAIS",
  "CÓDIGO E DESCRIÇÃO DA ATIVIDADE ECONÔMICA PRINCIPAL 69.20-6-01 CONTABILIDADE",
];

async function cardImage() {
  const canvas = createCanvas(1800, 1000);
  const context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "black";
  context.font = "32px Arial";
  lines.forEach((line, index) => context.fillText(line, 60, 100 + index * 120));
  return new Uint8Array(await canvas.encode("png"));
}

test("reconhece cartão CNPJ em imagem e exige revisão por OCR", { timeout: 60_000 }, async () => {
  const image = await cardImage();
  const result = await extractCnpjCard(image, "image/png", "cartao.png");
  assert.equal(result.source, "OCR");
  assert.equal(result.data.cnpj, "11222333000181");
  assert.match(result.data.razaoSocial ?? "", /EMPRESA TESTE LTDA/);
  assert.match(result.warning ?? "", /Revise/);
});

test("lê PDF textual sem OCR", { timeout: 60_000 }, async () => {
  const pdf = new PDFDocument();
  const context = pdf.beginPage(1800, 1000);
  context.font = "32px Arial";
  lines.forEach((line, index) => context.fillText(line, 60, 100 + index * 120));
  pdf.endPage();
  const result = await extractCnpjCard(new Uint8Array(pdf.close()), "application/pdf", "cartao.pdf");
  assert.equal(result.source, "TEXT");
  assert.equal(result.data.cnpj, "11222333000181");
});

test("usa OCR em PDF digitalizado", { timeout: 60_000 }, async () => {
  const imageBytes = await cardImage();
  const image = await loadImage(Buffer.from(imageBytes));
  const pdf = new PDFDocument();
  const context = pdf.beginPage(1800, 1000);
  (context as unknown as { drawImage: (source: typeof image, x: number, y: number, width: number, height: number) => void }).drawImage(image, 0, 0, 1800, 1000);
  pdf.endPage();
  const result = await extractCnpjCard(new Uint8Array(pdf.close()), "application/pdf", "digitalizado.pdf");
  assert.equal(result.source, "OCR");
  assert.equal(result.data.cnpj, "11222333000181");
});

test("rejeita imagem inválida", async () => {
  await assert.rejects(() => extractCnpjCard(new Uint8Array([1, 2, 3]), "image/png", "invalido.png"));
});

test("marca baixa confiança para revisão humana", () => {
  assert.match(ocrReviewWarning(79), /baixa confiança/);
  assert.doesNotMatch(ocrReviewWarning(80), /baixa confiança/);
});
