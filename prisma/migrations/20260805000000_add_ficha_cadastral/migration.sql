ALTER TABLE "Empresa"
  ADD COLUMN "numeroEndereco" TEXT,
  ADD COLUMN "bairro" TEXT,
  ADD COLUMN "inscricaoEstadual" TEXT,
  ADD COLUMN "inscricaoMunicipal" TEXT,
  ADD COLUMN "cnaePrincipal" TEXT,
  ADD COLUMN "cnaesSecundarios" TEXT,
  ADD COLUMN "ramoAtividade" TEXT,
  ADD COLUMN "servicoProduto" TEXT,
  ADD COLUMN "quantidadeFuncionarios" INTEGER,
  ADD COLUMN "situacaoAlvaras" TEXT,
  ADD COLUMN "participaLicitacoes" BOOLEAN,
  ADD COLUMN "contadorAnterior" TEXT,
  ADD COLUMN "dataAtualizacaoBancaria" TIMESTAMP(3),
  ADD COLUMN "pendenciasFiscais" BOOLEAN,
  ADD COLUMN "ranking" TEXT;

CREATE TABLE "ReferenciaComercial" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "cidade" TEXT NOT NULL,
  "uf" VARCHAR(2) NOT NULL,
  CONSTRAINT "ReferenciaComercial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferenciaComercial_empresaId_idx" ON "ReferenciaComercial"("empresaId");
ALTER TABLE "ReferenciaComercial" ADD CONSTRAINT "ReferenciaComercial_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
