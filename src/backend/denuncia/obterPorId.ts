"use server";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function obterPorId(id: string) {
  return RepositorioDenuncia.obterPorId(id);
}