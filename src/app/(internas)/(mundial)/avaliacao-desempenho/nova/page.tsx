import {
  TipoModuloPesquisa,
} from "@prisma/client";

import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";


export default function Page() {
  return (
    <PesquisasModuloTela
      modo="nova"
      tipo={
        TipoModuloPesquisa.AVALIACAO_DESEMPENHO
      }
      tituloModulo="Avaliação de Desempenho"
      baseHref="/avaliacao-desempenho"
    />
  );
}
