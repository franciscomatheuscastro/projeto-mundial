-- CreateTable
CREATE TABLE "AnexoDenuncia" (
    "id" TEXT NOT NULL,
    "denunciaId" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnexoDenuncia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnexoDenuncia_chave_key" ON "AnexoDenuncia"("chave");

-- CreateIndex
CREATE INDEX "AnexoDenuncia_denunciaId_idx" ON "AnexoDenuncia"("denunciaId");

-- AddForeignKey
ALTER TABLE "AnexoDenuncia" ADD CONSTRAINT "AnexoDenuncia_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
