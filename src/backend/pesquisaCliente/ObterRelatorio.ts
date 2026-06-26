"use server";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function obterRelatorioPesquisaCliente(id: string) {
  return RepositorioPesquisaCliente.obterRelatorio(id);
}