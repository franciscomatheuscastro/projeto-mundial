import {
  redirect,
} from "next/navigation";

import {
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  auth,
} from "@/src/auth";

import {
  obterDadosRelatorioModuloPesquisa,
} from "@/src/backend/pesquisaCliente/acoesModuloPesquisa";

import RelatorioAvaliacaoDesempenhoTela from "@/src/app/components/pesquisas/RelatorioAvaliacaoDesempenhoTela";

import type {
  DadosRelatorioDesempenho,
} from "@/src/app/components/pesquisas/RelatorioAvaliacaoDesempenhoTela";


type Props = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
    setor?: string;
  }>;
};


export default async function RelatorioAvaliacaoDesempenhoPage({
  searchParams,
}: Props) {
  const session =
    await auth();


  if (
    !session?.user
  ) {
    redirect(
      "/login"
    );
  }


  const filtros =
    await searchParams;


  const resultado =
    await obterDadosRelatorioModuloPesquisa(
      TipoModuloPesquisa.AVALIACAO_DESEMPENHO,
      {
        dataInicio:
          filtros.dataInicio,

        dataFim:
          filtros.dataFim,

        clienteId:
          filtros.clienteId,

        setor:
          filtros.setor,
      }
    );


  if (
    resultado.tipo !==
    TipoModuloPesquisa.AVALIACAO_DESEMPENHO
  ) {
    throw new Error(
      "Tipo de relatório inválido."
    );
  }


  if (
    !resultado.analise ||
    !(
      "scoreDesempenho" in
      resultado.analise
    )
  ) {
    throw new Error(
      "Dados da análise de desempenho inválidos."
    );
  }


  const dados: DadosRelatorioDesempenho = {
    ...resultado,

    tipo:
      resultado.tipo,

    filtros: {
      dataInicio:
        resultado.filtros.dataInicio,

      dataFim:
        resultado.filtros.dataFim,

      clienteId:
        resultado.filtros.clienteId,

      setor:
        resultado.filtros.setor,
    },

    setores:
      resultado.setores ??
      [],

    analise: {
      scoreDesempenho:
        resultado.analise.scoreDesempenho,

      dimensoes:
        resultado.analise.dimensoes,

      forcas:
        resultado.analise.forcas,

      pontosAtencao:
        resultado.analise.pontosAtencao,

      prioridades:
        resultado.analise.prioridades,
    },
  };


  return (
    <RelatorioAvaliacaoDesempenhoTela
      dados={
        dados
      }
    />
  );
}
