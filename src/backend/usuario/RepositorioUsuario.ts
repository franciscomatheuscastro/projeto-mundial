import bcrypt from "bcryptjs";
import { PerfilUsuario } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  Usuario,
  UsuarioSemSenha,
} from "@/src/core/model/Usuario";

export default class RepositorioUsuario {
  private static perfilVinculadoACliente(perfil: PerfilUsuario): boolean {
    return (
      perfil === PerfilUsuario.CLIENTE ||
      perfil === PerfilUsuario.COMITE_CLIENTE
    );
  }

  static async salvar(usuario: Usuario): Promise<UsuarioSemSenha> {
    const nome = usuario.nome?.trim();
    const email = usuario.email?.trim().toLowerCase();

    if (!nome) {
      throw new Error("Nome é obrigatório.");
    }

    if (!email) {
      throw new Error("E-mail é obrigatório.");
    }

    if (
      this.perfilVinculadoACliente(usuario.perfil) &&
      !usuario.clienteId
    ) {
      throw new Error(
        "Este perfil precisa estar vinculado a um cliente."
      );
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
      },
    });

    if (!usuario.id && usuarioExistente) {
      throw new Error("E-mail já cadastrado.");
    }

    if (
      usuario.id &&
      usuarioExistente &&
      usuarioExistente.id !== usuario.id
    ) {
      throw new Error("E-mail já cadastrado para outro usuário.");
    }

    let senhaCriptografada: string | undefined;

    if (usuario.senha?.trim()) {
      senhaCriptografada = await bcrypt.hash(usuario.senha, 10);
    }

    const clienteId = this.perfilVinculadoACliente(usuario.perfil)
      ? usuario.clienteId
      : null;

    if (usuario.id) {
      return prisma.usuario.update({
        where: {
          id: usuario.id,
        },
        data: {
          nome,
          email,
          perfil: usuario.perfil,
          ativo: usuario.ativo ?? true,
          clienteId,
          ...(senhaCriptografada
            ? { senha: senhaCriptografada }
            : {}),
        },
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true,
          clienteId: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      });
    }

    if (!senhaCriptografada) {
      throw new Error("Senha é obrigatória para novo usuário.");
    }

    return prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
        perfil: usuario.perfil ?? PerfilUsuario.RECEPCAO,
        ativo: usuario.ativo ?? true,
        clienteId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        clienteId: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });
  }

  static async obterTodos(): Promise<UsuarioSemSenha[]> {
    return prisma.usuario.findMany({
      orderBy: {
        nome: "asc",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        clienteId: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });
  }

  static async obterPorId(id: string): Promise<UsuarioSemSenha> {
    const usuario = await prisma.usuario.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        clienteId: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    return usuario;
  }

  static async excluir(id: string): Promise<void> {
    await prisma.usuario.delete({
      where: {
        id,
      },
    });
  }
}