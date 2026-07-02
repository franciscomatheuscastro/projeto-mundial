"use client";

import { useEffect, useState, useTransition } from "react";
import Backend from "@/src/backend";
import {
  PlanoAcao,
  PlanoAcaoDetalhado,
  PlanoAcaoResumo,
} from "@/src/core/model/PlanoAcao";

export function usePlanosAcao(carregarAoIniciar = true) {
  const [planos, setPlanos] = useState<PlanoAcaoResumo[]>([]);
  const [planoSelecionado, setPlanoSelecionado] =
    useState<PlanoAcaoDetalhado | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(carregarAoIniciar);
  const [processando, startTransition] = useTransition();

  async function carregarPlanos() {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.planosAcao.obterTodos();
      setPlanos(dados);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar planos de ação."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarPlanoPorId(id: string) {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.planosAcao.obterPorId(id);
      setPlanoSelecionado(dados);

      return dados;
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar plano de ação.";

      setErro(mensagem);
      setPlanoSelecionado(null);

      throw error;
    } finally {
      setCarregando(false);
    }
  }

  async function carregarPlanosPorPesquisa(pesquisaId: string) {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.planosAcao.obterPorPesquisa(pesquisaId);
      setPlanos(dados);

      return dados;
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar planos da pesquisa.";

      setErro(mensagem);
      throw error;
    } finally {
      setCarregando(false);
    }
  }

  async function salvarPlano(plano: PlanoAcao) {
    return new Promise<PlanoAcaoDetalhado>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          const resultado = await Backend.planosAcao.salvar(plano);
          setPlanoSelecionado(resultado);
          await carregarPlanos();

          resolve(resultado);
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao salvar plano de ação.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  async function excluirPlano(id: string) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          await Backend.planosAcao.excluir(id);
          await carregarPlanos();

          if (planoSelecionado?.id === id) {
            setPlanoSelecionado(null);
          }

          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao excluir plano de ação.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  useEffect(() => {
    if (carregarAoIniciar) {
      carregarPlanos();
    }
  }, [carregarAoIniciar]);

  return {
    planos,
    planoSelecionado,
    setPlanoSelecionado,

    carregando,
    processando,
    erro,

    carregarPlanos,
    carregarPlanoPorId,
    carregarPlanosPorPesquisa,
    salvarPlano,
    excluirPlano,
  };
}