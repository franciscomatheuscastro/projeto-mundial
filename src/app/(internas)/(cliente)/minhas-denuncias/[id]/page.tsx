import { auth } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
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
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const podeAcessar =
    usuario.perfil === PerfilUsuario.CLIENTE ||
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE;

  if (!podeAcessar || !usuario.clienteId) {
    redirect("/dashboard");
  }

  const { id } = await params;

  let podeTratar = false;

  if (
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE &&
    usuario.id
  ) {
    const colaborador =
      await prisma.colaboradorCliente.findFirst({
        where: {
          usuarioId: usuario.id,
          clienteId: usuario.clienteId,
          ativo: true,
        },
        select: {
          podeVerDenuncias: true,
          podeTratarDenuncias: true,
        },
      });

    if (!colaborador?.podeVerDenuncias) {
      redirect("/painel-controle");
    }

    podeTratar =
      colaborador.podeTratarDenuncias === true;
  }

  return (
    <DenunciaDetalheTela
      id={id}
      contexto="cliente"
      podeGerenciar={false}
      podeTratar={podeTratar}
    />
  );
}