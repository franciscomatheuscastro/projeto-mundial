-- CreateEnum
CREATE TYPE "DestinoTratativaDenuncia" AS ENUM ('MUNDIAL', 'COLABORADOR');

-- AlterTable
ALTER TABLE "Denuncia" ADD COLUMN     "colaboradorResponsavelId" TEXT,
ADD COLUMN     "destinoTratativa" "DestinoTratativaDenuncia",
ADD COLUMN     "tratativaLiberada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tratativaLiberadaEm" TIMESTAMP(3),
ADD COLUMN     "tratativaLiberadaPorUsuarioId" TEXT;

-- CreateIndex
CREATE INDEX "Denuncia_tratativaLiberada_idx" ON "Denuncia"("tratativaLiberada");

-- CreateIndex
CREATE INDEX "Denuncia_destinoTratativa_idx" ON "Denuncia"("destinoTratativa");

-- CreateIndex
CREATE INDEX "Denuncia_colaboradorResponsavelId_idx" ON "Denuncia"("colaboradorResponsavelId");

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_colaboradorResponsavelId_fkey" FOREIGN KEY ("colaboradorResponsavelId") REFERENCES "ColaboradorCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_tratativaLiberadaPorUsuarioId_fkey" FOREIGN KEY ("tratativaLiberadaPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
