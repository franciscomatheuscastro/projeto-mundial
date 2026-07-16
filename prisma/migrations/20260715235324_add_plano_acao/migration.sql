/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId]` on the table `ColaboradorCliente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PerfilUsuario" ADD VALUE 'COMITE_CLIENTE';

-- AlterTable
ALTER TABLE "ColaboradorCliente" ADD COLUMN     "podeTratarDenuncias" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "podeVerDenuncias" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "usuarioId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ColaboradorCliente_usuarioId_key" ON "ColaboradorCliente"("usuarioId");

-- CreateIndex
CREATE INDEX "ColaboradorCliente_clienteId_idx" ON "ColaboradorCliente"("clienteId");

-- CreateIndex
CREATE INDEX "ColaboradorCliente_ativo_idx" ON "ColaboradorCliente"("ativo");

-- CreateIndex
CREATE INDEX "Usuario_clienteId_idx" ON "Usuario"("clienteId");

-- CreateIndex
CREATE INDEX "Usuario_perfil_idx" ON "Usuario"("perfil");

-- AddForeignKey
ALTER TABLE "ColaboradorCliente" ADD CONSTRAINT "ColaboradorCliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
