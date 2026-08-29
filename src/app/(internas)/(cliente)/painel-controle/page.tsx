import type { ReactNode } from "react";

import { auth } from "@/src/auth";

import {
  PerfilUsuario,
  Prisma,
  TipoModuloPesquisa,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

import { redirect } from "next/navigation";

export default async function ClienteDashboardPage() {
  const session = await auth();

  /*
   * Somente ausência real de autenticação
   * deve redirecionar para o login.
   */
  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    id?: string;
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const administradorCliente =
    usuario.perfil === PerfilUsuario.CLIENTE;

  const membroComite =
    usuario.perfil ===
    PerfilUsuario.COMITE_CLIENTE;

  const podeAcessarPainel =
    administradorCliente ||
    membroComite;

  /*
   * Usuário autenticado, mas de outro painel.
   * Não deve ser enviado novamente ao login.
   */
  if (!podeAcessarPainel) {
    redirect("/dashboard");
  }

  if (!usuario.clienteId) {
    return (
      <AcessoIndisponivel
        titulo="Cliente não vinculado"
        descricao="Seu usuário está autenticado, mas não possui uma empresa vinculada. Solicite a correção do cadastro à Mundial."
      />
    );
  }

  const clienteId =
    usuario.clienteId;

  let colaboradorId:
    | string
    | null = null;

  /*
   * Validação específica do membro do comitê.
   */
  if (membroComite) {
    if (!usuario.id) {
      return (
        <AcessoIndisponivel
          titulo="Usuário não identificado"
          descricao="Não foi possível identificar seu usuário na sessão. Saia da plataforma e entre novamente."
        />
      );
    }

    const colaborador =
      await prisma.colaboradorCliente.findFirst({
        where: {
          usuarioId: usuario.id,
          clienteId,
          ativo: true,
        },

        select: {
          id: true,
          podeVerDenuncias: true,
        },
      });

    if (!colaborador) {
      return (
        <AcessoIndisponivel
          titulo="Vínculo do comitê não localizado"
          descricao="Seu usuário não está vinculado a um colaborador ativo desta empresa."
        />
      );
    }

    if (!colaborador.podeVerDenuncias) {
      return (
        <AcessoIndisponivel
          titulo="Acesso às denúncias desativado"
          descricao="Seu cadastro existe, mas não possui permissão para visualizar denúncias."
        />
      );
    }

    colaboradorId =
      colaborador.id;
  }

  const cliente =
    await prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },

      select: {
        id: true,
        nome: true,
        empresa: true,
        ativo: true,
      },
    });

  if (!cliente) {
    return (
      <AcessoIndisponivel
        titulo="Empresa não encontrada"
        descricao="A empresa vinculada ao seu usuário não foi localizada."
      />
    );
  }

  if (!cliente.ativo) {
    return (
      <AcessoIndisponivel
        titulo="Empresa desativada"
        descricao="O acesso desta empresa está temporariamente desativado. Entre em contato com a Mundial."
      />
    );
  }

  /*
   * O cliente master acompanha todos os protocolos
   * da empresa.
   *
   * O membro do comitê acompanha somente denúncias
   * em que seja responsável ou visualizador adicional.
   */
  const filtroDenuncias:
    Prisma.DenunciaWhereInput =
    administradorCliente
      ? {
          clienteId,
        }
      : {
          clienteId,
          tratativaLiberada: true,

          OR: [
            {
              destinoTratativa:
                "COLABORADOR",

              colaboradorResponsavelId:
                colaboradorId!,
            },

            {
              visualizadores: {
                some: {
                  colaboradorId:
                    colaboradorId!,
                },
              },
            },
          ],
        };

  const [
    pesquisas,
    pesquisasAbertas,
    respostas,

    climaTotal,
    climaAbertas,
    climaRespostas,

    desempenhoTotal,
    desempenhoAbertas,
    desempenhoRespostas,

    psicossocialTotal,
    psicossocialAbertas,
    psicossocialRespostas,

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


    /* ===============================================
     * PESQUISA DE CLIMA
     * ============================================= */

    administradorCliente
      ? prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo:
              TipoModuloPesquisa.CLIMA,
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo:
              TipoModuloPesquisa.CLIMA,
            status:
              "ABERTA",
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.respostaPesquisa.count({
          where: {
            pesquisa: {
              clienteId,
              tipo:
                TipoModuloPesquisa.CLIMA,
            },
          },
        })
      : Promise.resolve(0),


    /* ===============================================
     * AVALIAÇÃO DE DESEMPENHO
     * ============================================= */

    administradorCliente
      ? prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo:
              TipoModuloPesquisa.AVALIACAO_DESEMPENHO,
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo:
              TipoModuloPesquisa.AVALIACAO_DESEMPENHO,
            status:
              "ABERTA",
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.respostaPesquisa.count({
          where: {
            pesquisa: {
              clienteId,
              tipo:
                TipoModuloPesquisa.AVALIACAO_DESEMPENHO,
            },
          },
        })
      : Promise.resolve(0),


    /* ===============================================
     * AVALIAÇÃO PSICOSSOCIAL
     * ============================================= */

    administradorCliente
      ? prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo:
              TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo:
              TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
            status:
              "ABERTA",
          },
        })
      : Promise.resolve(0),

    administradorCliente
      ? prisma.respostaPesquisa.count({
          where: {
            pesquisa: {
              clienteId,
              tipo:
                TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
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
              in: [
                "AGENDADO",
                "REAGENDADO",
              ],
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
      where: filtroDenuncias,
    }),

    prisma.denuncia.count({
      where: {
        AND: [
          filtroDenuncias,
          {
            status: "EM_ANALISE",
          },
        ],
      },
    }),

    prisma.denuncia.count({
      where: {
        AND: [
          filtroDenuncias,
          {
            status: "EM_TRATATIVA",
          },
        ],
      },
    }),

    prisma.denuncia.count({
      where: {
        AND: [
          filtroDenuncias,
          {
            status: "CONCLUIDA",
          },
        ],
      },
    }),

    prisma.denuncia.count({
      where: {
        AND: [
          filtroDenuncias,

          {
            gravidade: "CRITICA",

            status: {
              notIn: [
                "CONCLUIDA",
                "ARQUIVADA",
              ],
            },
          },
        ],
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            {cliente.empresa ||
              cliente.nome ||
              "Minha empresa"}
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
            {administradorCliente
              ? "Visão executiva da Pesquisa de Clima, Avaliação de Desempenho, Avaliação Psicossocial, planos de ação, agendamentos e protocolos de denúncias da empresa."
              : "Painel do comitê responsável pelo acompanhamento das denúncias disponibilizadas para o seu usuário."}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {administradorCliente && (
          <>
            <Bloco titulo="Visão geral">
              <Card
                titulo="Aplicações"
                valor={pesquisas}
              />

              <Card
                titulo="Aplicações abertas"
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


            <section>
              <h2 className="mb-3 text-base font-black text-slate-900 sm:text-lg">
                Pesquisas e avaliações
              </h2>

              <div className="grid gap-5 lg:grid-cols-3">
                <CardModulo
                  titulo="Pesquisa de Clima"
                  descricao="Favorabilidade e percepção dos colaboradores."
                  total={climaTotal}
                  abertas={climaAbertas}
                  respostas={climaRespostas}
                  variante="clima"
                />

                <CardModulo
                  titulo="Avaliação de Desempenho"
                  descricao="Competências, pontos fortes, pontos de atenção e prioridades de desenvolvimento."
                  total={desempenhoTotal}
                  abertas={desempenhoAbertas}
                  respostas={desempenhoRespostas}
                  variante="desempenho"
                />

                <CardModulo
                  titulo="Avaliação Psicossocial"
                  descricao="Exposição aos fatores psicossociais relacionados ao trabalho."
                  total={psicossocialTotal}
                  abertas={psicossocialAbertas}
                  respostas={psicossocialRespostas}
                  variante="psicossocial"
                />
              </div>
            </section>
          </>
        )}

        <Bloco titulo="Canal de denúncias">
          <Card
            titulo={
              administradorCliente
                ? "Protocolos registrados"
                : "Denúncias disponíveis"
            }
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

function AcessoIndisponivel({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
          !
        </div>

        <h1 className="mt-5 text-xl font-black text-slate-900">
          {titulo}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {descricao}
        </p>

        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Voltar
        </a>
      </section>
    </main>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
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

function CardModulo({
  titulo,
  descricao,
  total,
  abertas,
  respostas,
  variante,
}: {
  titulo: string;
  descricao: string;
  total: number;
  abertas: number;
  respostas: number;
  variante:
    | "clima"
    | "desempenho"
    | "psicossocial";
}) {
  const classes =
    variante ===
    "desempenho"
      ? {
          badge:
            "bg-indigo-100 text-indigo-700",
          numero:
            "text-indigo-700",
        }
      : variante ===
          "psicossocial"
        ? {
            badge:
              "bg-amber-100 text-amber-800",
            numero:
              "text-amber-700",
          }
        : {
            badge:
              "bg-blue-100 text-blue-700",
            numero:
              "text-blue-700",
          };


  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${classes.badge}`}
      >
        Modalidade
      </span>

      <h3 className="mt-3 text-lg font-black text-slate-900">
        {
          titulo
        }
      </h3>

      <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
        {
          descricao
        }
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <MiniMetrica
          titulo="Aplicações"
          valor={
            total
          }
          classe={
            classes.numero
          }
        />

        <MiniMetrica
          titulo="Abertas"
          valor={
            abertas
          }
          classe={
            classes.numero
          }
        />

        <MiniMetrica
          titulo="Respostas"
          valor={
            respostas
          }
          classe={
            classes.numero
          }
        />
      </div>
    </article>
  );
}


function MiniMetrica({
  titulo,
  valor,
  classe,
}: {
  titulo: string;
  valor: number;
  classe: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500">
        {
          titulo
        }
      </p>

      <strong
        className={`mt-1 block text-xl font-black ${classe}`}
      >
        {
          valor
        }
      </strong>
    </div>
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
          destaque
            ? "text-red-700"
            : "text-slate-500"
        }`}
      >
        {titulo}
      </p>

      <strong
        className={`mt-2 block text-3xl font-black sm:text-4xl ${
          destaque
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {valor}
      </strong>
    </div>
  );
}