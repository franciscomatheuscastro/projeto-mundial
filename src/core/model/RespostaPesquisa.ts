import { StatusPesquisaCliente, TipoPergunta } from "@prisma/client";

export type PerguntaRespostaPesquisa = {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo: TipoPergunta;
  ordem: number;
  obrigatoria: boolean;
  opcoes: string[];
};

export type PesquisaPublica = {
  id: string;
  titulo: string;
  descricao: string | null;
  token: string;
  status: StatusPesquisaCliente;
  perguntas: PerguntaRespostaPesquisa[];
  cliente: {
    id: string;
    nome: string;
    empresa?: string | null;
  };
  modelo: {
    id: string;
    titulo: string;
    descricao?: string | null;
  };
};

export type RespostaPesquisaItem = {
  id: string;
  perguntaId: string;
  valor: string;
};

export type NovaRespostaPesquisa = {
  pesquisaId: string;
  token: string;
  nome?: string | null;
  email?: string | null;
  setor?: string | null;
  cargo?: string | null;
  respostas: RespostaPesquisaItem[];
};