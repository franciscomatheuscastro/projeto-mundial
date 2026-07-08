/*
  Warnings:

  - A unique constraint covering the columns `[conviteId]` on the table `RespostaPesquisa` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RespostaPesquisa" ADD COLUMN     "conviteId" TEXT;

-- CreateTable
CREATE TABLE "ConvitePesquisa" (
    "id" TEXT NOT NULL,
    "pesquisaId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "nome" TEXT,
    "email" TEXT,
    "setor" TEXT,
    "cargo" TEXT,
    "respondido" BOOLEAN NOT NULL DEFAULT false,
    "respondidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConvitePesquisa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConvitePesquisa_token_key" ON "ConvitePesquisa"("token");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaPesquisa_conviteId_key" ON "RespostaPesquisa"("conviteId");

-- AddForeignKey
ALTER TABLE "RespostaPesquisa" ADD CONSTRAINT "RespostaPesquisa_conviteId_fkey" FOREIGN KEY ("conviteId") REFERENCES "ConvitePesquisa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConvitePesquisa" ADD CONSTRAINT "ConvitePesquisa_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "PesquisaCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
