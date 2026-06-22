"use server";

import RepositorioUsuario from "./RepositorioUsuario";

export default async function obterPorId(id: string) {
  return RepositorioUsuario.obterPorId(id);
}