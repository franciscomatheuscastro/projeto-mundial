"use server";

import RepositorioCliente from "./RepositorioCliente";

import type {
  SalvarUsuarioMasterClienteInput,
  UsuarioMasterCliente,
} from "@/src/core/model/Cliente";

export type ResultadoSalvarUsuarioMasterCliente =
  | {
      sucesso: true;
      dados: UsuarioMasterCliente;
      erro?: never;
    }
  | {
      sucesso: false;
      dados?: never;
      erro: string;
    };

const ERROS_PUBLICOS = new Set([
  "Cliente não informado.",
  "Nome do usuário é obrigatório.",
  "E-mail do usuário é obrigatório.",
  "A senha deve possuir pelo menos 8 caracteres.",
  "Cliente não encontrado.",
  "Este e-mail já está sendo utilizado por outro usuário.",
  "Usuário master não encontrado para este cliente.",
  "Senha provisória é obrigatória para criar o acesso.",
  "Este cliente já possui um usuário master.",
]);

export default async function salvarUsuarioMasterCliente(
  dados: SalvarUsuarioMasterClienteInput
): Promise<ResultadoSalvarUsuarioMasterCliente> {
  try {
    const usuario =
      await RepositorioCliente.salvarUsuarioMaster(
        dados
      );

    return {
      sucesso: true,
      dados: usuario,
    };
  } catch (error) {
    console.error(
      "Erro ao salvar usuário master:",
      error
    );

    const mensagem =
      error instanceof Error &&
      ERROS_PUBLICOS.has(error.message)
        ? error.message
        : "Não foi possível salvar o usuário master.";

    return {
      sucesso: false,
      erro: mensagem,
    };
  }
}