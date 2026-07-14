-- CreateEnum
CREATE TYPE "TipoOrigemPlanoAcao" AS ENUM ('PESQUISA_CLIMA', 'DENUNCIA');

-- AlterTable
ALTER TABLE "PlanoAcao" ADD COLUMN     "denunciaId" TEXT,
ADD COLUMN     "tipoOrigem" "TipoOrigemPlanoAcao" NOT NULL DEFAULT 'PESQUISA_CLIMA';

-- CreateIndex
CREATE INDEX "PlanoAcao_tipoOrigem_idx" ON "PlanoAcao"("tipoOrigem");

-- CreateIndex
CREATE INDEX "PlanoAcao_pesquisaId_idx" ON "PlanoAcao"("pesquisaId");

-- CreateIndex
CREATE INDEX "PlanoAcao_denunciaId_idx" ON "PlanoAcao"("denunciaId");

-- AddForeignKey
ALTER TABLE "PlanoAcao" ADD CONSTRAINT "PlanoAcao_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
