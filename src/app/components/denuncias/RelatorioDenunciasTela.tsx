"use client";

import type {
  ReactNode,
} from "react";

import type {
  DadosRelatorioDenuncias,
  DenunciaRelatorio,
  HistoricoRelatorioDenuncia,
} from "@/src/core/model/Denuncia";

type Props = {
  dados: DadosRelatorioDenuncias;
};

const CAMINHO_LOGO =
  "/logo-pessoas.png";

export default function RelatorioDenunciasTela({
  dados,
}: Props) {
  const total =
    dados.denuncias.length;

  const recebidas =
    dados.denuncias.filter(
      item =>
        item.status ===
        "RECEBIDA"
    ).length;

  const emAnalise =
    dados.denuncias.filter(
      item =>
        item.status ===
        "EM_ANALISE"
    ).length;

  const emTratativa =
    dados.denuncias.filter(
      item =>
        item.status ===
        "EM_TRATATIVA"
    ).length;

  const concluidas =
    dados.denuncias.filter(
      item =>
        item.status ===
        "CONCLUIDA"
    ).length;

  const arquivadas =
    dados.denuncias.filter(
      item =>
        item.status ===
        "ARQUIVADA"
    ).length;

  const quantidadeColunas =
    dados.contexto ===
    "mundial"
      ? 6
      : 5;

  return (
    <main className="min-h-screen bg-white p-6 text-slate-900 print:min-h-0 print:p-0">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .relatorio-denuncias {
            width: 100% !important;
            max-width: none !important;
          }

          .relatorio-denuncias table {
            page-break-inside: auto;
          }

          .relatorio-denuncias thead {
            display: table-header-group;
          }

          .relatorio-denuncias tr,
          .evento-historico,
          .conclusao-final,
          .cabecalho-denuncia {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="relatorio-denuncias mx-auto max-w-[1200px]">
        <div className="mb-6 flex justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={() =>
              window.close()
            }
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Imprimir / salvar PDF
          </button>
        </div>

        <header className="border-b-2 border-slate-900 pb-5">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <img
                src={CAMINHO_LOGO}
                alt="Grupo Mundial RH"
                className="h-auto w-[150px] object-contain print:w-[135px]"
              />

              <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Mundial Connect
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Relatório de denúncias
              </h1>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <strong>
                Cliente:
              </strong>{" "}
              {
                dados.tituloCliente
              }
            </p>

            <p>
              <strong>
                Período:
              </strong>{" "}
              {
                formatarPeriodo(
                  dados.dataInicio,
                  dados.dataFim
                )
              }
            </p>

            <p>
              <strong>
                Gerado em:
              </strong>{" "}
              {
                new Date(
                  dados.geradoEm
                ).toLocaleString(
                  "pt-BR"
                )
              }
            </p>

            <p>
              <strong>
                Total:
              </strong>{" "}
              {total} denúncia(s)
            </p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 print:grid-cols-3">
          <Indicador
            label="Total"
            valor={total}
          />

          <Indicador
            label="Recebidas"
            valor={recebidas}
          />

          <Indicador
            label="Em análise"
            valor={emAnalise}
          />

          <Indicador
            label="Em tratativa"
            valor={emTratativa}
          />

          <Indicador
            label="Concluídas"
            valor={concluidas}
          />

          <Indicador
            label="Arquivadas"
            valor={arquivadas}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">
            Registros
          </h2>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <Th>
                    Data
                  </Th>

                  <Th>
                    Protocolo
                  </Th>

                  {dados.contexto ===
                    "mundial" && (
                    <Th>
                      Empresa
                    </Th>
                  )}

                  <Th>
                    Categoria
                  </Th>

                  <Th>
                    Gravidade
                  </Th>

                  <Th>
                    Status
                  </Th>
                </tr>
              </thead>

              <tbody>
                {dados.denuncias.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={
                        quantidadeColunas
                      }
                      className="border border-slate-300 px-3 py-8 text-center text-slate-500"
                    >
                      Nenhuma denúncia encontrada.
                    </td>
                  </tr>
                ) : (
                  dados.denuncias.map(
                    denuncia => (
                      <tr
                        key={
                          denuncia.id
                        }
                        className="break-inside-avoid"
                      >
                        <Td>
                          {
                            formatarDataHora(
                              denuncia.criadoEm,
                              false
                            )
                          }
                        </Td>

                        <Td>
                          {
                            denuncia.protocolo
                          }
                        </Td>

                        {dados.contexto ===
                          "mundial" && (
                          <Td>
                            {
                              denuncia.cliente
                                .empresa ||
                              denuncia.cliente
                                .nome
                            }
                          </Td>
                        )}

                        <Td>
                          {
                            denuncia.categoria
                              ?.nome ||
                            "Sem categoria"
                          }
                        </Td>

                        <Td>
                          {
                            formatarTexto(
                              denuncia.gravidade
                            )
                          }
                        </Td>

                        <Td>
                          {
                            formatarTexto(
                              denuncia.status
                            )
                          }
                        </Td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {dados.denuncias.length >
          0 && (
          <section className="mt-10">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Acompanhamento
              </p>

              <h2 className="mt-1 text-xl font-black">
                Histórico e conclusão por denúncia
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Linha do tempo dos eventos de acompanhamento e conclusão final registrada em cada protocolo.
              </p>
            </div>

            <div className="space-y-7">
              {dados.denuncias.map(
                denuncia => (
                  <DetalheDenunciaRelatorio
                    key={
                      `${denuncia.id}-detalhe`
                    }
                    denuncia={
                      denuncia
                    }
                    contexto={
                      dados.contexto
                    }
                  />
                )
              )}
            </div>
          </section>
        )}

        <footer className="mt-8 border-t border-slate-300 pt-4 text-xs leading-5 text-slate-500">
          Relatório gerencial. Não contém identificação do denunciante,
          tratativas internas ou anexos. O histórico apresentado considera
          somente os eventos disponibilizados no acompanhamento da denúncia.
        </footer>
      </div>
    </main>
  );
}

function DetalheDenunciaRelatorio({
  denuncia,
  contexto,
}: {
  denuncia: DenunciaRelatorio;
  contexto:
    | "mundial"
    | "cliente";
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-300">
      <div className="cabecalho-denuncia bg-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
              {
                denuncia.protocolo
              }
            </p>

            <h3 className="mt-1 break-words text-base font-black text-slate-900">
              {
                denuncia.titulo
              }
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {
                denuncia.categoria
                  ?.nome ||
                "Sem categoria"
              }

              {contexto ===
                "mundial" && (
                <>
                  {" · "}
                  {
                    denuncia.cliente
                      .empresa ||
                    denuncia.cliente
                      .nome
                  }
                </>
              )}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Badge
              texto={
                denuncia.gravidade
              }
              variante="gravidade"
            />

            <Badge
              texto={
                denuncia.status
              }
              variante="status"
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-3 text-xs sm:grid-cols-3">
          <InfoCompacta
            label="Registrada em"
            valor={
              formatarDataHora(
                denuncia.criadoEm
              )
            }
          />

          <InfoCompacta
            label="Última atualização"
            valor={
              formatarDataHora(
                denuncia.atualizadoEm
              )
            }
          />

          <InfoCompacta
            label="Eventos no histórico"
            valor={
              String(
                denuncia.historico.length
              )
            }
          />
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-black text-slate-900">
            Histórico da denúncia
          </h4>

          {denuncia.historico.length ===
          0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-xs leading-5 text-slate-500">
              Nenhum evento de acompanhamento disponível para este protocolo.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {denuncia.historico.map(
                (
                  evento,
                  index
                ) => (
                  <EventoHistorico
                    key={
                      evento.id
                    }
                    evento={
                      evento
                    }
                    ultimo={
                      index ===
                      denuncia.historico.length -
                        1
                    }
                  />
                )
              )}
            </ol>
          )}
        </div>

        <div className="conclusao-final mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            Conclusão final
          </p>

          {denuncia.respostaPublica?.trim() ? (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
              {
                denuncia.respostaPublica
              }
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {denuncia.status ===
              "CONCLUIDA"
                ? "A denúncia está concluída, mas não há uma conclusão final registrada."
                : "A denúncia ainda não possui conclusão final registrada."}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function EventoHistorico({
  evento,
  ultimo,
}: {
  evento:
    HistoricoRelatorioDenuncia;
  ultimo: boolean;
}) {
  return (
    <li className="evento-historico relative flex gap-3">
      <div className="flex w-5 shrink-0 flex-col items-center">
        <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />

        {!ultimo && (
          <span className="mt-1 min-h-8 w-px flex-1 bg-slate-200" />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <strong className="break-words text-sm text-slate-900">
            {
              evento.titulo
            }
          </strong>

          <span className="shrink-0 text-[11px] text-slate-400">
            {
              formatarDataHora(
                evento.criadoEm
              )
            }
          </span>
        </div>

        {evento.descricao && (
          <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
            {
              evento.descricao
            }
          </p>
        )}

        {(evento.statusAnterior ||
          evento.statusNovo) && (
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {evento.statusAnterior &&
            evento.statusNovo
              ? `${formatarTexto(
                  evento.statusAnterior
                )} → ${formatarTexto(
                  evento.statusNovo
                )}`
              : evento.statusNovo
                ? `Status: ${formatarTexto(
                    evento.statusNovo
                  )}`
                : `Status anterior: ${formatarTexto(
                    evento.statusAnterior!
                  )}`}
          </p>
        )}
      </div>
    </li>
  );
}

function Indicador({
  label,
  valor,
}: {
  label: string;
  valor: number;
}) {
  return (
    <div className="rounded-xl border border-slate-300 p-3 text-center">
      <p className="text-xs text-slate-500">
        {
          label
        }
      </p>

      <strong className="mt-1 block text-xl">
        {
          valor
        }
      </strong>
    </div>
  );
}

function InfoCompacta({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="font-semibold uppercase tracking-wide text-slate-400">
        {
          label
        }
      </p>

      <p className="mt-1 font-bold text-slate-700">
        {
          valor
        }
      </p>
    </div>
  );
}

function Badge({
  texto,
  variante,
}: {
  texto: string;
  variante:
    | "status"
    | "gravidade";
}) {
  const classe =
    variante ===
    "gravidade"
      ? texto ===
        "CRITICA"
        ? "bg-red-100 text-red-700"
        : texto ===
          "ALTA"
          ? "bg-orange-100 text-orange-700"
          : texto ===
            "MEDIA"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"
      : texto ===
        "CONCLUIDA"
        ? "bg-green-100 text-green-700"
        : texto ===
          "EM_TRATATIVA"
          ? "bg-blue-100 text-blue-700"
          : texto ===
            "EM_ANALISE"
            ? "bg-yellow-100 text-yellow-700"
            : texto ===
              "ARQUIVADA"
              ? "bg-slate-200 text-slate-700"
              : "bg-purple-100 text-purple-700";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${classe}`}
    >
      {
        formatarTexto(
          texto
        )
      }
    </span>
  );
}

function Th({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="border border-slate-300 px-2 py-2 text-left font-bold">
      {
        children
      }
    </th>
  );
}

function Td({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td className="border border-slate-300 px-2 py-2 align-top">
      {
        children
      }
    </td>
  );
}

function formatarTexto(
  valor: string
) {
  return valor
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      letra =>
        letra.toUpperCase()
    );
}

function formatarDataHora(
  data:
    | Date
    | string,
  incluirHora =
    true
) {
  const valor =
    new Date(
      data
    );

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return "-";
  }

  return incluirHora
    ? valor.toLocaleString(
        "pt-BR"
      )
    : valor.toLocaleDateString(
        "pt-BR"
      );
}

function formatarPeriodo(
  inicio: string | null,
  fim: string | null
) {
  if (
    !inicio &&
    !fim
  ) {
    return "Todos os períodos";
  }

  if (
    inicio &&
    fim
  ) {
    return `${formatarData(
      inicio
    )} até ${formatarData(
      fim
    )}`;
  }

  if (
    inicio
  ) {
    return `A partir de ${formatarData(
      inicio
    )}`;
  }

  return `Até ${formatarData(
    fim!
  )}`;
}

function formatarData(
  data: string
) {
  const [
    ano,
    mes,
    dia,
  ] =
    data.split(
      "-"
    );

  return `${dia}/${mes}/${ano}`;
}
