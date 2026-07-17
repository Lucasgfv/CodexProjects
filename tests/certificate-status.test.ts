import { certificateDaysUntil, certificateStatus } from "../lib/certificate-status";
import assert from "node:assert/strict";
import test from "node:test";

const reference = new Date("2026-07-17T15:00:00.000Z");

test("classifica vencido antes do dia atual", () => {
  assert.equal(certificateStatus("2026-07-16T00:00:00.000Z", reference), "VENCIDO");
  assert.equal(certificateDaysUntil("2026-07-16T00:00:00.000Z", reference), -1);
});

test("considera hoje e 30 dias como próximos", () => {
  assert.equal(certificateStatus("2026-07-17T00:00:00.000Z", reference), "PROXIMO");
  assert.equal(certificateStatus("2026-08-16T00:00:00.000Z", reference), "PROXIMO");
});

test("considera 31 dias como em dia", () => {
  assert.equal(certificateStatus("2026-08-17T00:00:00.000Z", reference), "EM_DIA");
});

