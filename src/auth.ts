import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PerfilUsuario } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

type UsuarioAutenticado = {
  id: string;
  perfil: PerfilUsuario;
  clienteId: string | null;
};

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "E-mail",
          type: "email",
        },
        senha: {
          label: "Senha",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email = String(
          credentials?.email ?? ""
        )
          .trim()
          .toLowerCase();

        const senha = String(credentials?.senha ?? "");

        if (!email || !senha) {
          return null;
        }

        const usuario = await prisma.usuario.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
            nome: true,
            email: true,
            senha: true,
            perfil: true,
            ativo: true,
            clienteId: true,
            cliente: {
              select: {
                ativo: true,
              },
            },
          },
        });

        if (!usuario || !usuario.ativo) {
          return null;
        }

        if (
          (
            usuario.perfil === PerfilUsuario.CLIENTE ||
            usuario.perfil === PerfilUsuario.COMITE_CLIENTE
          ) &&
          (!usuario.clienteId || !usuario.cliente?.ativo)
        ) {
          return null;
        }

        const senhaValida = await bcrypt.compare(
          senha,
          usuario.senha
        );

        if (!senhaValida) {
          return null;
        }

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          clienteId: usuario.clienteId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const usuario = user as typeof user &
          UsuarioAutenticado;

        token.id = usuario.id;
        token.perfil = usuario.perfil;
        token.clienteId = usuario.clienteId;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const usuarioSessao = session.user as typeof session.user &
          UsuarioAutenticado;

        usuarioSessao.id = String(token.id ?? "");
        usuarioSessao.perfil =
          token.perfil as PerfilUsuario;
        usuarioSessao.clienteId =
          typeof token.clienteId === "string"
            ? token.clienteId
            : null;
      }

      return session;
    },
  },
});