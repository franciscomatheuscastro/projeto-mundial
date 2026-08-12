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

import RelatorioModuloTela from "@/src/app/components/pesquisas/RelatorioModuloTela";

type Props = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
  }>;
};

export default async function Page({
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

  const dados =
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

  return (
    <RelatorioModuloTela
      dados={
        dados
      }
      tituloModulo="Diagnóstico Organizacional"
      baseHref="/diagnostico-organizacional"
    />
  );
}