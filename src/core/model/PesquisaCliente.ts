import { StatusPesquisaCliente, TipoPergunta } from "@prisma/client";

export type PerguntaPesquisaCliente = {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo: TipoPergunta;
  ordem: number;
  obrigatoria: boolean;
  opcoes: string[];
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
  setor?: string | null;
  cargo?: string | null;
  respostas: RespostaPesquisaItem[];
  criadoEm: Date;
};

export type PesquisaCliente = {
  id?: string;
  clienteId: string;
  modeloId: string;
  titulo: string;
  descricao?: string | null;
  token?: string;
  status?: StatusPesquisaCliente;
  perguntas?: PerguntaPesquisaCliente[];
  criadoEm?: Date;
  atualizadoEm?: Date;
};

export type PesquisaClienteResumo = {
  id: string;
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
  titulo: string;
  descricao: string | null;
  token: string;
  status: StatusPesquisaCliente;
  perguntas: PerguntaPesquisaCliente[];
  criadoEm: Date;
  atualizadoEm: Date;
  cliente: {
    id: string;
    nome: string;
    empresa?: string | null;
  };
  modelo: {
    id: string;
    titulo: string;
    perguntas: PerguntaPesquisaCliente[];
  };
  respostas: RespostaPesquisaCliente[];
  totalRespostas: number;
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
    ativo?: boolean;
    modeloPadrao?: boolean;
    criadoEm?: Date;
    atualizadoEm?: Date;
    perguntas: PerguntaPesquisaCliente[];
  }[];
};

export type PesquisaClienteRelatorio = PesquisaClienteDetalhada & {
  perguntasComResumo: {
    pergunta: PerguntaPesquisaCliente;
    totalRespostas: number;
    media: number;
    respostas: RespostaPesquisaItem[];
  }[];
  mediaGeral: number;
};