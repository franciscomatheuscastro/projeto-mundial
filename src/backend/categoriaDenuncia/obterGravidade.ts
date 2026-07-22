"use server";

import RepositorioCategoriaDenuncia from "./RepositorioCategoriaDenuncia";

export default async function obterGravidadeCategoriaDenuncia(
  id: string
) {
  return RepositorioCategoriaDenuncia.obterGravidade(
    id
  );
}