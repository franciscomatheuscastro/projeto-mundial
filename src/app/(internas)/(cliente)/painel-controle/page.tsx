import { auth } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";

export default async function ClienteDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    id?: string;
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const podeAcessarPainel =
    usuario.perfil === PerfilUsuario.CLIENTE ||
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE;

  if (!podeAcessarPainel) {
    redirect("/dashboard");
  }

  if (!usuario.clienteId) {
    redirect("/login");
  }

  const clienteId = usuario.clienteId;

  const administradorCliente =
    usuario.perfil === PerfilUsuario.CLIENTE;

  const membroComite =
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE;

  /*
   * O colaborador do comitê precisa estar ativo e ter
   * permissão para visualizar denúncias.
   */
  if (membroComite) {
    if (!usuario.id) {
      redirect("/login");
    }

    const colaborador =
      await prisma.colaboradorCliente.findFirst({
        where: {
          usuarioId: usuario.id,
          clienteId,
          ativo: true,
        },
        select: {
          podeVerDenuncias: true,
        },
      });

    if (!colaborador?.podeVerDenuncias) {
      redirect("/login");
    }
  }

  const [
    cliente,
    pesquisas,
    pesquisasAbertas,
    respostas,
    planosAcao,
    planosEmAndamento,
    agendamentos,
    proximosAgendamentos,
    denuncias,
    denunciasAnalise,
    denunciasTratativa,
    denunciasConcluidas,
    denunciasCriticas,
  ] = await Promise.all([
    prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
      select: {
        id: true,
        nome: true,
        empresa: true,
        ativo: true,
      },
    }),

    administradorCliente
      ? prisma.pesquisaCliente.count({
          where: {
            clienteId,
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.pesquisaCliente.count({
          where: {
            clienteId,
            status: "ABERTA",
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.respostaPesquisa.count({
          where: {
            pesquisa: {
              clienteId,
            },
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.planoAcao.count({
          where: {
            OR: [
              {
                pesquisa: {
                  clienteId,
                },
              },
              {
                denuncia: {
                  clienteId,
                },
              },
            ],
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.planoAcao.count({
          where: {
            status: "EM_ANDAMENTO",
            OR: [
              {
                pesquisa: {
                  clienteId,
                },
              },
              {
                denuncia: {
                  clienteId,
                },
              },
            ],
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.agendamento.count({
          where: {
            planoAcao: {
              OR: [
                {
                  pesquisa: {
                    clienteId,
                  },
                },
                {
                  denuncia: {
                    clienteId,
                  },
                },
              ],
            },
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.agendamento.count({
          where: {
            dataHora: {
              gte: new Date(),
            },
            status: {
              in: ["AGENDADO", "REAGENDADO"],
            },
            planoAcao: {
              OR: [
                {
                  pesquisa: {
                    clienteId,
                  },
                },
                {
                  denuncia: {
                    clienteId,
                  },
                },
              ],
            },
          },
        })
      : Promise.resolve(0),

    prisma.denuncia.count({
      where: {
        clienteId,
      },
    }),

    prisma.denuncia.count({
      where: {
        clienteId,
        status: "EM_ANALISE",
      },
    }),

    prisma.denuncia.count({
      where: {
        clienteId,
        status: "EM_TRATATIVA",
      },
    }),

    prisma.denuncia.count({
      where: {
        clienteId,
        status: "CONCLUIDA",
      },
    }),

    prisma.denuncia.count({
      where: {
        clienteId,
        gravidade: "CRITICA",
        status: {
          notIn: ["CONCLUIDA", "ARQUIVADA"],
        },
      },
    }),
  ]);

  if (!cliente || !cliente.ativo) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            {cliente.empresa || cliente.nome || "Minha empresa"}
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
            {administradorCliente
              ? "Visão executiva das pesquisas, planos de ação, agendamentos e denúncias da empresa."
              : "Painel do comitê responsável pelo acompanhamento e tratativa das denúncias da empresa."}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {administradorCliente && (
          <Bloco titulo="Pesquisa de clima">
            <Card titulo="Pesquisas" valor={pesquisas} />

            <Card
              titulo="Pesquisas abertas"
              valor={pesquisasAbertas}
            />

            <Card
              titulo="Respostas recebidas"
              valor={respostas}
            />

            <Card
              titulo="Planos de ação"
              valor={planosAcao}
            />

            <Card
              titulo="Planos em andamento"
              valor={planosEmAndamento}
            />

            <Card
              titulo="Agendamentos"
              valor={agendamentos}
            />

            <Card
              titulo="Próximos agendamentos"
              valor={proximosAgendamentos}
            />
          </Bloco>
        )}

        <Bloco titulo="Canal de denúncias">
          <Card
            titulo="Denúncias recebidas"
            valor={denuncias}
          />

          <Card
            titulo="Em análise"
            valor={denunciasAnalise}
          />

          <Card
            titulo="Em tratativa"
            valor={denunciasTratativa}
          />

          <Card
            titulo="Concluídas"
            valor={denunciasConcluidas}
          />

          <Card
            titulo="Críticas em aberto"
            valor={denunciasCriticas}
            destaque
          />
        </Bloco>
      </section>
    </main>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-black text-slate-900 sm:text-lg">
        {titulo}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

function Card({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
        destaque
          ? "bg-red-50 ring-red-200"
          : "bg-white ring-slate-200"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          destaque ? "text-red-700" : "text-slate-500"
        }`}
      >
        {titulo}
      </p>

      <strong
        className={`mt-2 block text-3xl font-black sm:text-4xl ${
          destaque ? "text-red-600" : "text-slate-900"
        }`}
      >
        {valor}
      </strong>
    </div>
  );
}