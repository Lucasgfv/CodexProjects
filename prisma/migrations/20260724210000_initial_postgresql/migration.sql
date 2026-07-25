-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "tipoCliente" TEXT,
    "regimeTributario" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" VARCHAR(2),
    "capitalSocial" DECIMAL(12,2),
    "honorarioMensal" DECIMAL(12,2),
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataBaixa" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Socio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "nacionalidade" TEXT,
    "estadoCivil" TEXT,
    "profissao" TEXT,
    "rg" TEXT,
    "orgaoEmissor" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" VARCHAR(2),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpresaSocio" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "cargo" TEXT,
    "percentualParticipacao" DECIMAL(5,2) NOT NULL,
    "recebeProlabore" BOOLEAN NOT NULL DEFAULT false,
    "valorProlabore" DECIMAL(10,2),
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "dataSaida" TIMESTAMP(3),

    CONSTRAINT "EmpresaSocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlteracaoContratual" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "numeroAlteracao" INTEGER,
    "dataAlteracao" TIMESTAMP(3) NOT NULL,
    "descricaoResumida" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlteracaoContratual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Socio_cpf_key" ON "Socio"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "EmpresaSocio_empresaId_socioId_key" ON "EmpresaSocio"("empresaId", "socioId");

-- CreateIndex
CREATE INDEX "EmpresaSocio_empresaId_idx" ON "EmpresaSocio"("empresaId");

-- CreateIndex
CREATE INDEX "EmpresaSocio_socioId_idx" ON "EmpresaSocio"("socioId");

-- CreateIndex
CREATE INDEX "AlteracaoContratual_empresaId_idx" ON "AlteracaoContratual"("empresaId");

-- CreateIndex
CREATE INDEX "Lancamento_empresaId_competencia_idx" ON "Lancamento"("empresaId", "competencia");

-- AddForeignKey
ALTER TABLE "EmpresaSocio" ADD CONSTRAINT "EmpresaSocio_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpresaSocio" ADD CONSTRAINT "EmpresaSocio_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlteracaoContratual" ADD CONSTRAINT "AlteracaoContratual_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
