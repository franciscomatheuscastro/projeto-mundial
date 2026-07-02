-- CreateEnum
CREATE TYPE "StatusPlanoAcao" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDO', 'ARQUIVADO');

-- CreateTable
CREATE TABLE "PlanoAcao" (
    "id" TEXT NOT NULL,
    "pesquisaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "diagnostico" TEXT,
    "objetivo" TEXT,
    "conclusao" TEXT,
    "status" "StatusPlanoAcao" NOT NULL DEFAULT 'RASCUNHO',
    "acoes" JSONB NOT NULL DEFAULT '[]',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoAcao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanoAcao" ADD CONSTRAINT "PlanoAcao_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "PesquisaCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
