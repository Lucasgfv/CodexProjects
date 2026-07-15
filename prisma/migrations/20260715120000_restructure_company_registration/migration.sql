-- Estrutura aditiva para o cadastro completo de empresas.
CREATE TYPE "TipoContatoEmpresa" AS ENUM ('PRINCIPAL', 'SOCIETARIO', 'FISCAL', 'CONTABIL', 'DEPARTAMENTO_PESSOAL', 'FINANCEIRO', 'OUTRO');
CREATE TYPE "TitularCertificado" AS ENUM ('PJ', 'PF');
CREATE TYPE "TipoCertificado" AS ENUM ('A1', 'A3', 'NUVEM', 'OUTRO');
CREATE TYPE "TipoAlteracaoEmpresa" AS ENUM ('ENDERECO', 'ATIVIDADES', 'RAZAO_SOCIAL', 'CAPITAL_SOCIAL', 'REGIME_TRIBUTARIO', 'CONTATOS', 'SOCIOS_ENTRADA', 'SOCIOS_SAIDA', 'SOCIOS_ENTRADA_E_SAIDA', 'SEM_ALTERACAO_SOCIOS', 'OUTRA');
CREATE TYPE "TipoDocumentoEmpresa" AS ENUM ('CARTAO_CNPJ', 'CONTRATO_SOCIAL', 'ALTERACAO_CONTRATUAL', 'BIC', 'TEC', 'ALVARA', 'OUTRO');

ALTER TABLE "Empresa"
    ADD COLUMN "dataAbertura" TIMESTAMP(3),
    ADD COLUMN "naturezaJuridica" TEXT,
    ADD COLUMN "porte" TEXT,
    ADD COLUMN "nire" TEXT,
    ADD COLUMN "situacaoCadastral" TEXT,
    ADD COLUMN "dataSituacaoCadastral" TIMESTAMP(3),
    ADD COLUMN "dataSaidaEscritorio" TIMESTAMP(3),
    ADD COLUMN "motivoSaidaEscritorio" TEXT,
    ADD COLUMN "responsavelInterno" TEXT,
    ADD COLUMN "observacoesInternas" TEXT;

-- Mantém uma representação única para CNPJ/CPF e evita duplicidade por pontuação.
UPDATE "Empresa" SET "cnpj" = UPPER(REGEXP_REPLACE("cnpj", '[^A-Za-z0-9]', '', 'g'));
UPDATE "Socio" SET "cpf" = REGEXP_REPLACE("cpf", '[^0-9]', '', 'g');

ALTER TABLE "Socio"
    ADD COLUMN "email" TEXT,
    ADD COLUMN "telefone" TEXT;

ALTER TABLE "EmpresaSocio"
    ADD COLUMN "administrador" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "dataEntrada" TIMESTAMP(3),
    ADD COLUMN "dataSaida" TIMESTAMP(3);

CREATE TABLE "ContatoEmpresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "tipo" "TipoContatoEmpresa" NOT NULL DEFAULT 'PRINCIPAL',
    "telefone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContatoEmpresa_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CertificadoDigital" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "titularTipo" "TitularCertificado" NOT NULL,
    "titularNome" TEXT NOT NULL,
    "titularDocumento" TEXT NOT NULL,
    "tipo" "TipoCertificado" NOT NULL,
    "emissora" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CertificadoDigital_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlteracaoEmpresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoAlteracaoEmpresa" NOT NULL,
    "descricao" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlteracaoEmpresa_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentoEmpresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoDocumentoEmpresa" NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentoEmpresa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContatoEmpresa_empresaId_idx" ON "ContatoEmpresa"("empresaId");
CREATE INDEX "CertificadoDigital_empresaId_dataVencimento_idx" ON "CertificadoDigital"("empresaId", "dataVencimento");
CREATE INDEX "CertificadoDigital_titularDocumento_idx" ON "CertificadoDigital"("titularDocumento");
CREATE INDEX "AlteracaoEmpresa_empresaId_data_idx" ON "AlteracaoEmpresa"("empresaId", "data");
CREATE INDEX "DocumentoEmpresa_empresaId_tipo_idx" ON "DocumentoEmpresa"("empresaId", "tipo");

ALTER TABLE "ContatoEmpresa" ADD CONSTRAINT "ContatoEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CertificadoDigital" ADD CONSTRAINT "CertificadoDigital_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlteracaoEmpresa" ADD CONSTRAINT "AlteracaoEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentoEmpresa" ADD CONSTRAINT "DocumentoEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
