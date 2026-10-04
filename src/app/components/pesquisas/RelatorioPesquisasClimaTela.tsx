"use client";



import Link from "next/link";

import {
  useState,
} from "react";


export type SetorRelatorioCliente = {
  nome: string;
  disponivel: boolean;
};


export type PrivacidadeSetorRelatorio = {
  minimoRespostas: number;
  filtroBloqueado: boolean;
  setorSolicitado: string | null;
  mensagem: string | null;
};



import MetodologiaCriteriosRelatorio, {

  type MetodologiaAplicacaoRelatorio,

} from "./MetodologiaCriteriosRelatorio";



import InformacoesAdicionaisRelatorio from "./InformacoesAdicionaisRelatorio";



import type {

  InformacaoAdicionalRelatorio,

} from "./InformacoesAdicionaisRelatorio";





export type DimensaoClima = {

  id: string;



  nome: string;



  totalRespostas: number;



  favoravel: number;



  neutro: number;



  desfavoravel: number;

};





export type AnaliseSetorClima = {

  setor: string;



  totalPesquisas: number;



  totalRespostas: number;



  indiceGeralClima: number | null;



  dimensoes: DimensaoClima[];

};





export type AnaliseClima = {

  indiceGeralClima: number | null;



  dimensoes: DimensaoClima[];



  setores?: AnaliseSetorClima[];



  comentariosAbertos?: string[];



  historico?: {

    rotulo: string;

    indice: number;

  }[];

};





export type DadosRelatorioClima = {

  tipo?: string;



  filtros: {

    dataInicio: string | null;



    dataFim: string | null;



    clienteId: string | null;

    setor?: string | null;

  };





  setores?: string[];



  clientes: {

    id: string;



    nome: string;



    empresa: string | null;

    setores: string[];

    setoresRelatorio: SetorRelatorioCliente[];

  }[];



  privacidadeSetor?: PrivacidadeSetorRelatorio;






  resumo: {

    totalPesquisas: number;



    totalAbertas: number;



    totalFechadas: number;



    totalArquivadas: number;



    totalRespostas: number;
    /*

     * Legado.

     * Não representa oficialmente

     * o Índice Geral de Clima.

     */

    mediaGeral: number | null;

  };





  porCliente: {

    clienteId: string;



    clienteNome: string;



    empresa: string | null;



    totalPesquisas: number;



    totalRespostas: number;
    mediaGeral: number | null;



    metodologia?: MetodologiaAplicacaoRelatorio;

  }[];





  pesquisas: {

    id: string;



    titulo: string;



    status: string;



    setor: string | null;



    criadoEm: Date | string;





    cliente: {

      id: string;



      nome: string;



      empresa: string | null;

    };





    modelo: {

      id: string;



      titulo: string;

    };





    totalRespostas: number;
    mediaGeral: number | null;



    metodologia?: MetodologiaAplicacaoRelatorio;

  }[];





  informacoesAdicionais: InformacaoAdicionalRelatorio[];



  analise?: AnaliseClima;

};





export default function RelatorioPesquisasClimaTela({

  dados,

}: {

  dados: DadosRelatorioClima;

}) {

  const analise =

    dados.analise;





  const dimensoesOrdenadas =

    [

      ...(

        analise?.dimensoes ||

        []

      ),

    ].sort(

      (

        a,

        b

      ) =>

        b.favoravel -

        a.favoravel

    );





  const melhores =

    dimensoesOrdenadas.slice(

      0,

      5

    );





  const piores =

    [

      ...dimensoesOrdenadas,

    ]

      .reverse()

      .slice(

        0,

        5

      );





  const setores =

    analise?.setores ||

    [];





  const dimensoesHeatmap =

    Array.from(

      new Set(

        setores.flatMap(

          setor =>

            setor.dimensoes.map(

              dimensao =>

                dimensao.nome

            )

        )

      )

    );





  return (

    <main className="min-h-screen bg-slate-100">

      <header className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm print:shadow-none sm:px-6 lg:px-8">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">

              Pesquisa de Clima

            </p>



            <h1 className="mt-1 text-2xl font-black text-slate-900">

              Relatório de Clima Organizacional

            </h1>



            <p className="mt-1 text-sm text-slate-500">

              Percepção dos colaboradores, favorabilidade e principais

              dimensões do clima.

            </p>

          </div>





          <div className="flex flex-wrap gap-3 print:hidden">

            <Link

              href="/pesquisas"

              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"

            >

              Voltar

            </Link>





            <Link

              href={montarUrlRelatorioImpressao(

                dados,

                "/relatorios/clima"

              )}

              target="_blank"

              rel="noopener noreferrer"

              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"

            >

              Imprimir relatório

            </Link>

          </div>

        </div>

      </header>





      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <Filtros

          dados={

            dados

          }

        />





        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

          <Card

            titulo="Pesquisas"

            valor={

              dados.resumo

                .totalPesquisas

            }

          />





          <Card

            titulo="Respostas"

            valor={

              dados.resumo

                .totalRespostas

            }

          />





          <Card

            titulo="Clima Geral"

            valor={

              analise?.indiceGeralClima ==

              null

                ? "—"

                : percentual(

                    analise

                      .indiceGeralClima

                  )

            }

            destaque

          />

        </div>





        {!analise ? (

          <AvisoAnalise />

        ) : (

          <>

            <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">

                Favorabilidade

              </p>



              <h2 className="mt-1 text-lg font-black text-slate-900">

                Resultado por dimensão

              </h2>



              <p className="mt-1 text-sm text-slate-500">

                Percentual de respostas favoráveis, neutras e desfavoráveis.

              </p>





              {analise.dimensoes.length ===

              0 ? (

                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">

                  Ainda não existem dimensões com respostas suficientes para

                  apresentar resultados.

                </div>

              ) : (

                <div className="mt-6 space-y-5">

                  {analise.dimensoes.map(

                    dimensao => (

                      <DimensaoClimaCard

                        key={

                          dimensao.id

                        }

                        dimensao={

                          dimensao

                        }

                      />

                    )

                  )}

                </div>

              )}

            </section>





            {analise.dimensoes.length >

              0 && (

              <div className="mb-6 grid gap-6 lg:grid-cols-2">

                <Ranking

                  titulo="Top 5 dimensões"

                  descricao="Aspectos mais bem percebidos pelos colaboradores."

                  itens={

                    melhores

                  }

                  tipo="melhores"

                />





                <Ranking

                  titulo="5 piores dimensões"

                  descricao="Dimensões com os menores índices de favorabilidade."

                  itens={

                    piores

                  }

                  tipo="atencao"

                />

              </div>

            )}





            {setores.length >

              0 && (

              <>

                <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">

                    Análise por setor

                  </p>



                  <h2 className="mt-1 text-lg font-black text-slate-900">

                    Comparativo de clima entre setores

                  </h2>



                  <p className="mt-1 text-sm text-slate-500">

                    Resultado consolidado das aplicações vinculadas a cada setor

                    pela Mundial.

                  </p>





                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {setores.map(

                      setor => (

                        <SetorClimaCard

                          key={

                            setor.setor

                          }

                          setor={

                            setor

                          }

                        />

                      )

                    )}

                  </div>

                </section>





                {dimensoesHeatmap.length >

                  0 && (

                  <HeatmapSetorDimensao

                    setores={

                      setores

                    }

                    dimensoes={

                      dimensoesHeatmap

                    }

                  />

                )}

              </>

            )}





            {!!analise.historico

              ?.length && (

              <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">

                    Histórico

                  </p>



                  <h2 className="mt-1 text-lg font-black text-slate-900">

                    Evolução do clima

                  </h2>



                  <p className="mt-1 text-sm text-slate-500">

                    Evolução do índice geral entre as pesquisas consideradas.

                  </p>

                </div>





                <div className="mt-5 space-y-4">

                  {analise.historico.map(

                    (

                      item,

                      index

                    ) => (

                      <BarraPercentual

                        key={`${item.rotulo}-${index}`}

                        titulo={

                          item.rotulo

                        }

                        percentualValor={

                          item.indice

                        }

                      />

                    )

                  )}

                </div>

              </section>

            )}





          </>

        )}





        <MetodologiaCriteriosRelatorio

          tipo="CLIMA"

          metodologias={

            dados.pesquisas.map(

              pesquisa =>

                pesquisa.metodologia

            )

          }

        />





        <InformacoesAdicionaisRelatorio

          itens={

            dados.informacoesAdicionais ||

            []

          }

          variante="clima"

        />





        <TabelaPesquisas

          pesquisas={

            dados.pesquisas

          }

        />

      </section>

    </main>

  );

}





function DimensaoClimaCard({

  dimensao,

}: {

  dimensao: DimensaoClima;

}) {

  const favoravel =

    limitarPercentual(

      dimensao.favoravel

    );



  const neutro =

    limitarPercentual(

      dimensao.neutro

    );



  const desfavoravel =

    limitarPercentual(

      dimensao.desfavoravel

    );





  return (

    <div className="rounded-2xl border border-slate-200 p-4">

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h3 className="font-black text-slate-900">

            {

              dimensao.nome

            }

          </h3>



          <p className="mt-1 text-xs text-slate-500">

            {

              dimensao.totalRespostas

            }{" "}

            resposta(s)

          </p>

        </div>





        <div className="text-left sm:text-right">

          <strong className="block text-xl text-blue-700">

            {percentual(

              favoravel

            )}

          </strong>



          <span className="text-xs font-semibold text-slate-500">

            favorabilidade

          </span>

        </div>

      </div>





      <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">

        <div

          className="bg-green-500"

          style={{

            width: `${favoravel}%`,

          }}

          title={`Favorável: ${percentual(

            favoravel

          )}`}

        />



        <div

          className="bg-amber-400"

          style={{

            width: `${neutro}%`,

          }}

          title={`Neutro: ${percentual(

            neutro

          )}`}

        />



        <div

          className="bg-red-500"

          style={{

            width: `${desfavoravel}%`,

          }}

          title={`Desfavorável: ${percentual(

            desfavoravel

          )}`}

        />

      </div>





      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">

        <span className="text-green-700">

          Favorável{" "}

          {percentual(

            favoravel

          )}

        </span>



        <span className="text-amber-700">

          Neutro{" "}

          {percentual(

            neutro

          )}

        </span>



        <span className="text-red-700">

          Desfavorável{" "}

          {percentual(

            desfavoravel

          )}

        </span>

      </div>

    </div>

  );

}





function Ranking({

  titulo,

  descricao,

  itens,

  tipo,

}: {

  titulo: string;



  descricao: string;



  itens: DimensaoClima[];



  tipo:

    | "melhores"

    | "atencao";

}) {

  return (

    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

      <h2 className="text-lg font-black text-slate-900">

        {

          titulo

        }

      </h2>



      <p className="mt-1 text-sm text-slate-500">

        {

          descricao

        }

      </p>





      {itens.length ===

      0 ? (

        <p className="mt-5 text-sm text-slate-500">

          Nenhuma dimensão disponível.

        </p>

      ) : (

        <div className="mt-5 space-y-3">

          {itens.map(

            (

              item,

              index

            ) => (

              <div

                key={

                  item.id

                }

                className={`flex items-center justify-between gap-4 rounded-2xl p-4 ${

                  tipo ===

                  "melhores"

                    ? "bg-green-50"

                    : "bg-amber-50"

                }`}

              >

                <div>

                  <span

                    className={`mr-2 text-xs font-bold ${

                      tipo ===

                      "melhores"

                        ? "text-green-600"

                        : "text-amber-600"

                    }`}

                  >

                    #

                    {index +

                      1}

                  </span>



                  <strong className="text-sm text-slate-900">

                    {

                      item.nome

                    }

                  </strong>

                </div>





                <strong

                  className={

                    tipo ===

                    "melhores"

                      ? "text-green-700"

                      : "text-amber-700"

                  }

                >

                  {percentual(

                    item.favoravel

                  )}

                </strong>

              </div>

            )

          )}

        </div>

      )}

    </section>

  );

}





function SetorClimaCard({

  setor,

}: {

  setor: AnaliseSetorClima;

}) {

  const indice =

    setor.indiceGeralClima;





  const melhorDimensao =

    [

      ...setor.dimensoes,

    ].sort(

      (

        a,

        b

      ) =>

        b.favoravel -

        a.favoravel

    )[0];





  const piorDimensao =

    [

      ...setor.dimensoes,

    ].sort(

      (

        a,

        b

      ) =>

        a.favoravel -

        b.favoravel

    )[0];





  return (

    <div className="rounded-2xl border border-slate-200 p-5">

      <div className="flex items-start justify-between gap-4">

        <div>

          <h3 className="font-black text-slate-900">

            {

              setor.setor

            }

          </h3>



          <p className="mt-1 text-xs text-slate-500">

            {

              setor.totalRespostas

            }{" "}

            resposta(s) ·{" "}

            {

              setor.totalPesquisas

            }{" "}

            aplicação(ões)

          </p>

        </div>





        <strong className="text-xl text-blue-700">

          {indice ===

          null

            ? "—"

            : percentual(

                indice

              )}

        </strong>

      </div>





      {indice !==

        null && (

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">

          <div

            className="h-full rounded-full bg-blue-600"

            style={{

              width: `${limitarPercentual(

                indice

              )}%`,

            }}

          />

        </div>

      )}





      <div className="mt-4 space-y-2 text-xs">

        {melhorDimensao && (

          <p className="text-green-700">

            <strong>

              Destaque:

            </strong>{" "}

            {

              melhorDimensao.nome

            }{" "}

            (

            {percentual(

              melhorDimensao.favoravel

            )}

            )

          </p>

        )}



        {piorDimensao &&

          piorDimensao.id !==

            melhorDimensao?.id && (

            <p className="text-amber-700">

              <strong>

                Atenção:

              </strong>{" "}

              {

                piorDimensao.nome

              }{" "}

              (

              {percentual(

                piorDimensao.favoravel

              )}

              )

            </p>

          )}

      </div>

    </div>

  );

}





function HeatmapSetorDimensao({

  setores,

  dimensoes,

}: {

  setores: AnaliseSetorClima[];

  dimensoes: string[];

}) {

  return (

    <section className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

      <div className="p-6">

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">

          Mapa comparativo

        </p>



        <h2 className="mt-1 text-lg font-black text-slate-900">

          Setor × dimensão

        </h2>



        <p className="mt-1 text-sm text-slate-500">

          Favorabilidade de cada dimensão por setor. Quanto maior o percentual,

          melhor a percepção naquele recorte.

        </p>

      </div>





      <div className="overflow-x-auto border-t border-slate-100">

        <table className="w-full min-w-[780px] text-sm">

          <thead className="bg-slate-50">

            <tr>

              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left font-bold text-slate-600">

                Setor

              </th>



              {dimensoes.map(

                dimensao => (

                  <th

                    key={

                      dimensao

                    }

                    className="px-3 py-3 text-center text-xs font-bold text-slate-600"

                  >

                    {

                      dimensao

                    }

                  </th>

                )

              )}

            </tr>

          </thead>





          <tbody>

            {setores.map(

              setor => (

                <tr

                  key={

                    setor.setor

                  }

                  className="border-t border-slate-100"

                >

                  <td className="sticky left-0 bg-white px-4 py-3 font-bold text-slate-900">

                    {

                      setor.setor

                    }



                    <span className="ml-2 text-xs font-normal text-slate-400">

                      n=

                      {

                        setor.totalRespostas

                      }

                    </span>

                  </td>



                  {dimensoes.map(

                    nomeDimensao => {

                      const dimensao =

                        setor.dimensoes.find(

                          item =>

                            item.nome ===

                            nomeDimensao

                        );





                      return (

                        <td

                          key={`${setor.setor}-${nomeDimensao}`}

                          className="px-3 py-3 text-center"

                        >

                          {dimensao ? (

                            <span

                              className={`inline-flex min-w-16 items-center justify-center rounded-xl px-3 py-2 text-xs font-black ${classeFavorabilidade(

                                dimensao.favoravel

                              )}`}

                            >

                              {percentual(

                                dimensao.favoravel

                              )}

                            </span>

                          ) : (

                            <span className="text-slate-300">

                              —

                            </span>

                          )}

                        </td>

                      );

                    }

                  )}

                </tr>

              )

            )}

          </tbody>

        </table>

      </div>

    </section>

  );

}





function classeFavorabilidade(

  valor: number

) {

  if (

    valor >=

    75

  ) {

    return "bg-green-100 text-green-800";

  }





  if (

    valor >=

    60

  ) {

    return "bg-lime-100 text-lime-800";

  }





  if (

    valor >=

    40

  ) {

    return "bg-amber-100 text-amber-800";

  }





  return "bg-red-100 text-red-800";

}






function Filtros({

  dados,

}: {

  dados: DadosRelatorioClima;

}) {
  const [
    clienteId,
    setClienteId,
  ] =
    useState(
      dados.filtros.clienteId ||
      ""
    );


  const [
    setor,
    setSetor,
  ] =
    useState(
      dados.filtros.setor ||
      ""
    );


  const clienteSelecionado =
    dados.clientes.find(
      cliente =>
        cliente.id ===
        clienteId
    ) ||
    null;


  const setoresRelatorio =
    clienteSelecionado?.setoresRelatorio ||
    [];


  const setoresDisponiveis =
    setoresRelatorio.filter(
      item =>
        item.disponivel
    );


  const setoresBloqueados =
    setoresRelatorio.filter(
      item =>
        !item.disponivel
    );


  const minimoRespostas =
    dados.privacidadeSetor?.minimoRespostas ||
    5;


  const semSetorDisponivel =
    Boolean(
      clienteId &&
      setoresDisponiveis.length ===
        0
    );


  return (

    <form

      method="get"

      className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 print:hidden"

    >

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <CampoFiltro

          label="Data inicial"

          name="dataInicio"

          type="date"

          defaultValue={

            dados.filtros

              .dataInicio ||

            ""

          }

        />





        <CampoFiltro

          label="Data final"

          name="dataFim"

          type="date"

          defaultValue={

            dados.filtros

              .dataFim ||

            ""

          }

        />





        <div>

          <label className="mb-2 block text-sm font-semibold text-slate-700">

            Cliente

          </label>



          <select

            name="clienteId"

            value={
              clienteId
            }

            onChange={
              event => {
                setClienteId(
                  event.target.value
                );

                /*
                 * Ao trocar de cliente, o setor anterior
                 * deixa de ser válido para o novo cliente.
                 */
                setSetor(
                  ""
                );
              }
            }

            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

          >

            <option value="">
              Todos os clientes
            </option>



            {dados.clientes.map(

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

        </div>



        <div>

          <label className="mb-2 block text-sm font-semibold text-slate-700">

            Setor

          </label>



          <select

            name="setor"

            value={
              setor
            }

            onChange={
              event =>
                setSetor(
                  event.target.value
                )
            }

            disabled={
              !clienteId ||
              semSetorDisponivel
            }

            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"

          >

            <option value="">
              {
                clienteId
                  ? "Todos os setores"
                  : "Selecione um cliente primeiro"
              }
            </option>



            {setoresRelatorio.map(
              item => (
                <option
                  key={
                    item.nome
                  }
                  value={
                    item.nome
                  }
                  disabled={
                    !item.disponivel
                  }
                >
                  {
                    item.disponivel
                      ? item.nome
                      : `${item.nome} — menos de ${minimoRespostas} respostas`
                  }
                </option>
              )
            )}

          </select>

        </div>

      </div>


      {clienteId &&
        setoresBloqueados.length >
          0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <strong>
            Proteção de anonimato:
          </strong>{" "}
          o filtro por setor só é liberado quando o setor possui pelo menos{" "}
          <strong>
            {minimoRespostas} respostas
          </strong>{" "}
          no período selecionado.
          {semSetorDisponivel
            ? " Nenhum setor deste cliente atingiu o mínimo necessário."
            : ` ${setoresBloqueados.length} setor(es) estão indisponíveis por não atingirem esse mínimo.`}
        </div>
      )}


      {dados.privacidadeSetor?.filtroBloqueado &&
        dados.privacidadeSetor.mensagem && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">
          {
            dados.privacidadeSetor.mensagem
          }
        </div>
      )}





      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

        <Link

          href="/pesquisas/relatorio"

          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"

        >

          Limpar

        </Link>





        <button

          type="submit"

          className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"

        >

          Gerar relatório

        </button>

      </div>

    </form>

  );

}





function TabelaPesquisas({

  pesquisas,

}: {

  pesquisas: DadosRelatorioClima["pesquisas"];

}) {

  return (

    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

      <div className="border-b border-slate-100 p-6">

        <h2 className="text-lg font-black text-slate-900">

          Pesquisas consideradas

        </h2>



        <p className="mt-1 text-sm text-slate-500">

          Aplicações utilizadas na consolidação dos indicadores de clima.

        </p>

      </div>





      <div className="overflow-x-auto">

        <table className="w-full min-w-[900px]">

          <thead className="bg-slate-50">

            <tr>

              <Th>

                Pesquisa

              </Th>



              <Th>

                Cliente

              </Th>



              <Th>

                Setor

              </Th>



              <Th>

                Status

              </Th>



              <Th direita>

                Respostas

              </Th>



              <Th direita>

                Ações

              </Th>

            </tr>

          </thead>





          <tbody>

            {pesquisas.length ===

            0 ? (

              <tr>

                <td

                  colSpan={

                    6

                  }

                  className="p-10 text-center text-sm text-slate-500"

                >

                  Nenhuma pesquisa encontrada.

                </td>

              </tr>

            ) : (

              pesquisas.map(

                pesquisa => (

                  <tr

                    key={

                      pesquisa.id

                    }

                    className="border-t border-slate-100"

                  >

                    <td className="px-4 py-4">

                      <div className="font-bold text-slate-900">

                        {

                          pesquisa.titulo

                        }

                      </div>



                      <div className="mt-1 text-xs text-slate-500">

                        {

                          pesquisa.modelo

                            .titulo

                        }

                      </div>

                    </td>





                    <td className="px-4 py-4 text-sm text-slate-700">

                      {pesquisa.cliente

                        .empresa ||

                        pesquisa.cliente

                          .nome}

                    </td>





                    <td className="px-4 py-4 text-sm text-slate-700">

                      {pesquisa.setor ||

                        "Toda a empresa"}

                    </td>





                    <td className="px-4 py-4">

                      <StatusBadge

                        status={

                          pesquisa.status

                        }

                      />

                    </td>





                    <TdNumero

                      valor={

                        pesquisa.totalRespostas

                      }

                    />





                    <td className="px-4 py-4 text-right print:hidden">

                      <Link

                        href={`/pesquisas/${pesquisa.id}/relatorio`}

                        className="text-sm font-bold text-blue-600 transition hover:text-blue-800"

                      >

                        Ver relatório

                      </Link>

                    </td>

                  </tr>

                )

              )

            )}

          </tbody>

        </table>

      </div>

    </section>

  );

}





function AvisoAnalise() {

  return (

    <div className="mb-6 rounded-3xl border border-blue-200 bg-blue-50 p-6">

      <h2 className="font-black text-blue-950">

        Dados analíticos ainda não calculados

      </h2>



      <p className="mt-2 text-sm leading-6 text-blue-800">

        O relatório operacional está disponível, mas ainda não foram encontrados

        indicadores de favorabilidade e resultados por dimensão.

      </p>

    </div>

  );

}





function BarraPercentual({

  titulo,

  percentualValor,

}: {

  titulo: string;



  percentualValor: number;

}) {

  const valor =

    limitarPercentual(

      percentualValor

    );





  return (

    <div>

      <div className="mb-2 flex items-center justify-between gap-4">

        <span className="text-sm font-semibold text-slate-700">

          {

            titulo

          }

        </span>



        <strong className="text-sm text-blue-700">

          {percentual(

            valor

          )}

        </strong>

      </div>





      <div className="h-3 overflow-hidden rounded-full bg-slate-100">

        <div

          className="h-full rounded-full bg-blue-600"

          style={{

            width: `${valor}%`,

          }}

        />

      </div>

    </div>

  );

}





function Card({

  titulo,

  valor,

  destaque = false,

}: {

  titulo: string;



  valor: string | number;



  destaque?: boolean;

}) {

  return (

    <div

      className={`rounded-3xl p-5 shadow-sm ring-1 ${

        destaque

          ? "bg-blue-600 text-white ring-blue-600"

          : "bg-white text-slate-900 ring-slate-200"

      }`}

    >

      <p

        className={`text-sm font-semibold ${

          destaque

            ? "text-blue-100"

            : "text-slate-500"

        }`}

      >

        {

          titulo

        }

      </p>



      <strong className="mt-2 block text-3xl font-black">

        {

          valor

        }

      </strong>

    </div>

  );

}





function CampoFiltro({

  label,

  name,

  type,

  defaultValue,

}: {

  label: string;



  name: string;



  type: string;



  defaultValue: string;

}) {

  return (

    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">

        {

          label

        }

      </label>



      <input

        name={

          name

        }

        type={

          type

        }

        defaultValue={

          defaultValue

        }

        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

      />

    </div>

  );

}





function StatusBadge({

  status,

}: {

  status: string;

}) {

  const classe =

    status ===

    "ABERTA"

      ? "bg-green-100 text-green-700"

      : status ===

          "FECHADA"

        ? "bg-red-100 text-red-700"

        : "bg-slate-100 text-slate-700";





  return (

    <span

      className={`rounded-full px-3 py-1 text-xs font-bold ${classe}`}

    >

      {status.replaceAll(

        "_",

        " "

      )}

    </span>

  );

}





function Th({

  children,

  direita = false,

}: {

  children: React.ReactNode;



  direita?: boolean;

}) {

  return (

    <th

      className={`px-4 py-3 text-sm font-bold text-slate-600 ${

        direita

          ? "text-right"

          : "text-left"

      }`}

    >

      {

        children

      }

    </th>

  );

}





function TdNumero({

  valor,

}: {

  valor: string | number;

}) {

  return (

    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-700">

      {

        valor

      }

    </td>

  );

}





function percentual(

  valor: number

) {

  return `${valor

    .toFixed(1)

    .replace(

      ".",

      ","

    )}%`;

}





function limitarPercentual(

  valor: number

) {

  if (

    !Number.isFinite(

      valor

    )

  ) {

    return 0;

  }





  return Math.min(

    100,

    Math.max(

      0,

      valor

    )

  );

}



function montarUrlRelatorioImpressao(

  dados: DadosRelatorioClima,

  pathname: string

) {

  const params =

    new URLSearchParams();





  if (

    dados.filtros.dataInicio

  ) {

    params.set(

      "dataInicio",

      dados.filtros.dataInicio

    );

  }





  if (

    dados.filtros.dataFim

  ) {

    params.set(

      "dataFim",

      dados.filtros.dataFim

    );

  }





  if (

    dados.filtros.clienteId

  ) {

    params.set(

      "clienteId",

      dados.filtros.clienteId

    );

  }





  if (

    dados.filtros.setor

  ) {

    params.set(

      "setor",

      dados.filtros.setor

    );

  }





  const query =

    params.toString();





  return query

    ? `${pathname}?${query}`

    : pathname;

}
