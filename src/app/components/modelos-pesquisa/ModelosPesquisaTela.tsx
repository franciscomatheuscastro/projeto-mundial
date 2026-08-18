"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";

import {
  useModelosPesquisa,
} from "@/src/app/data/hooks/useModelosPesquisa";

import type {
  ConfiguracaoAnaliseModelo,
  DimensaoModelo,
  FaixaInterpretacaoModelo,
  PerguntaModelo,
  SentidoPontuacao,
} from "@/src/core/model/ModeloPesquisa";


/* =========================================================
 * CONSTANTES CLIENT-SAFE
 * ======================================================= */

const TIPO_MODULO = {
  CLIMA: "CLIMA",
  DIAGNOSTICO_ORGANIZACIONAL:
    "DIAGNOSTICO_ORGANIZACIONAL",
  AVALIACAO_PSICOSSOCIAL:
    "AVALIACAO_PSICOSSOCIAL",
} as const;


const TIPO_PERGUNTA = {
  NOTA: "NOTA",
  SIM_NAO: "SIM_NAO",
  TEXTO: "TEXTO",
  TEXTO_LONGO: "TEXTO_LONGO",
  MULTIPLA_ESCOLHA:
    "MULTIPLA_ESCOLHA",
} as const;


/* =========================================================
 * PROPS
 * ======================================================= */

type Props = {
  modo:
    | "lista"
    | "novo"
    | "editar";

  modeloId?: string;
};


type EtapaEditor =
  | "dados"
  | "analise"
  | "dimensoes"
  | "perguntas";


/* =========================================================
 * ESTILO
 * ======================================================= */

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";


const sectionClassName =
  "scroll-mt-28 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200";


/* =========================================================
 * UTILITÁRIOS
 * ======================================================= */

function gerarIdLocal(
  prefixo: string
) {
  if (
    typeof crypto !==
      "undefined" &&
    "randomUUID" in crypto
  ) {
    return `${prefixo}-${crypto.randomUUID()}`;
  }


  return `${prefixo}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}


function criarConfiguracaoAnalisePadraoCliente(
  tipo: TipoModuloPesquisa
): ConfiguracaoAnaliseModelo {
  if (
    tipo ===
    TIPO_MODULO.CLIMA
  ) {
    return {
      metodo:
        "FAVORABILIDADE",

      escalaMinima:
        1,

      escalaMaxima:
        5,

      favoravel: [
        4,
        5,
      ],

      neutro: [
        3,
      ],

      desfavoravel: [
        1,
        2,
      ],

      faixas: [],
    };
  }


  if (
    tipo ===
    TIPO_MODULO.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    return {
      metodo:
        "MATURIDADE",

      escalaMinima:
        1,

      escalaMaxima:
        5,

      favoravel: [],

      neutro: [],

      desfavoravel: [],

      faixas: [],
    };
  }


  return {
    metodo:
      "RISCO_PSICOSSOCIAL",

    escalaMinima:
      1,

    escalaMaxima:
      5,

    favoravel: [],

    neutro: [],

    desfavoravel: [],

    faixas: [],
  };
}


function nomeModulo(
  tipo: TipoModuloPesquisa
) {
  if (
    tipo ===
    TIPO_MODULO.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    return "Diagnóstico Organizacional";
  }


  if (
    tipo ===
    TIPO_MODULO.AVALIACAO_PSICOSSOCIAL
  ) {
    return "Avaliação Psicossocial";
  }


  return "Pesquisa de Clima";
}


function nomeMetodo(
  metodo: string
) {
  if (
    metodo ===
    "FAVORABILIDADE"
  ) {
    return "Favorabilidade";
  }


  if (
    metodo ===
    "MATURIDADE"
  ) {
    return "Maturidade";
  }


  if (
    metodo ===
    "RISCO_PSICOSSOCIAL"
  ) {
    return "Risco psicossocial";
  }


  return metodo;
}


function nomeTipoPergunta(
  tipo: TipoPergunta
) {
  if (
    tipo ===
    TIPO_PERGUNTA.NOTA
  ) {
    return "Nota";
  }


  if (
    tipo ===
    TIPO_PERGUNTA.SIM_NAO
  ) {
    return "Sim ou Não";
  }


  if (
    tipo ===
    TIPO_PERGUNTA.TEXTO
  ) {
    return "Texto curto";
  }


  if (
    tipo ===
    TIPO_PERGUNTA.TEXTO_LONGO
  ) {
    return "Texto longo";
  }


  return "Múltipla escolha";
}


/* =========================================================
 * COMPONENTE PRINCIPAL
 * ======================================================= */

export default function ModelosPesquisaTela({
  modo,
  modeloId,
}: Props) {
  const router =
    useRouter();


  const {
    modelos,
    modeloSelecionado,
    carregando,
    processando,
    erro,
    carregarModeloPorId,
    salvarModelo,
    adicionarPergunta,
    salvarPergunta,
    excluirPergunta,
    duplicarModelo,
    excluirModelo,
  } =
    useModelosPesquisa();


  const [
    titulo,
    setTitulo,
  ] =
    useState("");


  const [
    descricao,
    setDescricao,
  ] =
    useState("");


  const [
    tipo,
    setTipo,
  ] =
    useState<TipoModuloPesquisa>(
      TIPO_MODULO.CLIMA as TipoModuloPesquisa
    );


  const [
    ativo,
    setAtivo,
  ] =
    useState(true);


  const [
    dimensoes,
    setDimensoes,
  ] =
    useState<DimensaoModelo[]>(
      []
    );


  const [
    configuracaoAnalise,
    setConfiguracaoAnalise,
  ] =
    useState<ConfiguracaoAnaliseModelo>(
      criarConfiguracaoAnalisePadraoCliente(
        TIPO_MODULO.CLIMA as TipoModuloPesquisa
      )
    );


  const [
    etapaAtiva,
    setEtapaAtiva,
  ] =
    useState<EtapaEditor>(
      "dados"
    );


  useEffect(() => {
    if (
      modo ===
        "editar" &&
      modeloId
    ) {
      void carregarModeloPorId(
        modeloId
      ).catch(
        () =>
          undefined
      );
    }
  }, [
    modo,
    modeloId,
    carregarModeloPorId,
  ]);


  useEffect(() => {
    if (
      modo ===
        "editar" &&
      modeloSelecionado
    ) {
      setTitulo(
        modeloSelecionado.titulo
      );

      setDescricao(
        modeloSelecionado.descricao ??
          ""
      );

      setTipo(
        modeloSelecionado.tipo
      );

      setAtivo(
        modeloSelecionado.ativo ??
          true
      );

      setDimensoes(
        modeloSelecionado.dimensoes ??
          []
      );

      setConfiguracaoAnalise(
        modeloSelecionado.configuracaoAnalise ??
          criarConfiguracaoAnalisePadraoCliente(
            modeloSelecionado.tipo
          )
      );
    }
  }, [
    modo,
    modeloSelecionado,
  ]);


  function alterarTipo(
    novoTipo: TipoModuloPesquisa
  ) {
    if (
      novoTipo ===
      tipo
    ) {
      return;
    }


    setTipo(
      novoTipo
    );


    setConfiguracaoAnalise(
      criarConfiguracaoAnalisePadraoCliente(
        novoTipo
      )
    );
  }


  async function enviarModelo(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    const resultado =
      await salvarModelo({
        id:
          modo ===
          "editar"
            ? modeloId
            : undefined,

        titulo,

        descricao:
          descricao.trim() ||
          null,

        tipo,

        ativo,

        modeloPadrao:
          modeloSelecionado?.modeloPadrao ??
          false,

        perguntas:
          modeloSelecionado?.perguntas ??
          [],

        dimensoes,

        configuracaoAnalise,
      });


    router.push(
      `/modelos-pesquisa/${resultado.id}`
    );

    router.refresh();
  }


  async function duplicarAtual() {
    if (
      !modeloId
    ) {
      return;
    }


    const novoModelo =
      await duplicarModelo(
        modeloId
      );


    router.push(
      `/modelos-pesquisa/${novoModelo.id}`
    );

    router.refresh();
  }


  async function excluirModeloAtual(
    id: string
  ) {
    if (
      !confirm(
        "Tem certeza que deseja excluir este modelo?"
      )
    ) {
      return;
    }


    await excluirModelo(
      id
    );


    router.push(
      "/modelos-pesquisa"
    );

    router.refresh();
  }


  function adicionarDimensao() {
    setDimensoes(
      atual => [
        ...atual,

        {
          id:
            gerarIdLocal(
              "dim"
            ),

          nome:
            "Nova dimensão",

          descricao:
            null,

          ordem:
            atual.length +
            1,

          peso:
            1,

          fatorRisco:
            null,
        },
      ]
    );
  }


  function atualizarDimensao(
    id: string,
    dados: Partial<DimensaoModelo>
  ) {
    setDimensoes(
      atual =>
        atual.map(
          dimensao =>
            dimensao.id ===
            id
              ? {
                  ...dimensao,
                  ...dados,
                }
              : dimensao
        )
    );
  }


  function excluirDimensao(
    id: string
  ) {
    if (
      !confirm(
        "Excluir esta dimensão? As perguntas vinculadas a ela ficarão sem dimensão após salvar o modelo."
      )
    ) {
      return;
    }


    setDimensoes(
      atual =>
        atual
          .filter(
            dimensao =>
              dimensao.id !==
              id
          )
          .map(
            (
              dimensao,
              index
            ) => ({
              ...dimensao,

              ordem:
                index +
                1,
            })
          )
    );
  }


  /* =======================================================
   * LISTA
   * ===================================================== */

  if (
    modo ===
    "lista"
  ) {
    const totalModelos =
      modelos.length;


    const totalAtivos =
      modelos.filter(
        modelo =>
          modelo.ativo
      ).length;


    const totalClima =
      modelos.filter(
        modelo =>
          modelo.tipo ===
          TIPO_MODULO.CLIMA
      ).length;


    const totalOutrosModulos =
      modelos.filter(
        modelo =>
          modelo.tipo !==
          TIPO_MODULO.CLIMA
      ).length;


    return (
      <main className="min-h-screen bg-slate-100">
        <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                Estrutura de Questionários
              </p>


              <h1 className="mt-1 text-2xl font-black text-slate-900">
                Construtor de Modelos
              </h1>


              <p className="mt-1 text-sm text-slate-500">
                Crie instrumentos reutilizáveis e configure sua estrutura
                analítica.
              </p>
            </div>


            <Link
              href="/modelos-pesquisa/novo"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              + Novo modelo
            </Link>
          </div>
        </header>


        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <AlertaErro
            mensagem={
              erro
            }
          />


          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardResumo
              titulo="Modelos"
              valor={
                totalModelos
              }
            />


            <CardResumo
              titulo="Ativos"
              valor={
                totalAtivos
              }
            />


            <CardResumo
              titulo="Pesquisa de Clima"
              valor={
                totalClima
              }
            />


            <CardResumo
              titulo="Outros módulos"
              valor={
                totalOutrosModulos
              }
            />
          </div>


          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>
                    Modelo
                  </Th>

                  <Th>
                    Tipo
                  </Th>

                  <Th>
                    Dimensões
                  </Th>

                  <Th>
                    Perguntas
                  </Th>

                  <Th>
                    Aplicações
                  </Th>

                  <Th>
                    Status
                  </Th>

                  <Th direita>
                    Ações
                  </Th>
                </tr>
              </thead>


              <tbody>
                {carregando ? (
                  <LinhaVazia
                    colunas={
                      7
                    }
                    texto="Carregando modelos..."
                  />
                ) : modelos.length ===
                  0 ? (
                  <LinhaVazia
                    colunas={
                      7
                    }
                    texto="Nenhum modelo cadastrado."
                  />
                ) : (
                  modelos.map(
                    modelo => (
                      <tr
                        key={
                          modelo.id
                        }
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900">
                            {
                              modelo.titulo
                            }
                          </div>

                          <div className="text-sm text-slate-500">
                            {modelo.descricao ||
                              "Sem descrição"}
                          </div>
                        </td>


                        <td className="w-[240px] px-4 py-4 align-middle">
                          <TipoModeloBadge
                            tipo={
                              modelo.tipo
                            }
                          />
                        </td>


                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          {
                            modelo.dimensoes
                              ?.length ||
                            0
                          }
                        </td>


                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          {
                            modelo.totalPerguntas
                          }
                        </td>


                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          {
                            modelo.totalPesquisas
                          }
                        </td>


                        <td className="px-4 py-4">
                          <StatusBadge
                            ativo={
                              modelo.ativo ??
                              false
                            }
                          />
                        </td>


                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/modelos-pesquisa/${modelo.id}`}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </Link>


                          <button
                            type="button"
                            onClick={() =>
                              void excluirModeloAtual(
                                modelo.id
                              )
                            }
                            disabled={
                              processando
                            }
                            className="ml-4 text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-60"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    );
  }


  /* =======================================================
   * NOVO MODELO
   * ===================================================== */

  if (
    modo ===
    "novo"
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <CabecalhoEditor
          titulo="Criar Modelo"
          descricao="Defina o tipo e a metodologia inicial do instrumento."
        />


        <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <form
            onSubmit={
              enviarModelo
            }
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <AlertaErro
              mensagem={
                erro
              }
            />


            <div className="mb-6">
              <EtapaTitulo
                numero="1"
                titulo="Identificação do modelo"
                descricao="Defina o módulo, título e objetivo deste instrumento."
              />
            </div>


            <SelectTipoModelo
              value={
                tipo
              }
              onChange={
                alterarTipo
              }
            />


            <Campo
              label="Título do modelo"
              value={
                titulo
              }
              onChange={
                setTitulo
              }
              required
              placeholder="Ex: Pesquisa de Clima 2026"
            />


            <CampoArea
              label="Descrição"
              value={
                descricao
              }
              onChange={
                setDescricao
              }
              placeholder="Objetivo e contexto do instrumento"
            />


            <div className="mt-7 border-t border-slate-200 pt-6">
              <EtapaTitulo
                numero="2"
                titulo="Método de análise"
                descricao="Configure a escala e a interpretação dos resultados."
              />


              <div className="mt-5 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <ConfiguracaoAnaliseEditor
                  tipo={
                    tipo
                  }
                  configuracao={
                    configuracaoAnalise
                  }
                  onChange={
                    setConfiguracaoAnalise
                  }
                />
              </div>
            </div>


            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
              <Link
                href="/modelos-pesquisa"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
              >
                Cancelar
              </Link>


              <button
                disabled={
                  processando
                }
                className="min-h-12 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                {processando
                  ? "Criando..."
                  : "Criar modelo"}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }


  /* =======================================================
   * EDITAR MODELO
   * ===================================================== */

  const totalPerguntas =
    modeloSelecionado?.perguntas.length ??
    0;


  return (
    <main className="min-h-screen bg-slate-100">
      <CabecalhoEditor
        titulo="Editar Modelo"
        descricao="Configure uma etapa por vez para manter o cadastro mais claro e objetivo."
      />


      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <TipoModeloBadge
            tipo={
              tipo
            }
          />


          <ResumoChip
            label="Dimensões"
            value={
              dimensoes.length
            }
          />


          <ResumoChip
            label="Perguntas"
            value={
              totalPerguntas
            }
          />


          <ResumoChip
            label="Método"
            value={
              nomeMetodo(
                configuracaoAnalise.metodo
              )
            }
          />


          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              ativo
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {ativo
              ? "Modelo ativo"
              : "Modelo inativo"}
          </span>
        </div>
      </div>


      <section className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:px-8">
        {/* =================================================
         * NAVEGAÇÃO DAS ETAPAS
         * =============================================== */}

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-300">
              Cadastro do modelo
            </p>


            <h2 className="mt-2 text-lg font-black">
              Etapas
            </h2>


            <p className="mt-1 text-sm leading-6 text-slate-300">
              Selecione uma etapa. Somente o conteúdo escolhido será exibido ao
              lado.
            </p>


            <nav className="mt-5 space-y-2">
              <AtalhoEditor
                numero="1"
                titulo="Dados gerais"
                descricao="Identificação e status"
                ativo={
                  etapaAtiva ===
                  "dados"
                }
                onClick={() =>
                  setEtapaAtiva(
                    "dados"
                  )
                }
              />


              <AtalhoEditor
                numero="2"
                titulo="Configuração da análise"
                descricao="Escala e interpretação"
                ativo={
                  etapaAtiva ===
                  "analise"
                }
                onClick={() =>
                  setEtapaAtiva(
                    "analise"
                  )
                }
              />


              <AtalhoEditor
                numero="3"
                titulo="Dimensões"
                descricao={`${dimensoes.length} cadastrada(s)`}
                ativo={
                  etapaAtiva ===
                  "dimensoes"
                }
                onClick={() =>
                  setEtapaAtiva(
                    "dimensoes"
                  )
                }
              />


              <AtalhoEditor
                numero="4"
                titulo="Perguntas"
                descricao={`${totalPerguntas} cadastrada(s)`}
                ativo={
                  etapaAtiva ===
                  "perguntas"
                }
                onClick={() =>
                  setEtapaAtiva(
                    "perguntas"
                  )
                }
              />
            </nav>


            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold text-slate-400">
                Modelo atual
              </p>


              <p className="mt-1 line-clamp-2 text-sm font-bold text-white">
                {titulo ||
                  "Modelo sem título"}
              </p>


              <p className="mt-1 text-xs text-slate-400">
                {nomeModulo(
                  tipo
                )}
              </p>
            </div>
          </div>
        </aside>


        {/* =================================================
         * CONTEÚDO DA ETAPA ATIVA
         * =============================================== */}

        <div className="min-w-0">
          {/* =================================================
           * ETAPA 1 - DADOS GERAIS
           * =============================================== */}

          {etapaAtiva ===
            "dados" && (
            <form
              onSubmit={
                enviarModelo
              }
              className={`${sectionClassName} overflow-hidden`}
            >
              <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
                <EtapaTitulo
                  numero="1"
                  titulo="Dados gerais"
                  descricao="Defina o módulo, identificação e status do instrumento."
                />
              </div>


              <div className="p-5 sm:p-7">
                <AlertaErro
                  mensagem={
                    erro
                  }
                />


                <div className="grid gap-x-6 lg:grid-cols-2">
                  <SelectTipoModelo
                    value={
                      tipo
                    }
                    onChange={
                      alterarTipo
                    }
                  />


                  <Campo
                    label="Título"
                    value={
                      titulo
                    }
                    onChange={
                      setTitulo
                    }
                    required
                  />


                  <div className="lg:col-span-2">
                    <CampoArea
                      label="Descrição"
                      value={
                        descricao
                      }
                      onChange={
                        setDescricao
                      }
                      placeholder="Objetivo e contexto do instrumento"
                    />
                  </div>
                </div>


                <label className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={
                      ativo
                    }
                    onChange={(
                      event
                    ) =>
                      setAtivo(
                        event.target.checked
                      )
                    }
                  />

                  <div>
                    <p className="font-bold text-slate-800">
                      Modelo ativo
                    </p>


                    <p className="mt-0.5 text-xs font-normal text-slate-500">
                      Modelos inativos permanecem cadastrados, mas não devem ser
                      utilizados em novas aplicações.
                    </p>
                  </div>
                </label>


                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      void duplicarAtual()
                    }
                    disabled={
                      processando
                    }
                    className="min-h-12 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Duplicar modelo
                  </button>


                  <button
                    disabled={
                      processando
                    }
                    className="min-h-12 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {processando
                      ? "Salvando..."
                      : "Salvar dados gerais"}
                  </button>
                </div>
              </div>
            </form>
          )}


          {/* =================================================
           * ETAPA 2 - ANÁLISE
           * =============================================== */}

          {etapaAtiva ===
            "analise" && (
            <form
              onSubmit={
                enviarModelo
              }
              className={`${sectionClassName} overflow-hidden`}
            >
              <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
                <EtapaTitulo
                  numero="2"
                  titulo="Configuração da análise"
                  descricao="Configure a escala e a forma como os resultados serão interpretados."
                />
              </div>


              <div className="p-5 sm:p-7">
                <div className="mx-auto max-w-4xl">
                  <ConfiguracaoAnaliseEditor
                    tipo={
                      tipo
                    }
                    configuracao={
                      configuracaoAnalise
                    }
                    onChange={
                      setConfiguracaoAnalise
                    }
                  />


                  <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-xs leading-5 text-amber-700">
                      As alterações da configuração analítica são persistidas ao
                      salvar esta etapa.
                    </p>


                    <button
                      disabled={
                        processando
                      }
                      className="min-h-12 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {processando
                        ? "Salvando..."
                        : "Salvar configuração"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}


          {/* =================================================
           * ETAPA 3 - DIMENSÕES
           * =============================================== */}

          {etapaAtiva ===
            "dimensoes" && (
            <form
              onSubmit={
                enviarModelo
              }
              className={`${sectionClassName} overflow-hidden`}
            >
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <EtapaTitulo
                  numero="3"
                  titulo="Dimensões"
                  descricao="Estruture os temas que agrupam e organizam as perguntas do instrumento."
                />


                <button
                  type="button"
                  onClick={
                    adicionarDimensao
                  }
                  className="min-h-11 shrink-0 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  + Nova dimensão
                </button>
              </div>


              <div className="p-5 sm:p-7">
                {dimensoes.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <p className="font-bold text-slate-700">
                      Nenhuma dimensão cadastrada.
                    </p>


                    <p className="mt-1 text-sm text-slate-500">
                      Crie a primeira dimensão para organizar a estrutura
                      analítica.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 2xl:grid-cols-2">
                    {dimensoes.map(
                      (
                        dimensao,
                        index
                      ) => (
                        <DimensaoCard
                          key={
                            dimensao.id
                          }
                          indice={
                            index +
                            1
                          }
                          dimensao={
                            dimensao
                          }
                          psicossocial={
                            tipo ===
                            TIPO_MODULO.AVALIACAO_PSICOSSOCIAL
                          }
                          onChange={(
                            dados
                          ) =>
                            atualizarDimensao(
                              dimensao.id,
                              dados
                            )
                          }
                          onExcluir={() =>
                            excluirDimensao(
                              dimensao.id
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}


                <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
                  <button
                    disabled={
                      processando
                    }
                    className="min-h-12 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {processando
                      ? "Salvando..."
                      : "Salvar dimensões"}
                  </button>
                </div>
              </div>
            </form>
          )}


          {/* =================================================
           * ETAPA 4 - PERGUNTAS
           * =============================================== */}

          {etapaAtiva ===
            "perguntas" && (
            <section className={`${sectionClassName} overflow-hidden`}>
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <EtapaTitulo
                  numero="4"
                  titulo="Perguntas"
                  descricao="Cadastre os itens do formulário e vincule cada pergunta à dimensão correta."
                />


                <button
                  type="button"
                  onClick={() => {
                    if (
                      modeloId
                    ) {
                      void adicionarPergunta(
                        modeloId
                      );
                    }
                  }}
                  disabled={
                    processando ||
                    !modeloId
                  }
                  className="min-h-11 shrink-0 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  + Adicionar pergunta
                </button>
              </div>


              <div className="bg-slate-50/70 p-5 sm:p-7">
                {carregando ||
                !modeloSelecionado ? (
                  <EstadoVazio
                    texto="Carregando modelo..."
                  />
                ) : modeloSelecionado.perguntas.length ===
                  0 ? (
                  <EstadoVazio
                    texto="Nenhuma pergunta cadastrada."
                  />
                ) : (
                  <div className="space-y-5">
                    {modeloSelecionado.perguntas.map(
                      (
                        pergunta,
                        index
                      ) => (
                        <PerguntaCard
                          key={
                            pergunta.id
                          }
                          indice={
                            index +
                            1
                          }
                          pergunta={
                            pergunta
                          }
                          dimensoes={
                            dimensoes
                          }
                          processando={
                            processando
                          }
                          onSalvar={async (
                            atualizada
                          ) => {
                            if (
                              !modeloId
                            ) {
                              return;
                            }


                            await salvarPergunta(
                              modeloId,
                              atualizada
                            );
                          }}
                          onExcluir={async (
                            perguntaId
                          ) => {
                            if (
                              !modeloId
                            ) {
                              return;
                            }


                            await excluirPergunta(
                              modeloId,
                              perguntaId
                            );
                          }}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}


/* =========================================================
 * COMPONENTES DE ORGANIZAÇÃO
 * ======================================================= */

function EtapaTitulo({
  numero,
  titulo,
  descricao,
  compacto = false,
}: {
  numero: string;
  titulo: string;
  descricao: string;
  compacto?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white">
        {
          numero
        }
      </span>


      <div>
        <h2
          className={
            compacto
              ? "text-base font-black text-slate-900"
              : "text-lg font-black text-slate-900"
          }
        >
          {
            titulo
          }
        </h2>


        <p className="mt-0.5 text-sm leading-5 text-slate-500">
          {
            descricao
          }
        </p>
      </div>
    </div>
  );
}


function AtalhoEditor({
  numero,
  titulo,
  descricao,
  ativo,
  onClick,
}: {
  numero: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
        ativo
          ? "border-blue-400/50 bg-blue-600 text-white shadow-lg shadow-blue-950/20"
          : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
            ativo
              ? "bg-white text-blue-700"
              : "bg-white/10 text-white"
          }`}
        >
          {
            numero
          }
        </span>


        <div className="min-w-0">
          <p className="text-sm font-bold">
            {
              titulo
            }
          </p>


          <p
            className={`mt-0.5 truncate text-xs ${
              ativo
                ? "text-blue-100"
                : "text-slate-400"
            }`}
          >
            {
              descricao
            }
          </p>
        </div>
      </div>
    </button>
  );
}


function ResumoChip({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | number;
}) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
      {
        label
      }:{" "}
      <strong className="text-slate-900">
        {
          value
        }
      </strong>
    </span>
  );
}


/* =========================================================
 * CONFIGURAÇÃO DE ANÁLISE
 * ======================================================= */

function ConfiguracaoAnaliseEditor({
  tipo,
  configuracao,
  onChange,
}: {
  tipo: TipoModuloPesquisa;

  configuracao: ConfiguracaoAnaliseModelo;

  onChange: (
    valor: ConfiguracaoAnaliseModelo
  ) => void;
}) {
  function alterar(
    dados: Partial<ConfiguracaoAnaliseModelo>
  ) {
    onChange({
      ...configuracao,
      ...dados,
    });
  }


  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Método
          </p>


          <p className="mt-1 text-sm font-black text-slate-900">
            {nomeMetodo(
              configuracao.metodo
            )}
          </p>
        </div>


        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          {configuracao.escalaMinima} a{" "}
          {configuracao.escalaMaxima}
        </span>
      </div>


      <div className="grid gap-3 sm:grid-cols-2">
        <CampoNumero
          label="Escala mínima"
          value={
            configuracao.escalaMinima
          }
          onChange={(
            valor
          ) =>
            alterar({
              escalaMinima:
                valor,
            })
          }
        />


        <CampoNumero
          label="Escala máxima"
          value={
            configuracao.escalaMaxima
          }
          onChange={(
            valor
          ) =>
            alterar({
              escalaMaxima:
                valor,
            })
          }
        />
      </div>


      {tipo ===
        TIPO_MODULO.CLIMA && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <p className="text-sm font-black text-blue-900">
            Favorabilidade
          </p>


          <p className="mt-1 text-xs leading-5 text-blue-700">
            Classifique as notas da escala entre favorável, neutro e
            desfavorável.
          </p>


          <div className="mt-4 space-y-3">
            <ArrayNotas
              label="Favorável"
              value={
                configuracao.favoravel
              }
              onChange={(
                valor
              ) =>
                alterar({
                  favoravel:
                    valor,
                })
              }
            />


            <ArrayNotas
              label="Neutro"
              value={
                configuracao.neutro
              }
              onChange={(
                valor
              ) =>
                alterar({
                  neutro:
                    valor,
                })
              }
            />


            <ArrayNotas
              label="Desfavorável"
              value={
                configuracao.desfavoravel
              }
              onChange={(
                valor
              ) =>
                alterar({
                  desfavoravel:
                    valor,
                })
              }
            />
          </div>
        </div>
      )}


      {tipo !==
        TIPO_MODULO.CLIMA && (
        <FaixasEditor
          faixas={
            configuracao.faixas
          }
          onChange={(
            faixas
          ) =>
            alterar({
              faixas,
            })
          }
          psicossocial={
            tipo ===
            TIPO_MODULO.AVALIACAO_PSICOSSOCIAL
          }
        />
      )}
    </div>
  );
}


/* =========================================================
 * FAIXAS
 * ======================================================= */

function FaixasEditor({
  faixas,
  onChange,
  psicossocial,
}: {
  faixas: FaixaInterpretacaoModelo[];

  onChange: (
    valor: FaixaInterpretacaoModelo[]
  ) => void;

  psicossocial: boolean;
}) {
  function adicionar() {
    onChange([
      ...faixas,

      {
        id:
          gerarIdLocal(
            "faixa"
          ),

        nome:
          "Nova faixa",

        minimo:
          0,

        maximo:
          100,

        classificacao:
          "NOVA_FAIXA",

        ordem:
          faixas.length +
          1,
      },
    ]);
  }


  function atualizar(
    id: string,
    dados: Partial<FaixaInterpretacaoModelo>
  ) {
    onChange(
      faixas.map(
        faixa =>
          faixa.id ===
          id
            ? {
                ...faixa,
                ...dados,
              }
            : faixa
      )
    );
  }


  function excluir(
    id: string
  ) {
    onChange(
      faixas
        .filter(
          faixa =>
            faixa.id !==
            id
        )
        .map(
          (
            faixa,
            index
          ) => ({
            ...faixa,

            ordem:
              index +
              1,
          })
        )
    );
  }


  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-900">
            Faixas de interpretação
          </p>


          <p className="mt-1 text-xs leading-5 text-slate-500">
            {psicossocial
              ? "Cadastre apenas as faixas previstas pela metodologia psicossocial utilizada."
              : "Defina como o score organizacional será classificado."}
          </p>
        </div>


        <button
          type="button"
          onClick={
            adicionar
          }
          className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white"
        >
          + Faixa
        </button>
      </div>


      <div className="mt-4 space-y-3">
        {faixas.map(
          (
            faixa,
            index
          ) => (
            <div
              key={
                faixa.id
              }
              className="rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Faixa{" "}
                  {
                    index +
                    1
                  }
                </span>


                <button
                  type="button"
                  onClick={() =>
                    excluir(
                      faixa.id
                    )
                  }
                  className="text-xs font-bold text-red-600"
                >
                  Excluir
                </button>
              </div>


              <div className="grid gap-3 sm:grid-cols-2">
                <CampoCompacto
                  label="Nome"
                  value={
                    faixa.nome
                  }
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      faixa.id,
                      {
                        nome:
                          valor,
                      }
                    )
                  }
                />


                <CampoCompacto
                  label="Classificação"
                  value={
                    faixa.classificacao
                  }
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      faixa.id,
                      {
                        classificacao:
                          valor,
                      }
                    )
                  }
                />


                <CampoNumero
                  label="Mínimo"
                  value={
                    faixa.minimo
                  }
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      faixa.id,
                      {
                        minimo:
                          valor,
                      }
                    )
                  }
                />


                <CampoNumero
                  label="Máximo"
                  value={
                    faixa.maximo
                  }
                  onChange={(
                    valor
                  ) =>
                    atualizar(
                      faixa.id,
                      {
                        maximo:
                          valor,
                      }
                    )
                  }
                />
              </div>
            </div>
          )
        )}


        {faixas.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
            <p className="text-xs font-semibold text-slate-500">
              Nenhuma faixa configurada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


/* =========================================================
 * DIMENSÃO
 * ======================================================= */

function DimensaoCard({
  indice,
  dimensao,
  psicossocial,
  onChange,
  onExcluir,
}: {
  indice: number;

  dimensao: DimensaoModelo;

  psicossocial: boolean;

  onChange: (
    dados: Partial<DimensaoModelo>
  ) => void;

  onExcluir: () => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-black text-blue-700 ring-1 ring-slate-200">
            {
              indice
            }
          </span>


          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Dimensão
            </p>


            <p className="text-sm font-black text-slate-900">
              {dimensao.nome ||
                `Dimensão ${indice}`}
            </p>
          </div>
        </div>


        <button
          type="button"
          onClick={
            onExcluir
          }
          className="rounded-xl px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
        >
          Excluir
        </button>
      </div>


      <div className="grid gap-4 md:grid-cols-[1fr_120px]">
        <CampoCompacto
          label="Nome"
          value={
            dimensao.nome
          }
          onChange={(
            nome
          ) =>
            onChange({
              nome,
            })
          }
        />


        <CampoNumero
          label="Peso"
          value={
            dimensao.peso
          }
          onChange={(
            peso
          ) =>
            onChange({
              peso,
            })
          }
        />


        <div className="md:col-span-2">
          <CampoCompacto
            label="Descrição"
            value={
              dimensao.descricao ??
              ""
            }
            onChange={(
              descricao
            ) =>
              onChange({
                descricao,
              })
            }
            placeholder="Opcional"
          />
        </div>


        {psicossocial && (
          <div className="md:col-span-2">
            <CampoCompacto
              label="Fator de risco"
              value={
                dimensao.fatorRisco ??
                ""
              }
              onChange={(
                fatorRisco
              ) =>
                onChange({
                  fatorRisco,
                })
              }
              placeholder="Ex: Sobrecarga de trabalho"
            />
          </div>
        )}
      </div>
    </article>
  );
}


/* =========================================================
 * PERGUNTA
 * ======================================================= */

function PerguntaCard({
  indice,
  pergunta,
  dimensoes,
  processando,
  onSalvar,
  onExcluir,
}: {
  indice: number;

  pergunta: PerguntaModelo;

  dimensoes: DimensaoModelo[];

  processando: boolean;

  onSalvar: (
    pergunta: PerguntaModelo
  ) => Promise<void>;

  onExcluir: (
    perguntaId: string
  ) => Promise<void>;
}) {
  const [
    titulo,
    setTitulo,
  ] =
    useState(
      pergunta.titulo
    );


  const [
    descricao,
    setDescricao,
  ] =
    useState(
      pergunta.descricao ??
        ""
    );


  const [
    tipo,
    setTipo,
  ] =
    useState<TipoPergunta>(
      pergunta.tipo
    );


  const [
    obrigatoria,
    setObrigatoria,
  ] =
    useState(
      pergunta.obrigatoria
    );


  const [
    opcoes,
    setOpcoes,
  ] =
    useState(
      pergunta.opcoes.join(
        "\n"
      )
    );


  const [
    dimensaoId,
    setDimensaoId,
  ] =
    useState(
      pergunta.dimensaoId ??
        ""
    );


  const [
    sentidoPontuacao,
    setSentidoPontuacao,
  ] =
    useState<SentidoPontuacao>(
      pergunta.sentidoPontuacao ??
        "POSITIVO"
    );


  const dimensaoSelecionada =
    dimensoes.find(
      dimensao =>
        dimensao.id ===
        dimensaoId
    );


  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    const opcoesTratadas =
      tipo ===
      TIPO_PERGUNTA.MULTIPLA_ESCOLHA
        ? opcoes
            .split("\n")
            .map(
              opcao =>
                opcao.trim()
            )
            .filter(
              Boolean
            )
        : [];


    const perguntaAtualizada: PerguntaModelo =
      {
        id:
          pergunta.id,

        titulo,

        descricao:
          descricao.trim() ||
          null,

        tipo,

        ordem:
          pergunta.ordem,

        obrigatoria,

        opcoes:
          opcoesTratadas,

        dimensaoId:
          dimensaoId ||
          null,

        sentidoPontuacao:
          tipo ===
          TIPO_PERGUNTA.NOTA
            ? sentidoPontuacao
            : "POSITIVO",
      };


    await onSalvar(
      perguntaAtualizada
    );
  }


  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-700">
            {
              indice
            }
          </span>


          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">
              {titulo ||
                `Pergunta ${indice}`}
            </p>


            <div className="mt-1 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                {nomeTipoPergunta(
                  tipo
                )}
              </span>


              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                {dimensaoSelecionada?.nome ||
                  "Sem dimensão"}
              </span>


              {obrigatoria && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  Obrigatória
                </span>
              )}
            </div>
          </div>
        </div>
      </div>


      <form
        onSubmit={
          salvar
        }
        className="p-5 sm:p-6"
      >
        <Campo
          label="Enunciado"
          value={
            titulo
          }
          onChange={
            setTitulo
          }
          required
        />


        <Campo
          label="Descrição complementar"
          value={
            descricao
          }
          onChange={
            setDescricao
          }
          placeholder="Opcional"
        />


        <div className="grid gap-4 md:grid-cols-2">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tipo da pergunta
            </label>


            <select
              value={
                tipo
              }
              onChange={(
                event
              ) => {
                const novoTipo =
                  event.target.value as TipoPergunta;


                setTipo(
                  novoTipo
                );


                if (
                  novoTipo !==
                  TIPO_PERGUNTA.MULTIPLA_ESCOLHA
                ) {
                  setOpcoes(
                    ""
                  );
                }
              }}
              className={
                inputClassName
              }
            >
              <option value="NOTA">
                Nota
              </option>

              <option value="SIM_NAO">
                Sim ou Não
              </option>

              <option value="TEXTO">
                Texto curto
              </option>

              <option value="TEXTO_LONGO">
                Texto longo
              </option>

              <option value="MULTIPLA_ESCOLHA">
                Múltipla escolha
              </option>
            </select>
          </div>


          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Dimensão
            </label>


            <select
              value={
                dimensaoId
              }
              onChange={(
                event
              ) =>
                setDimensaoId(
                  event.target.value
                )
              }
              className={
                inputClassName
              }
            >
              <option value="">
                Sem dimensão
              </option>


              {dimensoes.map(
                dimensao => (
                  <option
                    key={
                      dimensao.id
                    }
                    value={
                      dimensao.id
                    }
                  >
                    {
                      dimensao.nome
                    }
                  </option>
                )
              )}
            </select>
          </div>


          {tipo ===
            TIPO_PERGUNTA.NOTA && (
            <div className="mb-5 md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Sentido da pontuação
              </label>


              <select
                value={
                  sentidoPontuacao
                }
                onChange={(
                  event
                ) =>
                  setSentidoPontuacao(
                    event.target.value as SentidoPontuacao
                  )
                }
                className={
                  inputClassName
                }
              >
                <option value="POSITIVO">
                  Positivo — nota maior é melhor
                </option>

                <option value="NEGATIVO">
                  Negativo — nota maior é pior
                </option>
              </select>
            </div>
          )}


          {tipo ===
            TIPO_PERGUNTA.MULTIPLA_ESCOLHA && (
            <div className="md:col-span-2">
              <CampoArea
                label="Opções"
                value={
                  opcoes
                }
                onChange={
                  setOpcoes
                }
                placeholder="Uma opção por linha"
                required
              />
            </div>
          )}
        </div>


        <label className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={
              obrigatoria
            }
            onChange={(
              event
            ) =>
              setObrigatoria(
                event.target.checked
              )
            }
          />

          Pergunta obrigatória
        </label>


        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() =>
              void onExcluir(
                pergunta.id
              )
            }
            disabled={
              processando
            }
            className="min-h-11 rounded-2xl border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            Excluir pergunta
          </button>


          <button
            disabled={
              processando
            }
            className="min-h-11 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {processando
              ? "Salvando..."
              : "Salvar pergunta"}
          </button>
        </div>
      </form>
    </article>
  );
}


/* =========================================================
 * ARRAY DE NOTAS
 * ======================================================= */

function ArrayNotas({
  label,
  value,
  onChange,
}: {
  label: string;

  value: number[];

  onChange: (
    valor: number[]
  ) => void;
}) {
  return (
    <CampoCompacto
      label={
        label
      }
      value={
        value.join(
          ", "
        )
      }
      onChange={(
        texto
      ) =>
        onChange(
          texto
            .split(",")
            .map(
              item =>
                Number(
                  item.trim()
                )
            )
            .filter(
              item =>
                Number.isFinite(
                  item
                )
            )
        )
      }
      placeholder="Ex: 4, 5"
    />
  );
}


/* =========================================================
 * CAMPOS
 * ======================================================= */

function CampoNumero({
  label,
  value,
  onChange,
}: {
  label: string;

  value: number;

  onChange: (
    valor: number
  ) => void;
}) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {
          label
        }
      </label>


      <input
        type="number"
        step="0.01"
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        className={
          inputClassName
        }
      />
    </div>
  );
}


function CampoCompacto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;

  value: string;

  onChange: (
    valor: string
  ) => void;

  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-600">
        {
          label
        }
      </label>


      <input
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className={
          inputClassName
        }
      />
    </div>
  );
}


function Campo({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;

  value: string;

  onChange: (
    valor: string
  ) => void;

  type?: string;

  required?: boolean;

  placeholder?: string;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {
          label
        }
      </label>


      <input
        type={
          type
        }
        required={
          required
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className={
          inputClassName
        }
      />
    </div>
  );
}


function CampoArea({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;

  value: string;

  onChange: (
    valor: string
  ) => void;

  required?: boolean;

  placeholder?: string;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {
          label
        }
      </label>


      <textarea
        rows={
          4
        }
        required={
          required
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className={
          inputClassName
        }
      />
    </div>
  );
}


/* =========================================================
 * CABEÇALHO
 * ======================================================= */

function CabecalhoEditor({
  titulo,
  descricao,
}: {
  titulo: string;

  descricao: string;
}) {
  return (
    <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Construtor de Modelos
          </p>


          <h1 className="mt-1 text-2xl font-black text-slate-900">
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


        <Link
          href="/modelos-pesquisa"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Voltar
        </Link>
      </div>
    </header>
  );
}


/* =========================================================
 * SELECT TIPO MODELO
 * ======================================================= */

function SelectTipoModelo({
  value,
  onChange,
}: {
  value: TipoModuloPesquisa;

  onChange: (
    valor: TipoModuloPesquisa
  ) => void;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Tipo do modelo
      </label>


      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value as TipoModuloPesquisa
          )
        }
        className={
          inputClassName
        }
      >
        <option value="CLIMA">
          Pesquisa de Clima
        </option>

        <option value="DIAGNOSTICO_ORGANIZACIONAL">
          Diagnóstico Organizacional
        </option>

        <option value="AVALIACAO_PSICOSSOCIAL">
          Avaliação Psicossocial
        </option>
      </select>
    </div>
  );
}


/* =========================================================
 * BADGES
 * ======================================================= */

function TipoModeloBadge({
  tipo,
}: {
  tipo: TipoModuloPesquisa;
}) {
  if (
    tipo ===
    TIPO_MODULO.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700">
        Diagnóstico Organizacional
      </span>
    );
  }


  if (
    tipo ===
    TIPO_MODULO.AVALIACAO_PSICOSSOCIAL
  ) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700">
        Avaliação Psicossocial
      </span>
    );
  }


  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">
      Pesquisa de Clima
    </span>
  );
}


function StatusBadge({
  ativo,
}: {
  ativo: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        ativo
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {ativo
        ? "Ativo"
        : "Inativo"}
    </span>
  );
}


/* =========================================================
 * CARD RESUMO
 * ======================================================= */

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;

  valor: number;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-500">
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


/* =========================================================
 * TABELA
 * ======================================================= */

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


function LinhaVazia({
  colunas,
  texto,
}: {
  colunas: number;

  texto: string;
}) {
  return (
    <tr>
      <td
        colSpan={
          colunas
        }
        className="px-4 py-10 text-center text-sm text-slate-500"
      >
        {
          texto
        }
      </td>
    </tr>
  );
}


/* =========================================================
 * ESTADOS
 * ======================================================= */

function EstadoVazio({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
      {
        texto
      }
    </div>
  );
}


function AlertaErro({
  mensagem,
}: {
  mensagem: string | null;
}) {
  if (
    !mensagem
  ) {
    return null;
  }


  return (
    <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
      {
        mensagem
      }
    </div>
  );
}
