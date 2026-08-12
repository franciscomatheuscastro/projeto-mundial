"use server";

import {
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  auth,
} from "@/src/auth";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";


async function validarCliente() {
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
    usuario.perfil !==
    "CLIENTE"
  ) {
    throw new Error(
      "Usuário sem permissão."
    );
  }

  if (
    !usuario.clienteId
  ) {
    throw new Error(
      "Cliente não identificado."
    );
  }

  return {
    usuario,
    clienteId:
      usuario.clienteId as string,
  };
}


export async function obterMinhasAplicacoesModulo(
  tipo: TipoModuloPesquisa
) {
  const {
    clienteId,
  } =
    await validarCliente();

  return RepositorioPesquisaCliente.obterMinhas(
    clienteId,
    tipo
  );
}


export async function obterMinhaAplicacaoModuloPorId(
  id: string,
  tipo: TipoModuloPesquisa
) {
  const {
    clienteId,
  } =
    await validarCliente();

  return RepositorioPesquisaCliente.obterPorIdECliente(
    id,
    clienteId,
    tipo
  );
}


export async function obterMeuRelatorioModulo(
  id: string,
  tipo: TipoModuloPesquisa
) {
  const {
    clienteId,
  } =
    await validarCliente();

  return RepositorioPesquisaCliente.obterRelatorioPorCliente(
    id,
    clienteId,
    tipo
  );
}