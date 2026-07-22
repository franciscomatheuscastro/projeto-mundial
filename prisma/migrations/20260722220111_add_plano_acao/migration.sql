/*
  Warnings:

  - You are about to drop the `RegraCriticidadeDenuncia` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "CategoriaDenuncia" ADD COLUMN     "gravidade" "GravidadeDenuncia" NOT NULL DEFAULT 'MEDIA';

-- DropTable
DROP TABLE "RegraCriticidadeDenuncia";

-- CreateIndex
CREATE INDEX "CategoriaDenuncia_gravidade_idx" ON "CategoriaDenuncia"("gravidade");
