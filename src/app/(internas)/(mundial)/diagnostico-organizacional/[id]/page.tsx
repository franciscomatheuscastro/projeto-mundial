import {
  TipoModuloPesquisa,
} from "@prisma/client";

import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: Props) {
  const {
    id,
  } =
    await params;

  return (
    <PesquisasModuloTela
      modo="detalhe"
      pesquisaId={
        id
      }
      tipo={
        TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
      }
      tituloModulo="Diagnóstico Organizacional"
      baseHref="/diagnostico-organizacional"
    />
  );
}