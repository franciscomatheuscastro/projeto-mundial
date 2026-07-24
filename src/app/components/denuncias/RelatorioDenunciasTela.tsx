"use client";

import type { ReactNode } from "react";

import type {
  DadosRelatorioDenuncias,
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
      (item) =>
        item.status === "RECEBIDA"
    ).length;

  const emAnalise =
    dados.denuncias.filter(
      (item) =>
        item.status === "EM_ANALISE"
    ).length;

  const emTratativa =
    dados.denuncias.filter(
      (item) =>
        item.status === "EM_TRATATIVA"
    ).length;

  const concluidas =
    dados.denuncias.filter(
      (item) =>
        item.status === "CONCLUIDA"
    ).length;

  const arquivadas =
    dados.denuncias.filter(
      (item) =>
        item.status === "ARQUIVADA"
    ).length;

  const quantidadeColunas =
    dados.contexto === "mundial"
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

          .relatorio-denuncias tr {
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
              <strong>Cliente:</strong>{" "}
              {dados.tituloCliente}
            </p>

            <p>
              <strong>Período:</strong>{" "}
              {formatarPeriodo(
                dados.dataInicio,
                dados.dataFim
              )}
            </p>

            <p>
              <strong>Gerado em:</strong>{" "}
              {new Date(
                dados.geradoEm
              ).toLocaleString("pt-BR")}
            </p>

            <p>
              <strong>Total:</strong>{" "}
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
                  <Th>Data</Th>
                  <Th>Protocolo</Th>

                  {dados.contexto ===
                    "mundial" && (
                    <Th>Empresa</Th>
                  )}

                  <Th>Categoria</Th>
                  <Th>Gravidade</Th>
                  <Th>Status</Th>
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
                    (denuncia) => (
                      <tr
                        key={denuncia.id}
                        className="break-inside-avoid"
                      >
                        <Td>
                          {new Date(
                            denuncia.criadoEm
                          ).toLocaleDateString(
                            "pt-BR"
                          )}
                        </Td>

                        <Td>
                          {denuncia.protocolo}
                        </Td>

                        {dados.contexto ===
                          "mundial" && (
                          <Td>
                            {denuncia.cliente
                              .empresa ||
                              denuncia.cliente
                                .nome}
                          </Td>
                        )}

                        <Td>
                          {denuncia.categoria
                            ?.nome ||
                            "Sem categoria"}
                        </Td>

                        <Td>
                          {formatarTexto(
                            denuncia.gravidade
                          )}
                        </Td>

                        <Td>
                          {formatarTexto(
                            denuncia.status
                          )}
                        </Td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-8 border-t border-slate-300 pt-4 text-xs text-slate-500">
          Relatório gerencial. Não contém
          identificação do denunciante,
          tratativas internas ou anexos.
        </footer>
      </div>
    </main>
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
        {label}
      </p>

      <strong className="mt-1 block text-xl">
        {valor}
      </strong>
    </div>
  );
}

function Th({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="border border-slate-300 px-2 py-2 text-left font-bold">
      {children}
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
      {children}
    </td>
  );
}

function formatarTexto(
  valor: string
) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase()
    );
}

function formatarPeriodo(
  inicio: string | null,
  fim: string | null
) {
  if (!inicio && !fim) {
    return "Todos os períodos";
  }

  if (inicio && fim) {
    return `${formatarData(
      inicio
    )} até ${formatarData(fim)}`;
  }

  if (inicio) {
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
  ] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}
