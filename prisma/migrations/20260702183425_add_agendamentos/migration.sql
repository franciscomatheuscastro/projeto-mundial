-- CreateEnum
CREATE TYPE "StatusDenuncia" AS ENUM ('RECEBIDA', 'EM_ANALISE', 'EM_TRATATIVA', 'CONCLUIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "GravidadeDenuncia" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateTable
CREATE TABLE "ColaboradorCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "setor" TEXT,
    "cargo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColaboradorCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Denuncia" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "localOcorrido" TEXT,
    "dataOcorrido" TIMESTAMP(3),
    "anonima" BOOLEAN NOT NULL DEFAULT true,
    "nomeDenunciante" TEXT,
    "emailDenunciante" TEXT,
    "telefoneDenunciante" TEXT,
    "status" "StatusDenuncia" NOT NULL DEFAULT 'RECEBIDA',
    "gravidade" "GravidadeDenuncia" NOT NULL DEFAULT 'MEDIA',
    "respostaPublica" TEXT,
    "tratativas" JSONB NOT NULL DEFAULT '[]',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Denuncia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Denuncia_protocolo_key" ON "Denuncia"("protocolo");

-- AddForeignKey
ALTER TABLE "ColaboradorCliente" ADD CONSTRAINT "ColaboradorCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
