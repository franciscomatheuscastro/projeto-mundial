"use client";

import Link from "next/link";

import type {
  TipoModuloPesquisa,
} from "@prisma/client";


type Props = {
  relatorio: any | null;

  carregando: boolean;

  erro?: string | null;

  tipo: TipoModuloPesquisa;

  tituloModulo: string;

  baseHref: string;

  pesquisaId?: string;
};


const MODULO = {
  CLIMA:
    "CLIMA",

  DIAGNOSTICO_ORGANIZACIONAL:
    "DIAGNOSTICO_ORGANIZACIONAL",

  AVALIACAO_PSICOSSOCIAL:
    "AVALIACAO_PSICOSSOCIAL",
} as const;


export default function RelatorioAplicacaoModuloTela({
  relatorio,
  carregando,
  erro,
  tipo,
  tituloModulo,
  baseHref,
  pesquisaId,
}: Props) {
  if (
    erro
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Cabecalho
          modulo={
            tituloModulo
          }
          titulo="Relatório individual"
          descricao="Não foi possível carregar os resultados desta aplicação."
          voltarHref={`${baseHref}/${pesquisaId}`}
        />

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {
              erro
            }
          </div>
        </section>
      </main>
    );
  }


  if (
    carregando ||
    !relatorio
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Cabecalho
          modulo={
            tituloModulo
          }
          titulo="Relatório individual"
          descricao="Carregando dados da aplicação..."
          voltarHref={`${baseHref}/${pesquisaId}`}
        />

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Carregando relatório...
          </div>
        </section>
      </main>
    );
  }


  const totalRespostas =
    Number(
      relatorio.totalRespostas ||
      0
    );


  const totalPerguntas =
    relatorio.perguntas?.length ||
    0;


  const totalConvites =
    Number(
      relatorio.totalConvites ||
      0
    );


  const totalRespondidos =
    Number(
      relatorio.totalConvitesRespondidos ||
      0
    );


  const adesao =
    totalConvites >
    0
      ? (
          totalRespondidos /
          totalConvites
        ) *
        100
      : null;


  const tituloIndicador =
    tipo ===
    MODULO.CLIMA
      ? "Pesquisa de Clima"
      : tipo ===
          MODULO.DIAGNOSTICO_ORGANIZACIONAL
        ? "Diagnóstico"
        : "Avaliação Psicossocial";


  return (
    <main className="min-h-screen bg-slate-100">
      <Cabecalho
        modulo={
          tituloModulo
        }
        titulo="Relatório individual"
        descricao={`${relatorio.titulo} · ${tituloIndicador}`}
        voltarHref={`${baseHref}/${pesquisaId}`}
      />


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Aplicação
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-900">
                {
                  relatorio.titulo
                }
              </h2>

              {relatorio.descricao && (
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {
                    relatorio.descricao
                  }
                </p>
              )}
            </div>


            <div className="grid gap-3 sm:grid-cols-2">
              <Info
                titulo="Organização"
                valor={
                  relatorio.cliente
                    ?.empresa ||
                  relatorio.cliente
                    ?.nome ||
                  "—"
                }
              />

              <Info
                titulo="Modelo"
                valor={
                  relatorio.modelo
                    ?.titulo ||
                  "—"
                }
              />

              <Info
                titulo="Status"
                valor={
                  relatorio.status ||
                  "—"
                }
              />

              <Info
                titulo="Tipo"
                valor={
                  nomeTipo(
                    tipo
                  )
                }
              />
            </div>
          </div>
        </section>


        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            titulo="Respondentes"
            valor={
              totalRespostas
            }
          />

          <Card
            titulo="Perguntas"
            valor={
              totalPerguntas
            }
          />

          <Card
            titulo="Convites"
            valor={
              totalConvites ||
              "—"
            }
          />

          <Card
            titulo="Adesão"
            valor={
              adesao ===
              null
                ? "—"
                : `${adesao
                    .toFixed(
                      1
                    )
                    .replace(
                      ".",
                      ","
                    )}%`
            }
          />
        </div>


        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Respostas
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-900">
              Resultado por pergunta
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Visualização detalhada das respostas obtidas nesta aplicação.
            </p>
          </div>


          {!relatorio.perguntasComResumo
            ?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Ainda não existem respostas disponíveis.
            </div>
          ) : (
            <div className="space-y-5">
              {relatorio.perguntasComResumo.map(
                (
                  item: any
                ) => (
                  <PerguntaResultado
                    key={
                      item.pergunta.id
                    }
                    item={
                      item
                    }
                    relatorio={
                      relatorio
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}


function PerguntaResultado({
  item,
  relatorio,
}: {
  item: any;

  relatorio: any;
}) {
  const pergunta =
    item.pergunta;


  const respostas =
    Array.isArray(
      item.respostas
    )
      ? item.respostas
      : [];


  const dimensao =
    relatorio.dimensoes?.find(
      (
        dimensaoAtual: any
      ) =>
        dimensaoAtual.id ===
        pergunta.dimensaoId
    );


  const tipo =
    pergunta.tipo;


  return (
    <article className="rounded-3xl border border-slate-200 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Pergunta{" "}
              {
                pergunta.ordem
              }
            </span>


            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {
                nomeTipoPergunta(
                  tipo
                )
              }
            </span>


            {dimensao && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                {
                  dimensao.nome
                }
              </span>
            )}
          </div>


          <h3 className="mt-3 text-base font-black text-slate-900 sm:text-lg">
            {
              pergunta.titulo
            }
          </h3>


          {pergunta.descricao && (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {
                pergunta.descricao
              }
            </p>
          )}


          {dimensao?.fatorRisco && (
            <p className="mt-2 text-xs font-semibold text-orange-700">
              Fator de risco:{" "}
              {
                dimensao.fatorRisco
              }
            </p>
          )}
        </div>


        <div className="shrink-0">
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
            {
              item.totalRespostas ||
              respostas.length
            }{" "}
            resposta(s)
          </span>
        </div>
      </div>


      {tipo ===
        "NOTA" && (
        <ResultadoNota
          item={
            item
          }
          respostas={
            respostas
          }
          relatorio={
            relatorio
          }
        />
      )}


      {(tipo ===
        "SIM_NAO" ||
        tipo ===
          "MULTIPLA_ESCOLHA") && (
        <ResultadoOpcoes
          respostas={
            respostas
          }
        />
      )}


      {(tipo ===
        "TEXTO" ||
        tipo ===
          "TEXTO_LONGO") && (
        <ResultadoTexto
          respostas={
            respostas
          }
        />
      )}
    </article>
  );
}


function ResultadoNota({
  item,
  respostas,
  relatorio,
}: {
  item: any;

  respostas: any[];

  relatorio: any;
}) {
  const valores =
    respostas
      .map(
        resposta =>
          Number(
            resposta.valor
          )
      )
      .filter(
        valor =>
          Number.isFinite(
            valor
          )
      );


  const media =
    valores.length >
    0
      ? valores.reduce(
          (
            soma,
            valor
          ) =>
            soma +
            valor,
          0
        ) /
        valores.length
      : Number(
          item.media ||
          0
        );


  const minimo =
    Number(
      relatorio.configuracaoAnalise
        ?.escalaMinima ??
        1
    );


  const maximo =
    Number(
      relatorio.configuracaoAnalise
        ?.escalaMaxima ??
        5
    );


  const notas =
    Array.from(
      {
        length:
          Math.max(
            0,
            maximo -
              minimo +
              1
          ),
      },
      (
        _,
        index
      ) =>
        minimo +
        index
    );


  return (
    <div className="mt-5">
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="rounded-2xl bg-blue-50 px-4 py-3">
          <p className="text-xs font-bold uppercase text-blue-600">
            Média
          </p>

          <strong className="mt-1 block text-xl text-blue-900">
            {media
              .toFixed(
                2
              )
              .replace(
                ".",
                ","
              )}
          </strong>
        </div>


        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase text-slate-500">
            Escala
          </p>

          <strong className="mt-1 block text-xl text-slate-900">
            {minimo} a{" "}
            {
              maximo
            }
          </strong>
        </div>
      </div>


      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {notas.map(
          nota => {
            const quantidade =
              valores.filter(
                valor =>
                  valor ===
                  nota
              ).length;


            const percentual =
              valores.length >
              0
                ? (
                    quantidade /
                    valores.length
                  ) *
                  100
                : 0;


            return (
              <div
                key={
                  nota
                }
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-lg text-slate-900">
                    {
                      nota
                    }
                  </strong>

                  <span className="text-xs font-bold text-slate-500">
                    {
                      quantidade
                    }
                  </span>
                </div>


                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${percentual}%`,
                    }}
                  />
                </div>


                <p className="mt-2 text-xs text-slate-500">
                  {percentual
                    .toFixed(
                      1
                    )
                    .replace(
                      ".",
                      ","
                    )}
                  %
                </p>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}


function ResultadoOpcoes({
  respostas,
}: {
  respostas: any[];
}) {
  const agrupado =
    new Map<
      string,
      number
    >();


  for (
    const resposta
    of respostas
  ) {
    const valor =
      String(
        resposta.valor ??
        ""
      ).trim();


    if (
      !valor
    ) {
      continue;
    }


    agrupado.set(
      valor,
      (
        agrupado.get(
          valor
        ) ||
        0
      ) +
        1
    );
  }


  const total =
    Array.from(
      agrupado.values()
    ).reduce(
      (
        soma,
        quantidade
      ) =>
        soma +
        quantidade,
      0
    );


  if (
    total ===
    0
  ) {
    return (
      <p className="mt-5 text-sm text-slate-500">
        Nenhuma resposta registrada.
      </p>
    );
  }


  const itens =
    Array.from(
      agrupado.entries()
    ).sort(
      (
        a,
        b
      ) =>
        b[1] -
        a[1]
    );


  return (
    <div className="mt-5 space-y-3">
      {itens.map(
        ([
          opcao,
          quantidade,
        ]) => {
          const percentual =
            (
              quantidade /
              total
            ) *
            100;


          return (
            <div
              key={
                opcao
              }
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-slate-900">
                  {
                    opcao
                  }
                </span>


                <span className="text-sm font-bold text-slate-600">
                  {
                    quantidade
                  }{" "}
                  ·{" "}
                  {percentual
                    .toFixed(
                      1
                    )
                    .replace(
                      ".",
                      ","
                    )}
                  %
                </span>
              </div>


              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${percentual}%`,
                  }}
                />
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}


function ResultadoTexto({
  respostas,
}: {
  respostas: any[];
}) {
  const textos =
    respostas
      .map(
        resposta =>
          String(
            resposta.valor ??
            ""
          ).trim()
      )
      .filter(
        Boolean
      );


  if (
    textos.length ===
    0
  ) {
    return (
      <p className="mt-5 text-sm text-slate-500">
        Nenhum comentário registrado.
      </p>
    );
  }


  return (
    <div className="mt-5 space-y-3">
      {textos.map(
        (
          texto,
          index
        ) => (
          <div
            key={
              index
            }
            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
          >
            {
              texto
            }
          </div>
        )
      )}
    </div>
  );
}


function Cabecalho({
  modulo,
  titulo,
  descricao,
  voltarHref,
}: {
  modulo: string;

  titulo: string;

  descricao: string;

  voltarHref: string;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            {
              modulo
            }
          </p>


          <h1 className="mt-2 text-2xl font-black text-slate-900">
            {
              titulo
            }
          </h1>


          <p className="mt-1 text-sm text-slate-500">
            {
              descricao
            }
          </p>
        </div>


        <div className="flex gap-3">
          <Link
            href={
              voltarHref
            }
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </Link>


          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Imprimir relatório
          </button>
        </div>
      </div>
    </header>
  );
}


function Card({
  titulo,
  valor,
}: {
  titulo: string;

  valor:
    | string
    | number;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-bold text-slate-500">
        {
          titulo
        }
      </p>

      <strong className="mt-2 block text-3xl font-black text-slate-900">
        {
          valor
        }
      </strong>
    </div>
  );
}


function Info({
  titulo,
  valor,
}: {
  titulo: string;

  valor: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">
        {
          titulo
        }
      </p>

      <strong className="mt-1 block text-sm text-slate-900">
        {
          valor
        }
      </strong>
    </div>
  );
}


function nomeTipo(
  tipo: TipoModuloPesquisa
) {
  if (
    tipo ===
    MODULO.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    return "Diagnóstico Organizacional";
  }


  if (
    tipo ===
    MODULO.AVALIACAO_PSICOSSOCIAL
  ) {
    return "Avaliação Psicossocial";
  }


  return "Pesquisa de Clima";
}


function nomeTipoPergunta(
  tipo: string
) {
  if (
    tipo ===
    "NOTA"
  ) {
    return "Nota";
  }


  if (
    tipo ===
    "SIM_NAO"
  ) {
    return "Sim ou Não";
  }


  if (
    tipo ===
    "MULTIPLA_ESCOLHA"
  ) {
    return "Múltipla escolha";
  }


  if (
    tipo ===
    "TEXTO_LONGO"
  ) {
    return "Texto longo";
  }


  return "Texto";
}