-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'OPERADOR', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "StatusEmpresa" AS ENUM ('ATIVA', 'INATIVA');

-- CreateEnum
CREATE TYPE "OrigemAlteracao" AS ENUM ('MANUAL', 'AUTOMATICA');

-- AlterTable
ALTER TABLE "AlteracaoEmpresa" ADD COLUMN     "origem" "OrigemAlteracao" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "CertificadoDigital" ADD COLUMN     "removidoEm" TIMESTAMP(3),
ALTER COLUMN "titularNome" DROP NOT NULL,
ALTER COLUMN "titularDocumento" DROP NOT NULL,
ALTER COLUMN "tipo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ContatoEmpresa" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "inativadoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DocumentoEmpresa" ADD COLUMN     "removidoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "inativadaPorId" TEXT,
ADD COLUMN     "status" "StatusEmpresa" NOT NULL DEFAULT 'ATIVA';

-- Migra a classificação antiga sem apagar ou alterar outros dados da empresa.
UPDATE "Empresa" SET "status" = 'INATIVA' WHERE "tipoCliente" = 'INATIVO';

-- AlterTable
ALTER TABLE "EmpresaSocio" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SocioVinculo" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'VISUALIZADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deveTrocarSenha" BOOLEAN NOT NULL DEFAULT true,
    "tentativasFalhas" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoAte" TIMESTAMP(3),
    "ultimoAcessoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "alteracoes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_ativo_papel_idx" ON "Usuario"("ativo", "papel");

-- CreateIndex
CREATE INDEX "Auditoria_entidade_entidadeId_createdAt_idx" ON "Auditoria"("entidade", "entidadeId", "createdAt");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_createdAt_idx" ON "Auditoria"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "AlteracaoEmpresa_usuarioId_createdAt_idx" ON "AlteracaoEmpresa"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "CertificadoDigital_dataVencimento_removidoEm_idx" ON "CertificadoDigital"("dataVencimento", "removidoEm");

-- CreateIndex
CREATE INDEX "ContatoEmpresa_empresaId_ativo_idx" ON "ContatoEmpresa"("empresaId", "ativo");

-- CreateIndex
CREATE INDEX "DocumentoEmpresa_empresaId_removidoEm_idx" ON "DocumentoEmpresa"("empresaId", "removidoEm");

-- CreateIndex
CREATE INDEX "Empresa_status_dataEntrada_idx" ON "Empresa"("status", "dataEntrada");

-- CreateIndex
CREATE INDEX "Empresa_inativadaPorId_idx" ON "Empresa"("inativadaPorId");

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_inativadaPorId_fkey" FOREIGN KEY ("inativadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlteracaoEmpresa" ADD CONSTRAINT "AlteracaoEmpresa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
