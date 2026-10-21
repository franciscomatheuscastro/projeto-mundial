"use client";

import type {
  FormEvent,
} from "react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  TipoPerguntaCanalDenuncia,
} from "@prisma/client";

import {
  useRouter,
} from "next/navigation";

import {
  obterPerguntaCanalDenunciaPorId,
  salvarPerguntaCanalDenuncia,
} from "@/src/backend/perguntaCanalDenuncia/acoesPerguntasCanalDenuncia";

import {
  useClientes,
} from "@/src/app/data/hooks/useClientes";

import type {
  PerguntaCanalDenuncia,
} from "@/src/core/model/PerguntaCanalDenuncia";


type PerguntaInicialCompativel =
  PerguntaCanalDenuncia & {
    todosCanais?: boolean;
  };


type Props = {
  perguntaInicial?:
    | PerguntaInicialCompativel
    | null;
};


export default function PerguntaCanalDenunciaFormulario({
  perguntaInicial = null,
}: Props) {
  const router =
    useRouter();


  const {
    clientes,
    carregarClientes,
  } =
    useClientes();


  const [
    enunciado,
    setEnunciado,
  ] =
    useState(
      perguntaInicial?.enunciado ||
      ""
    );


  const [
    descricao,
    setDescricao,
  ] =
    useState(
      perguntaInicial?.descricao ||
      ""
    );


  const [
    tipo,
    setTipo,
  ] =
    useState<TipoPerguntaCanalDenuncia>(
      perguntaInicial?.tipo ||
      TipoPerguntaCanalDenuncia.TEXTO
    );


  const [
    obrigatoria,
    setObrigatoria,
  ] =
    useState(
      perguntaInicial?.obrigatoria ||
      false
    );


  const [
    abrirComplementoSim,
    setAbrirComplementoSim,
  ] =
    useState(
      perguntaInicial?.abrirComplementoSim ??
      false
    );


  const [
    ativo,
    setAtivo,
  ] =
    useState(
      perguntaInicial?.ativo ??
      true
    );


  const [
    ordem,
    setOrdem,
  ] =
    useState(
      perguntaInicial?.ordem ||
      0
    );


  const [
    clienteIds,
    setClienteIds,
  ] =
    useState<string[]>(
      perguntaInicial?.clienteIds ||
      []
    );


  const [
    todosCanais,
    setTodosCanais,
  ] =
    useState(
      perguntaInicial?.todosCanais ??
      false
    );


  const [
    opcoesTexto,
    setOpcoesTexto,
  ] =
    useState(
      perguntaInicial?.opcoes.join(
        "\n"
      ) ||
      ""
    );


  const [
    salvando,
    setSalvando,
  ] =
    useState(
      false
    );


  const [
    carregandoPergunta,
    setCarregandoPergunta,
  ] =
    useState(
      Boolean(
        perguntaInicial?.id
      )
    );


  const [
    erro,
    setErro,
  ] =
    useState<string | null>(
      null
    );


  useEffect(
    () => {
      void carregarClientes();
    },
    [
      carregarClientes,
    ]
  );


  /*
   * Ao editar, carregamos novamente a pergunta pela nova
   * action. Isso garante que o campo todosCanais seja
   * reconhecido mesmo que a page antiga ainda entregue
   * um objeto sem esse campo.
   */
  useEffect(
    () => {
      const id =
        perguntaInicial?.id;


      if (
        !id
      ) {
        setCarregandoPergunta(
          false
        );

        return;
      }


      let ativoEfeito =
        true;


      async function carregarPergunta() {
        try {
          const pergunta =
            await obterPerguntaCanalDenunciaPorId(
              id!
            );


          if (
            !ativoEfeito
          ) {
            return;
          }


          setEnunciado(
            pergunta.enunciado
          );

          setDescricao(
            pergunta.descricao ||
            ""
          );

          setTipo(
            pergunta.tipo
          );

          setObrigatoria(
            pergunta.obrigatoria
          );

          setAbrirComplementoSim(
            pergunta.abrirComplementoSim
          );

          setAtivo(
            pergunta.ativo
          );

          setOrdem(
            pergunta.ordem
          );

          setClienteIds(
            pergunta.clienteIds
          );

          setTodosCanais(
            pergunta.todosCanais
          );

          setOpcoesTexto(
            pergunta.opcoes.join(
              "\n"
            )
          );
        } catch (
          error
        ) {
          if (
            ativoEfeito
          ) {
            setErro(
              error instanceof Error
                ? error.message
                : "Não foi possível carregar a pergunta."
            );
          }
        } finally {
          if (
            ativoEfeito
          ) {
            setCarregandoPergunta(
              false
            );
          }
        }
      }


      void carregarPergunta();


      return () => {
        ativoEfeito =
          false;
      };
    },
    [
      perguntaInicial?.id,
    ]
  );


  const idsClientesDisponiveis =
    useMemo(
      () =>
        clientes.map(
          cliente =>
            cliente.id
        ),
      [
        clientes,
      ]
    );


  const todosClientesAtuaisSelecionados =
    clientes.length >
      0 &&
    idsClientesDisponiveis.every(
      id =>
        clienteIds.includes(
          id
        )
    );


  function alternarTodosCanais() {
    const novoValor =
      !todosCanais;


    setTodosCanais(
      novoValor
    );


    if (
      novoValor
    ) {
      /*
       * Não precisamos gravar manualmente os IDs aqui.
       * O backend vincula todos os clientes atuais e
       * mantém o marcador para os futuros.
       */
      setClienteIds(
        []
      );
    }
  }


  function alternarCliente(
    id: string
  ) {
    setTodosCanais(
      false
    );


    setClienteIds(
      atual =>
        atual.includes(
          id
        )
          ? atual.filter(
              item =>
                item !==
                id
            )
          : [
              ...atual,
              id,
            ]
    );
  }


  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (
      salvando
    ) {
      return;
    }


    const enunciadoNormalizado =
      enunciado.trim();


    const descricaoNormalizada =
      descricao.trim();


    const opcoesNormalizadas =
      tipo ===
        TipoPerguntaCanalDenuncia.MULTIPLA_ESCOLHA
        ? opcoesTexto
            .split(
              "\n"
            )
            .map(
              opcao =>
                opcao.trim()
            )
            .filter(
              Boolean
            )
        : [];


    if (
      !enunciadoNormalizado
    ) {
      setErro(
        "Informe o texto da pergunta."
      );

      return;
    }


    if (
      !todosCanais &&
      clienteIds.length ===
        0
    ) {
      setErro(
        "Selecione pelo menos um canal ou marque Todos os canais."
      );

      return;
    }


    if (
      tipo ===
        TipoPerguntaCanalDenuncia.MULTIPLA_ESCOLHA &&
      opcoesNormalizadas.length <
        2
    ) {
      setErro(
        "Informe pelo menos duas opções para a pergunta de múltipla escolha."
      );

      return;
    }


    try {
      setSalvando(
        true
      );

      setErro(
        null
      );


      await salvarPerguntaCanalDenuncia({
        id:
          perguntaInicial?.id,

        enunciado:
          enunciadoNormalizado,

        descricao:
          descricaoNormalizada ||
          null,

        tipo,

        obrigatoria,

        abrirComplementoSim:
          tipo ===
            TipoPerguntaCanalDenuncia.SIM_NAO
            ? abrirComplementoSim
            : false,

        ativo,

        ordem,

        todosCanais,

        clienteIds:
          todosCanais
            ? []
            : clienteIds,

        opcoes:
          opcoesNormalizadas,
      });


      router.push(
        "/denuncias/perguntas"
      );

      router.refresh();
    } catch (
      error
    ) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a pergunta."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }


  const bloqueado =
    salvando ||
    carregandoPergunta;


  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
          Canal de denúncias
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          {perguntaInicial
            ? "Editar pergunta"
            : "Nova pergunta"}
        </h1>
      </header>


      <form
        onSubmit={
          salvar
        }
        className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6"
      >
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {
              erro
            }
          </div>
        )}


        {carregandoPergunta && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
            Carregando dados da pergunta...
          </div>
        )}


        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Pergunta
              </label>

              <input
                value={
                  enunciado
                }
                onChange={
                  event =>
                    setEnunciado(
                      event.target.value
                    )
                }
                required
                disabled={
                  bloqueado
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>


            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Texto de apoio
              </label>

              <textarea
                value={
                  descricao
                }
                onChange={
                  event =>
                    setDescricao(
                      event.target.value
                    )
                }
                rows={
                  3
                }
                disabled={
                  bloqueado
                }
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tipo
              </label>

              <select
                value={
                  tipo
                }
                disabled={
                  bloqueado
                }
                onChange={
                  event => {
                    const novoTipo =
                      event.target.value as TipoPerguntaCanalDenuncia;


                    setTipo(
                      novoTipo
                    );


                    if (
                      novoTipo !==
                      TipoPerguntaCanalDenuncia.SIM_NAO
                    ) {
                      setAbrirComplementoSim(
                        false
                      );
                    }
                  }
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="TEXTO">
                  Texto curto
                </option>

                <option value="TEXTO_LONGO">
                  Texto longo
                </option>

                <option value="SIM_NAO">
                  Sim ou não
                </option>

                <option value="MULTIPLA_ESCOLHA">
                  Múltipla escolha
                </option>
              </select>
            </div>


            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ordem
              </label>

              <input
                type="number"
                min={
                  0
                }
                value={
                  ordem
                }
                disabled={
                  bloqueado
                }
                onChange={
                  event =>
                    setOrdem(
                      Number(
                        event.target.value
                      )
                    )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>


            {tipo ===
              TipoPerguntaCanalDenuncia.MULTIPLA_ESCOLHA && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Opções — uma por linha
                </label>

                <textarea
                  value={
                    opcoesTexto
                  }
                  onChange={
                    event =>
                      setOpcoesTexto(
                        event.target.value
                      )
                  }
                  required
                  rows={
                    5
                  }
                  disabled={
                    bloqueado
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>
            )}


            {tipo ===
              TipoPerguntaCanalDenuncia.SIM_NAO && (
              <label className="md:col-span-2 flex cursor-pointer items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <input
                  type="checkbox"
                  checked={
                    abrirComplementoSim
                  }
                  disabled={
                    bloqueado
                  }
                  onChange={
                    event =>
                      setAbrirComplementoSim(
                        event.target.checked
                      )
                  }
                  className="mt-1 h-4 w-4 accent-blue-600"
                />

                <span>
                  <strong className="block text-sm text-blue-900">
                    Abrir campo de texto quando a resposta for “Sim”
                  </strong>

                  <span className="mt-1 block text-xs leading-5 text-blue-700">
                    Ao selecionar “Sim”, o denunciante poderá complementar a resposta com um texto livre. Ao selecionar “Não”, nenhum campo adicional será exibido.
                  </span>
                </span>
              </label>
            )}


            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={
                  obrigatoria
                }
                disabled={
                  bloqueado
                }
                onChange={
                  event =>
                    setObrigatoria(
                      event.target.checked
                    )
                }
              />

              Pergunta obrigatória
            </label>


            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={
                  ativo
                }
                disabled={
                  bloqueado
                }
                onChange={
                  event =>
                    setAtivo(
                      event.target.checked
                    )
                }
              />

              Pergunta ativa
            </label>
          </div>
        </section>


        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Canais em que a pergunta aparecerá
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Marque Todos os canais para tornar a pergunta global ou selecione clientes específicos.
          </p>


          <div className="mt-5">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 transition hover:bg-blue-100">
              <input
                type="checkbox"
                checked={
                  todosCanais
                }
                disabled={
                  bloqueado
                }
                onChange={
                  alternarTodosCanais
                }
                className="mt-1 h-4 w-4 accent-blue-600"
              />

              <div>
                <span className="block text-sm font-bold text-blue-900">
                  Todos os canais, atuais e futuros
                </span>

                <span className="mt-1 block text-xs leading-5 text-blue-700">
                  A pergunta será exibida para todos os clientes atuais e também será atribuída automaticamente a qualquer novo cliente criado depois.
                </span>
              </div>
            </label>
          </div>


          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {clientes.length ===
            0 ? (
              <p className="md:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Nenhum cliente disponível.
              </p>
            ) : (
              clientes.map(
                cliente => (
                  <label
                    key={
                      cliente.id
                    }
                    className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                      todosCanais
                        ? "cursor-default border-slate-200 bg-slate-100 opacity-70"
                        : "cursor-pointer border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        todosCanais ||
                        clienteIds.includes(
                          cliente.id
                        )
                      }
                      disabled={
                        bloqueado ||
                        todosCanais
                      }
                      onChange={() =>
                        alternarCliente(
                          cliente.id
                        )
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-semibold text-slate-800">
                      {cliente.empresa ||
                        cliente.nome}
                    </span>
                  </label>
                )
              )
            )}
          </div>


          {!todosCanais &&
            todosClientesAtuaisSelecionados && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              Todos os clientes atuais estão marcados, mas a pergunta ainda não é global. Para incluir também clientes futuros, marque <strong>Todos os canais, atuais e futuros</strong>.
            </div>
          )}
        </section>


        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={
              bloqueado
            }
            onClick={() =>
              router.push(
                "/denuncias/perguntas"
              )
            }
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={
              bloqueado
            }
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {salvando
              ? "Salvando..."
              : "Salvar pergunta"}
          </button>
        </div>
      </form>
    </main>
  );
}
