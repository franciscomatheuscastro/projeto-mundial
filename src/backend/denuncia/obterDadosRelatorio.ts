"use server";

import {
  PerfilUsuario,
} from "@prisma/client";

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

import type {
  DadosRelatorioDenuncias,
  FiltroRelatorioDenuncias,
} from "@/src/core/model/Denuncia";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function obterDadosRelatorioDenuncias(
  filtro: FiltroRelatorioDenuncias
): Promise<DadosRelatorioDenuncias> {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuario = session.user as {
    id?: string;
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const perfisMundial: PerfilUsuario[] = [
    PerfilUsuario.ADMIN,
    PerfilUsuario.GESTOR,
    PerfilUsuario.PSICOLOGO,
    PerfilUsuario.ASSISTENTE_SOCIAL,
  ];

  if (
    usuario.perfil &&
    perfisMundial.includes(usuario.perfil)
  ) {
    let tituloCliente =
      "Todos os clientes";

    if (filtro.clienteId) {
      const cliente =
        await prisma.cliente.findUnique({
          where: {
            id: filtro.clienteId,
          },
          select: {
            id: true,
            nome: true,
            empresa: true,
          },
        });

      if (!cliente) {
        throw new Error(
          "Cliente não encontrado."
        );
      }

      tituloCliente =
        cliente.empresa ||
        cliente.nome;
    }

    const denuncias =
      await RepositorioDenuncia.obterParaRelatorio({
        dataInicio:
          filtro.dataInicio,
        dataFim:
          filtro.dataFim,
        clienteId:
          filtro.clienteId,
      });

    return {
      contexto: "mundial",
      tituloCliente,
      dataInicio:
        filtro.dataInicio || null,
      dataFim:
        filtro.dataFim || null,
      geradoEm: new Date(),
      denuncias,
    };
  }

  if (
    usuario.perfil ===
    PerfilUsuario.CLIENTE
  ) {
    if (!usuario.clienteId) {
      throw new Error(
        "Usuário sem cliente vinculado."
      );
    }

    const cliente =
      await prisma.cliente.findUnique({
        where: {
          id: usuario.clienteId,
        },
        select: {
          nome: true,
          empresa: true,
        },
      });

    if (!cliente) {
      throw new Error(
        "Cliente não encontrado."
      );
    }

    const denuncias =
      await RepositorioDenuncia.obterParaRelatorio({
        dataInicio:
          filtro.dataInicio,
        dataFim:
          filtro.dataFim,
        clienteId:
          usuario.clienteId,
      });

    return {
      contexto: "cliente",
      tituloCliente:
        cliente.empresa ||
        cliente.nome,
      dataInicio:
        filtro.dataInicio || null,
      dataFim:
        filtro.dataFim || null,
      geradoEm: new Date(),
      denuncias,
    };
  }

  if (
    usuario.perfil ===
    PerfilUsuario.COMITE_CLIENTE
  ) {
    if (
      !usuario.id ||
      !usuario.clienteId
    ) {
      throw new Error(
        "Usuário do comitê sem vínculo válido."
      );
    }

    const colaborador =
      await RepositorioDenuncia.obterColaboradorPorUsuario(
        usuario.id,
        usuario.clienteId
      );

    if (
      !colaborador ||
      !colaborador.ativo ||
      !colaborador.podeVerDenuncias
    ) {
      throw new Error(
        "Você não possui permissão para visualizar denúncias."
      );
    }

    const cliente =
      await prisma.cliente.findUnique({
        where: {
          id: usuario.clienteId,
        },
        select: {
          nome: true,
          empresa: true,
        },
      });

    if (!cliente) {
      throw new Error(
        "Cliente não encontrado."
      );
    }

    const denuncias =
      await RepositorioDenuncia.obterParaRelatorio({
        dataInicio:
          filtro.dataInicio,
        dataFim:
          filtro.dataFim,
        clienteId:
          usuario.clienteId,
        colaboradorId:
          colaborador.id,
      });

    return {
      contexto: "cliente",
      tituloCliente:
        cliente.empresa ||
        cliente.nome,
      dataInicio:
        filtro.dataInicio || null,
      dataFim:
        filtro.dataFim || null,
      geradoEm: new Date(),
      denuncias,
    };
  }

  throw new Error(
    "Acesso não autorizado."
  );
}