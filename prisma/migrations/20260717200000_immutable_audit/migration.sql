-- A trilha técnica é somente de acréscimo: alterações, exclusões e truncamento são bloqueados no banco.
CREATE OR REPLACE FUNCTION "prevent_auditoria_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'A tabela Auditoria é imutável';
END;
$$;

CREATE TRIGGER "Auditoria_prevent_update_delete"
BEFORE UPDATE OR DELETE ON "Auditoria"
FOR EACH ROW EXECUTE FUNCTION "prevent_auditoria_mutation"();

CREATE TRIGGER "Auditoria_prevent_truncate"
BEFORE TRUNCATE ON "Auditoria"
FOR EACH STATEMENT EXECUTE FUNCTION "prevent_auditoria_mutation"();
