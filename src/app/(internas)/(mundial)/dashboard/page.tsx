import type React from "react";

import Link from "next/link";

import {
  OrigemAtorDenuncia,
  PerfilUsuario,
  TipoEventoDenuncia,
  TipoModuloPesquisa,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

type DashboardPageProps = {
  searchParams: Promise<{
    clienteId?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: PerfilUsuario;
  };

  /*
   * Perfis externos possuem ambientes próprios e nunca
   * devem visualizar o dashboard administrativo da Mundial.
   */
  if (usuario.perfil === PerfilUsuario.GESTOR_CLIENTE) {
    redirect("/painel-controle");
  }

  if (
    usuario.perfil === PerfilUsuario.CLIENTE ||
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE
  ) {
    redirect("/painel-controle");
  }

  /*
   * Somente perfis internos conhecidos da Mundial podem
   * permanecer nesta página.
   */
  const perfisMundial: PerfilUsuario[] = [
    PerfilUsuario.ADMIN,
    PerfilUsuario.GESTOR,
    PerfilUsuario.PSICOLOGO,
    PerfilUsuario.ASSISTENTE_SOCIAL,
    PerfilUsuario.RECEPCAO,
  ];

  if (
    !usuario.perfil ||
    !perfisMundial.includes(usuario.perfil)
  ) {
    redirect("/login");
  }

  const params = await searchParams;

  const clienteId =
    params?.clienteId ||
    "todos";

  const temFiltroCliente =
    clienteId !==
    "todos";

  const clientesLista =
    await prisma.cliente.findMany({
      orderBy: {
        nome:
          "asc",
      },

      select: {
        id:
          true,

        nome:
          true,

        empresa:
          true,
      },
    });

  const wherePesquisaCliente =
    temFiltroCliente
      ? {
          clienteId,
        }
      : undefined;

  const whereRespostaPesquisa =
    temFiltroCliente
      ? {
          pesquisa: {
            clienteId,
          },
        }
      : undefined;

  const wherePlanoAcao =
    temFiltroCliente
      ? {
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
        }
      : undefined;

  const whereAgendamento =
    temFiltroCliente
      ? {
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
        }
      : undefined;

  const whereDenuncia =
    temFiltroCliente
      ? {
          clienteId,
        }
      : undefined;

  const [
    clientes,
    modelos,
    pesquisas,
    pesquisasAbertas,
    pesquisasFechadas,
    respostas,
    planosAcao,
    agendamentos,
    denuncias,
    denunciasCriticas,

    climaTotal,
    climaAbertas,
    climaRespostas,

    desempenhoTotal,
    desempenhoAbertas,
    desempenhoRespostas,

    psicossocialTotal,
    psicossocialAbertas,
    psicossocialRespostas,

    pesquisasCliente,
    pesquisasAbertasCliente,
    pesquisasFechadasCliente,
    respostasCliente,
    planosAcaoCliente,
    agendamentosCliente,

    climaCliente,
    climaAbertasCliente,
    climaRespostasCliente,

    desempenhoCliente,
    desempenhoAbertasCliente,
    desempenhoRespostasCliente,

    psicossocialCliente,
    psicossocialAbertasCliente,
    psicossocialRespostasCliente,

    denunciasCliente,
    denunciasRecebidasCliente,
    denunciasAnaliseCliente,
    denunciasTratativaCliente,
    denunciasConcluidasCliente,
    denunciasCriticasCliente,
  ] =
    await Promise.all([
      prisma.cliente.count(),

      prisma.modeloPesquisa.count(),

      prisma.pesquisaCliente.count(),

      prisma.pesquisaCliente.count({
        where: {
          status:
            "ABERTA",
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          status:
            "FECHADA",
        },
      }),

      prisma.respostaPesquisa.count(),

      prisma.planoAcao.count(),

      prisma.agendamento.count(),

      prisma.denuncia.count(),

      prisma.denuncia.count({
        where: {
          gravidade:
            "CRITICA",
        },
      }),

      /* ===============================================
       * MÉTRICAS GERAIS POR MODALIDADE
       * ============================================= */

      prisma.pesquisaCliente.count({
        where: {
          tipo:
            TipoModuloPesquisa.CLIMA,
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          tipo:
            TipoModuloPesquisa.CLIMA,

          status:
            "ABERTA",
        },
      }),

      prisma.respostaPesquisa.count({
        where: {
          pesquisa: {
            tipo:
              TipoModuloPesquisa.CLIMA,
          },
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          tipo:
            TipoModuloPesquisa.AVALIACAO_DESEMPENHO,
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          tipo:
            TipoModuloPesquisa.AVALIACAO_DESEMPENHO,

          status:
            "ABERTA",
        },
      }),

      prisma.respostaPesquisa.count({
        where: {
          pesquisa: {
            tipo:
              TipoModuloPesquisa.AVALIACAO_DESEMPENHO,
          },
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          tipo:
            TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          tipo:
            TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,

          status:
            "ABERTA",
        },
      }),

      prisma.respostaPesquisa.count({
        where: {
          pesquisa: {
            tipo:
              TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
          },
        },
      }),

      /* ===============================================
       * MÉTRICAS DO CLIENTE SELECIONADO
       * ============================================= */

      prisma.pesquisaCliente.count({
        where:
          wherePesquisaCliente,
      }),

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          status:
            "ABERTA",
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          status:
            "FECHADA",
        },
      }),

      prisma.respostaPesquisa.count({
        where:
          whereRespostaPesquisa,
      }),

      prisma.planoAcao.count({
        where:
          wherePlanoAcao,
      }),

      prisma.agendamento.count({
        where:
          whereAgendamento,
      }),

      /* ===============================================
       * CLIENTE — PESQUISA DE CLIMA
       * ============================================= */

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          tipo:
            TipoModuloPesquisa.CLIMA,
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          tipo:
            TipoModuloPesquisa.CLIMA,

          status:
            "ABERTA",
        },
      }),

      prisma.respostaPesquisa.count({
        where: {
          pesquisa: {
            ...(temFiltroCliente
              ? {
                  clienteId,
                }
              : {}),

            tipo:
              TipoModuloPesquisa.CLIMA,
          },
        },
      }),

      /* ===============================================
       * CLIENTE — AVALIAÇÃO DE DESEMPENHO
       * ============================================= */

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          tipo:
            TipoModuloPesquisa.AVALIACAO_DESEMPENHO,
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          tipo:
            TipoModuloPesquisa.AVALIACAO_DESEMPENHO,

          status:
            "ABERTA",
        },
      }),

      prisma.respostaPesquisa.count({
        where: {
          pesquisa: {
            ...(temFiltroCliente
              ? {
                  clienteId,
                }
              : {}),

            tipo:
              TipoModuloPesquisa.AVALIACAO_DESEMPENHO,
          },
        },
      }),

      /* ===============================================
       * CLIENTE — GESTÃO DE RISCOS PSICOSSOCIAIS
       * ============================================= */

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          tipo:
            TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          tipo:
            TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,

          status:
            "ABERTA",
        },
      }),

      prisma.respostaPesquisa.count({
        where: {
          pesquisa: {
            ...(temFiltroCliente
              ? {
                  clienteId,
                }
              : {}),

            tipo:
              TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
          },
        },
      }),

      /* ===============================================
       * DENÚNCIAS
       * ============================================= */

      prisma.denuncia.count({
        where:
          whereDenuncia,
      }),

      prisma.denuncia.count({
        where: {
          ...whereDenuncia,

          status:
            "RECEBIDA",
        },
      }),

      prisma.denuncia.count({
        where: {
          ...whereDenuncia,

          status:
            "EM_ANALISE",
        },
      }),

      prisma.denuncia.count({
        where: {
          ...whereDenuncia,

          status:
            "EM_TRATATIVA",
        },
      }),

      prisma.denuncia.count({
        where: {
          ...whereDenuncia,

          status:
            "CONCLUIDA",
        },
      }),

      prisma.denuncia.count({
        where: {
          ...whereDenuncia,

          gravidade:
            "CRITICA",
        },
      }),
    ]);

  /*
   * Feed operacional do Canal de Denúncias.
   *
   * Mostra:
   * - novas denúncias recebidas;
   * - tratativas registradas pelo cliente/comitê do cliente.
   *
   * O filtro de cliente do dashboard também é respeitado.
   */
  const [
    novasDenunciasNotificacao,
    tratativasClienteNotificacao,
  ] = await Promise.all([
    prisma.denuncia.findMany({
      where: whereDenuncia,
      orderBy: {
        criadoEm: "desc",
      },
      take: 10,
      select: {
        id: true,
        protocolo: true,
        criadoEm: true,
        cliente: {
          select: {
            nome: true,
            empresa: true,
          },
        },
      },
    }),

    prisma.historicoDenuncia.findMany({
      where: {
        tipo:
          TipoEventoDenuncia.TRATATIVA_CRIADA,
        origemAtor: {
          in: [
            OrigemAtorDenuncia.CLIENTE,
            OrigemAtorDenuncia.COMITE_CLIENTE,
          ],
        },
        ...(temFiltroCliente
          ? {
              denuncia: {
                clienteId,
              },
            }
          : {}),
      },
      orderBy: {
        criadoEm: "desc",
      },
      take: 10,
      select: {
        id: true,
        atorNome: true,
        criadoEm: true,
        denuncia: {
          select: {
            id: true,
            protocolo: true,
            cliente: {
              select: {
                nome: true,
                empresa: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const notificacoesDenunciasMundial:
    NotificacaoDenunciaMundial[] = [
      ...novasDenunciasNotificacao.map(
        denuncia => ({
          id: `nova-${denuncia.id}`,
          tipo: "NOVA_DENUNCIA" as const,
          titulo: "Nova denúncia recebida",
          descricao: `${denuncia.cliente.empresa || denuncia.cliente.nome} registrou o protocolo ${denuncia.protocolo}.`,
          data: denuncia.criadoEm,
          href: `/denuncias/${denuncia.id}`,
        })
      ),

      ...tratativasClienteNotificacao.map(
        evento => ({
          id: `tratativa-${evento.id}`,
          tipo: "TRATATIVA_CLIENTE" as const,
          titulo: "Tratativa registrada pelo cliente",
          descricao: `${evento.atorNome || "Responsável do cliente"} registrou uma tratativa no protocolo ${evento.denuncia.protocolo} · ${evento.denuncia.cliente.empresa || evento.denuncia.cliente.nome}.`,
          data: evento.criadoEm,
          href: `/denuncias/${evento.denuncia.id}`,
        })
      ),
    ]
      .sort(
        (a, b) =>
          new Date(b.data).getTime() -
          new Date(a.data).getTime()
      )
      .slice(0, 10);

  const clienteSelecionado =
    clienteId ===
    "todos"
      ? "Todos os clientes"
      : clientesLista.find(
          cliente =>
            cliente.id ===
            clienteId
        )?.empresa ||
        clientesLista.find(
          cliente =>
            cliente.id ===
            clienteId
        )?.nome ||
        "Cliente selecionado";

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-slate-100">
      <header className="bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
              Dashboard
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Painel Mundial
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
              Visão executiva de Pesquisa de Clima, Avaliação de Desempenho,
              Gestão de Riscos Psicossociais, planos de ação e Canal de Denúncias.
            </p>
          </div>

          <SinoNotificacoesMundial
            notificacoes={notificacoesDenunciasMundial}
          />
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl min-w-0 space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
         * VISÃO GERAL
         * =============================================== */}

        <Bloco
          titulo="Visão geral da plataforma"
          descricao="Indicadores consolidados de toda a operação."
        >
          <Card
            titulo="Clientes"
            valor={
              clientes
            }
          />

          <Card
            titulo="Modelos"
            valor={
              modelos
            }
          />

          <Card
            titulo="Aplicações"
            valor={
              pesquisas
            }
          />

          <Card
            titulo="Respostas"
            valor={
              respostas
            }
          />

          <Card
            titulo="Abertas"
            valor={
              pesquisasAbertas
            }
          />

          <Card
            titulo="Fechadas"
            valor={
              pesquisasFechadas
            }
          />

          <Card
            titulo="Planos"
            valor={
              planosAcao
            }
          />

          <Card
            titulo="Agendamentos"
            valor={
              agendamentos
            }
          />

          <Card
            titulo="Denúncias"
            valor={
              denuncias
            }
          />

          <Card
            titulo="Denúncias críticas"
            valor={
              denunciasCriticas
            }
            destaque
          />
        </Bloco>

        {/* =================================================
         * MODALIDADES
         * =============================================== */}

        <section>
          <CabecalhoBloco
            titulo="Módulos de pesquisa e gestão"
            descricao="Acompanhamento dos principais módulos de pesquisa e gestão da plataforma."
          />

          <div className="grid gap-5 lg:grid-cols-3">
            <CardModulo
              titulo="Pesquisa de Clima"
              descricao="Favorabilidade e percepção dos colaboradores."
              total={
                climaTotal
              }
              abertas={
                climaAbertas
              }
              respostas={
                climaRespostas
              }
              variante="clima"
            />

            <CardModulo
              titulo="Avaliação de Desempenho"
              descricao="Competências, pontos fortes, pontos de atenção e prioridades de desenvolvimento."
              total={
                desempenhoTotal
              }
              abertas={
                desempenhoAbertas
              }
              respostas={
                desempenhoRespostas
              }
              variante="desempenho"
            />

            <CardModulo
              titulo="Gestão de Riscos Psicossociais"
              descricao="Exposição aos fatores psicossociais relacionados ao trabalho."
              total={
                psicossocialTotal
              }
              abertas={
                psicossocialAbertas
              }
              respostas={
                psicossocialRespostas
              }
              variante="psicossocial"
            />
          </div>
        </section>

        {/* =================================================
         * FILTRO CLIENTE
         * =============================================== */}

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                Indicadores por cliente
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-900">
                {
                  clienteSelecionado
                }
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Análise operacional da organização selecionada em todos os módulos.
              </p>
            </div>

            <form className="w-full lg:w-96">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Cliente
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  name="clienteId"
                  defaultValue={
                    clienteId
                  }
                  className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="todos">
                    Todos os clientes
                  </option>

                  {clientesLista.map(
                    cliente => (
                      <option
                        key={
                          cliente.id
                        }
                        value={
                          cliente.id
                        }
                      >
                        {cliente.empresa ||
                          cliente.nome}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="submit"
                  className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Filtrar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* =================================================
         * CLIENTE — VISÃO GERAL
         * =============================================== */}

        <Bloco
          titulo="Visão consolidada do cliente"
          descricao="Indicadores das pesquisas e atividades vinculadas ao filtro atual."
        >
          <Card
            titulo="Aplicações"
            valor={
              pesquisasCliente
            }
          />

          <Card
            titulo="Abertas"
            valor={
              pesquisasAbertasCliente
            }
          />

          <Card
            titulo="Fechadas"
            valor={
              pesquisasFechadasCliente
            }
          />

          <Card
            titulo="Respostas"
            valor={
              respostasCliente
            }
          />

          <Card
            titulo="Planos"
            valor={
              planosAcaoCliente
            }
          />

          <Card
            titulo="Agendamentos"
            valor={
              agendamentosCliente
            }
          />
        </Bloco>

        {/* =================================================
         * CLIENTE — MODALIDADES
         * =============================================== */}

        <section>
          <CabecalhoBloco
            titulo="Módulos do cliente"
            descricao="Distribuição das aplicações e respostas por modalidade."
          />

          <div className="grid gap-5 lg:grid-cols-3">
            <CardModulo
              titulo="Pesquisa de Clima"
              descricao="Aplicações e respostas da modalidade."
              total={
                climaCliente
              }
              abertas={
                climaAbertasCliente
              }
              respostas={
                climaRespostasCliente
              }
              variante="clima"
            />

            <CardModulo
              titulo="Avaliação de Desempenho"
              descricao="Aplicações e respostas da modalidade."
              total={
                desempenhoCliente
              }
              abertas={
                desempenhoAbertasCliente
              }
              respostas={
                desempenhoRespostasCliente
              }
              variante="desempenho"
            />

            <CardModulo
              titulo="Gestão de Riscos Psicossociais"
              descricao="Aplicações e respostas da modalidade."
              total={
                psicossocialCliente
              }
              abertas={
                psicossocialAbertasCliente
              }
              respostas={
                psicossocialRespostasCliente
              }
              variante="psicossocial"
            />
          </div>
        </section>

        {/* =================================================
         * DENÚNCIAS
         * =============================================== */}

        <Bloco
          titulo="Canal de denúncias"
          descricao="Status e criticidade dos registros do cliente selecionado."
        >
          <Card
            titulo="Denúncias"
            valor={
              denunciasCliente
            }
          />

          <Card
            titulo="Recebidas"
            valor={
              denunciasRecebidasCliente
            }
          />

          <Card
            titulo="Em análise"
            valor={
              denunciasAnaliseCliente
            }
          />

          <Card
            titulo="Em tratativa"
            valor={
              denunciasTratativaCliente
            }
          />

          <Card
            titulo="Concluídas"
            valor={
              denunciasConcluidasCliente
            }
          />

          <Card
            titulo="Críticas"
            valor={
              denunciasCriticasCliente
            }
            destaque
          />
        </Bloco>
      </section>
    </main>
  );
}

/* =========================================================
 * COMPONENTES
 * ======================================================= */

type NotificacaoDenunciaMundial = {
  id: string;
  tipo:
    | "NOVA_DENUNCIA"
    | "TRATATIVA_CLIENTE";
  titulo: string;
  descricao: string;
  data: Date | string;
  href: string;
};

function SinoNotificacoesMundial({
  notificacoes,
}: {
  notificacoes: NotificacaoDenunciaMundial[];
}) {
  const quantidade =
    notificacoes.length;

  return (
    <details className="group relative shrink-0">
      <summary
        aria-label={`Notificações do Canal de Denúncias: ${quantidade}`}
        className="relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 [&::-webkit-details-marker]:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {quantidade > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
            {quantidade > 9
              ? "9+"
              : quantidade}
          </span>
        )}
      </summary>

      <div className="absolute right-0 top-full z-50 mt-3 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-black text-slate-900">
                Notificações
              </h2>

              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Canal de Denúncias
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              {quantidade}
            </span>
          </div>
        </div>

        {notificacoes.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            Nenhuma notificação recente.
          </div>
        ) : (
          <div className="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain">
            {notificacoes.map(notificacao => {
              const novaDenuncia =
                notificacao.tipo === "NOVA_DENUNCIA";

              return (
                <Link
                  key={notificacao.id}
                  href={notificacao.href}
                  className="block border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                        novaDenuncia
                          ? "bg-purple-500"
                          : "bg-emerald-500"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            novaDenuncia
                              ? "bg-purple-100 text-purple-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {novaDenuncia
                            ? "Nova denúncia"
                            : "Nova tratativa"}
                        </span>

                        <span className="text-[11px] font-semibold text-slate-400">
                          {formatarDataHoraNotificacao(
                            notificacao.data
                          )}
                        </span>
                      </div>

                      <p className="mt-1.5 break-words text-sm font-bold text-slate-900">
                        {notificacao.titulo}
                      </p>

                      <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                        {notificacao.descricao}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <Link
            href="/denuncias"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Ver todas as denúncias
          </Link>
        </div>
      </div>
    </details>
  );
}

function formatarDataHoraNotificacao(
  valor: Date | string
) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }
  ).format(data);
}

function CabecalhoBloco({
  titulo,
  descricao,
}: {
  titulo: string;

  descricao?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-black text-slate-900 sm:text-lg">
        {
          titulo
        }
      </h2>

      {descricao && (
        <p className="mt-1 text-sm text-slate-500">
          {
            descricao
          }
        </p>
      )}
    </div>
  );
}

function Bloco({
  titulo,
  descricao,
  children,
}: {
  titulo: string;

  descricao?: string;

  children: React.ReactNode;
}) {
  return (
    <section>
      <CabecalhoBloco
        titulo={
          titulo
        }
        descricao={
          descricao
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {
          children
        }
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
      <p className="text-sm font-semibold text-slate-500">
        {
          titulo
        }
      </p>

      <strong
        className={`mt-2 block text-3xl font-black sm:text-4xl ${
          destaque
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {
          valor
        }
      </strong>
    </div>
  );
}
