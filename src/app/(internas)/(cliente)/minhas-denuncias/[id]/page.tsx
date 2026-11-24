import {
  auth,
} from "@/src/auth";

import {
  DestinoTratativaDenuncia,
  PerfilUsuario,
} from "@prisma/client";

import {
  prisma,
} from "@/src/lib/prisma";

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
  const session =
    await auth();

  if (
    !session?.user
  ) {
    redirect(
      "/login"
    );
  }

  const usuario =
    session.user as {
      id?: string;
      perfil?: PerfilUsuario;
      clienteId?: string | null;
    };

  const usuarioCliente =
    usuario.perfil ===
    PerfilUsuario.CLIENTE;

  const usuarioComite =
    usuario.perfil ===
    PerfilUsuario.COMITE_CLIENTE;

  if (
    (
      !usuarioCliente &&
      !usuarioComite
    ) ||
    !usuario.clienteId
  ) {
    redirect(
      "/painel-controle"
    );
  }

  if (
    usuarioCliente
  ) {
    redirect(
      "/minhas-denuncias"
    );
  }

  if (
    !usuario.id
  ) {
    redirect(
      "/painel-controle"
    );
  }

  const {
    id,
  } =
    await params;

  const denunciaId =
    id?.trim();

  if (
    !denunciaId
  ) {
    notFound();
  }

  const colaborador =
    await prisma.colaboradorCliente.findFirst({
      where: {
        usuarioId:
          usuario.id,

        clienteId:
          usuario.clienteId,

        ativo:
          true,
      },

      select: {
        id:
          true,

        podeVerDenuncias:
          true,

        podeTratarDenuncias:
          true,
      },
    });

  if (
    !colaborador ||
    !colaborador.podeVerDenuncias
  ) {
    redirect(
      "/painel-controle"
    );
  }

  const denuncia =
    await prisma.denuncia.findFirst({
      where: {
        id:
          denunciaId,

        clienteId:
          usuario.clienteId,

        tratativaLiberada:
          true,

        OR: [
          {
            destinoTratativa:
              DestinoTratativaDenuncia.COLABORADOR,

            colaboradorResponsavelId:
              colaborador.id,
          },

          {
            visualizadores: {
              some: {
                colaboradorId:
                  colaborador.id,
              },
            },
          },
        ],
      },

      select: {
        id:
          true,

        colaboradorResponsavelId:
          true,

        visualizadores: {
          where: {
            colaboradorId:
              colaborador.id,
          },

          select: {
            colaboradorId:
              true,
          },

          take:
            1,
        },
      },
    });

  if (
    !denuncia
  ) {
    notFound();
  }

  const responsavelPrincipal =
    denuncia.colaboradorResponsavelId ===
    colaborador.id;

  const responsavelAdicional =
    denuncia.visualizadores.length >
    0;

  const autorizadoNaDenuncia =
    responsavelPrincipal ||
    responsavelAdicional;

  const podeExecutarTratativas =
    autorizadoNaDenuncia &&
    colaborador.podeTratarDenuncias ===
      true;

  return (
    <DenunciaDetalheTela
      id={
        denunciaId
      }
      contexto="cliente"
      podeGerenciar={
        false
      }
      podeLiberarTratativa={
        false
      }
      podeVerTratativas={
        podeExecutarTratativas
      }
      podeTratar={
        podeExecutarTratativas
      }
      podeEditarTratativas={
        podeExecutarTratativas
      }
      colaboradorLogadoId={
        colaborador.id
      }
      colaboradoresDisponiveis={
        []
      }
    />
  );
}
