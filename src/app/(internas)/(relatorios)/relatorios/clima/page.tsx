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

import RelatorioClimaImpressaoTela from "@/src/app/components/pesquisas/RelatorioClimaImpressaoTela";

import type {
  DadosRelatorioClima,
} from "@/src/app/components/pesquisas/RelatorioPesquisasClimaTela";


type PageProps = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
  }>;
};


export default async function RelatorioClimaImpressaoPage({
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
      TipoModuloPesquisa.CLIMA,
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
    TipoModuloPesquisa.CLIMA
  ) {
    throw new Error(
      "Tipo de relatório inválido."
    );
  }


  if (
    !resultado.analise ||
    !(
      "indiceGeralClima" in
      resultado.analise
    )
  ) {
    throw new Error(
      "Dados da análise de clima inválidos."
    );
  }


  const dados: DadosRelatorioClima =
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
        indiceGeralClima:
          resultado.analise.indiceGeralClima,

        dimensoes:
          resultado.analise.dimensoes,

        comentariosAbertos:
          resultado.analise.comentariosAbertos,

        historico:
          resultado.analise.historico,
      },
    };


  return (
    <RelatorioClimaImpressaoTela
      dados={
        dados
      }
    />
  );
}
