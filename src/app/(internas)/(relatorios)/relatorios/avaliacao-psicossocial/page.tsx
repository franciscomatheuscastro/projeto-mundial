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

import RelatorioAvaliacaoPsicossocialImpressaoTela from "@/src/app/components/pesquisas/RelatorioAvaliacaoPsicossocialImpressaoTela";

import type {
  AnalisePsicossocial,
  DadosRelatorioPsicossocial,
} from "@/src/app/components/pesquisas/RelatorioAvaliacaoPsicossocialImpressaoTela";


type Props = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
    setor?: string;
  }>;
};


export default async function RelatorioAvaliacaoPsicossocialImpressaoPage({
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
      TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
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
    TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
  ) {
    throw new Error(
      "Tipo de relatório inválido."
    );
  }


  /*
   * O relatório psicossocial de impressão
   * atualmente utiliza:
   *
   * - fatores;
   * - dimensões consolidadas;
   * - heatmap.
   *
   * Portanto validamos explicitamente
   * os três blocos antes de montar os dados.
   */
  if (
    !resultado.analise ||
    !(
      "fatores" in
      resultado.analise
    ) ||
    !(
      "dimensoes" in
      resultado.analise
    ) ||
    !(
      "heatmap" in
      resultado.analise
    )
  ) {
    throw new Error(
      "Dados da análise psicossocial inválidos."
    );
  }


  const analise: AnalisePsicossocial = {
    fatores:
      resultado.analise.fatores,

    dimensoes:
      resultado.analise.dimensoes,

    heatmap:
      resultado.analise.heatmap,
  };


  const dados: DadosRelatorioPsicossocial = {
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

    analise,
  };


  return (
    <RelatorioAvaliacaoPsicossocialImpressaoTela
      dados={
        dados
      }
      analise={
        analise
      }
    />
  );
}
