"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import Backend from "@/src/backend";

import {
  ModeloPesquisa,
  ModeloPesquisaComResumo,
  ModeloPesquisaDetalhado,
  PerguntaModelo,
} from "@/src/core/model/ModeloPesquisa";

export function useModelosPesquisa() {
  const [
    modelos,
    setModelos,
  ] =
    useState<
      ModeloPesquisaComResumo[]
    >([]);

  const [
    modeloSelecionado,
    setModeloSelecionado,
  ] =
    useState<
      ModeloPesquisaDetalhado | null
    >(null);

  const [
    erro,
    setErro,
  ] =
    useState<
      string | null
    >(null);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    processando,
    startTransition,
  ] =
    useTransition();

  const carregarModelos =
    useCallback(
      async () => {
        try {
          setCarregando(
            true
          );

          setErro(
            null
          );

          const dados =
            await Backend.modelosPesquisa.obterTodos();

          setModelos(
            dados
          );

          return dados;
        } catch (error) {
          const mensagem =
            error instanceof
            Error
              ? error.message
              : "Erro ao carregar modelos.";

          setErro(
            mensagem
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      []
    );

  const carregarModeloPorId =
    useCallback(
      async (
        id: string
      ) => {
        try {
          setCarregando(
            true
          );

          setErro(
            null
          );

          const dados =
            await Backend.modelosPesquisa.obterPorId(
              id
            );

          setModeloSelecionado(
            dados
          );

          return dados;
        } catch (error) {
          const mensagem =
            error instanceof
            Error
              ? error.message
              : "Erro ao carregar modelo.";

          setErro(
            mensagem
          );

          setModeloSelecionado(
            null
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      []
    );

  const excluirModelo =
    useCallback(
      async (
        id: string
      ) => {
        return new Promise<void>(
          (
            resolve,
            reject
          ) => {
            startTransition(
              async () => {
                try {
                  setErro(
                    null
                  );

                  await Backend.modelosPesquisa.excluir(
                    id
                  );

                  await carregarModelos();

                  setModeloSelecionado(
                    (
                      atual
                    ) =>
                      atual?.id ===
                      id
                        ? null
                        : atual
                  );

                  resolve();
                } catch (error) {
                  const mensagem =
                    error instanceof
                    Error
                      ? error.message
                      : "Erro ao excluir modelo.";

                  setErro(
                    mensagem
                  );

                  reject(
                    error
                  );
                }
              }
            );
          }
        );
      },
      [
        carregarModelos,
      ]
    );

  const salvarModelo =
    useCallback(
      async (
        modelo: ModeloPesquisa
      ) => {
        return new Promise<ModeloPesquisaDetalhado>(
          (
            resolve,
            reject
          ) => {
            startTransition(
              async () => {
                try {
                  setErro(
                    null
                  );

                  const resultado =
                    await Backend.modelosPesquisa.salvar(
                      modelo
                    );

                  await carregarModelos();

                  if (
                    resultado.id
                  ) {
                    await carregarModeloPorId(
                      resultado.id
                    );
                  }

                  resolve(
                    resultado
                  );
                } catch (error) {
                  const mensagem =
                    error instanceof
                    Error
                      ? error.message
                      : "Erro ao salvar modelo.";

                  setErro(
                    mensagem
                  );

                  reject(
                    error
                  );
                }
              }
            );
          }
        );
      },
      [
        carregarModelos,
        carregarModeloPorId,
      ]
    );

  const adicionarPergunta =
    useCallback(
      async (
        modeloId: string
      ) => {
        return new Promise<PerguntaModelo>(
          (
            resolve,
            reject
          ) => {
            startTransition(
              async () => {
                try {
                  setErro(
                    null
                  );

                  const pergunta =
                    await Backend.modelosPesquisa.adicionarPergunta(
                      modeloId
                    );

                  await carregarModeloPorId(
                    modeloId
                  );

                  resolve(
                    pergunta
                  );
                } catch (error) {
                  const mensagem =
                    error instanceof
                    Error
                      ? error.message
                      : "Erro ao adicionar pergunta.";

                  setErro(
                    mensagem
                  );

                  reject(
                    error
                  );
                }
              }
            );
          }
        );
      },
      [
        carregarModeloPorId,
      ]
    );

  const salvarPergunta =
    useCallback(
      async (
        modeloId: string,
        pergunta: PerguntaModelo
      ) => {
        return new Promise<PerguntaModelo>(
          (
            resolve,
            reject
          ) => {
            startTransition(
              async () => {
                try {
                  setErro(
                    null
                  );

                  const resultado =
                    await Backend.modelosPesquisa.salvarPergunta(
                      modeloId,
                      pergunta
                    );

                  await carregarModeloPorId(
                    modeloId
                  );

                  resolve(
                    resultado
                  );
                } catch (error) {
                  const mensagem =
                    error instanceof
                    Error
                      ? error.message
                      : "Erro ao salvar pergunta.";

                  setErro(
                    mensagem
                  );

                  reject(
                    error
                  );
                }
              }
            );
          }
        );
      },
      [
        carregarModeloPorId,
      ]
    );

  const excluirPergunta =
    useCallback(
      async (
        modeloId: string,
        perguntaId: string
      ) => {
        return new Promise<void>(
          (
            resolve,
            reject
          ) => {
            startTransition(
              async () => {
                try {
                  setErro(
                    null
                  );

                  await Backend.modelosPesquisa.excluirPergunta(
                    modeloId,
                    perguntaId
                  );

                  await carregarModeloPorId(
                    modeloId
                  );

                  resolve();
                } catch (error) {
                  const mensagem =
                    error instanceof
                    Error
                      ? error.message
                      : "Erro ao excluir pergunta.";

                  setErro(
                    mensagem
                  );

                  reject(
                    error
                  );
                }
              }
            );
          }
        );
      },
      [
        carregarModeloPorId,
      ]
    );

  const duplicarModelo =
    useCallback(
      async (
        id: string
      ) => {
        return new Promise<ModeloPesquisaDetalhado>(
          (
            resolve,
            reject
          ) => {
            startTransition(
              async () => {
                try {
                  setErro(
                    null
                  );

                  const resultado =
                    await Backend.modelosPesquisa.duplicar(
                      id
                    );

                  await carregarModelos();

                  if (
                    resultado.id
                  ) {
                    await carregarModeloPorId(
                      resultado.id
                    );
                  }

                  resolve(
                    resultado
                  );
                } catch (error) {
                  const mensagem =
                    error instanceof
                    Error
                      ? error.message
                      : "Erro ao duplicar modelo.";

                  setErro(
                    mensagem
                  );

                  reject(
                    error
                  );
                }
              }
            );
          }
        );
      },
      [
        carregarModelos,
        carregarModeloPorId,
      ]
    );

  useEffect(() => {
    void carregarModelos();
  }, [
    carregarModelos,
  ]);

  return {
    modelos,

    modeloSelecionado,
    setModeloSelecionado,

    carregando,
    processando,
    erro,

    excluirModelo,

    carregarModelos,
    carregarModeloPorId,

    salvarModelo,

    adicionarPergunta,
    salvarPergunta,
    excluirPergunta,

    duplicarModelo,
  };
}