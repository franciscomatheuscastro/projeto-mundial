import { GravidadeDenuncia, StatusDenuncia } from "@prisma/client";

export type TratativaDenuncia = {
  id: string;
  titulo: string;
  descricao: string;
  responsavel?: string | null;
  criadoEm: Date | string;
};

export type ConsultarDenunciaPublicaInput = {
  clienteId: string;
  protocolo: string;
};

export type NovaTratativa = {
  titulo: string;
  descricao: string;
  responsavel?: string | null;
};

export type ClienteDenuncia = {
  id: string;
  nome: string;
  empresa: string | null;
};

export type AnexoDenunciaInput = {
  chave: string;
  nomeOriginal: string;
  tipoMime: string;
  tamanho: number;
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
  categoria?: string | null;
  localOcorrido?: string | null;
  dataOcorrido?: string | null;
  anonima: boolean;
  nomeDenunciante?: string | null;
  emailDenunciante?: string | null;
  telefoneDenunciante?: string | null;
};

export type CriarDenunciaPublica = DenunciaPublica;

export type Denuncia = {
  id?: string;
  clienteId: string;

  protocolo?: string;
  titulo: string;
  descricao: string;
  categoria?: string | null;
  localOcorrido?: string | null;
  dataOcorrido?: Date | string | null;

  anonima: boolean;
  nomeDenunciante?: string | null;
  emailDenunciante?: string | null;
  telefoneDenunciante?: string | null;

  status: StatusDenuncia;
  gravidade: GravidadeDenuncia;
  respostaPublica?: string | null;
  tratativas: TratativaDenuncia[];
  anexos?: AnexoDenuncia[];

  criadoEm?: Date | string;
  atualizadoEm?: Date | string;

  cliente: ClienteDenuncia;
};

export type DenunciaResumo = {
  id: string;
  clienteId: string;
  protocolo: string;
  titulo: string;
  categoria: string | null;
  anonima: boolean;
  status: StatusDenuncia;
  gravidade: GravidadeDenuncia;
  quantidadeAnexos: number;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
  cliente: ClienteDenuncia;
};

export type DenunciaDetalhada = DenunciaResumo & {
  descricao: string;
  localOcorrido: string | null;
  dataOcorrido: Date | string | null;
  nomeDenunciante: string | null;
  emailDenunciante: string | null;
  telefoneDenunciante: string | null;
  respostaPublica: string | null;
  tratativas: TratativaDenuncia[];
  anexos: AnexoDenuncia[];
};

export type ConsultaDenunciaPublica = {
  protocolo: string;
  status: StatusDenuncia;
  respostaPublica: string | null;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
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