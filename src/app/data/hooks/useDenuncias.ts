"use client";

import { useEffect, useState, useTransition } from "react";
import Backend from "@/src/backend";
import {
  CriarDenunciaPublica,
  Denuncia,
  DenunciaDetalhada,
  DenunciaResumo,
  NovaTratativa,
} from "@/src/core/model/Denuncia";

type ContextoDenuncias = "mundial" | "cliente";

export function useDenuncias(
  carregarInicial = true,
  contexto: ContextoDenuncias = "mundial"
) {
  const [denuncias, setDenuncias] = useState<DenunciaResumo[]>([]);
  const [denunciaSelecionada, setDenunciaSelecionada] =
    useState<DenunciaDetalhada | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(carregarInicial);
  const [processando, startTransition] = useTransition();

  async function carregarDenuncias() {
    try {
      setCarregando(true);
      setErro(null);

      const dados =
        contexto === "cliente"
          ? await Backend.denuncias.obterMinhas()
          : await Backend.denuncias.obterTodos();

      setDenuncias(dados);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao carregar denúncias."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarDenunciaPorId(id: string) {
    try {
      setCarregando(true);
      setErro(null);

      const denuncia =
        contexto === "cliente"
          ? await Backend.denuncias.obterMinhaPorId(id)
          : await Backend.denuncias.obterPorId(id);

      setDenunciaSelecionada(denuncia);
      return denuncia;
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao carregar denúncia.";

      setErro(mensagem);
      throw error;
    } finally {
      setCarregando(false);
    }
  }

  async function criarDenunciaPublica(denuncia: CriarDenunciaPublica) {
    return new Promise<{ protocolo: string }>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          const resultado = await Backend.denuncias.criarPublica(denuncia);

          resolve(resultado);
        } catch (error) {
          const mensagem =
            error instanceof Error ? error.message : "Erro ao criar denúncia.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  async function consultarDenunciaPublica(
    clienteId: string,
    protocolo: string
  ) {
    try {
      setCarregando(true);
      setErro(null);

      const resultado = await Backend.denuncias.consultarPublica({
        clienteId,
        protocolo,
      });

      return resultado;
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao consultar denúncia.";

      setErro(mensagem);
      throw error;
    } finally {
      setCarregando(false);
    }
  }

  async function salvarDenuncia(denuncia: DenunciaDetalhada) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          const resultado =
            contexto === "cliente"
              ? await Backend.denuncias.salvarMinha(denuncia)
              : await Backend.denuncias.salvar(denuncia);

          setDenunciaSelecionada(resultado);
          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error ? error.message : "Erro ao salvar denúncia.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  async function adicionarTratativa(
    denunciaId: string,
    tratativa: NovaTratativa
  ) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          const resultado =
            contexto === "cliente"
              ? await Backend.denuncias.adicionarMinhaTratativa(
                  denunciaId,
                  tratativa
                )
              : await Backend.denuncias.adicionarTratativa(
                  denunciaId,
                  tratativa
                );

          setDenunciaSelecionada(resultado);
          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao adicionar tratativa.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  useEffect(() => {
    if (carregarInicial) {
      carregarDenuncias();
    }
  }, [carregarInicial, contexto]);

  return {
    denuncias,
    denunciaSelecionada,
    setDenunciaSelecionada,

    carregando,
    processando,
    erro,

    carregarDenuncias,
    carregarDenunciaPorId,
    criarDenunciaPublica,
    consultarDenunciaPublica,
    salvarDenuncia,
    adicionarTratativa,
  };
}