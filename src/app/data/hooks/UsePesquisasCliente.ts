"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  StatusPesquisaCliente,
} from "@prisma/client";

import Backend from "@/src/backend";

import {
  DadosFormularioPesquisaCliente,
  PesquisaCliente,
  PesquisaClienteDetalhada,
  PesquisaClienteRelatorio,
  PesquisaClienteResumo,
} from "@/src/core/model/PesquisaCliente";


type Contexto =
  | "mundial"
  | "cliente";


export function usePesquisasCliente(
  carregarAoIniciar = true,
  contexto: Contexto = "mundial"
) {
  const [
    pesquisas,
    setPesquisas,
  ] =
    useState<
      PesquisaClienteResumo[]
    >([]);


  const [
    pesquisaSelecionada,
    setPesquisaSelecionada,
  ] =
    useState<
      PesquisaClienteDetalhada | null
    >(null);


  const [
    relatorio,
    setRelatorio,
  ] =
    useState<
      PesquisaClienteRelatorio | null
    >(null);


  const [
    dadosFormulario,
    setDadosFormulario,
  ] =
    useState<DadosFormularioPesquisaCliente>({
      clientes: [],
      modelos: [],
    });


  const [
    erro,
    setErro,
  ] =
    useState<string | null>(
      null
    );


  const [
    carregando,
    setCarregando,
  ] =
    useState(
      carregarAoIniciar
    );


  const [
    processando,
    startTransition,
  ] =
    useTransition();


  const tratarErro =
    useCallback(
      (
        error: unknown,
        mensagemPadrao: string
      ) => {
        const mensagem =
          error instanceof Error
            ? error.message
            : mensagemPadrao;

        setErro(
          mensagem
        );

        return mensagem;
      },
      []
    );


  const carregarPesquisas =
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
            contexto ===
            "cliente"
              ? await Backend.pesquisasCliente.obterMinhas()
              : await Backend.pesquisasCliente.obterTodos();

          setPesquisas(
            dados
          );

          return dados;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao carregar pesquisas."
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        contexto,
        tratarErro,
      ]
    );


  const carregarPesquisaPorId =
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
            contexto ===
            "cliente"
              ? await Backend.pesquisasCliente.obterMinhaPorId(
                  id
                )
              : await Backend.pesquisasCliente.obterPorId(
                  id
                );

          setPesquisaSelecionada(
            dados
          );

          return dados;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao carregar pesquisa."
          );

          setPesquisaSelecionada(
            null
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        contexto,
        tratarErro,
      ]
    );


  const carregarRelatorio =
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
            contexto ===
            "cliente"
              ? await Backend.pesquisasCliente.obterMeuRelatorio(
                  id
                )
              : await Backend.pesquisasCliente.obterRelatorio(
                  id
                );

          setRelatorio(
            dados
          );

          return dados;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao carregar relatório."
          );

          setRelatorio(
            null
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        contexto,
        tratarErro,
      ]
    );


  const carregarDadosFormulario =
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
            await Backend.pesquisasCliente.obterDadosFormulario();

          setDadosFormulario(
            dados
          );

          return dados;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao carregar dados do formulário."
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        tratarErro,
      ]
    );


  const salvarPesquisa =
    useCallback(
      async (
        pesquisa: PesquisaCliente
      ) => {
        return new Promise<PesquisaClienteDetalhada>(
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
                    await Backend.pesquisasCliente.salvar(
                      pesquisa
                    );

                  setPesquisaSelecionada(
                    resultado
                  );

                  if (
                    carregarAoIniciar
                  ) {
                    await carregarPesquisas();
                  }

                  resolve(
                    resultado
                  );
                } catch (error) {
                  tratarErro(
                    error,
                    "Erro ao salvar pesquisa."
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
        carregarAoIniciar,
        carregarPesquisas,
        tratarErro,
      ]
    );


  const excluirPesquisa =
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

                  await Backend.pesquisasCliente.excluir(
                    id
                  );

                  setPesquisas(
                    atual =>
                      atual.filter(
                        item =>
                          item.id !==
                          id
                      )
                  );

                  setPesquisaSelecionada(
                    atual =>
                      atual?.id ===
                      id
                        ? null
                        : atual
                  );

                  if (
                    carregarAoIniciar
                  ) {
                    await carregarPesquisas();
                  }

                  resolve();
                } catch (error) {
                  tratarErro(
                    error,
                    "Erro ao excluir pesquisa."
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
        carregarAoIniciar,
        carregarPesquisas,
        tratarErro,
      ]
    );


  const alterarStatus =
    useCallback(
      async (
        id: string,
        status: StatusPesquisaCliente
      ) => {
        return new Promise<PesquisaClienteDetalhada>(
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
                    await Backend.pesquisasCliente.alterarStatus(
                      id,
                      status
                    );

                  setPesquisaSelecionada(
                    resultado
                  );

                  setPesquisas(
                    atual =>
                      atual.map(
                        item =>
                          item.id ===
                          id
                            ? {
                                ...item,
                                status,
                              }
                            : item
                      )
                  );

                  if (
                    carregarAoIniciar
                  ) {
                    await carregarPesquisas();
                  }

                  resolve(
                    resultado
                  );
                } catch (error) {
                  tratarErro(
                    error,
                    "Erro ao alterar status da pesquisa."
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
        carregarAoIniciar,
        carregarPesquisas,
        tratarErro,
      ]
    );


  const gerarConvites =
    useCallback(
      async (
        pesquisaId: string,
        quantidade: number
      ) => {
        return new Promise<PesquisaClienteDetalhada>(
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
                    await Backend.pesquisasCliente.gerarConvites(
                      pesquisaId,
                      quantidade
                    );

                  setPesquisaSelecionada(
                    resultado
                  );

                  if (
                    carregarAoIniciar
                  ) {
                    await carregarPesquisas();
                  }

                  resolve(
                    resultado
                  );
                } catch (error) {
                  tratarErro(
                    error,
                    "Erro ao gerar convites."
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
        carregarAoIniciar,
        carregarPesquisas,
        tratarErro,
      ]
    );


  useEffect(() => {
    if (
      carregarAoIniciar
    ) {
      void carregarPesquisas().catch(
        () =>
          undefined
      );
    }
  }, [
    carregarAoIniciar,
    carregarPesquisas,
  ]);


  return {
    pesquisas,

    pesquisaSelecionada,
    setPesquisaSelecionada,

    relatorio,

    dadosFormulario,

    carregando,
    processando,
    erro,

    carregarPesquisas,
    carregarPesquisaPorId,
    carregarRelatorio,
    carregarDadosFormulario,

    salvarPesquisa,
    excluirPesquisa,
    alterarStatus,
    gerarConvites,
  };
}