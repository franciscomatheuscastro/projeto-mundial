-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('AGENDADO', 'REALIZADO', 'CANCELADO', 'REAGENDADO');

-- CreateEnum
CREATE TYPE "TipoAgendamento" AS ENUM ('APRESENTACAO_PLANO', 'REUNIAO_ALINHAMENTO', 'DEVOLUTIVA', 'OUTRO');

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "planoAcaoId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 60,
    "local" TEXT,
    "linkReuniao" TEXT,
    "tipo" "TipoAgendamento" NOT NULL DEFAULT 'APRESENTACAO_PLANO',
    "status" "StatusAgendamento" NOT NULL DEFAULT 'AGENDADO',
    "participantes" JSONB NOT NULL DEFAULT '[]',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_planoAcaoId_fkey" FOREIGN KEY ("planoAcaoId") REFERENCES "PlanoAcao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
