"use client";

import { useEffect, useState, useTransition } from "react";
import Backend from "@/src/backend";
import {
  Cliente,
  ClienteComResumo,
  ClienteDetalhado,
} from "@/src/core/model/Cliente";

export function useClientes() {
  const [clientes, setClientes] = useState<ClienteComResumo[]>([]);
  const [clienteSelecionado, setClienteSelecionado] =
    useState<ClienteDetalhado | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, startTransition] = useTransition();

  async function carregarClientes() {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.clientes.obterTodos();
      setClientes(dados);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao carregar clientes."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarClientePorId(id: string) {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.clientes.obterPorId(id);
      setClienteSelecionado(dados);

      return dados;
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao carregar cliente.";

      setErro(mensagem);
      setClienteSelecionado(null);

      throw error;
    } finally {
      setCarregando(false);
    }
  }

  async function salvarCliente(cliente: Cliente) {
    return new Promise<Cliente>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          const resultado = await Backend.clientes.salvar(cliente);
          await carregarClientes();

          resolve(resultado);
        } catch (error) {
          const mensagem =
            error instanceof Error ? error.message : "Erro ao salvar cliente.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  return {
    clientes,
    clienteSelecionado,
    setClienteSelecionado,

    carregando,
    processando,
    erro,

    carregarClientes,
    carregarClientePorId,
    salvarCliente,
  };
}