import {
  StatusPesquisaCliente,
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";

import type {
  ConfiguracaoAnaliseModelo,
  DimensaoModelo,
  SentidoPontuacao,
} from "@/src/core/model/ModeloPesquisa";


export type PerguntaPesquisaCliente = {
  id: string;

  titulo: string;

  descricao?: string | null;

  tipo: TipoPergunta;

  ordem: number;

  obrigatoria: boolean;

  opcoes: string[];


  /*
   * Snapshot da estrutura analítica
   * utilizada quando a aplicação
   * foi criada.
   */
  dimensaoId?: string | null;


  /*
   * POSITIVO ou NEGATIVO.
   *
   * Necessário para interpretar
   * corretamente perguntas NOTA.
   */
  sentidoPontuacao: SentidoPontuacao;
};


export type RespostaPesquisaItem = {
  id: string;

  perguntaId: string;

  valor: string;
};


export type RespostaPesquisaCliente = {
  id: string;

  pesquisaId: string;

  nome?: string | null;

  email?: string | null;

  unidade?: string | null;

  setor?: string | null;

  cargo?: string | null;

  respostas: RespostaPesquisaItem[];

  criadoEm: Date;
};


export type PesquisaCliente = {
  id?: string;

  clienteId: string;

  modeloId: string;

  tipo?: TipoModuloPesquisa;

  titulo: string;

  descricao?: string | null;

  token?: string;

  status?: StatusPesquisaCliente;


  /*
   * Estes campos normalmente não precisam
   * ser enviados pelo formulário.
   *
   * O repositório gera snapshots a partir
   * do modelo no momento da criação.
   */
  perguntas?: PerguntaPesquisaCliente[];

  dimensoes?: DimensaoModelo[];

  configuracaoAnalise?: ConfiguracaoAnaliseModelo;

  criadoEm?: Date;

  atualizadoEm?: Date;
};


export type PesquisaClienteResumo = {
  id: string;

  tipo: TipoModuloPesquisa;

  titulo: string;

  descricao: string | null;

  token: string;

  status: StatusPesquisaCliente;

  criadoEm: Date;

  atualizadoEm: Date;


  cliente: {
    id: string;

    nome: string;
  };


  modelo: {
    id: string;

    titulo: string;
  };


  totalRespostas: number;
};


export type PesquisaClienteDetalhada = {
  id: string;

  clienteId: string;

  modeloId: string;

  tipo: TipoModuloPesquisa;

  titulo: string;

  descricao: string | null;

  token: string;

  status: StatusPesquisaCliente;


  /*
   * Snapshot da aplicação.
   *
   * Estes dados devem ser utilizados
   * para relatórios históricos.
   */
  perguntas: PerguntaPesquisaCliente[];

  dimensoes: DimensaoModelo[];

  configuracaoAnalise: ConfiguracaoAnaliseModelo;


  criadoEm: Date;

  atualizadoEm: Date;


  cliente: {
    id: string;

    nome: string;

    empresa?: string | null;
  };


  /*
   * Estado atual do modelo original.
   *
   * Pode ser diferente do snapshot
   * da aplicação.
   */
  modelo: {
    id: string;

    titulo: string;

    perguntas: PerguntaPesquisaCliente[];

    dimensoes: DimensaoModelo[];

    configuracaoAnalise: ConfiguracaoAnaliseModelo;
  };


  respostas: RespostaPesquisaCliente[];

  totalRespostas: number;


  convites?: ConvitePesquisaCliente[];

  totalConvites?: number;

  totalConvitesRespondidos?: number;
};


export type DadosFormularioPesquisaCliente = {
  clientes: {
    id: string;

    nome: string;

    email?: string | null;

    ativo?: boolean;

    empresa?: string | null;

    telefone?: string | null;

    documento?: string | null;

    observacoes?: string | null;

    criadoEm?: Date;

    atualizadoEm?: Date;
  }[];


  modelos: {
    id: string;

    titulo: string;

    descricao?: string | null;

    tipo: TipoModuloPesquisa;

    ativo?: boolean;

    modeloPadrao?: boolean;

    criadoEm?: Date;

    atualizadoEm?: Date;


    perguntas: PerguntaPesquisaCliente[];

    dimensoes: DimensaoModelo[];

    configuracaoAnalise: ConfiguracaoAnaliseModelo;
  }[];
};


export type PesquisaClienteRelatorio =
  PesquisaClienteDetalhada & {
    perguntasComResumo: {
      pergunta: PerguntaPesquisaCliente;

      totalRespostas: number;

      media: number;

      respostas: RespostaPesquisaItem[];
    }[];


    /*
     * Mantido temporariamente por
     * compatibilidade com relatórios antigos.
     *
     * Os relatórios novos usam:
     *
     * CLIMA
     * -> favorabilidade
     *
     * DIAGNÓSTICO
     * -> maturidade
     *
     * PSICOSSOCIAL
     * -> exposição/criticidade
     */
    mediaGeral: number;
  };


export type ConvitePesquisaCliente = {
  id: string;

  pesquisaId: string;

  token: string;

  nome?: string | null;

  email?: string | null;

  unidade?: string | null;

  setor?: string | null;

  cargo?: string | null;

  respondido: boolean;

  respondidoEm?: Date | null;

  criadoEm: Date;

  atualizadoEm: Date;
};