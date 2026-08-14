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

import RelatorioDiagnosticoOrganizacionalTela from "@/src/app/components/pesquisas/RelatorioDiagnosticoOrganizacionalTela";

import type {
  DadosRelatorioDiagnostico,
} from "@/src/app/components/pesquisas/RelatorioDiagnosticoOrganizacionalTela";


type Props = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
  }>;
};


export default async function RelatorioDiagnosticoOrganizacionalPage({
  searchParams,
}: Props) {
  const session =
    await auth();


  if (!session?.user) {
    redirect(
      "/login"
    );
  }


  const filtros =
    await searchParams;


  const resultado =
    await obterDadosRelatorioModuloPesquisa(
      TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL,
      filtros
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
      ...resultado,

      tipo:
        resultado.tipo,

      analise: {
        scoreOrganizacional:
          resultado.analise
            .scoreOrganizacional,

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
    <RelatorioDiagnosticoOrganizacionalTela
      dados={
        dados
      }
    />
  );
}