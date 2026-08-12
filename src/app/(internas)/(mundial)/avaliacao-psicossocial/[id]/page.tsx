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
        TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
      }
      tituloModulo="Avaliação Psicossocial"
      baseHref="/avaliacao-psicossocial"
    />
  );
}