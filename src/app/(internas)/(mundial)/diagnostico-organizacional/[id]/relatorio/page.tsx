import {
  TipoModuloPesquisa,
} from "@prisma/client";

import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RelatorioDiagnosticoOrganizacionalPage({
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
        TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
      }
      tituloModulo="Diagnóstico Organizacional"
      baseHref="/diagnostico-organizacional"
    />
  );
}