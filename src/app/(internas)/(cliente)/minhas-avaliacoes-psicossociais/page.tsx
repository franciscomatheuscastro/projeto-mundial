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


export default async function MinhasAvaliacoesPsicossociaisPage() {
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

  return (
    <PesquisasModuloTela
      modo="lista"
      tipo={
        TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
      }
      tituloModulo="Avaliação Psicossocial"
      baseHref="/minhas-avaliacoes-psicossociais"
      contexto="cliente"
    />
  );
}