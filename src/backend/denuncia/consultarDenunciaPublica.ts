"use server";

import { ConsultarDenunciaPublicaInput } from "@/src/core/model/Denuncia";
import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function consultarDenunciaPublica(
  dados: ConsultarDenunciaPublicaInput
) {
  return RepositorioDenuncia.consultarPublica(dados);
}