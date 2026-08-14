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

import RelatorioAvaliacaoPsicossocialTela, {
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


  if (!session?.user) {
    redirect(
      "/login"
    );
  }


  const filtros =
    await searchParams;


  const resultado =
    await obterDadosRelatorioModuloPesquisa(
      TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
      filtros
    );


  /*
   * A action é compartilhada pelos três módulos.
   *
   * Por isso o TypeScript entende o campo "analise"
   * como uma união:
   *
   * Clima | Diagnóstico | Psicossocial
   *
   * Neste endpoint nós sabemos que o tipo solicitado
   * é exclusivamente AVALIACAO_PSICOSSOCIAL.
   */
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
      ...resultado,

      tipo:
        resultado.tipo,

      analise: {
        fatores:
          resultado.analise.fatores,

        anonimatoMinimo:
          resultado.analise.anonimatoMinimo,
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