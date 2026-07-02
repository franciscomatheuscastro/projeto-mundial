import { PerfilUsuario } from "@prisma/client";

export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
  ativo?: boolean;
  clienteId?: string | null;
}

export interface UsuarioSemSenha {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  clienteId: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}