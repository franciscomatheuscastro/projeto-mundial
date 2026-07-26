-- CreateTable
CREATE TABLE "DenunciaVisualizador" (
    "denunciaId" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DenunciaVisualizador_pkey" PRIMARY KEY ("denunciaId","colaboradorId")
);

-- CreateIndex
CREATE INDEX "DenunciaVisualizador_denunciaId_idx" ON "DenunciaVisualizador"("denunciaId");

-- CreateIndex
CREATE INDEX "DenunciaVisualizador_colaboradorId_idx" ON "DenunciaVisualizador"("colaboradorId");

-- AddForeignKey
ALTER TABLE "DenunciaVisualizador" ADD CONSTRAINT "DenunciaVisualizador_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DenunciaVisualizador" ADD CONSTRAINT "DenunciaVisualizador_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "ColaboradorCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
