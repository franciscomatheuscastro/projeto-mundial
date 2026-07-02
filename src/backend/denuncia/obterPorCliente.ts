"use server";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function obterPorCliente(clienteId: string) {
  return RepositorioDenuncia.obterPorCliente(clienteId);
}