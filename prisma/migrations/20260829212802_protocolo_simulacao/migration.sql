/*
  Warnings:

  - You are about to drop the column `coletarSetor` on the `PesquisaCliente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PesquisaCliente" DROP COLUMN "coletarSetor",
ADD COLUMN     "setor" TEXT;
