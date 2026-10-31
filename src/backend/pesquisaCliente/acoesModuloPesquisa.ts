"use server";

import {
  PerfilUsuario,
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

type UsuarioSessao = {
  id?: string;
  perfil?: PerfilUsuario;
  clienteId?: string | null;
};

export type FiltrosRelatorioModuloPesquisa = {
  dataInicio?: string;
  dataFim?: string;
  clienteId?: string;
  setor?: string;
  funcionarioId?: string;
};

const PERFIS_MUNDIAL: PerfilUsuario[] = [
  PerfilUsuario.ADMIN,
  PerfilUsuario.GESTOR,
  PerfilUsuario.PSICOLOGO,
  PerfilUsuario.ASSISTENTE_SOCIAL,
];

function obterBaseHref(
  tipo: TipoModuloPesquisa
) {
  if (
    tipo ===
    TipoModuloPesquisa.AVALIACAO_DESEMPENHO
  ) {
    return "/avaliacao-desempenho";
  }

  if (
    tipo ===
    TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
  ) {
    return "/avaliacao-psicossocial";
  }

  return "/pesquisas";
}

function revalidarModulo(
  tipo: TipoModuloPesquisa,
  id?: string
) {
  const baseHref =
    obterBaseHref(tipo);

  revalidatePath(baseHref);
  revalidatePath(
    `${baseHref}/relatorio`
  );

  if (id) {
    revalidatePath(
      `${baseHref}/${id}`
    );

    revalidatePath(
      `${baseHref}/${id}/relatorio`
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/painel-controle");
  revalidatePath(
    "/minhas-avaliacoes-desempenho"
  );
}

async function validarMundial() {
  const session =
    await auth();

  if (!session?.user) {
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
   * GESTOR_CLIENTE acessa exclusivamente
   * Avaliação de Desempenho.
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

export async function obterTodosModuloPesquisa(
  tipo: TipoModuloPesquisa
) {
  await validarMundial();

  return RepositorioPesquisaCliente.obterTodos(
    tipo
  );
}

export async function obterPesquisaModuloPorId(
  id: string,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();

  if (!id?.trim()) {
    throw new Error(
      "Aplicação não informada."
    );
  }

  return RepositorioPesquisaCliente.obterPorId(
    id,
    tipo
  );
}

export async function obterDadosFormularioModuloPesquisa(
  tipo: TipoModuloPesquisa
) {
  await validarMundial();

  return RepositorioPesquisaCliente.obterDadosFormulario(
    tipo
  );
}

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

export async function excluirPesquisaModulo(
  id: string,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();

  if (!id?.trim()) {
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

export async function alterarStatusPesquisaModulo(
  id: string,
  status: StatusPesquisaCliente,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();

  if (!id?.trim()) {
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

export async function obterRelatorioModuloPesquisa(
  id: string,
  tipo: TipoModuloPesquisa
) {
  await validarMundial();

  if (!id?.trim()) {
    throw new Error(
      "Aplicação não informada."
    );
  }

  return RepositorioPesquisaCliente.obterRelatorio(
    id,
    tipo
  );
}

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

      setor:
        filtros.setor,

      funcionarioId:
        filtros.funcionarioId,
    }
  );
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
