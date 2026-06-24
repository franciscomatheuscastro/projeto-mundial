-- CreateEnum
CREATE TYPE "TipoPergunta" AS ENUM ('TEXTO', 'TEXTO_LONGO', 'NOTA', 'MULTIPLA_ESCOLHA', 'SIM_NAO');

-- CreateEnum
CREATE TYPE "StatusPesquisaCliente" AS ENUM ('ABERTA', 'FECHADA', 'ARQUIVADA');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "empresa" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "documento" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloPesquisa" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "modeloPadrao" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloPesquisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerguntaPesquisa" (
    "id" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoPergunta" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "opcoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerguntaPesquisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesquisaCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "token" TEXT NOT NULL,
    "status" "StatusPesquisaCliente" NOT NULL DEFAULT 'ABERTA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PesquisaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaPesquisa" (
    "id" TEXT NOT NULL,
    "pesquisaId" TEXT NOT NULL,
    "nome" TEXT,
    "email" TEXT,
    "setor" TEXT,
    "cargo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostaPesquisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaPergunta" (
    "id" TEXT NOT NULL,
    "respostaId" TEXT NOT NULL,
    "perguntaId" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostaPergunta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PesquisaCliente_token_key" ON "PesquisaCliente"("token");

-- AddForeignKey
ALTER TABLE "PerguntaPesquisa" ADD CONSTRAINT "PerguntaPesquisa_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloPesquisa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesquisaCliente" ADD CONSTRAINT "PesquisaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesquisaCliente" ADD CONSTRAINT "PesquisaCliente_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloPesquisa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaPesquisa" ADD CONSTRAINT "RespostaPesquisa_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "PesquisaCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaPergunta" ADD CONSTRAINT "RespostaPergunta_respostaId_fkey" FOREIGN KEY ("respostaId") REFERENCES "RespostaPesquisa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaPergunta" ADD CONSTRAINT "RespostaPergunta_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "PerguntaPesquisa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
