"use client";

import { useEffect, useState, useTransition } from "react";
import { StatusPesquisaCliente } from "@prisma/client";
import Backend from "@/src/backend";
import {
  DadosFormularioPesquisaCliente,
  PesquisaCliente,
  PesquisaClienteDetalhada,
  PesquisaClienteRelatorio,
  PesquisaClienteResumo,
} from "@/src/core/model/PesquisaCliente";

export function usePesquisasCliente() {
  const [pesquisas, setPesquisas] = useState<PesquisaClienteResumo[]>([]);
  const [pesquisaSelecionada, setPesquisaSelecionada] =
    useState<PesquisaClienteDetalhada | null>(null);
  const [relatorio, setRelatorio] =
    useState<PesquisaClienteRelatorio | null>(null);

  const [dadosFormulario, setDadosFormulario] =
    useState<DadosFormularioPesquisaCliente>({
      clientes: [],
      modelos: [],
    });

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, startTransition] = useTransition();

  async function carregarPesquisas() {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.pesquisasCliente.obterTodos();
      setPesquisas(dados);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao carregar pesquisas."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarPesquisaPorId(id: string) {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.pesquisasCliente.obterPorId(id);
      setPesquisaSelecionada(dados);

      return dados;
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao carregar pesquisa.";

      setErro(mensagem);
      setPesquisaSelecionada(null);
      throw error;
    } finally {
      setCarregando(false);
    }
  }

  async function carregarRelatorio(id: string) {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.pesquisasCliente.obterRelatorio(id);
      setRelatorio(dados);

      return dados;
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao carregar relatório.";

      setErro(mensagem);
      setRelatorio(null);
      throw error;
    } finally {
      setCarregando(false);
    }
  }

  async function carregarDadosFormulario() {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.pesquisasCliente.obterDadosFormulario();
      setDadosFormulario(dados);

      return dados;
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados do formulário.";

      setErro(mensagem);
      throw error;
    } finally {
      setCarregando(false);
    }
  }

  async function salvarPesquisa(pesquisa: PesquisaCliente) {
    return new Promise<PesquisaClienteDetalhada>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          const resultado = await Backend.pesquisasCliente.salvar(pesquisa);
          await carregarPesquisas();

          setPesquisaSelecionada(resultado);
          resolve(resultado);
        } catch (error) {
          const mensagem =
            error instanceof Error ? error.message : "Erro ao salvar pesquisa.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  async function alterarStatus(id: string, status: StatusPesquisaCliente) {
    return new Promise<PesquisaClienteDetalhada>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          const resultado = await Backend.pesquisasCliente.alterarStatus(
            id,
            status
          );

          setPesquisaSelecionada(resultado);
          await carregarPesquisas();

          resolve(resultado);
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao alterar status da pesquisa.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  useEffect(() => {
    carregarPesquisas();
  }, []);

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
    alterarStatus,
  };
}