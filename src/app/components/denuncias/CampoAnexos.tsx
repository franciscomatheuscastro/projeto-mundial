"use client";

import type { ChangeEvent } from "react";

type Props = {
  arquivos: File[];
  onChange: (arquivos: File[]) => void;
  disabled?: boolean;
};

const LIMITE_ARQUIVOS = 5;
const LIMITE_DOCUMENTO_IMAGEM = 10 * 1024 * 1024;
const LIMITE_AUDIO = 25 * 1024 * 1024;
const LIMITE_VIDEO = 100 * 1024 * 1024;

const EXTENSOES_PERMITIDAS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".doc",
  ".docx",
  ".mp3",
  ".wav",
  ".m4a",
  ".ogg",
  ".aac",
  ".mp4",
  ".webm",
  ".mov",
];

function tipoArquivo(arquivo: File) {
  if (arquivo.type.startsWith("audio/")) {
    return "audio";
  }

  if (arquivo.type.startsWith("video/")) {
    return "video";
  }

  if (arquivo.type.startsWith("image/")) {
    return "imagem";
  }

  return "documento";
}

function limiteArquivo(arquivo: File) {
  const tipo = tipoArquivo(arquivo);

  if (tipo === "video") {
    return LIMITE_VIDEO;
  }

  if (tipo === "audio") {
    return LIMITE_AUDIO;
  }

  return LIMITE_DOCUMENTO_IMAGEM;
}

function formatarLimite(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

function validarExtensao(arquivo: File) {
  const nome = arquivo.name.toLowerCase();

  return EXTENSOES_PERMITIDAS.some((extensao) =>
    nome.endsWith(extensao)
  );
}

export default function CampoAnexos({
  arquivos,
  onChange,
  disabled = false,
}: Props) {
  function selecionar(event: ChangeEvent<HTMLInputElement>) {
    const selecionados = Array.from(event.target.files || []);

    event.target.value = "";

    if (selecionados.length === 0) {
      return;
    }

    const quantidadeDisponivel =
      LIMITE_ARQUIVOS - arquivos.length;

    if (selecionados.length > quantidadeDisponivel) {
      alert(
        `Você pode adicionar somente mais ${quantidadeDisponivel} arquivo(s).`
      );

      return;
    }

    const arquivosInvalidos = selecionados.filter(
      (arquivo) => !validarExtensao(arquivo)
    );

    if (arquivosInvalidos.length > 0) {
      alert(
        `Formato não permitido: ${arquivosInvalidos
          .map((arquivo) => arquivo.name)
          .join(", ")}.`
      );

      return;
    }

    const arquivoGrande = selecionados.find(
      (arquivo) => arquivo.size > limiteArquivo(arquivo)
    );

    if (arquivoGrande) {
      alert(
        `O arquivo ${arquivoGrande.name} ultrapassa o limite de ` +
          `${formatarLimite(limiteArquivo(arquivoGrande))}.`
      );

      return;
    }

    const quantidadeVideos =
      arquivos.filter(
        (arquivo) => tipoArquivo(arquivo) === "video"
      ).length +
      selecionados.filter(
        (arquivo) => tipoArquivo(arquivo) === "video"
      ).length;

    if (quantidadeVideos > 1) {
      alert("É permitido anexar no máximo um vídeo por denúncia.");

      return;
    }

    onChange([...arquivos, ...selecionados]);
  }

  function remover(indice: number) {
    onChange(
      arquivos.filter((_, index) => index !== indice)
    );
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Anexos e evidências
      </label>

      <input
        type="file"
        multiple
        disabled={
          disabled || arquivos.length >= LIMITE_ARQUIVOS
        }
        accept={EXTENSOES_PERMITIDAS.join(",")}
        onChange={selecionar}
        className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100"
      />

      <div className="mt-2 space-y-1 text-xs text-slate-500">
        <p>Até 5 arquivos e no máximo um vídeo.</p>
        <p>Documentos e imagens: até 10 MB.</p>
        <p>Áudios: até 25 MB. Vídeos: até 100 MB.</p>
        <p>
          Áudios e vídeos serão acessíveis exclusivamente pela equipe da
          Mundial.
        </p>
      </div>

      {arquivos.length > 0 && (
        <div className="mt-3 space-y-2">
          {arquivos.map((arquivo, indice) => {
            const tipo = tipoArquivo(arquivo);

            return (
              <div
                key={`${arquivo.name}-${arquivo.size}-${indice}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {arquivo.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {tipo.charAt(0).toUpperCase() +
                      tipo.slice(1)}
                    {" • "}
                    {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {(tipo === "audio" || tipo === "video") && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      Visível somente para a Mundial
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remover(indice)}
                  className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}