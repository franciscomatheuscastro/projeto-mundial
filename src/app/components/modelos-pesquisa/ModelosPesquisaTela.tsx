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

import {
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";

import {
  useModelosPesquisa,
} from "@/src/app/data/hooks/useModelosPesquisa";

import {
  ConfiguracaoAnaliseModelo,
  criarConfiguracaoAnalisePadrao,
  DimensaoModelo,
  FaixaInterpretacaoModelo,
  PerguntaModelo,
  SentidoPontuacao,
} from "@/src/core/model/ModeloPesquisa";


type Props = {
  modo:
    | "lista"
    | "novo"
    | "editar";

  modeloId?: string;
};


const inputClassName =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";


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
      TipoModuloPesquisa.CLIMA
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
      criarConfiguracaoAnalisePadrao(
        TipoModuloPesquisa.CLIMA
      )
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
          criarConfiguracaoAnalisePadrao(
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

    /*
     * Trocar o módulo altera o motor analítico.
     * Portanto começamos com uma configuração coerente
     * para o novo módulo.
     */
    setConfiguracaoAnalise(
      criarConfiguracaoAnalisePadrao(
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

        descricao,

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
      (
        atual
      ) => [
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
      (
        atual
      ) =>
        atual.map(
          (
            dimensao
          ) =>
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
      (
        atual
      ) =>
        atual
          .filter(
            (
              dimensao
            ) =>
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


  if (
    modo ===
    "lista"
  ) {
    const totalModelos =
      modelos.length;

    const totalAtivos =
      modelos.filter(
        (
          modelo
        ) =>
          modelo.ativo
      ).length;

    const totalClima =
      modelos.filter(
        (
          modelo
        ) =>
          modelo.tipo ===
          TipoModuloPesquisa.CLIMA
      ).length;

    const totalOutrosModulos =
      modelos.filter(
        (
          modelo
        ) =>
          modelo.tipo !==
          TipoModuloPesquisa.CLIMA
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
                Crie instrumentos reutilizáveis e configure sua estrutura analítica.
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
            <table className="w-full min-w-[1000px] border-collapse">
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
                    (
                      modelo
                    ) => (
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


                        <td className="px-4 py-4">
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


        <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
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


            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
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
                className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
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


  return (
    <main className="min-h-screen bg-slate-100">
      <CabecalhoEditor
        titulo="Editar Modelo"
        descricao="Configure dimensões, metodologia e perguntas do instrumento."
      />


      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[380px_1fr] lg:px-8">
        <aside className="h-fit space-y-5">
          <form
            onSubmit={
              enviarModelo
            }
            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
          >
            <AlertaErro
              mensagem={
                erro
              }
            />


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


            <CampoArea
              label="Descrição"
              value={
                descricao
              }
              onChange={
                setDescricao
              }
            />


            <label className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
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

              Modelo ativo
            </label>


            <button
              disabled={
                processando
              }
              className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {processando
                ? "Salvando..."
                : "Salvar modelo"}
            </button>


            <button
              type="button"
              onClick={() =>
                void duplicarAtual()
              }
              disabled={
                processando
              }
              className="mt-3 min-h-12 w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-60"
            >
              Duplicar modelo
            </button>
          </form>


          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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

            <p className="mt-2 text-xs text-amber-700">
              Alterações nesta configuração só são persistidas quando você clicar em “Salvar modelo”.
            </p>
          </div>
        </aside>


        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  Estrutura analítica
                </p>

                <h2 className="mt-1 text-lg font-black text-slate-900">
                  Dimensões
                </h2>

                <p className="text-sm text-slate-500">
                  Agrupe as perguntas para permitir cálculos e relatórios por dimensão.
                </p>
              </div>


              <button
                type="button"
                onClick={
                  adicionarDimensao
                }
                className="min-h-12 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
              >
                + Dimensão
              </button>
            </div>


            {dimensoes.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Nenhuma dimensão cadastrada.
              </div>
            ) : (
              <div className="space-y-3">
                {dimensoes.map(
                  (
                    dimensao
                  ) => (
                    <DimensaoCard
                      key={
                        dimensao.id
                      }
                      dimensao={
                        dimensao
                      }
                      psicossocial={
                        tipo ===
                        TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
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
          </section>


          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Perguntas do formulário
                </h2>

                <p className="text-sm text-slate-500">
                  Total:{" "}
                  {modeloSelecionado?.perguntas.length ??
                    0}{" "}
                  pergunta(s)
                </p>
              </div>


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
                className="min-h-12 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                + Adicionar pergunta
              </button>
            </div>


            <div className="space-y-4">
              {carregando ||
              !modeloSelecionado ? (
                <EstadoVazio texto="Carregando modelo..." />
              ) : modeloSelecionado.perguntas.length ===
                0 ? (
                <EstadoVazio texto="Nenhuma pergunta cadastrada." />
              ) : (
                modeloSelecionado.perguntas.map(
                  (
                    pergunta
                  ) => (
                    <PerguntaCard
                      key={
                        pergunta.id
                      }
                      pergunta={
                        pergunta
                      }
                      dimensoes={
                        dimensoes
                      }
                      tipoModulo={
                        tipo
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
                )
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}


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
      <h3 className="mb-1 font-black text-slate-900">
        Configuração de análise
      </h3>

      <p className="mb-5 text-xs text-slate-500">
        Método:{" "}
        <strong>
          {
            configuracao.metodo
          }
        </strong>
      </p>


      <div className="grid gap-4 sm:grid-cols-3">
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

        <CampoNumero
          label="Anonimato mínimo"
          value={
            configuracao.anonimatoMinimo
          }
          onChange={(
            valor
          ) =>
            alterar({
              anonimatoMinimo:
                valor,
            })
          }
        />
      </div>


      {tipo ===
        TipoModuloPesquisa.CLIMA && (
        <div className="mt-5 rounded-2xl bg-blue-50 p-4">
          <p className="mb-4 text-sm font-bold text-blue-900">
            Favorabilidade
          </p>

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
      )}


      {tipo !==
        TipoModuloPesquisa.CLIMA && (
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
            TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
          }
        />
      )}
    </div>
  );
}


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
        (
          faixa
        ) =>
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
          (
            faixa
          ) =>
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
    <div className="mt-5 rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Faixas de interpretação
          </p>

          <p className="text-xs text-slate-500">
            {psicossocial
              ? "Cadastre somente faixas previstas pela metodologia psicossocial utilizada."
              : "Defina as faixas utilizadas para interpretar o score organizacional."}
          </p>
        </div>

        <button
          type="button"
          onClick={
            adicionar
          }
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
        >
          + Faixa
        </button>
      </div>


      <div className="mt-4 space-y-3">
        {faixas.map(
          (
            faixa
          ) => (
            <div
              key={
                faixa.id
              }
              className="rounded-2xl bg-slate-50 p-3"
            >
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

              <button
                type="button"
                onClick={() =>
                  excluir(
                    faixa.id
                  )
                }
                className="mt-3 text-xs font-bold text-red-600"
              >
                Excluir faixa
              </button>
            </div>
          )
        )}


        {faixas.length ===
          0 && (
          <p className="py-3 text-center text-xs text-slate-500">
            Nenhuma faixa configurada.
          </p>
        )}
      </div>
    </div>
  );
}


function DimensaoCard({
  dimensao,
  psicossocial,
  onChange,
  onExcluir,
}: {
  dimensao: DimensaoModelo;

  psicossocial: boolean;

  onChange: (
    dados: Partial<DimensaoModelo>
  ) => void;

  onExcluir: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="grid gap-4 md:grid-cols-2">
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


      <button
        type="button"
        onClick={
          onExcluir
        }
        className="mt-3 text-xs font-bold text-red-600"
      >
        Excluir dimensão
      </button>
    </div>
  );
}


function PerguntaCard({
  pergunta,
  dimensoes,
  tipoModulo,
  processando,
  onSalvar,
  onExcluir,
}: {
  pergunta: PerguntaModelo;

  dimensoes: DimensaoModelo[];

  tipoModulo: TipoModuloPesquisa;

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
    peso,
    setPeso,
  ] =
    useState(
      pergunta.peso ??
        1
    );


  const [
    sentidoPontuacao,
    setSentidoPontuacao,
  ] =
    useState<SentidoPontuacao>(
      pergunta.sentidoPontuacao ??
        "POSITIVO"
    );


  const [
    fatorRisco,
    setFatorRisco,
  ] =
    useState(
      pergunta.fatorRisco ??
        ""
    );


  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    await onSalvar({
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
        opcoes
          .split("\n")
          .map(
            (
              opcao
            ) =>
              opcao.trim()
          )
          .filter(
            Boolean
          ),

      dimensaoId:
        dimensaoId ||
        null,

      peso,

      sentidoPontuacao,

      fatorRisco:
        fatorRisco.trim() ||
        null,
    });
  }


  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <form
        onSubmit={
          salvar
        }
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            Pergunta{" "}
            {
              pergunta.ordem
            }
          </span>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {
              tipo
            }
          </span>
        </div>


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
              ) =>
                setTipo(
                  event.target.value as TipoPergunta
                )
              }
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
                (
                  dimensao
                ) => (
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


          <CampoNumero
            label="Peso da pergunta"
            value={
              peso
            }
            onChange={
              setPeso
            }
          />


          <div className="mb-5">
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


          {tipoModulo ===
            TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL && (
            <div className="md:col-span-2">
              <Campo
                label="Fator de risco"
                value={
                  fatorRisco
                }
                onChange={
                  setFatorRisco
                }
                placeholder="Ex: Sobrecarga"
              />
            </div>
          )}


          <div className="md:col-span-2">
            <CampoArea
              label="Opções"
              value={
                opcoes
              }
              onChange={
                setOpcoes
              }
              placeholder={"Uma opção por linha"}
            />
          </div>
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


        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
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
            className="min-h-12 rounded-2xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-60"
          >
            Excluir pergunta
          </button>

          <button
            disabled={
              processando
            }
            className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {processando
              ? "Salvando..."
              : "Salvar pergunta"}
          </button>
        </div>
      </form>
    </div>
  );
}


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
              (
                item
              ) =>
                Number(
                  item.trim()
                )
            )
            .filter(
              (
                item
              ) =>
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


function CabecalhoEditor({
  titulo,
  descricao,
}: {
  titulo: string;

  descricao: string;
}) {
  return (
    <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
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
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
        >
          Voltar
        </Link>
      </div>
    </header>
  );
}


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
        <option value={TipoModuloPesquisa.CLIMA}>
          Pesquisa de Clima
        </option>

        <option value={TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL}>
          Diagnóstico Organizacional
        </option>

        <option value={TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL}>
          Avaliação Psicossocial
        </option>
      </select>
    </div>
  );
}


function TipoModeloBadge({
  tipo,
}: {
  tipo: TipoModuloPesquisa;
}) {
  if (
    tipo ===
    TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    return (
      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
        Diagnóstico Organizacional
      </span>
    );
  }

  if (
    tipo ===
    TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
  ) {
    return (
      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
        Avaliação Psicossocial
      </span>
    );
  }

  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
      Pesquisa de Clima
    </span>
  );
}


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