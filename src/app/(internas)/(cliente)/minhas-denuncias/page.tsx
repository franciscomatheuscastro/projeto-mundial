import { auth } from "@/src/auth";

import { PerfilUsuario } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

import { redirect } from "next/navigation";

import DenunciasTela from "@/src/app/components/denuncias/DenunciasTela";

export default async function ClienteDenunciasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    id?: string;
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const usuarioCliente =
    usuario.perfil === PerfilUsuario.CLIENTE;

  const usuarioComite =
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE;

  if (
    (!usuarioCliente && !usuarioComite) ||
    !usuario.clienteId
  ) {
    redirect("/dashboard");
  }

  if (usuarioComite) {
    if (!usuario.id) {
      redirect("/painel-controle");
    }

    const colaborador =
      await prisma.colaboradorCliente.findFirst({
        where: {
          usuarioId: usuario.id,
          clienteId: usuario.clienteId,
          ativo: true,
        },

        select: {
          podeVerDenuncias: true,
        },
      });

    if (!colaborador?.podeVerDenuncias) {
      redirect("/painel-controle");
    }
  }

  return (
    <DenunciasTela
      contexto="cliente"
      podeCriar={false}
    />
  );
}