/*
  Warnings:

  - You are about to drop the column `conviteId` on the `RespostaPesquisa` table. All the data in the column will be lost.
  - You are about to drop the `ConvitePesquisa` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConvitePesquisa" DROP CONSTRAINT "ConvitePesquisa_pesquisaId_fkey";

-- DropForeignKey
ALTER TABLE "RespostaPesquisa" DROP CONSTRAINT "RespostaPesquisa_conviteId_fkey";

-- DropIndex
DROP INDEX "RespostaPesquisa_conviteId_key";

-- AlterTable
ALTER TABLE "RespostaPesquisa" DROP COLUMN "conviteId";

-- DropTable
DROP TABLE "ConvitePesquisa";
