"use server";

import RepositorioCliente from "./RepositorioCliente";

import type {
  SalvarUsuarioMasterClienteInput,
} from "@/src/core/model/Cliente";

export default async function salvarUsuarioMasterCliente(
  dados: SalvarUsuarioMasterClienteInput
) {
  return RepositorioCliente.salvarUsuarioMaster(
    dados
  );
}
