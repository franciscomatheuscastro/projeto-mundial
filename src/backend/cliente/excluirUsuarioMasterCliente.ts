"use server";

import RepositorioCliente from "./RepositorioCliente";

import type {
  ExcluirUsuarioMasterClienteInput,
} from "@/src/core/model/Cliente";

export default async function excluirUsuarioMasterCliente(
  dados: ExcluirUsuarioMasterClienteInput
) {
  return RepositorioCliente.excluirUsuarioMaster(
    dados
  );
}
