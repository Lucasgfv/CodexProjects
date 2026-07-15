import assert from "node:assert/strict";
import test from "node:test";
import { parseCnpjCardText } from "../lib/cnpj-card";

test("extrai os principais dados de um Cartão CNPJ", () => {
  const text = `
NÚMERO DE INSCRIÇÃO
11.222.333/0001-81
MATRIZ
COMPROVANTE DE INSCRIÇÃO E DE SITUAÇÃO CADASTRAL
DATA DE ABERTURA
15/03/2020
NOME EMPRESARIAL
EXEMPLO SERVIÇOS CONTÁBEIS LTDA
TÍTULO DO ESTABELECIMENTO (NOME DE FANTASIA)
EXEMPLO CONTÁBIL
PORTE
ME
CÓDIGO E DESCRIÇÃO DA ATIVIDADE ECONÔMICA PRINCIPAL
69.20-6-01 - Atividades de contabilidade
CÓDIGO E DESCRIÇÃO DAS ATIVIDADES ECONÔMICAS SECUNDÁRIAS
70.20-4-00 - Consultoria em gestão empresarial
CÓDIGO E DESCRIÇÃO DA NATUREZA JURÍDICA
206-2 - Sociedade Empresária Limitada
LOGRADOURO
RUA DAS EMPRESAS
NÚMERO
100
COMPLEMENTO
SALA 2
CEP
01.010-001
BAIRRO/DISTRITO
CENTRO
MUNICÍPIO
SÃO PAULO
UF
SP
ENDEREÇO ELETRÔNICO
CONTATO@EXEMPLO.COM.BR
TELEFONE
(11) 3333-4444
ENTE FEDERATIVO RESPONSÁVEL (EFR)
*****
SITUAÇÃO CADASTRAL
ATIVA
DATA DA SITUAÇÃO CADASTRAL
15/03/2020
MOTIVO DE SITUAÇÃO CADASTRAL
`;

  const result = parseCnpjCardText(text);
  assert.deepEqual(result, {
    cnpj: "11222333000181",
    razaoSocial: "EXEMPLO SERVIÇOS CONTÁBEIS LTDA",
    nomeFantasia: "EXEMPLO CONTÁBIL",
    dataAbertura: "2020-03-15",
    naturezaJuridica: "206-2 - Sociedade Empresária Limitada",
    porte: "ME",
    cnaePrincipal: "69.20-6-01 - Atividades de contabilidade",
    cnaesSecundarios: "70.20-4-00 - Consultoria em gestão empresarial",
    endereco: "RUA DAS EMPRESAS",
    numero: "100",
    complemento: "SALA 2",
    cep: "01010001",
    bairro: "CENTRO",
    cidade: "SÃO PAULO",
    uf: "SP",
    email: "contato@exemplo.com.br",
    telefone1: "1133334444",
    situacaoCadastral: "ATIVA",
    dataSituacaoCadastral: "2020-03-15",
  });
});

