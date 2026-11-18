import type { ReactNode } from "react";

import Link from "next/link";

import {
  PerfilUsuario,
  Prisma,
  TipoModuloPesquisa,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

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

  const administradorCliente =
    usuario.perfil === PerfilUsuario.CLIENTE;

  const membroComite =
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE;

  const gestorCliente =
    usuario.perfil === PerfilUsuario.GESTOR_CLIENTE;

  const podeAcessarPainel =
    administradorCliente ||
    membroComite ||
    gestorCliente;

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

  if (gestorCliente && !usuario.id) {
    return (
      <AcessoIndisponivel
        titulo="Gestor não identificado"
        descricao="Não foi possível identificar o gestor autenticado. Saia da plataforma e entre novamente."
      />
    );
  }

  const clienteId = usuario.clienteId;

  let colaboradorId: string | null = null;

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
          descricao="Seu usuário não está vinculado a um integrante ativo do Comitê de Ética desta empresa."
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

    colaboradorId = colaborador.id;
  }

  const cliente = await prisma.cliente.findUnique({
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
   * Para o CLIENTE, os indicadores de desempenho consideram
   * toda a empresa.
   *
   * Para o GESTOR_CLIENTE, consideram exclusivamente as
   * avaliações atribuídas ao usuário autenticado.
   */
  const filtroDesempenho: Prisma.PesquisaClienteWhereInput = {
    clienteId,
    tipo: TipoModuloPesquisa.AVALIACAO_DESEMPENHO,
    ...(gestorCliente
      ? {
          gestorUsuarioId: usuario.id!,
        }
      : {}),
  };

  const [
    desempenhoTotal,
    desempenhoAbertas,
    desempenhoRespostas,
  ] =
    administradorCliente || gestorCliente
      ? await Promise.all([
          prisma.pesquisaCliente.count({
            where: filtroDesempenho,
          }),

          prisma.pesquisaCliente.count({
            where: {
              ...filtroDesempenho,
              status: "ABERTA",
            },
          }),

          prisma.respostaPesquisa.count({
            where: {
              pesquisa: filtroDesempenho,
            },
          }),
        ])
      : [0, 0, 0];

  /*
   * Demais indicadores executivos são exclusivos do
   * cliente master.
   */
  const agora = new Date();

  const limiteProximosSeteDias = new Date(
    agora.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const [
    pesquisas,
    pesquisasAbertas,
    respostas,
    climaTotal,
    climaAbertas,
    climaRespostas,
    psicossocialTotal,
    psicossocialAbertas,
    psicossocialRespostas,
    planosAcao,
    planosEmAndamento,
    agendamentos,
    proximosAgendamentos,
    agendamentosProximosSeteDias,
  ] = administradorCliente
    ? await Promise.all([
        prisma.pesquisaCliente.count({
          where: { clienteId },
        }),

        prisma.pesquisaCliente.count({
          where: {
            clienteId,
            status: "ABERTA",
          },
        }),

        prisma.respostaPesquisa.count({
          where: {
            pesquisa: { clienteId },
          },
        }),

        prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo: TipoModuloPesquisa.CLIMA,
          },
        }),

        prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo: TipoModuloPesquisa.CLIMA,
            status: "ABERTA",
          },
        }),

        prisma.respostaPesquisa.count({
          where: {
            pesquisa: {
              clienteId,
              tipo: TipoModuloPesquisa.CLIMA,
            },
          },
        }),

        prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo: TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
          },
        }),

        prisma.pesquisaCliente.count({
          where: {
            clienteId,
            tipo: TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
            status: "ABERTA",
          },
        }),

        prisma.respostaPesquisa.count({
          where: {
            pesquisa: {
              clienteId,
              tipo: TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
            },
          },
        }),

        prisma.planoAcao.count({
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
        }),

        prisma.planoAcao.count({
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
        }),

        prisma.agendamento.count({
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
        }),

        prisma.agendamento.count({
          where: {
            dataHora: {
              gte: agora,
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
        }),

        prisma.agendamento.count({
          where: {
            dataHora: {
              gte: agora,
              lt: limiteProximosSeteDias,
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
        }),
      ])
    : Array(14).fill(0) as number[];

  /*
   * Denúncias são visíveis somente para o cliente master
   * e para integrantes autorizados do Comitê de Ética.
   * O gestor de desempenho não participa deste módulo.
   */
  const filtroDenuncias: Prisma.DenunciaWhereInput | null =
    administradorCliente
      ? {
          clienteId,
        }
      : membroComite
        ? {
            clienteId,
            tratativaLiberada: true,
            OR: [
              {
                destinoTratativa: "COLABORADOR",
                colaboradorResponsavelId: colaboradorId!,
              },
              {
                visualizadores: {
                  some: {
                    colaboradorId: colaboradorId!,
                  },
                },
              },
            ],
          }
        : null;

  const [
    denuncias,
    denunciasAnalise,
    denunciasTratativa,
    denunciasConcluidas,
    denunciasCriticas,
  ] = filtroDenuncias
    ? await Promise.all([
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
                  notIn: ["CONCLUIDA", "ARQUIVADA"],
                },
              },
            ],
          },
        }),
      ])
    : [0, 0, 0, 0, 0];

  /*
   * Notificações operacionais do Canal de Denúncias.
   *
   * CLIENTE:
   * - acompanha os direcionamentos da própria empresa;
   * - recebe alerta visual quando o prazo de 5 dias úteis venceu.
   *
   * COMITE_CLIENTE:
   * - visualiza apenas denúncias em que é o responsável designado.
   *
   * GESTOR_CLIENTE:
   * - não participa do Canal de Denúncias.
   */
  const filtroNotificacoesDenuncias:
    | Prisma.DenunciaWhereInput
    | null =
    administradorCliente
      ? {
          clienteId,
          tratativaLiberada: true,
          destinoTratativa: "COLABORADOR",
        }
      : membroComite
        ? {
            clienteId,
            tratativaLiberada: true,
            destinoTratativa: "COLABORADOR",
            colaboradorResponsavelId: colaboradorId!,
          }
        : null;

  const denunciasParaNotificacao =
    filtroNotificacoesDenuncias
      ? await prisma.denuncia.findMany({
          where: filtroNotificacoesDenuncias,
          orderBy: {
            tratativaLiberadaEm: "desc",
          },
          take: 20,
          select: {
            id: true,
            protocolo: true,
            status: true,
            tratativaLiberadaEm: true,
            prazoTratativaEm: true,
            alertaPrazoTratativaEnviadoEm: true,
            colaboradorResponsavel: {
              select: {
                nome: true,
              },
            },
            _count: {
              select: {
                tratativas: true,
              },
            },
          },
        })
      : [];

  const notificacoesDenunciasCliente =
    denunciasParaNotificacao
      .flatMap(denuncia => {
        const itens: NotificacaoDenunciaPainel[] = [];

        const href =
          membroComite
            ? `/minhas-denuncias/${denuncia.id}`
            : "/minhas-denuncias";

        if (denuncia.tratativaLiberadaEm) {
          itens.push({
            id: `direcionamento-${denuncia.id}`,
            tipo: "DIRECIONAMENTO",
            titulo: "Denúncia direcionada para tratativa",
            descricao:
              administradorCliente
                ? `Protocolo ${denuncia.protocolo} foi direcionado para ${denuncia.colaboradorResponsavel?.nome || "o responsável designado"}.`
                : `O protocolo ${denuncia.protocolo} foi direcionado para sua tratativa.`,
            data: denuncia.tratativaLiberadaEm,
            protocolo: denuncia.protocolo,
            href,
          });
        }

        const prazoVencido =
          Boolean(denuncia.prazoTratativaEm) &&
          denuncia._count.tratativas === 0 &&
          denuncia.status !== "CONCLUIDA" &&
          denuncia.status !== "ARQUIVADA" &&
          new Date(
            denuncia.prazoTratativaEm!
          ).getTime() <= agora.getTime();

        if (prazoVencido) {
          itens.push({
            id: `prazo-${denuncia.id}`,
            tipo: "PRAZO_VENCIDO",
            titulo: "Prazo de tratativa vencido",
            descricao: `O protocolo ${denuncia.protocolo} ultrapassou o prazo de 5 dias úteis sem registro da primeira tratativa.`,
            data: denuncia.prazoTratativaEm!,
            protocolo: denuncia.protocolo,
            href,
          });
        }

        return itens;
      })
      .sort(
        (a, b) =>
          new Date(b.data).getTime() -
          new Date(a.data).getTime()
      )
      .slice(0, 8);

  const descricaoDashboard = gestorCliente
    ? "Acompanhe exclusivamente as Avaliações de Desempenho atribuídas ao seu usuário."
    : administradorCliente
      ? "Visão executiva da Pesquisa de Clima, Avaliação de Desempenho, Gestão de Riscos Psicossociais, planos de ação, agendamentos e protocolos de denúncias da empresa."
      : "Painel do Comitê de Ética para acompanhamento das denúncias disponibilizadas ao seu usuário.";

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-slate-100">
      <header className="bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
              Dashboard
            </p>

            <h1 className="mt-2 break-words text-2xl font-black text-slate-900 sm:text-3xl">
              {cliente.empresa || cliente.nome || "Minha empresa"}
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
              {descricaoDashboard}
            </p>
          </div>

          {(administradorCliente || membroComite) && (
            <SinoNotificacoesCliente
              notificacoes={notificacoesDenunciasCliente}
              membroComite={membroComite}
            />
          )}
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {gestorCliente && (
          <Bloco titulo="Avaliação de Desempenho">
            <Card
              titulo="Avaliações atribuídas"
              valor={desempenhoTotal}
            />

            <Card
              titulo="Avaliações em aberto"
              valor={desempenhoAbertas}
            />

            <Card
              titulo="Respostas recebidas"
              valor={desempenhoRespostas}
            />
          </Bloco>
        )}

        {administradorCliente && (
          <>
            <Bloco titulo="Visão geral">
              <Card titulo="Aplicações" valor={pesquisas} />
              <Card titulo="Aplicações abertas" valor={pesquisasAbertas} />
              <Card titulo="Respostas recebidas" valor={respostas} />
              <Card titulo="Planos de ação" valor={planosAcao} />
              <Card titulo="Planos em andamento" valor={planosEmAndamento} />
              <Card titulo="Agendamentos" valor={agendamentos} />
              <Card titulo="Próximos agendamentos" valor={proximosAgendamentos} />
              <Card
                titulo="Agendamentos nos próximos 7 dias"
                valor={agendamentosProximosSeteDias}
              />
            </Bloco>

            <section>
              <h2 className="mb-3 text-base font-black text-slate-900 sm:text-lg">
                Módulos de pesquisa e gestão
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
                  titulo="Gestão de Riscos Psicossociais"
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

        {(administradorCliente || membroComite) && (
          <Bloco titulo="Canal de denúncias">
            <Card
              titulo={
                administradorCliente
                  ? "Protocolos registrados"
                  : "Denúncias disponíveis"
              }
              valor={denuncias}
            />

            <Card titulo="Em análise" valor={denunciasAnalise} />
            <Card titulo="Em tratativa" valor={denunciasTratativa} />
            <Card titulo="Concluídas" valor={denunciasConcluidas} />
            <Card
              titulo="Críticas em aberto"
              valor={denunciasCriticas}
              destaque
            />
          </Bloco>
        )}
      </section>
    </main>
  );
}

type NotificacaoDenunciaPainel = {
  id: string;
  tipo:
    | "DIRECIONAMENTO"
    | "PRAZO_VENCIDO";
  titulo: string;
  descricao: string;
  data: Date | string;
  protocolo: string;
  href: string;
};

function SinoNotificacoesCliente({
  notificacoes,
  membroComite,
}: {
  notificacoes: NotificacaoDenunciaPainel[];
  membroComite: boolean;
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
                {membroComite
                  ? "Direcionamentos atribuídos a você"
                  : "Canal de Denúncias"}
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              {quantidade}
            </span>
          </div>
        </div>

        {notificacoes.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            Nenhuma notificação pendente ou recente.
          </div>
        ) : (
          <div className="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain">
            {notificacoes.map(notificacao => {
              const prazoVencido =
                notificacao.tipo === "PRAZO_VENCIDO";

              return (
                <Link
                  key={notificacao.id}
                  href={notificacao.href}
                  className={`block border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${
                    prazoVencido
                      ? "bg-red-50/70 hover:bg-red-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                        prazoVencido
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            prazoVencido
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {prazoVencido
                            ? "Prazo vencido"
                            : "Direcionamento"}
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
            href="/minhas-denuncias"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Ver denúncias
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
  variante: "clima" | "desempenho" | "psicossocial";
}) {
  const classes =
    variante === "desempenho"
      ? {
          badge: "bg-indigo-100 text-indigo-700",
          numero: "text-indigo-700",
        }
      : variante === "psicossocial"
        ? {
            badge: "bg-amber-100 text-amber-800",
            numero: "text-amber-700",
          }
        : {
            badge: "bg-blue-100 text-blue-700",
            numero: "text-blue-700",
          };

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${classes.badge}`}
      >
        Modalidade
      </span>

      <h3 className="mt-3 text-lg font-black text-slate-900">
        {titulo}
      </h3>

      <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
        {descricao}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <MiniMetrica
          titulo="Aplicações"
          valor={total}
          classe={classes.numero}
        />

        <MiniMetrica
          titulo="Abertas"
          valor={abertas}
          classe={classes.numero}
        />

        <MiniMetrica
          titulo="Respostas"
          valor={respostas}
          classe={classes.numero}
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
        {titulo}
      </p>

      <strong
        className={`mt-1 block text-xl font-black ${classe}`}
      >
        {valor}
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
