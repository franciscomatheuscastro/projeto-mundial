import {
  TipoModuloPesquisa,
} from "@prisma/client";

import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";

export default function Page() {
  return (
    <PesquisasModuloTela
      modo="nova"
      tipo={
        TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
      }
      tituloModulo="Gestão de Riscos Psicossociais"
      baseHref="/avaliacao-psicossocial"
      contexto="mundial"
    />
  );
}