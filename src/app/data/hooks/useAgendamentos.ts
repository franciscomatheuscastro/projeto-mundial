"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Backend from "@/src/backend";
import {
  Agendamento,
  AgendamentoDetalhado,
  AgendamentoResumo,
} from "@/src/core/model/Agendamento";

type Contexto = "mundial" | "cliente";

export function useAgendamentos(
  carregarAoIniciar = true,
  contexto: Contexto = "mundial"
) {
  const [agendamentos, setAgendamentos] = useState<AgendamentoResumo[]>([]);
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<AgendamentoDetalhado | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(carregarAoIniciar);
  const [processando, startTransition] = useTransition();

  const carregarAgendamentos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados =
        contexto === "cliente"
          ? await Backend.agendamentos.obterMeus()
          : await Backend.agendamentos.obterTodos();

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
  }, [contexto]);

  const carregarAgendamentoPorId = useCallback(
    async (id: string) => {
      try {
        setCarregando(true);
        setErro(null);

        const dados =
          contexto === "cliente"
            ? await Backend.agendamentos.obterMeuPorId(id)
            : await Backend.agendamentos.obterPorId(id);

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
    },
    [contexto]
  );

  const salvarAgendamento = useCallback(
    async (agendamento: Agendamento) => {
      return new Promise<AgendamentoDetalhado>((resolve, reject) => {
        startTransition(async () => {
          try {
            setErro(null);

            const resultado = await Backend.agendamentos.salvar(agendamento);
            setAgendamentoSelecionado(resultado);

            if (carregarAoIniciar) {
              await carregarAgendamentos();
            }

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
    },
    [carregarAgendamentos, carregarAoIniciar]
  );

  const excluirAgendamento = useCallback(
    async (id: string) => {
      return new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            setErro(null);

            await Backend.agendamentos.excluir(id);
            await carregarAgendamentos();

            setAgendamentoSelecionado((atual) =>
              atual?.id === id ? null : atual
            );

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
    },
    [carregarAgendamentos]
  );

  useEffect(() => {
    if (carregarAoIniciar) {
      carregarAgendamentos();
    }
  }, [carregarAoIniciar, carregarAgendamentos]);

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