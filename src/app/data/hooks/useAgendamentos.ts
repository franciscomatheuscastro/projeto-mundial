"use client";

import { useEffect, useState, useTransition } from "react";
import Backend from "@/src/backend";
import {
  Agendamento,
  AgendamentoDetalhado,
  AgendamentoResumo,
} from "@/src/core/model/Agendamento";

export function useAgendamentos(carregarAoIniciar = true) {
  const [agendamentos, setAgendamentos] = useState<AgendamentoResumo[]>([]);
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<AgendamentoDetalhado | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(carregarAoIniciar);
  const [processando, startTransition] = useTransition();

  async function carregarAgendamentos() {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.agendamentos.obterTodos();
      setAgendamentos(dados);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar agendamentos."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarAgendamentoPorId(id: string) {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.agendamentos.obterPorId(id);
      setAgendamentoSelecionado(dados);

      return dados;
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar agendamento.";

      setErro(mensagem);
      setAgendamentoSelecionado(null);

      throw error;
    } finally {
      setCarregando(false);
    }
  }

  async function salvarAgendamento(agendamento: Agendamento) {
    return new Promise<AgendamentoDetalhado>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          const resultado = await Backend.agendamentos.salvar(agendamento);
          setAgendamentoSelecionado(resultado);
          await carregarAgendamentos();

          resolve(resultado);
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao salvar agendamento.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  async function excluirAgendamento(id: string) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          await Backend.agendamentos.excluir(id);
          await carregarAgendamentos();

          if (agendamentoSelecionado?.id === id) {
            setAgendamentoSelecionado(null);
          }

          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao excluir agendamento.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  useEffect(() => {
    if (carregarAoIniciar) {
      carregarAgendamentos();
    }
  }, [carregarAoIniciar]);

  return {
    agendamentos,
    agendamentoSelecionado,
    setAgendamentoSelecionado,

    carregando,
    processando,
    erro,

    carregarAgendamentos,
    carregarAgendamentoPorId,
    salvarAgendamento,
    excluirAgendamento,
  };
}