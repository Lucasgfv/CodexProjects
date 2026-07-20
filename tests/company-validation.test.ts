import assert from "node:assert/strict";
import test from "node:test";
import { isValidCnae, isValidCnpj, isValidCpf, isValidPhone, normalizeCnpj, parseDate, validateCompanyForm } from "../lib/company-validation";

test("normaliza e valida CNPJ numérico", () => {
  assert.equal(normalizeCnpj("11.222.333/0001-81"), "11222333000181");
  assert.equal(isValidCnpj("11.222.333/0001-81"), true);
  assert.equal(isValidCnpj("11.222.333/0001-82"), false);
});

test("aceita o formato alfanumérico oficial do CNPJ", () => {
  assert.equal(normalizeCnpj("J3.ABB.3LZ/0001-46"), "J3ABB3LZ000146");
  assert.equal(isValidCnpj("J3.ABB.3LZ/0001-46"), true);
});

test("valida CPF e rejeita sequências repetidas", () => {
  assert.equal(isValidCpf("529.982.247-25"), true);
  assert.equal(isValidCpf("111.111.111-11"), false);
});

test("rejeita datas inexistentes", () => {
  assert.equal(parseDate("2026-02-31"), null);
  assert.equal(parseDate("2026-02-28")?.toISOString(), "2026-02-28T00:00:00.000Z");
});

test("valida CNAE e telefone com DDD", () => {
  assert.equal(isValidCnae("69.20-6-01 - Atividades de contabilidade"), true);
  assert.equal(isValidCnae("6920601"), true);
  assert.equal(isValidCnae("69206"), false);
  assert.equal(isValidPhone("(11) 3333-4444"), true);
  assert.equal(isValidPhone("3333-4444"), false);
});

test("aceita CNAEs secundários livres e os novos tipos de cliente", () => {
  for (const tipoCliente of ["FIXO", "AVULSO", "IRPF"]) {
    const form = new FormData();
    Object.entries({
      razaoSocial: "Empresa Teste Ltda",
      nomeFantasia: "Empresa Teste",
      cnpj: "11.222.333/0001-81",
      endereco: "Rua Teste",
      cidade: "São Paulo",
      uf: "SP",
      cnaePrincipal: "69.20-6-01 - Atividades de contabilidade",
      cnaesSecundarios: "Atividade secundária informada livremente, com vírgula\nComércio varejista",
      ramoAtividade: "Serviços",
      servicoProduto: "Contabilidade",
      dataEntrada: "2026-07-20",
      situacaoAlvaras: "PENDENTE",
      tipoCliente,
      regimeTributario: "SIMPLES_NACIONAL",
      ranking: "C",
    }).forEach(([key, value]) => form.set(key, value));

    const result = validateCompanyForm(form);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.data.cnaesSecundarios, [
        "Atividade secundária informada livremente, com vírgula",
        "Comércio varejista",
      ]);
      assert.equal(result.data.tipoCliente, tipoCliente);
    }
  }
});
