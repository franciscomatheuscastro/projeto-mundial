import {
  StatusPesquisaCliente,
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";

import type {
  SentidoPontuacao,
} from "@/src/core/model/ModeloPesquisa";


export type PerguntaRespostaPesquisa = {
  id: string;

  titulo: string;

  descricao?: string | null;

  tipo: TipoPergunta;

  ordem: number;

  obrigatoria: boolean;

  opcoes: string[];


  /*
   * Estrutura analítica utilizada
   * pelo motor de relatórios.
   */
  dimensaoId?: string | null;

  sentidoPontuacao?: SentidoPontuacao;
};


export type PesquisaPublica = {
  id: string;

  tipo: TipoModuloPesquisa;

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


  convite?: {
    id: string;

    token: string;

    respondido: boolean;

    nome?: string | null;

    email?: string | null;

    unidade?: string | null;

    setor?: string | null;

    cargo?: string | null;
  } | null;
};


export type RespostaPesquisaItem = {
  id: string;

  perguntaId: string;

  valor: string;
};


export type NovaRespostaPesquisa = {
  pesquisaId: string;

  token: string;

  conviteToken?: string | null;

  nome?: string | null;

  email?: string | null;

  unidade?: string | null;

  setor?: string | null;

  cargo?: string | null;

  respostas: RespostaPesquisaItem[];
};