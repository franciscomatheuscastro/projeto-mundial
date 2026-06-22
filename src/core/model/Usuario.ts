import { PerfilUsuario } from "@prisma/client";

export type Usuario = {
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
  ativo?: boolean;
  criadoEm?: Date;
  atualizadoEm?: Date;
};

export type UsuarioSemSenha = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};