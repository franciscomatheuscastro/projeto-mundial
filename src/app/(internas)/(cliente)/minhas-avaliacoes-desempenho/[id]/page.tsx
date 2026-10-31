import {
  PerfilUsuario,
  TipoModuloPesquisa,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/src/auth";
import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MinhaAvaliacaoDesempenhoPage({
  params,
}: PageProps) {
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

  const { id } = await params;

  return (
    <PesquisasModuloTela
      modo="detalhe"
      tipo={
        TipoModuloPesquisa.AVALIACAO_DESEMPENHO
      }
      tituloModulo="Avaliação de Desempenho"
      baseHref="/minhas-avaliacoes-desempenho"
      pesquisaId={id}
      contexto="cliente"
    />
  );
}
