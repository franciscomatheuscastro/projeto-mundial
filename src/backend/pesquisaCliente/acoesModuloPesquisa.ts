"use server";

import {
  StatusPesquisaCliente,
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import {
  auth,
} from "@/src/auth";

import type {
  PesquisaCliente,
} from "@/src/core/model/PesquisaCliente";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";


/* =========================================================
 * TIPOS
 * ======================================================= */

type UsuarioSessao = {
  perfil?: string;

  clienteId?: string | null;
};


export type FiltrosRelatorioModuloPesquisa = {
  dataInicio?: string;

  dataFim?: string;

  clienteId?: string;
};


/* =========================================================
 * PERFIS
 * ======================================================= */

const PERFIS_MUNDIAL = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];


/* =========================================================
 * ROTAS DOS MÓDULOS
 * ======================================================= */

function obterBaseHref(
  tipo: TipoModuloPesquisa
) {
  if (
    tipo ===
    TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    return "/diagnostico-organizacional";
  }


  if (
    tipo ===
    TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
  ) {
    return "/avaliacao-psicossocial";
  }


  return "/pesquisas";
}


/* =========================================================
 * REVALIDAÇÃO
 * ======================================================= */

function revalidarModulo(
  tipo: TipoModuloPesquisa,
  id?: string
) {
  const baseHref =
    obterBaseHref(
      tipo
    );


  revalidatePath(
    baseHref
  );


  revalidatePath(
    `${baseHref}/relatorio`
  );


  if (
    id
  ) {
    revalidatePath(
      `${baseHref}/${id}`
    );


    revalidatePath(
      `${baseHref}/${id}/relatorio`
    );
  }


  revalidatePath(
    "/dashboard"
  );
}


/* =========================================================
 * AUTENTICAÇÃO - MUNDIAL
 * ======================================================= */

async function validarMundial() {
  const session =
    await auth();


  if (
    !session?.user
  ) {
    throw new Error(
      "Usuário não autenticado."
    );
  }


  const usuario =
    session.user as UsuarioSessao;


  if (
    !usuario.perfil ||
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


/* =========================================================
 * AUTENTICAÇÃO - CLIENTE
 * ======================================================= */

async function validarCliente() {
  const session =
    await auth();


  if (
    !session?.user
  ) {
    throw new Error(
      "Usuário não autenticado."
    );
  }


  const usuario =
    session.user as UsuarioSessao;


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
      usuario.clienteId,
  };
}


/* =========================================================
 * MUNDIAL - LISTAR
 * ======================================================= */

export async function obterTodosModuloPesquisa(
  tipo: TipoModuloPesquisa
) {
  await validarMundial();


  return RepositorioPesquisaCliente.obterTodos(
    tipo
  );
}


/* =========================================================
 * MUNDIAL - OBTER POR ID
 * ======================================================= */

export async function obterPesquisaModuloPorId(
  id: string,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();


  if (
    !id?.trim()
  ) {
    throw new Error(
      "Aplicação não informada."
    );
  }


  return RepositorioPesquisaCliente.obterPorId(
    id,
    tipo
  );
}


/* =========================================================
 * MUNDIAL - DADOS DO FORMULÁRIO
 * ======================================================= */

export async function obterDadosFormularioModuloPesquisa(
  tipo: TipoModuloPesquisa
) {
  await validarMundial();


  return RepositorioPesquisaCliente.obterDadosFormulario(
    tipo
  );
}


/* =========================================================
 * MUNDIAL - SALVAR
 * ======================================================= */

export async function salvarPesquisaModulo(
  pesquisa: PesquisaCliente,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();


  const resultado =
    await RepositorioPesquisaCliente.salvar(
      {
        ...pesquisa,

        tipo,
      },
      tipo
    );


  revalidarModulo(
    tipo,
    resultado.id
  );


  return resultado;
}


/* =========================================================
 * MUNDIAL - EXCLUIR
 * ======================================================= */

export async function excluirPesquisaModulo(
  id: string,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();


  if (
    !id?.trim()
  ) {
    throw new Error(
      "Aplicação não informada."
    );
  }


  const resultado =
    await RepositorioPesquisaCliente.excluir(
      id,
      tipo
    );


  revalidarModulo(
    tipo
  );


  return resultado;
}


/* =========================================================
 * MUNDIAL - ALTERAR STATUS
 * ======================================================= */

export async function alterarStatusPesquisaModulo(
  id: string,
  status: StatusPesquisaCliente,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();


  if (
    !id?.trim()
  ) {
    throw new Error(
      "Aplicação não informada."
    );
  }


  const resultado =
    await RepositorioPesquisaCliente.alterarStatus(
      id,
      status,
      tipo
    );


  revalidarModulo(
    tipo,
    id
  );


  return resultado;
}


/* =========================================================
 * MUNDIAL - RELATÓRIO INDIVIDUAL
 * ======================================================= */

export async function obterRelatorioModuloPesquisa(
  id: string,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();


  if (
    !id?.trim()
  ) {
    throw new Error(
      "Aplicação não informada."
    );
  }


  return RepositorioPesquisaCliente.obterRelatorio(
    id,
    tipo
  );
}


/* =========================================================
 * MUNDIAL - GERAR CONVITES
 * ======================================================= */

export async function gerarConvitesModuloPesquisa(
  pesquisaId: string,
  quantidade: number,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();


  const quantidadeNormalizada =
    Number(
      quantidade
    );


  if (
    !Number.isInteger(
      quantidadeNormalizada
    ) ||
    quantidadeNormalizada <
      1 ||
    quantidadeNormalizada >
      500
  ) {
    throw new Error(
      "A quantidade deve ser um número inteiro entre 1 e 500."
    );
  }


  const resultado =
    await RepositorioPesquisaCliente.gerarConvites(
      pesquisaId,
      quantidadeNormalizada,
      tipo
    );


  revalidarModulo(
    tipo,
    pesquisaId
  );


  return resultado;
}


/* =========================================================
 * MUNDIAL - RELATÓRIO CONSOLIDADO
 * ======================================================= */

export async function obterDadosRelatorioModuloPesquisa(
  tipo: TipoModuloPesquisa,
  filtros: FiltrosRelatorioModuloPesquisa = {}
) {
  await validarMundial();


  return RepositorioPesquisaCliente.obterDadosRelatorio(
    tipo,
    {
      dataInicio:
        filtros.dataInicio,

      dataFim:
        filtros.dataFim,

      clienteId:
        filtros.clienteId,
    }
  );
}


/* =========================================================
 * CLIENTE - LISTAR APLICAÇÕES
 * ======================================================= */

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


/* =========================================================
 * CLIENTE - OBTER APLICAÇÃO POR ID
 * ======================================================= */

export async function obterMinhaAplicacaoModuloPorId(
  id: string,
  tipo: TipoModuloPesquisa
) {
  const {
    clienteId,
  } =
    await validarCliente();


  if (
    !id?.trim()
  ) {
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


/* =========================================================
 * CLIENTE - RELATÓRIO INDIVIDUAL
 * ======================================================= */

export async function obterMeuRelatorioModulo(
  id: string,
  tipo: TipoModuloPesquisa
) {
  const {
    clienteId,
  } =
    await validarCliente();


  if (
    !id?.trim()
  ) {
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