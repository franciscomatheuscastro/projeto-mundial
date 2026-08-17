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
  DadosRelatorioPsicossocial,
} from "@/src/app/components/pesquisas/RelatorioAvaliacaoPsicossocialTela";


type Props = {
  searchParams: Promise<{
    dataInicio?: string;

    dataFim?: string;

    clienteId?: string;
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


  const analise = {
    fatores:
      resultado.analise.fatores,

    heatmap:
      resultado.analise.heatmap,
  };


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

      analise,
    };


  /*
   * Contadores usados pelo relatório
   * de impressão.
   */
  const altos =
    analise.fatores.filter(
      fator =>
        normalizarClassificacao(
          fator.classificacao
        ) ===
        "ALTO"
    ).length;


  const criticos =
    analise.fatores.filter(
      fator =>
        normalizarClassificacao(
          fator.classificacao
        ) ===
        "CRITICO"
    ).length;


  const pendentes =
    Math.max(
      0,
      dados.resumo.totalConvites -
        dados.resumo.totalConvitesRespondidos
    );


  return (
    <RelatorioAvaliacaoPsicossocialImpressaoTela
      dados={
        dados
      }
      analise={
        analise
      }
      altos={
        altos
      }
      criticos={
        criticos
      }
      pendentes={
        pendentes
      }
    />
  );
}


function normalizarClassificacao(
  valor?: string | null
) {
  return (
    valor ??
    ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLocaleUpperCase(
      "pt-BR"
    )
    .replace(
      /\s+/g,
      "_"
    );
}