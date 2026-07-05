import { GravidadeDenuncia } from "@prisma/client";

export type RegraCriticidadeDenuncia = {
  id?: string;
  termo: string;
  categoria?: string | null;
  gravidade: GravidadeDenuncia;
  ativo?: boolean;
  criadoEm?: Date | string;
  atualizadoEm?: Date | string;
};