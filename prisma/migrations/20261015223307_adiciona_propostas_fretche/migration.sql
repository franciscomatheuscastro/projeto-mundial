/*
  Corrige a migração de transição do antigo perfil
  COMITE_ETICA_MUNDIAL para a nova lógica:

  - membros do Comitê passam a ser ADMIN;
  - Usuario.membroComiteEtica identifica esses usuários;
  - o valor COMITE_ETICA_MUNDIAL é removido do enum PerfilUsuario.

  Esta migração preserva usuários e históricos existentes.
*/

BEGIN;

-- 1. Cria o novo marcador no Usuario.
ALTER TABLE "Usuario"
ADD COLUMN IF NOT EXISTS "membroComiteEtica" BOOLEAN NOT NULL DEFAULT false;

-- 2. Preserva quem já estava usando o perfil antigo.
UPDATE "Usuario"
SET
  "membroComiteEtica" = true,
  "perfil" = 'ADMIN'
WHERE "perfil" = 'COMITE_ETICA_MUNDIAL';

-- 3. Preserva o histórico de tratativas eventualmente criado
--    com o perfil antigo.
UPDATE "TratativaDenuncia"
SET "criadoPorPerfil" = 'ADMIN'
WHERE "criadoPorPerfil" = 'COMITE_ETICA_MUNDIAL';

-- 4. Recria o enum sem COMITE_ETICA_MUNDIAL.
CREATE TYPE "PerfilUsuario_new" AS ENUM (
  'ADMIN',
  'GESTOR',
  'PSICOLOGO',
  'ASSISTENTE_SOCIAL',
  'RECEPCAO',
  'CLIENTE',
  'COMITE_CLIENTE'
);

ALTER TABLE "Usuario"
ALTER COLUMN "perfil" DROP DEFAULT;

ALTER TABLE "Usuario"
ALTER COLUMN "perfil"
TYPE "PerfilUsuario_new"
USING ("perfil"::text::"PerfilUsuario_new");

ALTER TABLE "TratativaDenuncia"
ALTER COLUMN "criadoPorPerfil"
TYPE "PerfilUsuario_new"
USING ("criadoPorPerfil"::text::"PerfilUsuario_new");

ALTER TYPE "PerfilUsuario"
RENAME TO "PerfilUsuario_old";

ALTER TYPE "PerfilUsuario_new"
RENAME TO "PerfilUsuario";

DROP TYPE "PerfilUsuario_old";

ALTER TABLE "Usuario"
ALTER COLUMN "perfil"
SET DEFAULT 'RECEPCAO';

-- 5. Índice correspondente ao schema atual.
CREATE INDEX IF NOT EXISTS "Usuario_membroComiteEtica_idx"
ON "Usuario"("membroComiteEtica");

COMMIT;
