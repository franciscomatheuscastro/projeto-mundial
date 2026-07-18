-- CreateEnum
CREATE TYPE "TipoPerguntaCanalDenuncia" AS ENUM ('TEXTO', 'TEXTO_LONGO', 'SIM_NAO', 'MULTIPLA_ESCOLHA');

-- CreateTable
CREATE TABLE "PerguntaCanalDenuncia" (
    "id" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoPerguntaCanalDenuncia" NOT NULL DEFAULT 'TEXTO',
    "obrigatoria" BOOLEAN NOT NULL DEFAULT false,
    "opcoes" JSONB NOT NULL DEFAULT '[]',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerguntaCanalDenuncia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerguntaCanalDenunciaCliente" (
    "id" TEXT NOT NULL,
    "perguntaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerguntaCanalDenunciaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaPerguntaCanalDenuncia" (
    "id" TEXT NOT NULL,
    "denunciaId" TEXT NOT NULL,
    "perguntaId" TEXT,
    "perguntaEnunciado" TEXT NOT NULL,
    "perguntaTipo" "TipoPerguntaCanalDenuncia" NOT NULL,
    "resposta" JSONB NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostaPerguntaCanalDenuncia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerguntaCanalDenuncia_ativo_ordem_idx" ON "PerguntaCanalDenuncia"("ativo", "ordem");

-- CreateIndex
CREATE INDEX "PerguntaCanalDenunciaCliente_clienteId_idx" ON "PerguntaCanalDenunciaCliente"("clienteId");

-- CreateIndex
CREATE INDEX "PerguntaCanalDenunciaCliente_perguntaId_idx" ON "PerguntaCanalDenunciaCliente"("perguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "PerguntaCanalDenunciaCliente_perguntaId_clienteId_key" ON "PerguntaCanalDenunciaCliente"("perguntaId", "clienteId");

-- CreateIndex
CREATE INDEX "RespostaPerguntaCanalDenuncia_denunciaId_idx" ON "RespostaPerguntaCanalDenuncia"("denunciaId");

-- CreateIndex
CREATE INDEX "RespostaPerguntaCanalDenuncia_perguntaId_idx" ON "RespostaPerguntaCanalDenuncia"("perguntaId");

-- AddForeignKey
ALTER TABLE "PerguntaCanalDenunciaCliente" ADD CONSTRAINT "PerguntaCanalDenunciaCliente_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "PerguntaCanalDenuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerguntaCanalDenunciaCliente" ADD CONSTRAINT "PerguntaCanalDenunciaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaPerguntaCanalDenuncia" ADD CONSTRAINT "RespostaPerguntaCanalDenuncia_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaPerguntaCanalDenuncia" ADD CONSTRAINT "RespostaPerguntaCanalDenuncia_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "PerguntaCanalDenuncia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
