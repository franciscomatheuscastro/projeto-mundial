"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePlanosAcao } from "@/src/app/data/hooks/usePlanosAcao";
import {
  AcaoPlanoAcao,
  PlanoAcaoDetalhado,
} from "@/src/core/model/PlanoAcao";

type Props = {
  id: string;
  contexto?: "mundial" | "cliente";
};

export default function PlanoAcaoRelatorioTela({
  id,
  contexto = "mundial",
}: Props) {
  const {
    planoSelecionado,
    carregando,
    erro,
    carregarPlanoPorId,
  } = usePlanosAcao(false, contexto);

  const baseHref =
    contexto === "cliente"
      ? "/meus-planos-acao"
      : "/planos-acao";

  useEffect(() => {
    /*
     * O hook já registra o erro internamente.
     * O catch evita uma Promise rejeitada sem tratamento no useEffect.
     */
    void carregarPlanoPorId(id).catch(() => undefined);
  }, [id, carregarPlanoPorId]);

  const indicadores = useMemo(() => {
    const acoes = planoSelecionado?.acoes || [];

    const total = acoes.length;

    const concluidas = acoes.filter(
      (acao) => acao.status === "CONCLUIDA"
    ).length;

    const andamento = acoes.filter(
      (acao) => acao.status === "EM_ANDAMENTO"
    ).length;

    const pendentes = acoes.filter(
      (acao) => acao.status === "PENDENTE"
    ).length;

    const progresso =
      total > 0
        ? Math.round((concluidas / total) * 100)
        : 0;

    return {
      total,
      concluidas,
      andamento,
      pendentes,
      progresso,
    };
  }, [planoSelecionado]);

  const dadosOrigem = useMemo(() => {
    if (!planoSelecionado) {
      return {
        planoDeDenuncia: false,
        tipoOrigem: "",
        tituloOrigem: "",
        identificadorOrigem: null as string | null,
        clienteNome: "",
      };
    }

    if (
      planoSelecionado.tipoOrigem === "DENUNCIA"
    ) {
      const denuncia = planoSelecionado.denuncia;

      return {
        planoDeDenuncia: true,
        tipoOrigem: "Denúncia",
        tituloOrigem:
          denuncia?.titulo || "Denúncia não identificada",
        identificadorOrigem:
          denuncia?.protocolo || null,
        clienteNome: denuncia?.cliente
          ? denuncia.cliente.empresa ||
            denuncia.cliente.nome
          : "Cliente não identificado",
      };
    }

    const pesquisa = planoSelecionado.pesquisa;

    return {
      planoDeDenuncia: false,
      tipoOrigem: "Pesquisa de clima",
      tituloOrigem:
        pesquisa?.titulo || "Pesquisa não identificada",
      identificadorOrigem: null,
      clienteNome: pesquisa?.cliente
        ? pesquisa.cliente.empresa ||
          pesquisa.cliente.nome
        : "Cliente não identificado",
    };
  }, [planoSelecionado]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando relatório...
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      </main>
    );
  }

  if (!planoSelecionado) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Relatório não encontrado.
        </div>
      </main>
    );
  }

  const {
    planoDeDenuncia,
    tipoOrigem,
    tituloOrigem,
    identificadorOrigem,
    clienteNome,
  } = dadosOrigem;

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          html,
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          #relatorio-plano,
          #relatorio-plano * {
            visibility: visible !important;
          }

          #relatorio-plano {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
          }

          .print-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-table-wrapper {
            overflow: visible !important;
          }

          .print-table {
            width: 100% !important;
            table-layout: fixed !important;
            font-size: 9px !important;
          }

          .print-table th,
          .print-table td {
            padding: 6px !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
          }

          .print-table th:nth-child(1),
          .print-table td:nth-child(1) {
            width: 5% !important;
          }

          .print-table th:nth-child(2),
          .print-table td:nth-child(2) {
            width: 31% !important;
          }

          .print-table th:nth-child(3),
          .print-table td:nth-child(3) {
            width: 18% !important;
          }

          .print-table th:nth-child(4),
          .print-table td:nth-child(4) {
            width: 14% !important;
          }

          .print-table th:nth-child(5),
          .print-table td:nth-child(5) {
            width: 14% !important;
          }

          .print-table th:nth-child(6),
          .print-table td:nth-child(6) {
            width: 18% !important;
          }

          .print-title {
            font-size: 24px !important;
            line-height: 1.15 !important;
          }

          .print-grid-5 {
            display: grid !important;
            grid-template-columns: repeat(
              5,
              minmax(0, 1fr)
            ) !important;
            gap: 8px !important;
          }

          .print-grid-2 {
            display: grid !important;
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
            gap: 12px !important;
          }

          .print-chart {
            width: 110px !important;
            height: 110px !important;
          }

          .print-chart-center {
            width: 76px !important;
            height: 76px !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-slate-100">
        <header className="no-print border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Mundial Connect
              </p>

              <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                Relatório do Plano de Ação
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Apresentação executiva para acompanhamento
                do cliente.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
              >
                Baixar PDF
              </button>

              {contexto === "mundial" && (
                <Link
                  href={`${baseHref}/${id}`}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  Editar plano
                </Link>
              )}

              <Link
                href={baseHref}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                Voltar
              </Link>
            </div>
          </div>
        </header>

        <section
          id="relatorio-plano"
          className="print-page mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"
        >
          <Capa
            plano={planoSelecionado}
            tipoOrigem={tipoOrigem}
            tituloOrigem={tituloOrigem}
            identificadorOrigem={
              identificadorOrigem
            }
            clienteNome={clienteNome}
          />

          <div className="print-grid-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi
              titulo="Status"
              valor={formatarStatus(
                planoSelecionado.status
              )}
            />

            <Kpi
              titulo="Total de ações"
              valor={indicadores.total}
            />

            <Kpi
              titulo="Concluídas"
              valor={indicadores.concluidas}
              positivo
            />

            <Kpi
              titulo="Em andamento"
              valor={indicadores.andamento}
              alerta
            />

            <Kpi
              titulo="Pendentes"
              valor={indicadores.pendentes}
              negativo
            />
          </div>

          <section className="print-grid-2 grid gap-6 lg:grid-cols-2">
            <Bloco titulo="Resumo executivo">
              <TextoPadrao>
                {planoSelecionado.diagnostico ||
                  (planoDeDenuncia
                    ? "Este plano de ação foi estruturado a partir da análise da denúncia, considerando os fatos relatados, os riscos identificados, as tratativas necessárias e as medidas de prevenção."
                    : "Este plano de ação foi estruturado a partir da análise dos resultados da pesquisa de clima, com foco em melhorias práticas, priorização de ações e fortalecimento da cultura organizacional.")}
              </TextoPadrao>
            </Bloco>

            <Bloco titulo="Progresso geral">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <GraficoCircular
                  percentual={indicadores.progresso}
                />

                <div className="w-full space-y-3 text-sm sm:w-auto sm:min-w-40">
                  <Legenda
                    texto="Concluídas"
                    valor={indicadores.concluidas}
                  />

                  <Legenda
                    texto="Em andamento"
                    valor={indicadores.andamento}
                  />

                  <Legenda
                    texto="Pendentes"
                    valor={indicadores.pendentes}
                  />
                </div>
              </div>
            </Bloco>
          </section>

          <section className="print-grid-2 grid gap-6 lg:grid-cols-2">
            <Bloco titulo="Objetivo do plano">
              <TextoPadrao>
                {planoSelecionado.objetivo ||
                  (planoDeDenuncia
                    ? "Estabelecer medidas corretivas, preventivas e de acompanhamento para tratar adequadamente os fatos identificados e reduzir a recorrência de situações semelhantes."
                    : "Transformar os achados da pesquisa em iniciativas aplicáveis, mensuráveis e conectadas à melhoria do ambiente de trabalho.")}
              </TextoPadrao>
            </Bloco>

            <Bloco titulo="Direcionamento estratégico">
              <ul className="space-y-3 text-sm text-slate-700">
                {planoDeDenuncia ? (
                  <>
                    <Item>
                      Conduzir as tratativas com
                      confidencialidade e imparcialidade.
                    </Item>

                    <Item>
                      Definir responsáveis e prazos para cada
                      medida corretiva.
                    </Item>

                    <Item>
                      Reduzir riscos de reincidência e exposição
                      institucional.
                    </Item>

                    <Item>
                      Registrar evidências e acompanhar a
                      efetividade das ações.
                    </Item>
                  </>
                ) : (
                  <>
                    <Item>
                      Fortalecer a comunicação entre áreas e
                      liderança.
                    </Item>

                    <Item>
                      Aumentar a clareza sobre responsabilidades
                      e prioridades.
                    </Item>

                    <Item>
                      Melhorar o engajamento e o senso de
                      pertencimento.
                    </Item>

                    <Item>
                      Monitorar a evolução com checkpoints
                      periódicos.
                    </Item>
                  </>
                )}
              </ul>
            </Bloco>
          </section>

          <Bloco titulo="Ações do plano">
            <div className="print-table-wrapper overflow-x-auto rounded-xl border border-slate-200">
              <table className="print-table min-w-[850px] w-full border-collapse text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>#</Th>
                    <Th>Ação</Th>
                    <Th>Responsável</Th>
                    <Th>Prioridade</Th>
                    <Th>Prazo</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>

                <tbody>
                  {planoSelecionado.acoes.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Nenhuma ação cadastrada.
                      </td>
                    </tr>
                  ) : (
                    planoSelecionado.acoes.map(
                      (acao, index) => (
                        <tr
                          key={acao.id}
                          className="border-t border-slate-200"
                        >
                          <td className="px-4 py-4 text-slate-500">
                            {index + 1}
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-medium text-slate-900">
                              {acao.titulo}
                            </div>

                            {acao.descricao && (
                              <div className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                                {acao.descricao}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {acao.responsavel || "-"}
                          </td>

                          <td className="px-4 py-4">
                            <PrioridadeBadge
                              prioridade={
                                acao.prioridade
                              }
                            />
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {acao.prazo || "-"}
                          </td>

                          <td className="px-4 py-4">
                            <StatusAcaoBadge
                              status={acao.status}
                            />
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Bloco>

          <section className="print-grid-2 grid gap-6 lg:grid-cols-2">
            <Bloco titulo="Próximos passos">
              <ul className="space-y-3 text-sm text-slate-700">
                <Item>
                  Executar as ações pendentes e monitorar os
                  respectivos prazos.
                </Item>

                <Item>
                  Realizar reunião de acompanhamento com os
                  responsáveis.
                </Item>

                <Item>
                  Registrar a evolução e as evidências de
                  execução.
                </Item>

                <Item>
                  Reavaliar prioridades conforme o avanço do
                  plano.
                </Item>
              </ul>
            </Bloco>

            <Bloco titulo="Conclusão">
              <TextoPadrao>
                {planoSelecionado.conclusao ||
                  (planoDeDenuncia
                    ? "A execução consistente deste plano contribui para uma tratativa responsável da denúncia, mitigação dos riscos identificados e fortalecimento dos mecanismos internos de prevenção e governança."
                    : "A execução consistente deste plano tende a converter os dados da pesquisa em ganhos reais de clima, comunicação e performance organizacional.")}
              </TextoPadrao>
            </Bloco>
          </section>

          <footer className="pt-4 text-center text-xs text-slate-400">
            Relatório gerado em{" "}
            {new Date().toLocaleDateString("pt-BR")} ·
            Mundial Connect
          </footer>
        </section>
      </main>
    </>
  );
}

function Capa({
  plano,
  tipoOrigem,
  tituloOrigem,
  identificadorOrigem,
  clienteNome,
}: {
  plano: PlanoAcaoDetalhado;
  tipoOrigem: string;
  tituloOrigem: string;
  identificadorOrigem: string | null;
  clienteNome: string;
}) {
  return (
    <section className="print-card overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-6 text-white shadow-sm sm:p-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">
            Plano de ação · {tipoOrigem}
          </p>

          <h2 className="print-title mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
            {plano.titulo}
          </h2>

          <div className="mt-5 space-y-1 text-sm text-blue-100">
            <p>
              <strong className="font-semibold">
                Origem:
              </strong>{" "}
              {tituloOrigem}
            </p>

            {identificadorOrigem && (
              <p>
                <strong className="font-semibold">
                  Protocolo:
                </strong>{" "}
                {identificadorOrigem}
              </p>
            )}

            <p>
              <strong className="font-semibold">
                Cliente:
              </strong>{" "}
              {clienteNome}
            </p>
          </div>
        </div>

        <div className="self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-100 md:self-auto">
          {formatarStatus(plano.status)}
        </div>
      </div>
    </section>
  );
}

function Kpi({
  titulo,
  valor,
  positivo,
  alerta,
  negativo,
}: {
  titulo: string;
  valor: string | number;
  positivo?: boolean;
  alerta?: boolean;
  negativo?: boolean;
}) {
  const cor = positivo
    ? "text-green-600"
    : alerta
    ? "text-yellow-600"
    : negativo
    ? "text-red-600"
    : "text-blue-700";

  return (
    <div className="print-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {titulo}
      </p>

      <strong
        className={`mt-2 block text-2xl font-bold ${cor}`}
      >
        {valor}
      </strong>
    </div>
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
    <section className="print-card print-section rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-4 text-lg font-bold text-slate-900">
        {titulo}
      </h3>

      {children}
    </section>
  );
}

function TextoPadrao({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
      {children}
    </p>
  );
}

function GraficoCircular({
  percentual,
}: {
  percentual: number;
}) {
  const percentualSeguro = Math.min(
    100,
    Math.max(0, percentual)
  );

  return (
    <div
      className="print-chart grid h-36 w-36 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(
          #16a34a ${percentualSeguro}%,
          #e2e8f0 ${percentualSeguro}% 100%
        )`,
      }}
    >
      <div className="print-chart-center grid h-24 w-24 place-items-center rounded-full bg-white">
        <div className="text-center">
          <strong className="text-2xl font-bold text-slate-900">
            {percentualSeguro}%
          </strong>

          <p className="text-xs text-slate-500">
            progresso
          </p>
        </div>
      </div>
    </div>
  );
}

function Legenda({
  texto,
  valor,
}: {
  texto: string;
  valor: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-600">
        {texto}
      </span>

      <strong className="text-slate-900">
        {valor}
      </strong>
    </div>
  );
}

function Item({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <li className="flex gap-2">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
        ✓
      </span>

      <span>{children}</span>
    </li>
  );
}

function Th({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function StatusAcaoBadge({
  status,
}: {
  status: AcaoPlanoAcao["status"];
}) {
  const classe =
    status === "CONCLUIDA"
      ? "bg-green-100 text-green-700"
      : status === "EM_ANDAMENTO"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classe}`}
    >
      {formatarStatus(status)}
    </span>
  );
}

function PrioridadeBadge({
  prioridade,
}: {
  prioridade: AcaoPlanoAcao["prioridade"];
}) {
  const classe =
    prioridade === "ALTA"
      ? "bg-red-100 text-red-700"
      : prioridade === "MEDIA"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classe}`}
    >
      {formatarStatus(prioridade)}
    </span>
  );
}

function formatarStatus(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase()
    );
}