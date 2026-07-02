"use server";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function obterTodos() {
  return RepositorioDenuncia.obterTodos();
}