"use server";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function obterPesquisaClientePorId(id: string) {
  return RepositorioPesquisaCliente.obterPorId(id);
}