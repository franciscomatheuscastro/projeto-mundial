import type {
  GravidadeDenuncia,
} from "@prisma/client";

export type CategoriaDenuncia = {
  id?: string;

  nome: string;
  descricao?: string | null;

  gravidade: GravidadeDenuncia;

  ativo: boolean;
  ordem: number;

  criadoEm?: Date | string;
  atualizadoEm?: Date | string;

  quantidadeDenuncias?: number;
};