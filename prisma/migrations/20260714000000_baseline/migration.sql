-- Baseline do schema existente antes da reestruturação do cadastro.
CREATE TYPE "SituacaoAlvara" AS ENUM ('PRONTO', 'EM_ANDAMENTO', 'PENDENTE', 'NAO_APLICAVEL');
CREATE TYPE "TipoCliente" AS ENUM ('PRINCIPAL', 'SECUNDARIO', 'PROSPECT', 'INATIVO');
CREATE TYPE "RegimeTributario" AS ENUM ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI', 'ISENTO');
CREATE TYPE "Ranking" AS ENUM ('C', 'B', 'A', 'S', 'SS');
CREATE TYPE "TipoVinculo" AS ENUM ('SOCIO_EM_OUTRA_EMPRESA', 'VINCULO_DE_INTERESSE');

CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "endereco" TEXT NOT NULL,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "cep" TEXT,
    "pontoReferencia" TEXT,
    "email" TEXT,
    "telefone1" TEXT,
    "telefone2" TEXT,
    "capitalSocial" DECIMAL(15,2),
    "cnaePrincipal" TEXT NOT NULL,
    "cnaesSecundarios" TEXT[] NOT NULL,
    "ramoAtividade" TEXT NOT NULL,
    "servicoProduto" TEXT NOT NULL,
    "quantidadeFuncionarios" INTEGER NOT NULL DEFAULT 0,
    "tempoEmpresa" TEXT,
    "historicoAlteracoes" TEXT[] NOT NULL,
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "responsavelAnterior" TEXT,
    "situacaoAlvaras" "SituacaoAlvara" NOT NULL DEFAULT 'PENDENTE',
    "participaLicitacoes" BOOLEAN NOT NULL DEFAULT false,
    "tipoCliente" "TipoCliente" NOT NULL DEFAULT 'PRINCIPAL',
    "regimeTributario" "RegimeTributario" NOT NULL,
    "dataBaixa" TIMESTAMP(3),
    "irpfSociosNaContabilidade" BOOLEAN NOT NULL DEFAULT false,
    "dataAtualizacaoBancaria" TIMESTAMP(3),
    "pendenciasFiscais" BOOLEAN NOT NULL DEFAULT false,
    "ranking" "Ranking" NOT NULL DEFAULT 'C',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Socio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmpresaSocio" (
    "empresaId" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "participacao" DECIMAL(5,2),
    "cargo" TEXT,
    CONSTRAINT "EmpresaSocio_pkey" PRIMARY KEY ("empresaId", "socioId")
);

CREATE TABLE "SocioVinculo" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "tipo" "TipoVinculo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "empresaDestinoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocioVinculo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");
CREATE INDEX "Empresa_razaoSocial_idx" ON "Empresa"("razaoSocial");
CREATE INDEX "Empresa_nomeFantasia_idx" ON "Empresa"("nomeFantasia");
CREATE UNIQUE INDEX "Socio_cpf_key" ON "Socio"("cpf");
CREATE INDEX "SocioVinculo_socioId_idx" ON "SocioVinculo"("socioId");
CREATE INDEX "SocioVinculo_empresaDestinoId_idx" ON "SocioVinculo"("empresaDestinoId");

ALTER TABLE "EmpresaSocio" ADD CONSTRAINT "EmpresaSocio_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmpresaSocio" ADD CONSTRAINT "EmpresaSocio_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocioVinculo" ADD CONSTRAINT "SocioVinculo_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocioVinculo" ADD CONSTRAINT "SocioVinculo_empresaDestinoId_fkey" FOREIGN KEY ("empresaDestinoId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

