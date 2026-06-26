"use server";

import { redirect } from "next/navigation";
import { NovaRespostaPesquisa } from "@/src/core/model/RespostaPesquisa";
import RepositorioRespostaPesquisa from "./RepositorioRespostaPesquisa";

export default async function salvarRespostaPesquisa(
  resposta: NovaRespostaPesquisa
) {
  await RepositorioRespostaPesquisa.salvar(resposta);

  redirect(`/pesquisa/${resposta.token}/obrigado`);
}