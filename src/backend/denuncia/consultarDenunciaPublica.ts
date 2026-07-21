"use server";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function consultarDenunciaPublica(
  dados: {
    protocolo: string;
  }
) {
  return RepositorioDenuncia.consultarPublica(
    dados
  );
}
