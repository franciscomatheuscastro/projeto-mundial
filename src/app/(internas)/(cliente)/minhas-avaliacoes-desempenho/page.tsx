import {
  PerfilUsuario,
  TipoModuloPesquisa,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/src/auth";
import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";

export default async function MinhasAvaliacoesDesempenhoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const podeAcessar =
    usuario.perfil === PerfilUsuario.CLIENTE ||
    usuario.perfil === PerfilUsuario.GESTOR_CLIENTE;

  if (!podeAcessar) {
    if (
      usuario.perfil ===
      PerfilUsuario.COMITE_CLIENTE
    ) {
      redirect("/painel-controle");
    }

    redirect("/dashboard");
  }

  if (!usuario.clienteId) {
    redirect("/login");
  }

  return (
    <PesquisasModuloTela
      modo="lista"
      tipo={
        TipoModuloPesquisa.AVALIACAO_DESEMPENHO
      }
      tituloModulo="Avaliação de Desempenho"
      baseHref="/minhas-avaliacoes-desempenho"
      contexto="cliente"
    />
  );
}
