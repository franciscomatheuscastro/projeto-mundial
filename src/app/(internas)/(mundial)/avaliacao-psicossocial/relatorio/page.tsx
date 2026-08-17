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

import RelatorioAvaliacaoPsicossocialTela from "@/src/app/components/pesquisas/RelatorioAvaliacaoPsicossocialTela";

import type {
  DadosRelatorioPsicossocial,
} from "@/src/app/components/pesquisas/RelatorioAvaliacaoPsicossocialTela";


type Props = {
  searchParams: Promise<{
    dataInicio?: string;

    dataFim?: string;

    clienteId?: string;
  }>;
};


export default async function RelatorioAvaliacaoPsicossocialPage({
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


  if (
    !resultado.analise ||
    !(
      "fatores" in
      resultado.analise
    )
  ) {
    throw new Error(
      "Dados da análise psicossocial inválidos."
    );
  }


  const dados: DadosRelatorioPsicossocial =
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
        fatores:
          resultado.analise.fatores,

        heatmap:
          resultado.analise.heatmap,
      },
    };


  return (
    <RelatorioAvaliacaoPsicossocialTela
      dados={
        dados
      }
    />
  );
}
