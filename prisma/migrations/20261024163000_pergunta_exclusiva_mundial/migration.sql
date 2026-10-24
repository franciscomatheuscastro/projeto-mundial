/*
  Perguntas exclusivas da Mundial no Canal de Denúncias.

  - PerguntaCanalDenuncia.exclusivaMundial:
    configuração da pergunta.

  - RespostaPerguntaCanalDenuncia.exclusivaMundial:
    snapshot de privacidade da resposta.
*/

BEGIN;

ALTER TABLE "PerguntaCanalDenuncia"
ADD COLUMN IF NOT EXISTS "exclusivaMundial"
BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "RespostaPerguntaCanalDenuncia"
ADD COLUMN IF NOT EXISTS "exclusivaMundial"
BOOLEAN NOT NULL DEFAULT false;


/*
 * Para respostas já existentes, copia a configuração
 * atual da pergunta quando houver vínculo.
 */
UPDATE "RespostaPerguntaCanalDenuncia" AS r
SET "exclusivaMundial" = p."exclusivaMundial"
FROM "PerguntaCanalDenuncia" AS p
WHERE r."perguntaId" = p."id";


CREATE INDEX IF NOT EXISTS "PerguntaCanalDenuncia_exclusivaMundial_idx"
ON "PerguntaCanalDenuncia"("exclusivaMundial");

CREATE INDEX IF NOT EXISTS "RespostaPerguntaCanalDenuncia_exclusivaMundial_idx"
ON "RespostaPerguntaCanalDenuncia"("exclusivaMundial");

COMMIT;
