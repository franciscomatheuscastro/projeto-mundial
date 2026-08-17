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

import RelatorioDiagnosticoOrganizacionalImpressaoTela from "@/src/app/components/pesquisas/RelatorioDiagnosticoOrganizacionalImpressaoTela";

import type {
  DadosRelatorioDiagnostico,
} from "@/src/app/components/pesquisas/RelatorioDiagnosticoOrganizacionalTela";


type PageProps = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
  }>;
};


export default async function RelatorioDiagnosticoOrganizacionalImpressaoPage({
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
      TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL,
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
    TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    throw new Error(
      "Tipo de relatório inválido."
    );
  }


  if (
    !resultado.analise ||
    !(
      "scoreOrganizacional" in
      resultado.analise
    )
  ) {
    throw new Error(
      "Dados da análise de diagnóstico organizacional inválidos."
    );
  }


  const dados: DadosRelatorioDiagnostico =
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
        scoreOrganizacional:
          resultado.analise.scoreOrganizacional,

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
    <RelatorioDiagnosticoOrganizacionalImpressaoTela
      dados={
        dados
      }
    />
  );
}
