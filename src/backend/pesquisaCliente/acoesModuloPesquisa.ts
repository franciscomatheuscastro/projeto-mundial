"use server";

import {
  StatusPesquisaCliente,
  TipoModuloPesquisa,
} from "@prisma/client";

import { auth } from "@/src/auth";

import type {
  PesquisaCliente,
} from "@/src/core/model/PesquisaCliente";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

const PERFIS_MUNDIAL = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];

async function validarUsuarioMundial() {
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
      "Usuário sem permissão."
    );
  }

  return usuario;
}

export async function obterTodosModuloPesquisa(
  tipo: TipoModuloPesquisa
) {
  await validarUsuarioMundial();

  return RepositorioPesquisaCliente.obterTodos(
    tipo
  );
}

export async function obterPesquisaModuloPorId(
  id: string,
  tipo: TipoModuloPesquisa
) {
  await validarUsuarioMundial();

  return RepositorioPesquisaCliente.obterPorId(
    id,
    tipo
  );
}

export async function obterDadosFormularioModuloPesquisa(
  tipo: TipoModuloPesquisa
) {
  await validarUsuarioMundial();

  return RepositorioPesquisaCliente.obterDadosFormulario(
    tipo
  );
}

export async function salvarPesquisaModulo(
  dados: {
    titulo: string;
    descricao?: string | null;
    clienteId: string;
    modeloId: string;
  },
  tipo: TipoModuloPesquisa
) {
  await validarUsuarioMundial();

  const pesquisa: PesquisaCliente = {
    titulo:
      dados.titulo,

    descricao:
      dados.descricao,

    clienteId:
      dados.clienteId,

    modeloId:
      dados.modeloId,

    tipo,
  };

  return RepositorioPesquisaCliente.salvar(
    pesquisa,
    tipo
  );
}

export async function excluirPesquisaModulo(
  id: string,
  tipo: TipoModuloPesquisa
) {
  await validarUsuarioMundial();

  return RepositorioPesquisaCliente.excluir(
    id,
    tipo
  );
}

export async function alterarStatusPesquisaModulo(
  id: string,
  status: StatusPesquisaCliente,
  tipo: TipoModuloPesquisa
) {
  await validarUsuarioMundial();

  return RepositorioPesquisaCliente.alterarStatus(
    id,
    status,
    tipo
  );
}

export async function gerarConvitesModuloPesquisa(
  id: string,
  quantidade: number,
  tipo: TipoModuloPesquisa
) {
  await validarUsuarioMundial();

  return RepositorioPesquisaCliente.gerarConvites(
    id,
    quantidade,
    tipo
  );
}

export async function obterRelatorioModuloPesquisa(
  id: string,
  tipo: TipoModuloPesquisa
) {
  await validarUsuarioMundial();

  return RepositorioPesquisaCliente.obterRelatorio(
    id,
    tipo
  );
}

export async function obterDadosRelatorioModuloPesquisa(
  tipo: TipoModuloPesquisa,
  filtros: {
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
  } = {}
) {
  await validarUsuarioMundial();

  return RepositorioPesquisaCliente.obterDadosRelatorio(
    tipo,
    filtros
  );
}