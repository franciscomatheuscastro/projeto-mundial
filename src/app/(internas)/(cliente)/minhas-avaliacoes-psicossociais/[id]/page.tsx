import {
  redirect,
} from "next/navigation";

import {
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  auth,
} from "@/src/auth";

import PesquisasModuloTela from "@/src/app/components/pesquisas/PesquisasModuloTela";


type PageProps = {
  params: Promise<{
    id: string;
  }>;
};


export default async function MinhaAvaliacaoPsicossocialDetalhePage({
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
    session.user as any;

  if (
    usuario.perfil !==
    "CLIENTE"
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
      modo="detalhe"
      tipo={
        TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
      }
      tituloModulo="Avaliação Psicossocial"
      baseHref="/minhas-avaliacoes-psicossociais"
      pesquisaId={
        id
      }
      contexto="cliente"
    />
  );
}