"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import Backend from "@/src/backend";

import type {
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
      async (): Promise<
        ModeloPesquisaComResumo[]
      > => {
        try {
          setCarregando(
            true
          );

          setErro(
            null
          );


          const dados =
            await Backend.modelosPesquisa.obterTodos();


          const modelosTipados =
            dados as ModeloPesquisaComResumo[];


          setModelos(
            modelosTipados
          );


          return modelosTipados;
        } catch (error) {
          const mensagem =
            error instanceof Error
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
      ): Promise<ModeloPesquisaDetalhado> => {
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


          const modeloTipado =
            dados as ModeloPesquisaDetalhado;


          setModeloSelecionado(
            modeloTipado
          );


          return modeloTipado;
        } catch (error) {
          const mensagem =
            error instanceof Error
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
      ): Promise<void> => {
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
                    atual =>
                      atual?.id ===
                      id
                        ? null
                        : atual
                  );


                  resolve();
                } catch (error) {
                  const mensagem =
                    error instanceof Error
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
      ): Promise<ModeloPesquisaDetalhado> => {
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


                  const atualizado =
                    await carregarModeloPorId(
                      resultado.id
                    );


                  resolve(
                    atualizado
                  );
                } catch (error) {
                  const mensagem =
                    error instanceof Error
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
      ): Promise<PerguntaModelo> => {
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
                    await Backend.modelosPesquisa.adicionarPergunta(
                      modeloId
                    );


                  /*
                   * O backend retorna a estrutura correta,
                   * porém o TypeScript está alargando
                   * sentidoPontuacao para string.
                   */
                  const pergunta =
                    resultado as PerguntaModelo;


                  await carregarModeloPorId(
                    modeloId
                  );


                  resolve(
                    pergunta
                  );
                } catch (error) {
                  const mensagem =
                    error instanceof Error
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
      ): Promise<PerguntaModelo> => {
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


                  /*
                   * O retorno possui a mesma estrutura
                   * de PerguntaModelo.
                   *
                   * O cast corrige apenas a inferência
                   * excessivamente ampla de
                   * sentidoPontuacao.
                   */
                  const perguntaSalva =
                    resultado as PerguntaModelo;


                  await carregarModeloPorId(
                    modeloId
                  );


                  resolve(
                    perguntaSalva
                  );
                } catch (error) {
                  const mensagem =
                    error instanceof Error
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
      ): Promise<void> => {
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
                    error instanceof Error
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
      ): Promise<ModeloPesquisaDetalhado> => {
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


                  const atualizado =
                    await carregarModeloPorId(
                      resultado.id
                    );


                  resolve(
                    atualizado
                  );
                } catch (error) {
                  const mensagem =
                    error instanceof Error
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


  useEffect(
    () => {
      void carregarModelos().catch(
        () =>
          undefined
      );
    },
    [
      carregarModelos,
    ]
  );


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