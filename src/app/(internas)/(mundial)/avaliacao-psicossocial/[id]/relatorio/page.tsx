import {
  TipoModuloPesquisa,
} from "@prisma/client";

import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RelatorioAvaliacaoPsicossocialPage({
  params,
}: PageProps) {
  const {
    id,
  } =
    await params;

  return (
    <PesquisasModuloTela
      modo="relatorio"
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