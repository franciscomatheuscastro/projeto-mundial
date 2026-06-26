"use server";

import RepositorioCliente from "./RepositorioCliente";

export default async function obterPorId(id: string) {
  return RepositorioCliente.obterPorId(id);
}