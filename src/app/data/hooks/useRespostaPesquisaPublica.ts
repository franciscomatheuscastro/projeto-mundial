"use client";

import { useState, useTransition } from "react";
import Backend from "@/src/backend";
import {
  NovaRespostaPesquisa,
  PesquisaPublica,
} from "@/src/core/model/RespostaPesquisa";

export function useRespostaPesquisaPublica() {
  const [pesquisa, setPesquisa] = useState<PesquisaPublica | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, startTransition] = useTransition();

  async function salvarResposta(resposta: NovaRespostaPesquisa) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);
          await Backend.respostasPesquisa.salvar(resposta);
          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error
              ? error.message
              : "Erro ao enviar resposta.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  return {
    pesquisa,
    setPesquisa,
    erro,
    processando,
    salvarResposta,
  };
}