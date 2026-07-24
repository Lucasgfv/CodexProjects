import assert from "node:assert/strict";
import test from "node:test";
import { getAuthOrigin, sanitizeCallbackPath, usesSecureAuthCookies } from "../lib/auth-url";

test("usa o IPv4 local como origem canônica", () => {
  assert.equal(getAuthOrigin(undefined), "http://127.0.0.1:3000");
  assert.equal(getAuthOrigin("http://localhost:3000/rota"), "http://localhost:3000");
});

test("ativa cookies seguros somente em HTTPS", () => {
  assert.equal(usesSecureAuthCookies("http://localhost:3000"), false);
  assert.equal(usesSecureAuthCookies("https://autcompany.interno"), true);
});

test("aceita somente callbacks internos relativos", () => {
  assert.equal(sanitizeCallbackPath("/empresas/nova?origem=login"), "/empresas/nova?origem=login");
  assert.equal(sanitizeCallbackPath("http://0.0.0.0:3000/"), "/");
  assert.equal(sanitizeCallbackPath("//exemplo.com"), "/");
  assert.equal(sanitizeCallbackPath("/\\exemplo.com"), "/");
  assert.equal(sanitizeCallbackPath("/login"), "/");
  assert.equal(sanitizeCallbackPath("/login?senha=alterada", "/", true), "/login?senha=alterada");
  assert.equal(sanitizeCallbackPath("/api/auth/session"), "/");
});
