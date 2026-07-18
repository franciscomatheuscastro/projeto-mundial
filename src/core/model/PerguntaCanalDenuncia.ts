import { TipoPerguntaCanalDenuncia } from "@prisma/client";

export type PerguntaCanalDenuncia = {
  id?: string;
  enunciado: string;
  descricao?: string | null;
  tipo: TipoPerguntaCanalDenuncia;
  obrigatoria: boolean;
  opcoes: string[];
  ativo: boolean;
  ordem: number;
  clienteIds: string[];
  clientes?: Array<{
    id: string;
    nome: string;
    empresa?: string | null;
  }>;
  criadoEm?: Date | string;
  atualizadoEm?: Date | string;
};

export type PerguntaCanalPublica = {
  id: string;
  enunciado: string;
  descricao?: string | null;
  tipo: TipoPerguntaCanalDenuncia;
  obrigatoria: boolean;
  opcoes: string[];
  ordem: number;
};

export type RespostaPerguntaCanalInput = {
  perguntaId: string;
  resposta: string | boolean | null;
};
