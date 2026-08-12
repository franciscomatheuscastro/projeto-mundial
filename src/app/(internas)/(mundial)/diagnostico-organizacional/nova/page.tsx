import {
  TipoModuloPesquisa,
} from "@prisma/client";

import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";

export default function Page() {
  return (
    <PesquisasModuloTela
      modo="nova"
      tipo={
        TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
      }
      tituloModulo="Diagnóstico Organizacional"
      baseHref="/diagnostico-organizacional"
    />
  );
}