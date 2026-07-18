/*
  Warnings:

  - You are about to drop the column `categoria` on the `Denuncia` table. All the data in the column will be lost.
  - You are about to drop the column `tratativas` on the `Denuncia` table. All the data in the column will be lost.
  - Added the required column `tipo` to the `AnexoDenuncia` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoAnexoDenuncia" AS ENUM ('DOCUMENTO', 'IMAGEM', 'AUDIO', 'VIDEO', 'OUTRO');

-- CreateEnum
CREATE TYPE "VisibilidadeAnexoDenuncia" AS ENUM ('SOMENTE_MUNDIAL', 'MUNDIAL_E_COMITE');

-- CreateEnum
CREATE TYPE "TipoEventoDenuncia" AS ENUM ('DENUNCIA_REGISTRADA', 'STATUS_ALTERADO', 'GRAVIDADE_ALTERADA', 'TRATATIVA_CRIADA', 'TRATATIVA_EDITADA', 'RESPONSAVEL_ATRIBUIDO', 'RESPOSTA_PUBLICA_ALTERADA', 'ANEXO_ADICIONADO');

-- CreateEnum
CREATE TYPE "OrigemAtorDenuncia" AS ENUM ('PUBLICO', 'MUNDIAL', 'CLIENTE', 'COMITE_CLIENTE', 'SISTEMA');

-- AlterTable
ALTER TABLE "AnexoDenuncia" ADD COLUMN     "tipo" "TipoAnexoDenuncia" NOT NULL,
ADD COLUMN     "visibilidade" "VisibilidadeAnexoDenuncia" NOT NULL DEFAULT 'MUNDIAL_E_COMITE';

-- AlterTable
ALTER TABLE "Denuncia" DROP COLUMN "categoria",
DROP COLUMN "tratativas",
ADD COLUMN     "aceiteTermosEm" TIMESTAMP(3),
ADD COLUMN     "categoriaId" TEXT,
ADD COLUMN     "ipAceiteHash" TEXT,
ADD COLUMN     "userAgentAceite" TEXT,
ADD COLUMN     "versaoTermosAceitos" TEXT;

-- CreateTable
CREATE TABLE "TratativaDenuncia" (
    "id" TEXT NOT NULL,
    "denunciaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "responsavelId" TEXT,
    "criadoPorUsuarioId" TEXT,
    "atualizadoPorUsuarioId" TEXT,
    "criadoPorNome" TEXT NOT NULL,
    "criadoPorPerfil" "PerfilUsuario",
    "atualizadoPorNome" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TratativaDenuncia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoDenuncia" (
    "id" TEXT NOT NULL,
    "denunciaId" TEXT NOT NULL,
    "tipo" "TipoEventoDenuncia" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "statusAnterior" "StatusDenuncia",
    "statusNovo" "StatusDenuncia",
    "origemAtor" "OrigemAtorDenuncia" NOT NULL,
    "atorNome" TEXT,
    "atorId" TEXT,
    "visivelPublicamente" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoDenuncia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaDenuncia" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaDenuncia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TratativaDenuncia_denunciaId_idx" ON "TratativaDenuncia"("denunciaId");

-- CreateIndex
CREATE INDEX "TratativaDenuncia_responsavelId_idx" ON "TratativaDenuncia"("responsavelId");

-- CreateIndex
CREATE INDEX "TratativaDenuncia_criadoPorUsuarioId_idx" ON "TratativaDenuncia"("criadoPorUsuarioId");

-- CreateIndex
CREATE INDEX "TratativaDenuncia_atualizadoPorUsuarioId_idx" ON "TratativaDenuncia"("atualizadoPorUsuarioId");

-- CreateIndex
CREATE INDEX "HistoricoDenuncia_denunciaId_criadoEm_idx" ON "HistoricoDenuncia"("denunciaId", "criadoEm");

-- CreateIndex
CREATE INDEX "HistoricoDenuncia_visivelPublicamente_idx" ON "HistoricoDenuncia"("visivelPublicamente");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaDenuncia_nome_key" ON "CategoriaDenuncia"("nome");

-- CreateIndex
CREATE INDEX "CategoriaDenuncia_ativo_ordem_idx" ON "CategoriaDenuncia"("ativo", "ordem");

-- CreateIndex
CREATE INDEX "AnexoDenuncia_tipo_idx" ON "AnexoDenuncia"("tipo");

-- CreateIndex
CREATE INDEX "AnexoDenuncia_visibilidade_idx" ON "AnexoDenuncia"("visibilidade");

-- CreateIndex
CREATE INDEX "Denuncia_clienteId_idx" ON "Denuncia"("clienteId");

-- CreateIndex
CREATE INDEX "Denuncia_categoriaId_idx" ON "Denuncia"("categoriaId");

-- CreateIndex
CREATE INDEX "Denuncia_status_idx" ON "Denuncia"("status");

-- CreateIndex
CREATE INDEX "Denuncia_gravidade_idx" ON "Denuncia"("gravidade");

-- CreateIndex
CREATE INDEX "Denuncia_criadoEm_idx" ON "Denuncia"("criadoEm");

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaDenuncia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TratativaDenuncia" ADD CONSTRAINT "TratativaDenuncia_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "ColaboradorCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TratativaDenuncia" ADD CONSTRAINT "TratativaDenuncia_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TratativaDenuncia" ADD CONSTRAINT "TratativaDenuncia_atualizadoPorUsuarioId_fkey" FOREIGN KEY ("atualizadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TratativaDenuncia" ADD CONSTRAINT "TratativaDenuncia_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoDenuncia" ADD CONSTRAINT "HistoricoDenuncia_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
