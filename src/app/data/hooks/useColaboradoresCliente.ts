"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import Backend from "@/src/backend";

import type {
  ColaboradorCliente,
  ColaboradorClienteSalvo,
} from "@/src/core/model/ColaboradorCliente";

export function useColaboradoresCliente() {
  const [
    colaboradores,
    setColaboradores,
  ] = useState<
    ColaboradorClienteSalvo[]
  >([]);

  const [
    colaboradorSelecionado,
    setColaboradorSelecionado,
  ] =
    useState<ColaboradorClienteSalvo | null>(
      null
    );

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
    useState(true);

  const [
    processando,
    startTransition,
  ] =
    useTransition();

  const carregarColaboradores =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro(null);

        const dados =
          await Backend.colaboradoresCliente.obterMeus();

        setColaboradores(
          dados
        );

        return dados;
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Erro ao carregar colaboradores.";

        setErro(
          mensagem
        );

        throw error;
      } finally {
        setCarregando(false);
      }
    }, []);

  const salvarColaborador =
    useCallback(
      async (
        colaborador:
          ColaboradorCliente
      ): Promise<void> => {
        return new Promise<void>(
          (
            resolve,
            reject
          ) => {
            startTransition(
              async () => {
                try {
                  setErro(null);

                  const resposta =
                    await Backend.colaboradoresCliente.salvarMeu(
                      colaborador
                    );

                  if (
                    !resposta.sucesso
                  ) {
                    throw new Error(
                      resposta.erro
                    );
                  }

                  await carregarColaboradores();

                  setColaboradorSelecionado(
                    null
                  );

                  resolve();
                } catch (error) {
                  const mensagem =
                    error instanceof Error
                      ? error.message
                      : "Erro ao salvar colaborador.";

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
        carregarColaboradores,
      ]
    );

  const excluirColaborador =
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
                  setErro(null);

                  await Backend.colaboradoresCliente.excluirMeu(
                    id
                  );

                  await carregarColaboradores();

                  setColaboradorSelecionado(
                    (atual) =>
                      atual?.id === id
                        ? null
                        : atual
                  );

                  resolve();
                } catch (error) {
                  const mensagem =
                    error instanceof Error
                      ? error.message
                      : "Erro ao excluir colaborador.";

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
        carregarColaboradores,
      ]
    );

  const limparErro =
    useCallback(() => {
      setErro(null);
    }, []);

  useEffect(() => {
    carregarColaboradores().catch(
      () => {
        /*
         * O erro já foi registrado
         * no estado do hook.
         */
      }
    );
  }, [
    carregarColaboradores,
  ]);

  return {
    colaboradores,

    colaboradorSelecionado,
    setColaboradorSelecionado,

    carregando,
    processando,
    erro,

    limparErro,

    carregarColaboradores,
    salvarColaborador,
    excluirColaborador,
  };
}