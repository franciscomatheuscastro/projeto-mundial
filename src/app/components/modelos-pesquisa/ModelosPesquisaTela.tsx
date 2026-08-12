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
  PerguntaModelo,
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

  useEffect(() => {
    if (
      modo === "editar" &&
      modeloId
    ) {
      void carregarModeloPorId(
        modeloId
      );
    }
  }, [
    modo,
    modeloId,
    carregarModeloPorId,
  ]);

  useEffect(() => {
    if (
      modo === "editar" &&
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
        modeloSelecionado.tipo ??
          TipoModuloPesquisa.CLIMA
      );

      setAtivo(
        modeloSelecionado.ativo ??
          true
      );
    }
  }, [
    modo,
    modeloSelecionado,
  ]);

  async function enviarModelo(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const resultado =
      await salvarModelo({
        id:
          modo === "editar"
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
      });

    router.push(
      `/modelos-pesquisa/${resultado.id}`
    );

    router.refresh();
  }

  async function duplicarAtual() {
    if (!modeloId) {
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
    const confirmado =
      confirm(
        "Tem certeza que deseja excluir este modelo?"
      );

    if (!confirmado) {
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

  if (
    modo === "lista"
  ) {
    const totalModelos =
      modelos.length;

    const totalAtivos =
      modelos.filter(
        (modelo) =>
          modelo.ativo
      ).length;

    const totalClima =
      modelos.filter(
        (modelo) =>
          (modelo.tipo ??
            TipoModuloPesquisa.CLIMA) ===
          TipoModuloPesquisa.CLIMA
      ).length;

    const totalOutrosModulos =
      modelos.filter(
        (modelo) =>
          (modelo.tipo ??
            TipoModuloPesquisa.CLIMA) !==
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
                Crie modelos reutilizáveis para Pesquisa de Clima,
                Diagnóstico Organizacional e Avaliação Psicossocial.
              </p>
            </div>

            <Link
              href="/modelos-pesquisa/novo"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              + Novo modelo
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {erro && (
            <AlertaErro
              mensagem={
                erro
              }
            />
          )}

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
            <table className="w-full min-w-[960px] border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>
                    Modelo
                  </Th>

                  <Th>
                    Tipo
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

                  <Th
                    direita
                  >
                    Ações
                  </Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia
                    colunas={
                      6
                    }
                    texto="Carregando modelos..."
                  />
                ) : modelos.length ===
                  0 ? (
                  <LinhaVazia
                    colunas={
                      6
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
                              modelo.tipo ??
                              TipoModuloPesquisa.CLIMA
                            }
                          />
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
                            className="ml-4 text-sm font-bold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
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
    modo === "novo"
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                Construtor de Modelos
              </p>

              <h1 className="mt-1 text-2xl font-black text-slate-900">
                Criar Modelo
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Defina o tipo do questionário e depois configure suas perguntas.
              </p>
            </div>

            <Link
              href="/modelos-pesquisa"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <form
            onSubmit={
              enviarModelo
            }
            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
          >
            {erro && (
              <AlertaErro
                mensagem={
                  erro
                }
              />
            )}

            <SelectTipoModelo
              value={
                tipo
              }
              onChange={
                setTipo
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
              placeholder="Ex: Diagnóstico Organizacional 2026"
            />

            <CampoArea
              label="Descrição"
              value={
                descricao
              }
              onChange={
                setDescricao
              }
              placeholder="Explique o objetivo deste modelo"
            />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Link
                href="/modelos-pesquisa"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>

              <button
                disabled={
                  processando
                }
                className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
              Construtor de Modelos
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Editar Modelo
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Configure o tipo, perguntas e opções do questionário.
            </p>
          </div>

          <Link
            href="/modelos-pesquisa"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[380px_1fr] lg:px-8">
        <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          {erro && (
            <AlertaErro
              mensagem={
                erro
              }
            />
          )}

          <form
            onSubmit={
              enviarModelo
            }
          >
            <SelectTipoModelo
              value={
                tipo
              }
              onChange={
                setTipo
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

            <label className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={
                  ativo
                }
                onChange={(
                  event
                ) =>
                  setAtivo(
                    event.target
                      .checked
                  )
                }
                className="h-4 w-4"
              />

              Modelo ativo
            </label>

            <button
              disabled={
                processando
              }
              className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processando
                ? "Salvando..."
                : "Salvar modelo"}
            </button>
          </form>

          <button
            type="button"
            onClick={() =>
              void duplicarAtual()
            }
            disabled={
              processando
            }
            className="mt-3 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Duplicar modelo
          </button>
        </aside>

        <div>
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
              className="min-h-12 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              + Adicionar pergunta
            </button>
          </div>

          <div className="space-y-4">
            {carregando ||
            !modeloSelecionado ? (
              <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                Carregando modelo...
              </div>
            ) : modeloSelecionado.perguntas.length ===
              0 ? (
              <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                Nenhuma pergunta cadastrada.
              </div>
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
                    processando={
                      processando
                    }
                    onSalvar={async (
                      perguntaAtualizada
                    ) => {
                      if (
                        !modeloId
                      ) {
                        return;
                      }

                      await salvarPergunta(
                        modeloId,
                        perguntaAtualizada
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
        </div>
      </section>
    </main>
  );
}

function SelectTipoModelo({
  value,
  onChange,
}: {
  value:
    TipoModuloPesquisa;

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
            event.target
              .value as TipoModuloPesquisa
          )
        }
        className={
          inputClassName
        }
      >
        <option
          value={
            TipoModuloPesquisa.CLIMA
          }
        >
          Pesquisa de Clima
        </option>

        <option
          value={
            TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
          }
        >
          Diagnóstico Organizacional
        </option>

        <option
          value={
            TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
          }
        >
          Avaliação Psicossocial
        </option>
      </select>

      <p className="mt-2 text-xs text-slate-500">
        O modelo ficará disponível somente no módulo selecionado.
      </p>
    </div>
  );
}

function TipoModeloBadge({
  tipo,
}: {
  tipo:
    TipoModuloPesquisa;
}) {
  if (
    tipo ===
    TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    return (
      <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
        Diagnóstico Organizacional
      </span>
    );
  }

  if (
    tipo ===
    TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
  ) {
    return (
      <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
        Avaliação Psicossocial
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
      Pesquisa de Clima
    </span>
  );
}

function PerguntaCard({
  pergunta,
  processando,
  onSalvar,
  onExcluir,
}: {
  pergunta:
    PerguntaModelo;

  processando:
    boolean;

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
      Array.isArray(
        pergunta.opcoes
      )
        ? pergunta.opcoes.join(
            "\n"
          )
        : ""
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
            (opcao) =>
              opcao.trim()
          )
          .filter(
            Boolean
          ),
    });
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <form
        onSubmit={
          salvar
        }
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            Pergunta{" "}
            {
              pergunta.ordem
            }
          </span>

          <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
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
                  event.target
                    .value as TipoPergunta
                )
              }
              className={
                inputClassName
              }
            >
              <option value="NOTA">
                Nota de 1 a 5
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

          <CampoArea
            label="Opções"
            value={
              opcoes
            }
            onChange={
              setOpcoes
            }
            placeholder={
              "Uma opção por linha\nRuim\nBom\nExcelente"
            }
          />
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
                event.target
                  .checked
              )
            }
            className="h-4 w-4"
          />

          Pergunta obrigatória
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            className="min-h-12 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Excluir pergunta
          </button>

          <button
            disabled={
              processando
            }
            className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
  ativo:
    boolean;
}) {
  return ativo ? (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      Ativo
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
      Inativo
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
            event.target
              .value
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
            event.target
              .value
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
  children:
    React.ReactNode;

  direita?:
    boolean;
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
  colunas:
    number;

  texto:
    string;
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

function AlertaErro({
  mensagem,
}: {
  mensagem:
    string | null;
}) {
  if (!mensagem) {
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