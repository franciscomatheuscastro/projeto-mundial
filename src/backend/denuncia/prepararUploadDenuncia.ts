"use server";

import RepositorioDenuncia from "./RepositorioDenuncia";
import { PrepararUploadDenunciaInput } from "@/src/core/model/Denuncia";

export default async function prepararUploadDenuncia(
  dados: PrepararUploadDenunciaInput
) {
  return RepositorioDenuncia.prepararUpload(dados);
}