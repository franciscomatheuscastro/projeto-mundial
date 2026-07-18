export type CategoriaDenuncia = {
  id?: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  ordem: number;

  criadoEm?: Date | string;
  atualizadoEm?: Date | string;

  quantidadeDenuncias?: number;
};