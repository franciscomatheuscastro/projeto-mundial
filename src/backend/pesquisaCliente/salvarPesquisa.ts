"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  PesquisaCliente,
} from "@/src/core/model/PesquisaCliente";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function salvarPesquisa(
  pesquisa: PesquisaCliente
) {
  const resultado =
    await RepositorioPesquisaCliente.salvar(
      {
        ...pesquisa,

        tipo:
          TipoModuloPesquisa.CLIMA,
      },

      TipoModuloPesquisa.CLIMA
    );

  revalidatePath(
    "/pesquisas"
  );

  revalidatePath(
    "/dashboard"
  );

  return resultado;
}