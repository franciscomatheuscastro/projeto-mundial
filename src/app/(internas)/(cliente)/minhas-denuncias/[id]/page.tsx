import { auth } from "@/src/auth";

import { PerfilUsuario } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

import {
  notFound,
  redirect,
} from "next/navigation";

import DenunciaDetalheTela from "@/src/app/components/denuncias/DenunciaDetalheTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClienteDenunciaDetalhePage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    id?: string;
    nome?: string | null;
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const usuarioCliente =
    usuario.perfil === PerfilUsuario.CLIENTE;

  const usuarioComite =
    usuario.perfil ===
    PerfilUsuario.COMITE_CLIENTE;

  if (
    (!usuarioCliente && !usuarioComite) ||
    !usuario.clienteId
  ) {
    redirect("/dashboard");
  }

  const { id } = await params;

  if (!id?.trim()) {
    notFound();
  }

  /*
   * Confirma que a denúncia pertence ao cliente
   * vinculado ao usuário autenticado.
   */
  const denuncia =
    await prisma.denuncia.findFirst({
      where: {
        id,
        clienteId: usuario.clienteId,
      },

      select: {
        id: true,
      },
    });

  if (!denuncia) {
    notFound();
  }

  let podeVerTratativas = false;
  let podeTratar = false;
  let podeEditarTratativas = false;
  let colaboradorLogadoId:
    | string
    | null = null;

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
          id: true,
          podeVerDenuncias: true,
          podeTratarDenuncias: true,
        },
      });

    if (!colaborador?.podeVerDenuncias) {
      redirect("/painel-controle");
    }

    colaboradorLogadoId =
      colaborador.id;

    podeVerTratativas =
      colaborador.podeTratarDenuncias ===
      true;

    podeTratar =
      colaborador.podeTratarDenuncias ===
      true;

    podeEditarTratativas =
      colaborador.podeTratarDenuncias ===
      true;
  }

  return (
    <DenunciaDetalheTela
      id={id}
      contexto="cliente"

      podeGerenciar={false}

      podeVerTratativas={
        podeVerTratativas
      }

      podeTratar={podeTratar}

      podeEditarTratativas={
        podeEditarTratativas
      }

      podeAtribuirResponsavel={false}

      colaboradorLogadoId={
        colaboradorLogadoId
      }

      colaboradoresDisponiveis={[]}
    />
  );
}