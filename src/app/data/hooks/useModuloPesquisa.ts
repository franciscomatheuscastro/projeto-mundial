"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  StatusPesquisaCliente,
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  alterarStatusPesquisaModulo,
  excluirPesquisaModulo,
  gerarConvitesModuloPesquisa,
  obterDadosFormularioModuloPesquisa,
  obterPesquisaModuloPorId,
  obterRelatorioModuloPesquisa,
  obterTodosModuloPesquisa,
  salvarPesquisaModulo,
} from "@/src/backend/pesquisaCliente/acoesModuloPesquisa";

export function useModuloPesquisa(
  tipo: TipoModuloPesquisa,
  carregarInicial = true
) {
  const [
    pesquisas,
    setPesquisas,
  ] =
    useState<any[]>([]);

  const [
    pesquisaSelecionada,
    setPesquisaSelecionada,
  ] =
    useState<any | null>(
      null
    );

  const [
    relatorio,
    setRelatorio,
  ] =
    useState<any | null>(
      null
    );

  const [
    dadosFormulario,
    setDadosFormulario,
  ] =
    useState<any>({
      clientes: [],
      modelos: [],
    });

  const [
    carregando,
    setCarregando,
  ] =
    useState(
      carregarInicial
    );

  const [
    processando,
    setProcessando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState<
      string | null
    >(null);

  const tratarErro =
    useCallback(
      (
        error: unknown,
        mensagem: string
      ) => {
        const texto =
          error instanceof Error
            ? error.message
            : mensagem;

        setErro(
          texto
        );

        return texto;
      },
      []
    );

  const carregarPesquisas =
    useCallback(
      async () => {
        try {
          setCarregando(
            true
          );

          setErro(
            null
          );

          const resultado =
            await obterTodosModuloPesquisa(
              tipo
            );

          setPesquisas(
            resultado
          );

          return resultado;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao carregar aplicações."
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        tipo,
        tratarErro,
      ]
    );

  const carregarDadosFormulario =
    useCallback(
      async () => {
        try {
          setCarregando(
            true
          );

          setErro(
            null
          );

          const resultado =
            await obterDadosFormularioModuloPesquisa(
              tipo
            );

          setDadosFormulario(
            resultado
          );

          return resultado;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao carregar formulário."
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        tipo,
        tratarErro,
      ]
    );

  const carregarPesquisaPorId =
    useCallback(
      async (
        id: string
      ) => {
        try {
          setCarregando(
            true
          );

          setErro(
            null
          );

          const resultado =
            await obterPesquisaModuloPorId(
              id,
              tipo
            );

          setPesquisaSelecionada(
            resultado
          );

          return resultado;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao carregar aplicação."
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        tipo,
        tratarErro,
      ]
    );

  const carregarRelatorio =
    useCallback(
      async (
        id: string
      ) => {
        try {
          setCarregando(
            true
          );

          setErro(
            null
          );

          const resultado =
            await obterRelatorioModuloPesquisa(
              id,
              tipo
            );

          setRelatorio(
            resultado
          );

          return resultado;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao carregar relatório."
          );

          throw error;
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        tipo,
        tratarErro,
      ]
    );

  const salvar =
    useCallback(
      async (
        dados: {
          titulo: string;
          descricao?: string | null;
          clienteId: string;
          modeloId: string;
        }
      ) => {
        try {
          setProcessando(
            true
          );

          setErro(
            null
          );

          return await salvarPesquisaModulo(
            dados,
            tipo
          );
        } catch (error) {
          tratarErro(
            error,
            "Erro ao salvar aplicação."
          );

          throw error;
        } finally {
          setProcessando(
            false
          );
        }
      },
      [
        tipo,
        tratarErro,
      ]
    );

  const excluir =
    useCallback(
      async (
        id: string
      ) => {
        try {
          setProcessando(
            true
          );

          setErro(
            null
          );

          await excluirPesquisaModulo(
            id,
            tipo
          );

          setPesquisas(
            (atual) =>
              atual.filter(
                (item) =>
                  item.id !==
                  id
              )
          );
        } catch (error) {
          tratarErro(
            error,
            "Erro ao excluir aplicação."
          );

          throw error;
        } finally {
          setProcessando(
            false
          );
        }
      },
      [
        tipo,
        tratarErro,
      ]
    );

  const alterarStatus =
    useCallback(
      async (
        id: string,
        status: StatusPesquisaCliente
      ) => {
        try {
          setProcessando(
            true
          );

          setErro(
            null
          );

          const resultado =
            await alterarStatusPesquisaModulo(
              id,
              status,
              tipo
            );

          setPesquisaSelecionada(
            resultado
          );

          return resultado;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao alterar status."
          );

          throw error;
        } finally {
          setProcessando(
            false
          );
        }
      },
      [
        tipo,
        tratarErro,
      ]
    );

  const gerarConvites =
    useCallback(
      async (
        id: string,
        quantidade: number
      ) => {
        try {
          setProcessando(
            true
          );

          setErro(
            null
          );

          const resultado =
            await gerarConvitesModuloPesquisa(
              id,
              quantidade,
              tipo
            );

          setPesquisaSelecionada(
            resultado
          );

          return resultado;
        } catch (error) {
          tratarErro(
            error,
            "Erro ao gerar convites."
          );

          throw error;
        } finally {
          setProcessando(
            false
          );
        }
      },
      [
        tipo,
        tratarErro,
      ]
    );

  useEffect(() => {
    if (
      carregarInicial
    ) {
      void carregarPesquisas();
    }
  }, [
    carregarInicial,
    carregarPesquisas,
  ]);

  return {
    pesquisas,

    pesquisaSelecionada,

    relatorio,

    dadosFormulario,

    carregando,

    processando,

    erro,

    carregarPesquisas,

    carregarDadosFormulario,

    carregarPesquisaPorId,

    carregarRelatorio,

    salvar,

    excluir,

    alterarStatus,

    gerarConvites,
  };
}