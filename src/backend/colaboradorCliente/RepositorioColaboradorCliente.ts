import bcrypt from "bcryptjs";
import { PerfilUsuario } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  ColaboradorCliente,
  ColaboradorClienteSalvo,
} from "@/src/core/model/ColaboradorCliente";

export default class RepositorioColaboradorCliente {
  static async obterPorCliente(
    clienteId: string
  ): Promise<ColaboradorClienteSalvo[]> {
    return prisma.colaboradorCliente.findMany({
      where: {
        clienteId,
      },
      orderBy: {
        nome: "asc",
      },
      select: {
        id: true,
        clienteId: true,
        usuarioId: true,
        nome: true,
        email: true,
        telefone: true,
        setor: true,
        cargo: true,
        ativo: true,
        podeVerDenuncias: true,
        podeTratarDenuncias: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });
  }

  static async obterPorIdECliente(
    id: string,
    clienteId: string
  ): Promise<ColaboradorClienteSalvo> {
    const colaborador = await prisma.colaboradorCliente.findFirst({
      where: {
        id,
        clienteId,
      },
      select: {
        id: true,
        clienteId: true,
        usuarioId: true,
        nome: true,
        email: true,
        telefone: true,
        setor: true,
        cargo: true,
        ativo: true,
        podeVerDenuncias: true,
        podeTratarDenuncias: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    if (!colaborador) {
      throw new Error("Colaborador não encontrado.");
    }

    return colaborador;
  }

  static async salvar(
    clienteId: string,
    colaborador: ColaboradorCliente
  ): Promise<ColaboradorClienteSalvo> {
    const nome = colaborador.nome?.trim();
    const email = colaborador.email?.trim().toLowerCase();
    const senha = colaborador.senha?.trim();

    if (!clienteId) {
      throw new Error("Cliente não identificado.");
    }

    if (!nome) {
      throw new Error("Nome é obrigatório.");
    }

    if (!email) {
      throw new Error("E-mail é obrigatório.");
    }

    if (!colaborador.id && !senha) {
      throw new Error(
        "Senha é obrigatória para cadastrar um novo colaborador."
      );
    }

    const clienteExiste = await prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
      select: {
        id: true,
        ativo: true,
      },
    });

    if (!clienteExiste || !clienteExiste.ativo) {
      throw new Error("Cliente não encontrado ou inativo.");
    }

    const usuarioComMesmoEmail = await prisma.usuario.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        colaboradorCliente: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!colaborador.id && usuarioComMesmoEmail) {
      throw new Error("Já existe um usuário com este e-mail.");
    }

    let colaboradorAtual:
      | {
          id: string;
          clienteId: string;
          usuarioId: string | null;
        }
      | null = null;

    if (colaborador.id) {
      colaboradorAtual = await prisma.colaboradorCliente.findFirst({
        where: {
          id: colaborador.id,
          clienteId,
        },
        select: {
          id: true,
          clienteId: true,
          usuarioId: true,
        },
      });

      if (!colaboradorAtual) {
        throw new Error("Colaborador não encontrado.");
      }

      if (
        usuarioComMesmoEmail &&
        usuarioComMesmoEmail.id !== colaboradorAtual.usuarioId
      ) {
        throw new Error("Este e-mail pertence a outro usuário.");
      }
    }

    const senhaCriptografada = senha
      ? await bcrypt.hash(senha, 10)
      : undefined;

    return prisma.$transaction(async (tx) => {
      if (colaboradorAtual) {
        if (!colaboradorAtual.usuarioId) {
          if (!senhaCriptografada) {
            throw new Error(
              "Informe uma senha para liberar o acesso deste colaborador."
            );
          }

          const usuarioCriado = await tx.usuario.create({
            data: {
              nome,
              email,
              senha: senhaCriptografada,
              perfil: PerfilUsuario.COMITE_CLIENTE,
              ativo: colaborador.ativo ?? true,
              clienteId,
            },
            select: {
              id: true,
            },
          });

          return tx.colaboradorCliente.update({
            where: {
              id: colaboradorAtual.id,
            },
            data: {
              usuarioId: usuarioCriado.id,
              nome,
              email,
              telefone: colaborador.telefone?.trim() || null,
              setor: colaborador.setor?.trim() || null,
              cargo: colaborador.cargo?.trim() || null,
              ativo: colaborador.ativo ?? true,
              podeVerDenuncias:
                colaborador.podeVerDenuncias ?? true,
              podeTratarDenuncias:
                colaborador.podeTratarDenuncias ?? true,
            },
            select: {
              id: true,
              clienteId: true,
              usuarioId: true,
              nome: true,
              email: true,
              telefone: true,
              setor: true,
              cargo: true,
              ativo: true,
              podeVerDenuncias: true,
              podeTratarDenuncias: true,
              criadoEm: true,
              atualizadoEm: true,
            },
          });
        }

        await tx.usuario.update({
          where: {
            id: colaboradorAtual.usuarioId,
          },
          data: {
            nome,
            email,
            ativo: colaborador.ativo ?? true,
            clienteId,
            perfil: PerfilUsuario.COMITE_CLIENTE,
            ...(senhaCriptografada
              ? { senha: senhaCriptografada }
              : {}),
          },
        });

        return tx.colaboradorCliente.update({
          where: {
            id: colaboradorAtual.id,
          },
          data: {
            nome,
            email,
            telefone: colaborador.telefone?.trim() || null,
            setor: colaborador.setor?.trim() || null,
            cargo: colaborador.cargo?.trim() || null,
            ativo: colaborador.ativo ?? true,
            podeVerDenuncias:
              colaborador.podeVerDenuncias ?? true,
            podeTratarDenuncias:
              colaborador.podeTratarDenuncias ?? true,
          },
          select: {
            id: true,
            clienteId: true,
            usuarioId: true,
            nome: true,
            email: true,
            telefone: true,
            setor: true,
            cargo: true,
            ativo: true,
            podeVerDenuncias: true,
            podeTratarDenuncias: true,
            criadoEm: true,
            atualizadoEm: true,
          },
        });
      }

      if (!senhaCriptografada) {
        throw new Error("Senha é obrigatória.");
      }

      const usuarioCriado = await tx.usuario.create({
        data: {
          nome,
          email,
          senha: senhaCriptografada,
          perfil: PerfilUsuario.COMITE_CLIENTE,
          ativo: colaborador.ativo ?? true,
          clienteId,
        },
        select: {
          id: true,
        },
      });

      return tx.colaboradorCliente.create({
        data: {
          clienteId,
          usuarioId: usuarioCriado.id,
          nome,
          email,
          telefone: colaborador.telefone?.trim() || null,
          setor: colaborador.setor?.trim() || null,
          cargo: colaborador.cargo?.trim() || null,
          ativo: colaborador.ativo ?? true,
          podeVerDenuncias:
            colaborador.podeVerDenuncias ?? true,
          podeTratarDenuncias:
            colaborador.podeTratarDenuncias ?? true,
        },
        select: {
          id: true,
          clienteId: true,
          usuarioId: true,
          nome: true,
          email: true,
          telefone: true,
          setor: true,
          cargo: true,
          ativo: true,
          podeVerDenuncias: true,
          podeTratarDenuncias: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      });
    });
  }

  static async excluir(
    id: string,
    clienteId: string
  ): Promise<void> {
    const colaborador = await prisma.colaboradorCliente.findFirst({
      where: {
        id,
        clienteId,
      },
      select: {
        id: true,
        usuarioId: true,
      },
    });

    if (!colaborador) {
      throw new Error("Colaborador não encontrado.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.colaboradorCliente.delete({
        where: {
          id: colaborador.id,
        },
      });

      if (colaborador.usuarioId) {
        await tx.usuario.delete({
          where: {
            id: colaborador.usuarioId,
          },
        });
      }
    });
  }
}