"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import Backend from "@/src/backend";
import {
  ColaboradorCliente,
  ColaboradorClienteSalvo,
} from "@/src/core/model/ColaboradorCliente";

export function useColaboradoresCliente() {
  const [colaboradores, setColaboradores] = useState<
    ColaboradorClienteSalvo[]
  >([]);

  const [colaboradorSelecionado, setColaboradorSelecionado] =
    useState<ColaboradorClienteSalvo | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, startTransition] = useTransition();

  const carregarColaboradores = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados =
        await Backend.colaboradoresCliente.obterMeus();

      setColaboradores(dados);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar colaboradores.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }, []);

  async function salvarColaborador(
    colaborador: ColaboradorCliente
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          await Backend.colaboradoresCliente.salvarMeu(
            colaborador
          );

          await carregarColaboradores();
          setColaboradorSelecionado(null);

          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao salvar colaborador.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  async function excluirColaborador(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          await Backend.colaboradoresCliente.excluirMeu(id);
          await carregarColaboradores();

          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao excluir colaborador.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  useEffect(() => {
    carregarColaboradores();
  }, [carregarColaboradores]);

  return {
    colaboradores,
    colaboradorSelecionado,
    setColaboradorSelecionado,
    carregando,
    processando,
    erro,
    carregarColaboradores,
    salvarColaborador,
    excluirColaborador,
  };
}