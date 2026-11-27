"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  PerfilUsuario,
} from "@prisma/client";

import {
  auth,
} from "@/src/auth";

import type {
  ColaboradorCliente,
  ColaboradorClienteSalvo,
} from "@/src/core/model/ColaboradorCliente";

import RepositorioColaboradorCliente from "./RepositorioColaboradorCliente";

export type ResultadoSalvarMeuColaborador =
  | {
      sucesso: true;
      dados: ColaboradorClienteSalvo;
      erro?: never;
    }
  | {
      sucesso: false;
      dados?: never;
      erro: string;
    };

const ERROS_PUBLICOS =
  new Set<string>([
    "Cliente não identificado.",
    "Nome é obrigatório.",
    "E-mail é obrigatório.",
    "Senha é obrigatória para cadastrar um novo colaborador.",
    "A senha deve possuir pelo menos 8 caracteres.",
    "Informe um telefone válido com DDD.",
    "Para realizar tratativas, o colaborador também precisa visualizar denúncias.",
    "Cliente não encontrado ou inativo.",
    "Colaborador não encontrado.",
    "Este e-mail pertence a outro usuário.",
    "Já existe um usuário com este e-mail.",
    "Informe uma senha para liberar o acesso deste colaborador.",
    "Senha é obrigatória.",
  ]);

export default async function salvarMeuColaborador(
  colaborador: ColaboradorCliente
): Promise<ResultadoSalvarMeuColaborador> {
  try {
    const session =
      await auth();

    if (!session?.user) {
      return {
        sucesso: false,
        erro:
          "Usuário não autenticado.",
      };
    }

    const usuario =
      session.user as {
        perfil?: PerfilUsuario;
        clienteId?: string | null;
      };

    if (
      usuario.perfil !==
      PerfilUsuario.CLIENTE
    ) {
      return {
        sucesso: false,
        erro:
          "Apenas o administrador do cliente pode cadastrar colaboradores.",
      };
    }

    const clienteId =
      usuario.clienteId?.trim();

    if (!clienteId) {
      return {
        sucesso: false,
        erro:
          "Usuário não vinculado a um cliente.",
      };
    }

    const resultado =
      await RepositorioColaboradorCliente.salvar(
        clienteId,
        colaborador
      );

    revalidatePath(
      "/meus-colaboradores"
    );

    revalidatePath(
      "/minhas-denuncias"
    );

    return {
      sucesso: true,
      dados: resultado,
    };
  } catch (error) {
    console.error(
      "Erro ao salvar integrante do Comitê de Ética:",
      error
    );

    const mensagem =
      error instanceof Error &&
      ERROS_PUBLICOS.has(
        error.message
      )
        ? error.message
        : "Não foi possível salvar o colaborador.";

    return {
      sucesso: false,
      erro: mensagem,
    };
  }
}