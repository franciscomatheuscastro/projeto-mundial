-- AlterTable
ALTER TABLE "ColaboradorCliente" ADD COLUMN     "unidade" TEXT;

-- AlterTable
ALTER TABLE "ConvitePesquisa" ADD COLUMN     "unidade" TEXT;

-- AlterTable
ALTER TABLE "ModeloPesquisa" ADD COLUMN     "configuracaoAnalise" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "dimensoes" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "PesquisaCliente" ADD COLUMN     "configuracaoAnalise" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "dimensoes" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "RespostaPesquisa" ADD COLUMN     "unidade" TEXT;
