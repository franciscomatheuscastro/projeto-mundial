import { auth } from "@/src/auth";

import {
  DestinoTratativaDenuncia,
  PerfilUsuario,
} from "@prisma/client";

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
    redirect("/painel-controle");
  }

  /*
   * O cliente master pode acompanhar apenas
   * protocolo, status e datas na listagem.
   * Mesmo digitando a URL manualmente, ele
   * não pode acessar os detalhes.
   */
  if (usuarioCliente) {
    redirect("/minhas-denuncias");
  }

  if (!usuario.id) {
    redirect("/painel-controle");
  }

  const { id } = await params;

  const denunciaId = id?.trim();

  if (!denunciaId) {
    notFound();
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

  if (
    !colaborador ||
    !colaborador.podeVerDenuncias
  ) {
    redirect("/painel-controle");
  }

  /*
   * O comitê pode abrir a denúncia quando:
   *
   * 1. for o responsável principal; ou
   * 2. estiver na lista de visualizadores.
   */
  const denuncia =
    await prisma.denuncia.findFirst({
      where: {
        id: denunciaId,
        clienteId: usuario.clienteId,
        tratativaLiberada: true,

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
        id: true,
        destinoTratativa: true,
        colaboradorResponsavelId: true,
      },
    });

  if (!denuncia) {
    notFound();
  }

  const responsavelPrincipal =
    denuncia.destinoTratativa ===
      DestinoTratativaDenuncia.COLABORADOR &&
    denuncia.colaboradorResponsavelId ===
      colaborador.id;

  /*
   * Somente o responsável principal pode
   * ver, criar e editar tratativas.
   *
   * O visualizador adicional acessa os dados
   * da denúncia em modo somente leitura.
   */
  const podeExecutarTratativas =
    responsavelPrincipal &&
    colaborador.podeTratarDenuncias === true;

  return (
    <DenunciaDetalheTela
      id={denunciaId}
      contexto="cliente"
      podeGerenciar={false}
      podeLiberarTratativa={false}
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
      colaboradoresDisponiveis={[]}
    />
  );
}
