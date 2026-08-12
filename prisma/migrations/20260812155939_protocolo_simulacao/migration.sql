-- CreateEnum
CREATE TYPE "TipoModuloPesquisa" AS ENUM ('CLIMA', 'DIAGNOSTICO_ORGANIZACIONAL', 'AVALIACAO_PSICOSSOCIAL');

-- AlterTable
ALTER TABLE "ModeloPesquisa" ADD COLUMN     "tipo" "TipoModuloPesquisa" NOT NULL DEFAULT 'CLIMA';

-- AlterTable
ALTER TABLE "PesquisaCliente" ADD COLUMN     "tipo" "TipoModuloPesquisa" NOT NULL DEFAULT 'CLIMA';

-- CreateIndex
CREATE INDEX "ModeloPesquisa_tipo_idx" ON "ModeloPesquisa"("tipo");

-- CreateIndex
CREATE INDEX "ModeloPesquisa_ativo_idx" ON "ModeloPesquisa"("ativo");

-- CreateIndex
CREATE INDEX "PesquisaCliente_tipo_idx" ON "PesquisaCliente"("tipo");

-- CreateIndex
CREATE INDEX "PesquisaCliente_clienteId_tipo_idx" ON "PesquisaCliente"("clienteId", "tipo");

-- CreateIndex
CREATE INDEX "PesquisaCliente_status_idx" ON "PesquisaCliente"("status");

-- CreateIndex
CREATE INDEX "PesquisaCliente_criadoEm_idx" ON "PesquisaCliente"("criadoEm");
