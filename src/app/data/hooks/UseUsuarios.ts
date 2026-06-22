"use client";

import { useEffect, useState, useTransition } from "react";
import Backend from "@/src/backend";
import { UsuarioSemSenha, Usuario } from "@/src/core/model/Usuario";

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioSemSenha[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] =
    useState<UsuarioSemSenha | null>(null);

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, startTransition] = useTransition();

  async function carregarUsuarios() {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await Backend.usuarios.obterTodos();
      setUsuarios(dados);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao carregar usuários."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarUsuario(usuario: Usuario) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          await Backend.usuarios.salvar(usuario);
          await carregarUsuarios();

          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error ? error.message : "Erro ao salvar usuário.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  async function excluirUsuario(id: string) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setErro(null);

          await Backend.usuarios.excluir(id);
          await carregarUsuarios();

          resolve();
        } catch (error) {
          const mensagem =
            error instanceof Error ? error.message : "Erro ao excluir usuário.";

          setErro(mensagem);
          reject(error);
        }
      });
    });
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  return {
    usuarios,
    usuarioSelecionado,
    setUsuarioSelecionado,

    carregando,
    processando,
    erro,

    carregarUsuarios,
    salvarUsuario,
    excluirUsuario,
  };
}