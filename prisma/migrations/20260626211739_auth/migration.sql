/*
  Warnings:

  - You are about to drop the `PerguntaPesquisa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RespostaPergunta` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `respostas` to the `RespostaPesquisa` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PerguntaPesquisa" DROP CONSTRAINT "PerguntaPesquisa_modeloId_fkey";

-- DropForeignKey
ALTER TABLE "RespostaPergunta" DROP CONSTRAINT "RespostaPergunta_perguntaId_fkey";

-- DropForeignKey
ALTER TABLE "RespostaPergunta" DROP CONSTRAINT "RespostaPergunta_respostaId_fkey";

-- AlterTable
ALTER TABLE "ModeloPesquisa" ADD COLUMN     "perguntas" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "PesquisaCliente" ADD COLUMN     "perguntas" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "RespostaPesquisa" ADD COLUMN     "respostas" JSONB NOT NULL;

-- DropTable
DROP TABLE "PerguntaPesquisa";

-- DropTable
DROP TABLE "RespostaPergunta";
