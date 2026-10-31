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
   * Campo legado da aplicação.
   *
   * Na Pesquisa de Clima o setor não é mais fixado
   * na PesquisaCliente; ele pode ser informado
   * opcionalmente pelo respondente.
   */
  /*
   * Na Avaliação de Desempenho, o setor é definido
   * pela Mundial na criação da aplicação.
   */
  setor: string | null;

  gestor?: {
    id: string;
    nome: string;
    email?: string | null;
  } | null;

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
   * Identificação do respondente.
   *
   * CLIMA:
   * - nome, e-mail, unidade e cargo não são persistidos;
   * - setor é opcional e pertence à resposta.
   *
   * AVALIAÇÃO DE DESEMPENHO / PSICOSSOCIAL:
   * - seguem a regra de identificação do formulário.
   */
  nome?: string | null;

  email?: string | null;

  unidade?: string | null;

  setor?: string | null;

  cargo?: string | null;

  /*
   * Campos exclusivos da Avaliação de Desempenho.
   *
   * As datas devem chegar no formato YYYY-MM-DD,
   * que é o formato nativo de <input type="date">.
   */
  nomeGestor?: string | null;

  dataAvaliacao?: string | null;

  dataAdmissao?: string | null;

  respostas: RespostaPesquisaItem[];
};
