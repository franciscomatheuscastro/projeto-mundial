import {
  PerfilUsuario,
  StatusPesquisaCliente,
} from "@prisma/client";

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

export type UsuarioMasterCliente = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  perfil: PerfilUsuario;
  criadoEm: Date;
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

  usuarioMaster: UsuarioMasterCliente | null;

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

export type MinhaContaCliente = {
  cliente: {
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
  };

  usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: PerfilUsuario;
    ativo: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
  };
};

export type SalvarUsuarioMasterClienteInput = {
  clienteId: string;
  usuarioId?: string;
  nome: string;
  email: string;
  senha?: string;
  ativo: boolean;
};

export type ExcluirUsuarioMasterClienteInput = {
  clienteId: string;
  usuarioId: string;
};