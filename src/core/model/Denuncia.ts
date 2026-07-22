import {
  DestinoTratativaDenuncia,
  GravidadeDenuncia,
  OrigemAtorDenuncia,
  PerfilUsuario,
  StatusDenuncia,
  TipoAnexoDenuncia,
  TipoEventoDenuncia,
  VisibilidadeAnexoDenuncia,
  TipoPerguntaCanalDenuncia,
} from "@prisma/client";

import type {
  RespostaPerguntaCanalInput,
} from "@/src/core/model/PerguntaCanalDenuncia";

export type ClienteDenuncia = {
  id: string;
  nome: string;
  empresa: string | null;
};

export type CategoriaDenuncia = {
  id: string;
  nome: string;
  descricao?: string | null;

  gravidade: GravidadeDenuncia;

  ativo?: boolean;
  ordem?: number;
};

export type ColaboradorResponsavelTratativa = {
  id: string;
  nome: string;
  email?: string | null;
  cargo?: string | null;
  setor?: string | null;
};

export type LiberarTratativaInput = {
  denunciaId: string;
  destino: DestinoTratativaDenuncia;
  colaboradorId?: string | null;
};

export type TratativaDenuncia = {
  id: string;
  denunciaId?: string;
  titulo: string;
  descricao: string;

  criadoPorUsuarioId?: string | null;
  criadoPorNome: string;
  criadoPorPerfil?: PerfilUsuario | null;

  atualizadoPorUsuarioId?: string | null;
  atualizadoPorNome?: string | null;

  criadoEm: Date | string;
  atualizadoEm: Date | string;
};

export type RespostaPerguntaCanalDenuncia = {
  id: string;

  perguntaId?: string | null;

  perguntaEnunciado: string;

  perguntaTipo:
    TipoPerguntaCanalDenuncia;

  resposta: unknown;

  criadoEm: Date | string;
};

export type NovaTratativa = {
  titulo: string;
  descricao: string;
};

export type EditarTratativaInput = {
  id: string;
  denunciaId: string;
  titulo: string;
  descricao: string;
};

export type HistoricoDenuncia = {
  id: string;
  tipo: TipoEventoDenuncia;
  titulo: string;
  descricao?: string | null;
  statusAnterior?: StatusDenuncia | null;
  statusNovo?: StatusDenuncia | null;
  origemAtor: OrigemAtorDenuncia;
  atorNome?: string | null;
  visivelPublicamente: boolean;
  criadoEm: Date | string;
};

export type ConsultarDenunciaPublicaInput = {
  clienteId: string;
  protocolo: string;
};

export type AnexoDenunciaInput = {
  chave: string;
  nomeOriginal: string;
  tipoMime: string;
  tamanho: number;
  tipo: TipoAnexoDenuncia;
  visibilidade: VisibilidadeAnexoDenuncia;
};

export type AnexoDenuncia = AnexoDenunciaInput & {
  id: string;
  criadoEm: Date | string;
  url?: string | null;
};

export type DenunciaPublica = {
  clienteId: string;

  titulo: string;
  descricao: string;

  categoriaId: string;

  localOcorrido?: string | null;
  dataOcorrido?: string | null;

  anonima: boolean;

  nomeDenunciante?: string | null;
  emailDenunciante?: string | null;
  telefoneDenunciante?: string | null;

  respostasPersonalizadas?: RespostaPerguntaCanalInput[];

  aceitouTermos: boolean;
  versaoTermosAceitos: string;
};

export type CriarDenunciaPublica = DenunciaPublica;

export type Denuncia = {
  id?: string;
  clienteId: string;
  protocolo?: string;
  titulo: string;
  descricao: string;
  categoriaId: string;
  categoria?: CategoriaDenuncia;
  localOcorrido?: string | null;
  dataOcorrido?: Date | string | null;
  anonima: boolean;
  nomeDenunciante?: string | null;
  emailDenunciante?: string | null;
  telefoneDenunciante?: string | null;
  status: StatusDenuncia;
  gravidade: GravidadeDenuncia;
  respostaPublica?: string | null;

  tratativaLiberada?: boolean;
  destinoTratativa?: DestinoTratativaDenuncia | null;
  colaboradorResponsavelId?: string | null;
  colaboradorResponsavel?: ColaboradorResponsavelTratativa | null;
  tratativaLiberadaEm?: Date | string | null;

  aceiteTermosEm?: Date | string;
  versaoTermosAceitos?: string;
  tratativas?: TratativaDenuncia[];
  historico?: HistoricoDenuncia[];
  anexos?: AnexoDenuncia[];
  criadoEm?: Date | string;
  atualizadoEm?: Date | string;
  cliente: ClienteDenuncia;
  respostasPerguntasCanal?:
    RespostaPerguntaCanalDenuncia[];
};

export type DenunciaResumo = {
  id: string;
  clienteId: string;
  protocolo: string;
  titulo: string;
  categoriaId: string;
  categoria: CategoriaDenuncia;
  anonima: boolean;
  status: StatusDenuncia;
  gravidade: GravidadeDenuncia;
  quantidadeAnexos: number;

  tratativaLiberada: boolean;
  destinoTratativa: DestinoTratativaDenuncia | null;
  colaboradorResponsavelId: string | null;
  colaboradorResponsavel: ColaboradorResponsavelTratativa | null;

  criadoEm: Date | string;
  atualizadoEm: Date | string;
  cliente: ClienteDenuncia;
};

export type DenunciaDetalhada =
  DenunciaResumo & {
    descricao: string;

    localOcorrido: string | null;

    dataOcorrido:
      | Date
      | string
      | null;

    nomeDenunciante: string | null;

    emailDenunciante: string | null;

    telefoneDenunciante:
      | string
      | null;

    respostaPublica: string | null;

    tratativaLiberadaEm:
      | Date
      | string
      | null;

    tratativas:
      TratativaDenuncia[];

    historico:
      HistoricoDenuncia[];

    anexos:
      AnexoDenuncia[];

    respostasPerguntasCanal:
      RespostaPerguntaCanalDenuncia[];
  };

export type ConsultaDenunciaPublica = {
  protocolo: string;
  status: StatusDenuncia;
  respostaPublica: string | null;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
  historico: Array<{
    id: string;
    titulo: string;
    descricao?: string | null;
    statusNovo?: StatusDenuncia | null;
    criadoEm: Date | string;
  }>;
};

export type PrepararUploadDenunciaInput = {
  denunciaId: string;
  protocolo: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanho: number;
};

export type ConfirmarUploadDenunciaInput = {
  denunciaId: string;
  protocolo: string;
  chave: string;
  nomeOriginal: string;
  tipoMime: string;
  tamanho: number;
};

export type FiltroRelatorioDenuncias = {
  dataInicio?: string;
  dataFim?: string;
  clienteId?: string;
};

export type DadosRelatorioDenuncias = {
  contexto: "mundial" | "cliente";
  tituloCliente: string;
  dataInicio: string | null;
  dataFim: string | null;
  geradoEm: Date | string;
  denuncias: DenunciaResumo[];
};
