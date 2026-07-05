-- CreateTable
CREATE TABLE "RegraCriticidadeDenuncia" (
    "id" TEXT NOT NULL,
    "termo" TEXT NOT NULL,
    "categoria" TEXT,
    "gravidade" "GravidadeDenuncia" NOT NULL DEFAULT 'ALTA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegraCriticidadeDenuncia_pkey" PRIMARY KEY ("id")
);
