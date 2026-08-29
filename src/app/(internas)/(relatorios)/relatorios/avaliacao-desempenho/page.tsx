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

import RelatorioAvaliacaoDesempenhoImpressaoTela from "@/src/app/components/pesquisas/RelatorioAvaliacaoDesempenhoImpressaoTela";

import type {
  DadosRelatorioDesempenho,
} from "@/src/app/components/pesquisas/RelatorioAvaliacaoDesempenhoTela";


type PageProps = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
  }>;
};


export default async function RelatorioAvaliacaoDesempenhoImpressaoPage({
  searchParams,
}: PageProps) {
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
      "Dados da análise de avaliação de desempenho inválidos."
    );
  }


  const dados: DadosRelatorioDesempenho =
    {
      tipo:
        resultado.tipo,

      filtros:
        resultado.filtros,

      clientes:
        resultado.clientes,

      resumo:
        resultado.resumo,

      porCliente:
        resultado.porCliente,

      pesquisas:
        resultado.pesquisas,

      informacoesAdicionais:
        resultado.informacoesAdicionais ??
        [],

      analise: {
        scoreDesempenho:
          resultado.analise
            .scoreDesempenho,

        dimensoes:
          resultado.analise
            .dimensoes,

        forcas:
          resultado.analise
            .forcas,

        pontosAtencao:
          resultado.analise
            .pontosAtencao,

        prioridades:
          resultado.analise
            .prioridades,
      },
    };


  return (
    <RelatorioAvaliacaoDesempenhoImpressaoTela
      dados={
        dados
      }
    />
  );
}