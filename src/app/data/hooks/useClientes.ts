"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import Backend from "@/src/backend";

import type {
  Cliente,
  ClienteComResumo,
  ClienteDetalhado,
} from "@/src/core/model/Cliente";

export function useClientes(
  carregarInicial = true
) {
  const [clientes, setClientes] =
    useState<ClienteComResumo[]>([]);

  const [
    clienteSelecionado,
    setClienteSelecionado,
  ] = useState<ClienteDetalhado | null>(
    null
  );

  const [erro, setErro] =
    useState<string | null>(null);

  const [carregando, setCarregando] =
    useState(carregarInicial);

  const [processando, startTransition] =
    useTransition();

  const carregarClientes =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro(null);

        const dados =
          await Backend.clientes.obterTodos();

        setClientes(dados);

        return dados;
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Erro ao carregar clientes.";

        setErro(mensagem);

        throw error;
      } finally {
        setCarregando(false);
      }
    }, []);

  const carregarClientePorId =
    useCallback(async (id: string) => {
      if (!id?.trim()) {
        throw new Error(
          "Cliente não informado."
        );
      }

      try {
        setCarregando(true);
        setErro(null);

        const dados =
          await Backend.clientes.obterPorId(
            id
          );

        setClienteSelecionado(dados);

        return dados;
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Erro ao carregar cliente.";

        setErro(mensagem);
        setClienteSelecionado(null);

        throw error;
      } finally {
        setCarregando(false);
      }
    }, []);

  const excluirCliente =
    useCallback(
      async (id: string) => {
        if (!id?.trim()) {
          throw new Error(
            "Cliente não informado."
          );
        }

        return new Promise<void>(
          (resolve, reject) => {
            startTransition(async () => {
              try {
                setErro(null);

                await Backend.clientes.excluir(
                  id
                );

                await carregarClientes();

                setClienteSelecionado(
                  (clienteAtual) =>
                    clienteAtual?.id === id
                      ? null
                      : clienteAtual
                );

                resolve();
              } catch (error) {
                const mensagem =
                  error instanceof Error
                    ? error.message
                    : "Erro ao excluir cliente.";

                setErro(mensagem);

                reject(error);
              }
            });
          }
        );
      },
      [carregarClientes]
    );

  const salvarCliente =
    useCallback(
      async (cliente: Cliente) => {
        return new Promise<Cliente>(
          (resolve, reject) => {
            startTransition(async () => {
              try {
                setErro(null);

                const resultado =
                  await Backend.clientes.salvar(
                    cliente
                  );

                await carregarClientes();

                resolve(resultado);
              } catch (error) {
                const mensagem =
                  error instanceof Error
                    ? error.message
                    : "Erro ao salvar cliente.";

                setErro(mensagem);

                reject(error);
              }
            });
          }
        );
      },
      [carregarClientes]
    );

  const limparErro =
    useCallback(() => {
      setErro(null);
    }, []);

  useEffect(() => {
    if (!carregarInicial) {
      setCarregando(false);
      return;
    }

    carregarClientes().catch(() => {
      // O erro já foi registrado no estado.
    });
  }, [
    carregarInicial,
    carregarClientes,
  ]);

  return {
    clientes,

    clienteSelecionado,
    setClienteSelecionado,

    carregando,
    processando,
    erro,

    limparErro,

    excluirCliente,
    carregarClientes,
    carregarClientePorId,
    salvarCliente,
  };
}