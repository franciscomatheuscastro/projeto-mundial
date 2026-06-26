import { StatusPesquisaCliente } from "@prisma/client";

export type Cliente = {
  id?: string;
  nome: string;
  empresa?: string | null;
  email?: string | null;
  telefone?: string | null;
  documento?: string | null;
  observacoes?: string | null;
  ativo?: boolean;
  criadoEm?: Date;
  atualizadoEm?: Date;
};

export type ClienteComResumo = {
  id: string;
  nome: string;
  empresa: string | null;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  observacoes: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  totalPesquisas: number;
};

export type ClienteDetalhado = {
  id: string;
  nome: string;
  empresa: string | null;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  observacoes: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  pesquisas: {
    id: string;
    titulo: string;
    status: StatusPesquisaCliente;
    criadoEm: Date;
    modelo: {
      id: string;
      titulo: string;
    };
  }[];
};