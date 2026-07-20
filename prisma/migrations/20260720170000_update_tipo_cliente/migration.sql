-- Substitui a classificação comercial antiga sem apagar empresas existentes.
BEGIN;

CREATE TYPE "TipoCliente_new" AS ENUM ('FIXO', 'AVULSO', 'IRPF');

ALTER TABLE "Empresa" ALTER COLUMN "tipoCliente" DROP DEFAULT;
ALTER TABLE "Empresa"
  ALTER COLUMN "tipoCliente" TYPE "TipoCliente_new"
  USING (
    CASE "tipoCliente"::text
      WHEN 'PRINCIPAL' THEN 'FIXO'
      WHEN 'SECUNDARIO' THEN 'AVULSO'
      WHEN 'PROSPECT' THEN 'IRPF'
      WHEN 'INATIVO' THEN 'FIXO'
      ELSE 'FIXO'
    END
  )::"TipoCliente_new";

ALTER TYPE "TipoCliente" RENAME TO "TipoCliente_old";
ALTER TYPE "TipoCliente_new" RENAME TO "TipoCliente";
DROP TYPE "TipoCliente_old";

ALTER TABLE "Empresa" ALTER COLUMN "tipoCliente" SET DEFAULT 'FIXO';

COMMIT;
