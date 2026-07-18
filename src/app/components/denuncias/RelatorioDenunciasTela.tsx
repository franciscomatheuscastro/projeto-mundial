"use client";

import type {
  DadosRelatorioDenuncias,
} from "@/src/core/model/Denuncia";

type Props = {
  dados: DadosRelatorioDenuncias;
};

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

  return (
    <main className="min-h-screen bg-white p-6 text-slate-900 print:p-0">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={() =>
              window.close()
            }
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Imprimir / salvar PDF
          </button>
        </div>

        <header className="border-b-2 border-slate-900 pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            MundialSafe
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Relatório de denúncias
          </h1>

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

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                <Th>Título</Th>
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
                      dados.contexto ===
                      "mundial"
                        ? 7
                        : 6
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
                            denuncia.cliente.nome}
                        </Td>
                      )}

                      <Td>
                        {denuncia.categoria
                          ?.nome ||
                          "Sem categoria"}
                      </Td>

                      <Td>
                        {denuncia.titulo}
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
  children: React.ReactNode;
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
  children: React.ReactNode;
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