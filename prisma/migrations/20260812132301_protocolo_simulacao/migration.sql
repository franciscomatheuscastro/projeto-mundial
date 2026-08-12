-- AlterTable
ALTER TABLE "PerguntaCanalDenuncia" ADD COLUMN     "abrirComplementoSim" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RespostaPerguntaCanalDenuncia" ADD COLUMN     "complemento" TEXT;
