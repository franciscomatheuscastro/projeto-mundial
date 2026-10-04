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

import RelatorioPesquisasClimaTela from "@/src/app/components/pesquisas/RelatorioPesquisasClimaTela";

import type {
  DadosRelatorioClima,
} from "@/src/app/components/pesquisas/RelatorioPesquisasClimaTela";


type PageProps = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
    setor?: string;
  }>;
};


export default async function RelatorioPesquisasPage({
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

        setor:
          filtros.setor,
      }
    );


  /*
   * Esta rota pertence exclusivamente
   * ao módulo Pesquisa de Clima.
   */
  if (
    resultado.tipo !==
    TipoModuloPesquisa.CLIMA
  ) {
    throw new Error(
      "Tipo de relatório inválido."
    );
  }


  /*
   * O backend compartilhado pode retornar
   * diferentes estruturas de análise.
   *
   * Aqui garantimos que este resultado
   * pertence à Pesquisa de Clima.
   */
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


  const dados: DadosRelatorioClima = {
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
      indiceGeralClima:
        resultado.analise.indiceGeralClima,

      dimensoes:
        resultado.analise.dimensoes,

      /*
       * Comparativo entre os setores
       * definidos pela Mundial nas aplicações.
       */
      setores:
        resultado.analise.setores ??
        [],

      comentariosAbertos:
        resultado.analise.comentariosAbertos,

      historico:
        resultado.analise.historico,
    },
  };


  return (
    <RelatorioPesquisasClimaTela
      dados={
        dados
      }
    />
  );
}
