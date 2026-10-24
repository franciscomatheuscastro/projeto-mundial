import {
  TipoPerguntaCanalDenuncia,
} from "@prisma/client";


export type PerguntaCanalDenuncia = {
  id?: string;

  enunciado: string;
  descricao?: string | null;

  tipo: TipoPerguntaCanalDenuncia;

  obrigatoria: boolean;

  /**
   * Aplicável somente a perguntas SIM_NAO.
   *
   * Quando true:
   * - SIM abre um campo complementar de texto;
   * - NÃO permanece apenas como resposta booleana.
   */
  abrirComplementoSim: boolean;

  opcoes: string[];

  ativo: boolean;
  ordem: number;

  /**
   * Quando true, a pergunta é global:
   * - aparece para todos os clientes atuais;
   * - continua válida para clientes criados futuramente.
   */
  todosCanais?: boolean;

  /**
   * Quando true, somente usuários da Mundial podem
   * visualizar a resposta registrada para esta pergunta.
   *
   * A pergunta continua aparecendo normalmente no
   * formulário público do canal.
   */
  exclusivaMundial?: boolean;

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

  abrirComplementoSim: boolean;

  opcoes: string[];

  ordem: number;
};


export type RespostaPerguntaCanalInput = {
  perguntaId: string;

  resposta:
    | string
    | boolean
    | null;

  complemento?: string | null;
};
