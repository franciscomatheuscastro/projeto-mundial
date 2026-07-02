-- AlterEnum
ALTER TYPE "PerfilUsuario" ADD VALUE 'CLIENTE';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "clienteId" TEXT;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
