ALTER TABLE "Denuncia"
ADD COLUMN IF NOT EXISTS "prazoTratativaEm" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "alertaPrazoTratativaEnviadoEm" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS
"Denuncia_prazoTratativaEm_alertaPrazoTratativaEnviadoEm_idx"
ON "Denuncia"(
  "prazoTratativaEm",
  "alertaPrazoTratativaEnviadoEm"
);