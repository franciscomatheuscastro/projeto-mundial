"use server";

import RepositorioCategoriaDenuncia from "./RepositorioCategoriaDenuncia";

export default async function obterCategoriasDenunciaAtivas() {
  return RepositorioCategoriaDenuncia.obterAtivas();
}