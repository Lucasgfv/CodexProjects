import { canEditCompanies } from "../lib/permissions";
import assert from "node:assert/strict";
import test from "node:test";

test("matriz de edição dos três papéis", () => {
  assert.equal(canEditCompanies("ADMIN"), true);
  assert.equal(canEditCompanies("OPERADOR"), true);
  assert.equal(canEditCompanies("VISUALIZADOR"), false);
});
