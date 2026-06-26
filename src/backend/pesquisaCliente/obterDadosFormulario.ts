"use server";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function obterDadosFormularioPesquisaCliente() {
  return RepositorioPesquisaCliente.obterDadosFormulario();
}