import { validatePassword } from "../lib/password";
import assert from "node:assert/strict";
import test from "node:test";

test("rejeita senha curta", () => {
  assert.match(validatePassword("Aa1curta") ?? "", /12 caracteres/);
});

test("exige maiúscula, minúscula e número", () => {
  assert.match(validatePassword("abcdefghijkl") ?? "", /maiúscula/);
});

test("aceita senha temporária forte", () => {
  assert.equal(validatePassword("SenhaTemporaria2026"), null);
});

