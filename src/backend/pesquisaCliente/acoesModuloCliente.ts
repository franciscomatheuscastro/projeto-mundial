"use server";

import {
  PerfilUsuario,
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  auth,
} from "@/src/auth";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

type UsuarioSessao = {
  id?: string;
  perfil?: PerfilUsuario;
  clienteId?: string | null;
};

async function validarAcessoClienteModulo(
  tipo: TipoModuloPesquisa
) {
  const session =
    await auth();

  if (!session?.user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuario =
    session.user as UsuarioSessao;

  const administradorCliente =
    usuario.perfil ===
    PerfilUsuario.CLIENTE;

  const gestorCliente =
    usuario.perfil ===
    PerfilUsuario.GESTOR_CLIENTE;

  if (
    !administradorCliente &&
    !gestorCliente
  ) {
    throw new Error(
      "Usuário sem permissão."
    );
  }

  /*
   * O gestor possui acesso somente ao módulo
   * de Avaliação de Desempenho.
   */
  if (
    gestorCliente &&
    tipo !==
      TipoModuloPesquisa.AVALIACAO_DESEMPENHO
  ) {
    throw new Error(
      "O gestor possui acesso somente à Avaliação de Desempenho."
    );
  }

  if (!usuario.clienteId) {
    throw new Error(
      "Cliente não identificado."
    );
  }

  if (
    gestorCliente &&
    !usuario.id
  ) {
    throw new Error(
      "Gestor não identificado."
    );
  }

  return {
    usuario,
    clienteId:
      usuario.clienteId,
  };
}

export async function obterMinhasAplicacoesModulo(
  tipo: TipoModuloPesquisa
) {
  const {
    clienteId,
  } =
    await validarAcessoClienteModulo(
      tipo
    );

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
    await validarAcessoClienteModulo(
      tipo
    );

  if (!id?.trim()) {
    throw new Error(
      "Aplicação não informada."
    );
  }

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
    await validarAcessoClienteModulo(
      tipo
    );

  if (!id?.trim()) {
    throw new Error(
      "Aplicação não informada."
    );
  }

  return RepositorioPesquisaCliente.obterRelatorioPorCliente(
    id,
    clienteId,
    tipo
  );
}
