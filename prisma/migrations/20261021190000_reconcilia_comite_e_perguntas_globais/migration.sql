/*
  Migration de reconciliação segura para o banco atual.

  Objetivos:
  1. Registrar no histórico reproduzível a coluna membroComiteEtica,
     que já existe no Railway.
  2. Adicionar o suporte a perguntas globais com todosCanais.
  3. Preservar perguntas antigas que já estavam vinculadas a todos
     os clientes existentes.

  Os IF NOT EXISTS tornam a migration segura para o banco atual,
  onde membroComiteEtica e seu índice já existem.
*/

BEGIN;

ALTER TABLE "Usuario"
ADD COLUMN IF NOT EXISTS "membroComiteEtica"
BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Usuario_membroComiteEtica_idx"
ON "Usuario"("membroComiteEtica");

ALTER TABLE "PerguntaCanalDenuncia"
ADD COLUMN IF NOT EXISTS "todosCanais"
BOOLEAN NOT NULL DEFAULT false;

UPDATE "PerguntaCanalDenuncia" AS p
SET "todosCanais" = true
WHERE EXISTS (
  SELECT 1
  FROM "Cliente"
)
AND NOT EXISTS (
  SELECT 1
  FROM "Cliente" AS c
  WHERE NOT EXISTS (
    SELECT 1
    FROM "PerguntaCanalDenunciaCliente" AS pc
    WHERE pc."perguntaId" = p."id"
      AND pc."clienteId" = c."id"
  )
);

CREATE INDEX IF NOT EXISTS "PerguntaCanalDenuncia_todosCanais_idx"
ON "PerguntaCanalDenuncia"("todosCanais");

COMMIT;
