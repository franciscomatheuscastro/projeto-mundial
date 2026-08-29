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

  /*
   * Setor fixado pela Mundial na aplicação.
   * O campo é informativo; o respondente não o escolhe.
   */
  setor: string | null;

  perguntas: PerguntaRespostaPesquisa[];

  cliente: {
    id: string;

    nome: string;

    empresa?: string | null;

    setores: string[];
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

  /*
   * Mantidos para Diagnóstico Organizacional e Psicossocial.
   * No CLIMA o backend ignora identificação e usa o setor
   * fixado na própria PesquisaCliente.
   */
  nome?: string | null;

  email?: string | null;

  unidade?: string | null;

  setor?: string | null;

  cargo?: string | null;

  respostas: RespostaPesquisaItem[];
};
