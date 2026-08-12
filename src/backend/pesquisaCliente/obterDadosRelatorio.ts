"use server";

import {
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  auth,
} from "@/src/auth";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

const PERFIS_MUNDIAL = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];

export type FiltrosRelatorioPesquisas = {
  dataInicio?: string;
  dataFim?: string;
  clienteId?: string;
};

export default async function obterDadosRelatorio(
  filtros: FiltrosRelatorioPesquisas = {}
) {
  const session =
    await auth();

  if (!session?.user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuario =
    session.user as any;

  if (
    !PERFIS_MUNDIAL.includes(
      usuario.perfil
    )
  ) {
    throw new Error(
      "Usuário sem permissão para acessar este relatório."
    );
  }

  return RepositorioPesquisaCliente.obterDadosRelatorio(
    TipoModuloPesquisa.CLIMA,
    filtros
  );
}