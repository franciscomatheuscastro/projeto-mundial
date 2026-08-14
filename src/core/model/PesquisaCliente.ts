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
   * Snapshot analítico da pergunta.
   */
  dimensaoId?: string | null;

  peso: number;

  sentidoPontuacao: SentidoPontuacao;

  fatorRisco?: string | null;
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
   * Normalmente não precisam ser enviados pela tela.
   * O repositório cria o snapshot automaticamente
   * a partir do ModeloPesquisa.
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
   * Snapshot usado pela aplicação.
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
   * Modelo original atual.
   *
   * Pode evoluir depois da criação da aplicação.
   * Por isso o relatório deverá usar prioritariamente
   * os snapshots acima.
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
     * Mantido nesta etapa por compatibilidade com
     * os relatórios atuais.
     *
     * Depois criaremos indicadores específicos:
     *
     * CLIMA -> favorabilidade
     * DIAGNÓSTICO -> maturidade/score
     * PSICOSSOCIAL -> exposição/criticidade
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