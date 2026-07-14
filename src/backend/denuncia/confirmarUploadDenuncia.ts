"use server";

import RepositorioDenuncia from "./RepositorioDenuncia";
import { ConfirmarUploadDenunciaInput } from "@/src/core/model/Denuncia";

export default async function confirmarUploadDenuncia(
  dados: ConfirmarUploadDenunciaInput
) {
  return RepositorioDenuncia.confirmarUpload(dados);
}