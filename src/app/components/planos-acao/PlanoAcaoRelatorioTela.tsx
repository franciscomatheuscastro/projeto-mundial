"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePlanosAcao } from "@/src/app/data/hooks/usePlanosAcao";
import { AcaoPlanoAcao } from "@/src/core/model/PlanoAcao";

type Props = {
  id: string;
  contexto?: "mundial" | "cliente";
};

export default function PlanoAcaoRelatorioTela({
  id,
  contexto = "mundial",
}: Props) {
  const { planoSelecionado, carregando, erro, carregarPlanoPorId } =
    usePlanosAcao(false, contexto);

  const baseHref = contexto === "cliente" ? "/meus-planos-acao" : "/planos-acao";

  useEffect(() => {
    carregarPlanoPorId(id);
  }, [id]);

  const indicadores = useMemo(() => {
    const acoes = planoSelecionado?.acoes || [];

    const total = acoes.length;
    const concluidas = acoes.filter((a) => a.status === "CONCLUIDA").length;
    const andamento = acoes.filter((a) => a.status === "EM_ANDAMENTO").length;
    const pendentes = acoes.filter((a) => a.status === "PENDENTE").length;
    const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return { total, concluidas, andamento, pendentes, progresso };
  }, [planoSelecionado]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="text-sm text-slate-500">Carregando relatório...</div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      </main>
    );
  }

  if (!planoSelecionado) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Relatório não encontrado.
        </div>
      </main>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
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
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
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

          .print-table {
            font-size: 10px !important;
          }

          .print-title {
            font-size: 24px !important;
          }

          .print-grid-5 {
            display: grid !important;
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }

          .print-grid-2 {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-slate-100">
        <header className="no-print border-b bg-white px-8 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                MundialSafe
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Relatório do Plano de Ação
              </h1>
              <p className="text-sm text-slate-500">
                Apresentação executiva para acompanhamento do cliente.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Baixar PDF
              </button>

              {contexto === "mundial" && (
                <Link
                  href={`${baseHref}/${id}`}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Editar plano
                </Link>
              )}

              <Link
                href={baseHref}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </Link>
            </div>
          </div>
        </header>

        <section
          id="relatorio-plano"
          className="print-page mx-auto max-w-6xl space-y-6 px-8 py-8"
        >
          <Capa plano={planoSelecionado} />

          <div className="print-grid-5 grid gap-4 md:grid-cols-5">
            <Kpi titulo="Status" valor={formatarStatus(planoSelecionado.status)} />
            <Kpi titulo="Total de ações" valor={indicadores.total} />
            <Kpi titulo="Concluídas" valor={indicadores.concluidas} positivo />
            <Kpi titulo="Em andamento" valor={indicadores.andamento} alerta />
            <Kpi titulo="Pendentes" valor={indicadores.pendentes} negativo />
          </div>

          <section className="print-grid-2 grid gap-6 lg:grid-cols-2">
            <Bloco titulo="Resumo executivo">
              <TextoPadrao>
                {planoSelecionado.diagnostico ||
                  "Este plano de ação foi estruturado a partir da análise dos resultados da pesquisa de clima, com foco em melhorias práticas, priorização de ações e fortalecimento da cultura organizacional."}
              </TextoPadrao>
            </Bloco>

            <Bloco titulo="Progresso geral">
              <div className="flex items-center gap-6">
                <GraficoCircular percentual={indicadores.progresso} />

                <div className="space-y-3 text-sm">
                  <Legenda texto="Concluídas" valor={indicadores.concluidas} />
                  <Legenda texto="Em andamento" valor={indicadores.andamento} />
                  <Legenda texto="Pendentes" valor={indicadores.pendentes} />
                </div>
              </div>
            </Bloco>
          </section>

          <section className="print-grid-2 grid gap-6 lg:grid-cols-2">
            <Bloco titulo="Objetivo do plano">
              <TextoPadrao>
                {planoSelecionado.objetivo ||
                  "Transformar os achados da pesquisa em iniciativas aplicáveis, mensuráveis e conectadas à melhoria do ambiente de trabalho."}
              </TextoPadrao>
            </Bloco>

            <Bloco titulo="Direcionamento estratégico">
              <ul className="space-y-3 text-sm text-slate-700">
                <Item>Fortalecer comunicação entre áreas e liderança.</Item>
                <Item>Aumentar clareza sobre responsabilidades e prioridades.</Item>
                <Item>Melhorar engajamento e senso de pertencimento.</Item>
                <Item>Monitorar evolução com checkpoints periódicos.</Item>
              </ul>
            </Bloco>
          </section>

          <Bloco titulo="Ações do plano">
            <div className="overflow-hidden rounded-xl border">
              <table className="print-table w-full border-collapse text-sm">
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
                  {planoSelecionado.acoes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Nenhuma ação cadastrada.
                      </td>
                    </tr>
                  ) : (
                    planoSelecionado.acoes.map((acao, index) => (
                      <tr key={acao.id} className="border-t">
                        <td className="px-4 py-4 text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">
                            {acao.titulo}
                          </div>

                          {acao.descricao && (
                            <div className="mt-1 text-xs text-slate-500">
                              {acao.descricao}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {acao.responsavel || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <PrioridadeBadge prioridade={acao.prioridade} />
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          {acao.prazo || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <StatusAcaoBadge status={acao.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Bloco>

          <section className="print-grid-2 grid gap-6 lg:grid-cols-2">
            <Bloco titulo="Próximos passos">
              <ul className="space-y-3 text-sm text-slate-700">
                <Item>Executar ações pendentes e monitorar prazos.</Item>
                <Item>Realizar reunião de acompanhamento com liderança.</Item>
                <Item>Acompanhar evolução dos indicadores.</Item>
                <Item>Reavaliar prioridades conforme avanço do plano.</Item>
              </ul>
            </Bloco>

            <Bloco titulo="Conclusão">
              <TextoPadrao>
                {planoSelecionado.conclusao ||
                  "A execução consistente deste plano tende a converter os dados da pesquisa em ganhos reais de clima, comunicação e performance organizacional."}
              </TextoPadrao>
            </Bloco>
          </section>

          <footer className="pt-4 text-center text-xs text-slate-400">
            Relatório gerado em {new Date().toLocaleDateString("pt-BR")} ·
            MundialSafe
          </footer>
        </section>
      </main>
    </>
  );
}

function Capa({ plano }: { plano: any }) {
  return (
    <section className="print-card overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-8 text-white shadow-sm">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">
            Plano de ação
          </p>

          <h2 className="print-title mt-4 max-w-3xl text-4xl font-bold">
            {plano.titulo}
          </h2>

          <div className="mt-5 space-y-1 text-sm text-blue-100">
            <p>Pesquisa: {plano.pesquisa.titulo}</p>
            <p>
              Cliente:{" "}
              {plano.pesquisa.cliente.empresa || plano.pesquisa.cliente.nome}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 p-5 text-right backdrop-blur">
          <p className="text-2xl font-bold">MundialSafe</p>
          <p className="mt-2 max-w-xs text-sm text-blue-100">
            Transformando diagnósticos em ações de impacto.
          </p>
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
    <div className="print-card rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className={`mt-2 block text-2xl ${cor}`}>{valor}</strong>
    </div>
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
    <section className="print-card print-section rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">{titulo}</h3>
      {children}
    </section>
  );
}

function TextoPadrao({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-7 text-slate-700">{children}</p>;
}

function GraficoCircular({ percentual }: { percentual: number }) {
  return (
    <div
      className="grid h-36 w-36 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#16a34a ${percentual}%, #e2e8f0 ${percentual}% 100%)`,
      }}
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-white">
        <div className="text-center">
          <strong className="text-2xl text-slate-900">{percentual}%</strong>
          <p className="text-xs text-slate-500">progresso</p>
        </div>
      </div>
    </div>
  );
}

function Legenda({ texto, valor }: { texto: string; valor: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-600">{texto}</span>
      <strong className="text-slate-900">{valor}</strong>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1 h-4 w-4 rounded-full bg-blue-100 text-center text-[10px] font-bold text-blue-700">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function StatusAcaoBadge({ status }: { status: AcaoPlanoAcao["status"] }) {
  const classe =
    status === "CONCLUIDA"
      ? "bg-green-100 text-green-700"
      : status === "EM_ANDAMENTO"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${classe}`}>
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
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${classe}`}>
      {formatarStatus(prioridade)}
    </span>
  );
}

function formatarStatus(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}