import {
  PerfilUsuario,
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  redirect,
} from "next/navigation";

import {
  auth,
} from "@/src/auth";

import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MinhaGestaoRiscosPsicossociaisRelatorioPage({
  params,
}: PageProps) {
  const session =
    await auth();

  if (!session?.user) {
    redirect(
      "/login"
    );
  }

  const usuario =
    session.user as {
      perfil?: PerfilUsuario;
      clienteId?: string | null;
    };

  if (
    usuario.perfil !==
    PerfilUsuario.CLIENTE
  ) {
    redirect(
      "/dashboard"
    );
  }

  if (
    !usuario.clienteId
  ) {
    redirect(
      "/login"
    );
  }

  const {
    id,
  } =
    await params;

  return (
    <PesquisasModuloTela
      modo="relatorio"
      tipo={
        TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
      }
      tituloModulo="Gestão de Riscos Psicossociais"
      baseHref="/minhas-avaliacoes-psicossociais"
      pesquisaId={
        id
      }
      contexto="cliente"
    />
  );
}