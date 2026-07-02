import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {},
        senha: {},
      },

      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const senha = String(credentials?.senha ?? "");

        if (!email || !senha) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email },
          select: {
            id: true,
            nome: true,
            email: true,
            senha: true,
            perfil: true,
            ativo: true,
            clienteId: true,
          },
        });

        if (!usuario || !usuario.ativo) return null;

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) return null;

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
        token.id = user.id;
        token.perfil = (user as any).perfil;
        token.clienteId = (user as any).clienteId;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).perfil = token.perfil;
        (session.user as any).clienteId = token.clienteId;
      }

      return session;
    },
  },
});