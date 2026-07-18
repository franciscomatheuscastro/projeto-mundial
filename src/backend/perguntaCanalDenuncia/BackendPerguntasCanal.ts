"use server";

import { auth } from "@/src/auth";
import RepositorioPerguntaCanalDenuncia from "./RepositorioPerguntaCanalDenuncia";
import type { PerguntaCanalDenuncia } from "@/src/core/model/PerguntaCanalDenuncia";

const PERFIS_MUNDIAL = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];

async function validarMundial() {
  const session = await auth();
  const usuario = session?.user as any;

  if (!usuario || !PERFIS_MUNDIAL.includes(usuario.perfil)) {
    throw new Error("Acesso não autorizado.");
  }
}

export async function obterTodasPerguntasCanal() {
  await validarMundial();
  return RepositorioPerguntaCanalDenuncia.obterTodas();
}

export async function obterPerguntaCanalPorId(id: string) {
  await validarMundial();
  return RepositorioPerguntaCanalDenuncia.obterPorId(id);
}

export async function obterPerguntasCanalAtivasPorCliente(
  clienteId: string
) {
  return RepositorioPerguntaCanalDenuncia.obterAtivasPorCliente(clienteId);
}

export async function salvarPerguntaCanal(
  dados: PerguntaCanalDenuncia
) {
  await validarMundial();
  return RepositorioPerguntaCanalDenuncia.salvar(dados);
}

export async function excluirPerguntaCanal(id: string) {
  await validarMundial();
  return RepositorioPerguntaCanalDenuncia.excluir(id);
}
