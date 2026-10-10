CREATE TABLE "FiscalEmpresa" (
    "id" TEXT NOT NULL, "codigo" INTEGER, "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL, "cnpjDigits" TEXT NOT NULL,
    "inscricaoEstadual" TEXT, "regime" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL, "observacoes" TEXT NOT NULL DEFAULT '',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FiscalEmpresa_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FiscalTarefa" (
    "id" TEXT NOT NULL, "empresaId" TEXT NOT NULL, "chave" TEXT NOT NULL,
    "nome" TEXT NOT NULL, "competencia" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL, "valorOriginal" TEXT,
    "statusAlteradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FiscalTarefa_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FiscalMei" (
    "id" TEXT NOT NULL, "nome" TEXT NOT NULL, "cnpj" TEXT NOT NULL,
    "cnpjDigits" TEXT NOT NULL, "responsavel" TEXT NOT NULL,
    "limiteReferencia" DECIMAL(12,2) NOT NULL DEFAULT 81000,
    "faturamentoConferido" BOOLEAN NOT NULL DEFAULT false,
    "inativo" BOOLEAN NOT NULL DEFAULT false, "observacoes" TEXT NOT NULL DEFAULT '',
    "certificadoDescricao" TEXT, "certificadoAtivo" BOOLEAN NOT NULL DEFAULT false,
    "certificadoValidoAte" TIMESTAMP(3), "acessoCpf" TEXT, "acessoSenha" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FiscalMei_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FiscalMeiAtividade" (
    "id" TEXT NOT NULL, "meiId" TEXT NOT NULL, "chave" TEXT NOT NULL,
    "nome" TEXT NOT NULL, "competencia" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL, "statusAlteradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoEm" TIMESTAMP(3), "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FiscalMeiAtividade_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FiscalMeiFaturamento" (
    "id" TEXT NOT NULL, "meiId" TEXT NOT NULL, "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL, "valor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FiscalMeiFaturamento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FiscalConfiguracao" (
    "chave" TEXT NOT NULL, "valor" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FiscalConfiguracao_pkey" PRIMARY KEY ("chave")
);

CREATE UNIQUE INDEX "FiscalEmpresa_cnpj_key" ON "FiscalEmpresa"("cnpj");
CREATE UNIQUE INDEX "FiscalEmpresa_cnpjDigits_key" ON "FiscalEmpresa"("cnpjDigits");
CREATE INDEX "FiscalEmpresa_responsavel_idx" ON "FiscalEmpresa"("responsavel");
CREATE INDEX "FiscalEmpresa_regime_idx" ON "FiscalEmpresa"("regime");
CREATE UNIQUE INDEX "FiscalTarefa_empresaId_chave_competencia_key" ON "FiscalTarefa"("empresaId", "chave", "competencia");
CREATE INDEX "FiscalTarefa_competencia_status_idx" ON "FiscalTarefa"("competencia", "status");
CREATE UNIQUE INDEX "FiscalMei_cnpj_key" ON "FiscalMei"("cnpj");
CREATE UNIQUE INDEX "FiscalMei_cnpjDigits_key" ON "FiscalMei"("cnpjDigits");
CREATE INDEX "FiscalMei_responsavel_idx" ON "FiscalMei"("responsavel");
CREATE INDEX "FiscalMei_certificadoAtivo_idx" ON "FiscalMei"("certificadoAtivo");
CREATE UNIQUE INDEX "FiscalMeiAtividade_meiId_chave_competencia_key" ON "FiscalMeiAtividade"("meiId", "chave", "competencia");
CREATE INDEX "FiscalMeiAtividade_competencia_status_idx" ON "FiscalMeiAtividade"("competencia", "status");
CREATE UNIQUE INDEX "FiscalMeiFaturamento_meiId_ano_mes_key" ON "FiscalMeiFaturamento"("meiId", "ano", "mes");
CREATE INDEX "FiscalMeiFaturamento_ano_mes_idx" ON "FiscalMeiFaturamento"("ano", "mes");

ALTER TABLE "FiscalTarefa" ADD CONSTRAINT "FiscalTarefa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "FiscalEmpresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FiscalMeiAtividade" ADD CONSTRAINT "FiscalMeiAtividade_meiId_fkey" FOREIGN KEY ("meiId") REFERENCES "FiscalMei"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FiscalMeiFaturamento" ADD CONSTRAINT "FiscalMeiFaturamento_meiId_fkey" FOREIGN KEY ("meiId") REFERENCES "FiscalMei"("id") ON DELETE CASCADE ON UPDATE CASCADE;
