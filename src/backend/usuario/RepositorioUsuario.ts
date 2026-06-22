import bcrypt from "bcryptjs";
import { PerfilUsuario } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { Usuario, UsuarioSemSenha } from "@/src/core/model/Usuario";

export default class RepositorioUsuario {
  static async salvar(usuario: Usuario): Promise<UsuarioSemSenha> {
    const email = usuario.email.trim().toLowerCase();

    if (!usuario.nome?.trim()) {
      throw new Error("Nome é obrigatório.");
    }

    if (!email) {
      throw new Error("E-mail é obrigatório.");
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario.id && usuarioExistente) {
      throw new Error("E-mail já cadastrado.");
    }

    let senhaCriptografada: string | undefined;

    if (usuario.senha) {
      senhaCriptografada = await bcrypt.hash(usuario.senha, 10);
    }

    if (usuario.id) {
      return prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          nome: usuario.nome,
          email,
          perfil: usuario.perfil,
          ativo: usuario.ativo ?? true,
          ...(senhaCriptografada && { senha: senhaCriptografada }),
        },
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      });
    }

    if (!usuario.senha) {
      throw new Error("Senha é obrigatória para novo usuário.");
    }

    return prisma.usuario.create({
      data: {
        nome: usuario.nome,
        email,
        senha: senhaCriptografada!,
        perfil: usuario.perfil ?? PerfilUsuario.RECEPCAO,
        ativo: usuario.ativo ?? true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
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
        criadoEm: true,
        atualizadoEm: true,
      },
    });
  }

  static async obterPorId(id: string): Promise<UsuarioSemSenha> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
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
      where: { id },
    });
  }
}