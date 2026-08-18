import type React from "react";

import {
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  prisma,
} from "@/src/lib/prisma";


type DashboardPageProps = {
  searchParams: Promise<{
    clienteId?: string;
  }>;
};


export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params =
    await searchParams;


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
          pesquisa: {
            clienteId,
          },
        }
      : undefined;


  const whereAgendamento =
    temFiltroCliente
      ? {
          planoAcao: {
            pesquisa: {
              clienteId,
            },
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

    diagnosticoTotal,
    diagnosticoAbertas,
    diagnosticoRespostas,

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

    diagnosticoCliente,
    diagnosticoAbertasCliente,
    diagnosticoRespostasCliente,

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
            TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL,
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          tipo:
            TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL,

          status:
            "ABERTA",
        },
      }),

      prisma.respostaPesquisa.count({
        where: {
          pesquisa: {
            tipo:
              TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL,
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
       * CLIENTE — DIAGNÓSTICO ORGANIZACIONAL
       * ============================================= */

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          tipo:
            TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL,
        },
      }),

      prisma.pesquisaCliente.count({
        where: {
          ...wherePesquisaCliente,

          tipo:
            TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL,

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
              TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL,
          },
        },
      }),


      /* ===============================================
       * CLIENTE — AVALIAÇÃO PSICOSSOCIAL
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
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Dashboard
          </p>


          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Painel Mundial
              </h1>


              <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
                Visão executiva de Pesquisa de Clima, Diagnóstico Organizacional,
                Avaliação Psicossocial, planos de ação e Canal de Denúncias.
              </p>
            </div>
          </div>
        </div>
      </header>


      <section className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
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
            titulo="Modalidades de avaliação"
            descricao="Acompanhamento das três linhas de pesquisa da plataforma."
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
              titulo="Diagnóstico Organizacional"
              descricao="Maturidade, forças, pontos de atenção e prioridades."
              total={
                diagnosticoTotal
              }
              abertas={
                diagnosticoAbertas
              }
              respostas={
                diagnosticoRespostas
              }
              variante="diagnostico"
            />


            <CardModulo
              titulo="Avaliação Psicossocial"
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
            titulo="Avaliações do cliente"
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
              titulo="Diagnóstico Organizacional"
              descricao="Aplicações e respostas da modalidade."
              total={
                diagnosticoCliente
              }
              abertas={
                diagnosticoAbertasCliente
              }
              respostas={
                diagnosticoRespostasCliente
              }
              variante="diagnostico"
            />


            <CardModulo
              titulo="Avaliação Psicossocial"
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
    | "diagnostico"
    | "psicossocial";
}) {
  const classes =
    variante ===
    "diagnostico"
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
