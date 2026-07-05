"use client";

import { useEffect, useState, useTransition } from "react";
import Backend from "@/src/backend";
import { RegraCriticidadeDenuncia } from "@/src/core/model/RegraCriticidadeDenuncia";

export function useCriticidadeDenuncia() {
  const [regras, setRegras] = useState<RegraCriticidadeDenuncia[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, startTransition] = useTransition();

  async function carregarRegras() {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.criticidadeDenuncia.obterTodos();
      setRegras(dados);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar regras de criticidade."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarRegra(regra: RegraCriticidadeDenuncia) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          await Backend.criticidadeDenuncia.salvar(regra);
          await carregarRegras();

          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao salvar regra de criticidade.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  async function excluirRegra(id: string) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          await Backend.criticidadeDenuncia.excluir(id);
          await carregarRegras();

          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao excluir regra de criticidade.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  useEffect(() => {
    carregarRegras();
  }, []);

  return {
    regras,
    carregando,
    processando,
    erro,
    carregarRegras,
    salvarRegra,
    excluirRegra,
  };
}