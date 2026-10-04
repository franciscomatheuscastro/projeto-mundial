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





export type DimensaoDesempenho = {

  id: string;

  nome: string;

  score: number;

  classificacao: string;

  totalRespostas: number;

};





export type AnaliseDesempenho = {

  scoreDesempenho: number | null;



  dimensoes: DimensaoDesempenho[];



  forcas: string[];



  pontosAtencao: string[];



  prioridades: string[];

};





export type DadosRelatorioDesempenho = {

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



    setor?: string | null;



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



  analise?: AnaliseDesempenho;

};





export default function RelatorioAvaliacaoDesempenhoTela({

  dados,

}: {

  dados: DadosRelatorioDesempenho;

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
        b.score -
        a.score
    );


  const top5Dimensoes =
    dimensoesOrdenadas.slice(
      0,
      5
    );


  const piores5Dimensoes =
    [
      ...dimensoesOrdenadas,
    ]
      .reverse()
      .slice(
        0,
        5
      );





  return (

    <main className="min-h-screen bg-slate-100">

      <header className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm print:shadow-none sm:px-6 lg:px-8">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">

              Avaliação de Desempenho

            </p>



            <h1 className="mt-1 text-2xl font-black text-slate-900">

              Relatório de Avaliação de Desempenho

            </h1>



            <p className="mt-1 text-sm text-slate-500">

              Competências, pontos fortes, oportunidades de melhoria e prioridades de desenvolvimento.

            </p>

          </div>





          <div className="flex gap-3 print:hidden">

            <Link

              href="/avaliacao-desempenho"

              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"

            >

              Voltar

            </Link>



            <Link

              href={montarUrlRelatorioImpressao(

                dados,

                "/relatorios/avaliacao-desempenho"

              )}

              target="_blank"

              rel="noopener noreferrer"

              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"

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

            titulo="Avaliações"

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

            titulo="Score de Desempenho"

            valor={

              analise?.scoreDesempenho ==

              null

                ? "—"

                : `${formatarScore(

                    analise.scoreDesempenho

                  )}/100`

            }

            destaque

          />

        </div>





        {!analise ? (

          <AvisoAnalise />

        ) : (

          <>

            <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">

                Desempenho Avaliado

              </p>



              <h2 className="mt-1 text-lg font-black text-slate-900">

                Resultado por dimensão

              </h2>



              <p className="mt-1 text-sm text-slate-500">

                Consolidação das dimensões de desempenho em uma escala de 0

                a 100.

              </p>





              {analise.dimensoes.length ===

              0 ? (

                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">

                  Nenhuma dimensão com dados disponíveis.

                </div>

              ) : (

                <div className="mt-6 space-y-4">

                  {analise.dimensoes.map(

                    dimensao => (

                      <DimensaoDesempenhoCard

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
                <RankingDesempenho
                  titulo="Top 5 dimensões"
                  descricao="Dimensões com os maiores scores de desempenho."
                  itens={
                    top5Dimensoes
                  }
                  tipo="melhores"
                />

                <RankingDesempenho
                  titulo="5 piores dimensões"
                  descricao="Dimensões com os menores scores de desempenho e maior necessidade de desenvolvimento."
                  itens={
                    piores5Dimensoes
                  }
                  tipo="atencao"
                />
              </div>
            )}



            <div className="mb-6 grid gap-6 xl:grid-cols-3">

              <ListaExecutiva

                titulo="Forças"

                itens={

                  analise.forcas

                }

                vazio="Nenhuma força classificada."

                variante="forca"

              />



              <ListaExecutiva

                titulo="Pontos de atenção"

                itens={

                  analise.pontosAtencao

                }

                vazio="Nenhum ponto de atenção identificado."

                variante="atencao"

              />



              <ListaExecutiva

                titulo="Prioridades"

                itens={

                  analise.prioridades

                }

                vazio="Nenhuma prioridade classificada."

                variante="prioridade"

                destaque

              />

            </div>

          </>

        )}





        <MetodologiaCriteriosRelatorio

          tipo="AVALIACAO_DESEMPENHO"

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

          variante="diagnostico"

        />





        <TabelaAplicacoes

          pesquisas={

            dados.pesquisas

          }

        />

      </section>

    </main>

  );

}





function DimensaoDesempenhoCard({

  dimensao,

}: {

  dimensao: DimensaoDesempenho;

}) {

  const score =

    Math.min(

      100,

      Math.max(

        0,

        dimensao.score

      )

    );





  return (

    <div className="rounded-2xl border border-slate-200 p-4">

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

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

          <strong className="block text-xl text-indigo-700">

            {formatarScore(

              score

            )}

            /100

          </strong>



          <span className="text-xs font-bold uppercase text-slate-500">

            {formatarClassificacao(

              dimensao.classificacao

            )}

          </span>

        </div>

      </div>





      <div className="h-3 overflow-hidden rounded-full bg-slate-100">

        <div

          className="h-full rounded-full bg-indigo-600"

          style={{

            width: `${score}%`,

          }}

        />

      </div>

    </div>

  );

}






function RankingDesempenho({
  titulo,
  descricao,
  itens,
  tipo,
}: {
  titulo: string;
  descricao: string;
  itens: DimensaoDesempenho[];
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
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black ${
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

                    <strong className="truncate text-sm text-slate-900">
                      {
                        item.nome
                      }
                    </strong>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      formatarClassificacao(
                        item.classificacao
                      )
                    }
                  </p>
                </div>

                <strong
                  className={
                    tipo ===
                    "melhores"
                      ? "text-green-700"
                      : "text-amber-700"
                  }
                >
                  {formatarScore(
                    item.score
                  )}
                  /100
                </strong>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}



function ListaExecutiva({

  titulo,

  itens,

  vazio,

  destaque = false,

  variante,

}: {

  titulo: string;



  itens: string[];



  vazio: string;



  destaque?: boolean;



  variante:

    | "forca"

    | "atencao"

    | "prioridade";

}) {

  const classeItem =

    variante ===

    "forca"

      ? "bg-emerald-50 text-emerald-800"

      : variante ===

          "atencao"

        ? "bg-amber-50 text-amber-800"

        : destaque

          ? "bg-white/10 text-white"

          : "bg-red-50 text-red-800";





  return (

    <section

      className={`rounded-3xl p-6 shadow-sm ring-1 ${

        destaque

          ? "bg-indigo-950 text-white ring-indigo-950"

          : "bg-white text-slate-900 ring-slate-200"

      }`}

    >

      <h2 className="text-lg font-black">

        {

          titulo

        }

      </h2>





      {itens.length ===

      0 ? (

        <p

          className={`mt-4 text-sm ${

            destaque

              ? "text-indigo-200"

              : "text-slate-500"

          }`}

        >

          {

            vazio

          }

        </p>

      ) : (

        <div className="mt-4 space-y-3">

          {itens.map(

            (

              item,

              index

            ) => (

              <div

                key={`${item}-${index}`}

                className={`rounded-2xl p-3 text-sm font-semibold ${classeItem}`}

              >

                {

                  item

                }

              </div>

            )

          )}

        </div>

      )}

    </section>

  );

}






function Filtros({

  dados,

}: {

  dados: DadosRelatorioDesempenho;

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

          defaultValue={

            dados.filtros

              .dataInicio ||

            ""

          }

        />



        <CampoFiltro

          label="Data final"

          name="dataFim"

          defaultValue={

            dados.filtros

              .dataFim ||

            ""

          }

        />





        <div>

          <label className="mb-2 block text-sm font-semibold text-slate-700">

            Organização

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

            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"

          >

            <option value="">
              Todas as organizações
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

            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"

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

          href="/avaliacao-desempenho/relatorio"

          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"

        >

          Limpar

        </Link>



        <button

          type="submit"

          className="min-h-12 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"

        >

          Gerar análise

        </button>

      </div>

    </form>

  );

}





function TabelaAplicacoes({

  pesquisas,

}: {

  pesquisas: DadosRelatorioDesempenho["pesquisas"];

}) {

  return (

    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

      <div className="border-b border-slate-100 p-6">

        <h2 className="text-lg font-black text-slate-900">

          Avaliações consideradas

        </h2>



        <p className="mt-1 text-sm text-slate-500">

          Aplicações incluídas no consolidado apresentado acima.

        </p>

      </div>





      <div className="overflow-x-auto">

        <table className="w-full min-w-[900px]">

          <thead className="bg-slate-50">

            <tr>

              <Th>

                Avaliação

              </Th>



              <Th>

                Organização

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

                    5

                  }

                  className="p-10 text-center text-sm text-slate-500"

                >

                  Nenhum avaliação encontrado.

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

                        href={`/avaliacao-desempenho/${pesquisa.id}/relatorio`}

                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800"

                      >

                        Ver avaliação

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

    <div className="mb-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-6">

      <h2 className="font-black text-indigo-950">

        Score de desempenho ainda não calculado

      </h2>



      <p className="mt-2 text-sm leading-6 text-indigo-800">

        O backend ainda precisa consolidar as dimensões do avaliação e aplicar

        as regras de interpretação definidas no modelo.

      </p>

    </div>

  );

}





function CampoFiltro({

  label,

  name,

  defaultValue,

}: {

  label: string;



  name: string;



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

        type="date"

        defaultValue={

          defaultValue

        }

        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"

      />

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

          ? "bg-indigo-600 text-white ring-indigo-600"

          : "bg-white text-slate-900 ring-slate-200"

      }`}

    >

      <p

        className={`text-sm font-semibold ${

          destaque

            ? "text-indigo-100"

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





function formatarScore(

  valor: number

) {

  return valor

    .toFixed(1)

    .replace(

      ".",

      ","

    );

}





function formatarClassificacao(

  valor: string

) {

  return valor

    .replaceAll(

      "_",

      " "

    )

    .toLocaleLowerCase(

      "pt-BR"

    )

    .replace(

      /^./,

      letra =>

        letra.toLocaleUpperCase(

          "pt-BR"

        )

    );

}



function montarUrlRelatorioImpressao(

  dados: DadosRelatorioDesempenho,

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
