import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

function obterVariavel(nome: string) {
  const valor =
    process.env[nome]?.trim();

  if (!valor) {
    throw new Error(
      `Variável ${nome} não configurada.`
    );
  }

  return valor;
}

const bucket =
  obterVariavel("STORAGE_BUCKET");

const endpoint =
  obterVariavel("STORAGE_ENDPOINT");

const storage = new S3Client({
  endpoint,

  region:
    process.env.STORAGE_REGION?.trim() ||
    "auto",

  credentials: {
    accessKeyId: obterVariavel(
      "STORAGE_ACCESS_KEY_ID"
    ),

    secretAccessKey: obterVariavel(
      "STORAGE_SECRET_ACCESS_KEY"
    ),
  },

  /*
   * Para Cloudflare R2 normalmente false.
   * Se utilizar MinIO ou outro S3 compatível,
   * pode ser necessário true.
   */
  forcePathStyle: false,
});

export type PrepararUploadInput = {
  clienteId: string;
  denunciaId: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanho: number;
};

const MEGABYTE =
  1024 * 1024;

const TAMANHO_MAXIMO_PADRAO =
  10 * MEGABYTE;

const TAMANHO_MAXIMO_AUDIO =
  25 * MEGABYTE;

const TAMANHO_MAXIMO_VIDEO =
  100 * MEGABYTE;

const TIPOS_DOCUMENTO = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const TIPOS_IMAGEM = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const TIPOS_AUDIO = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",
]);

const TIPOS_VIDEO = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
]);

const TIPOS_PERMITIDOS = new Set([
  ...TIPOS_DOCUMENTO,
  ...TIPOS_IMAGEM,
  ...TIPOS_AUDIO,
  ...TIPOS_VIDEO,
]);

function normalizarTipoMime(
  tipoMime: string
) {
  return tipoMime
    .trim()
    .toLowerCase();
}

function obterTamanhoMaximo(
  tipoMime: string
) {
  if (TIPOS_VIDEO.has(tipoMime)) {
    return TAMANHO_MAXIMO_VIDEO;
  }

  if (TIPOS_AUDIO.has(tipoMime)) {
    return TAMANHO_MAXIMO_AUDIO;
  }

  return TAMANHO_MAXIMO_PADRAO;
}

function formatarMegabytes(
  tamanho: number
) {
  return Math.round(
    tamanho / MEGABYTE
  );
}

function limparNomeArquivo(
  nome: string
) {
  const nomeSemCaminho =
    nome
      .split(/[\\/]/)
      .pop()
      ?.trim() || "arquivo";

  const nomeLimpo = nomeSemCaminho
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    )
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return nomeLimpo || "arquivo";
}

export function validarArquivo(
  dados: {
    nomeArquivo: string;
    tipoMime: string;
    tamanho: number;
  }
) {
  if (!dados.nomeArquivo?.trim()) {
    throw new Error(
      "Nome do arquivo inválido."
    );
  }

  if (!dados.tipoMime?.trim()) {
    throw new Error(
      "Tipo do arquivo não identificado."
    );
  }

  if (
    !Number.isFinite(dados.tamanho) ||
    dados.tamanho <= 0
  ) {
    throw new Error(
      "Tamanho do arquivo inválido."
    );
  }

  const tipoMime =
    normalizarTipoMime(
      dados.tipoMime
    );

  if (
    !TIPOS_PERMITIDOS.has(tipoMime)
  ) {
    throw new Error(
      "Formato não permitido. Envie PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, MP3, M4A, WAV, OGG, AAC, MP4, WEBM ou MOV."
    );
  }

  const tamanhoMaximo =
    obterTamanhoMaximo(tipoMime);

  if (
    dados.tamanho >
    tamanhoMaximo
  ) {
    throw new Error(
      `O arquivo ${dados.nomeArquivo} ultrapassa o limite de ${formatarMegabytes(
        tamanhoMaximo
      )} MB para este formato.`
    );
  }
}

export async function gerarUploadTemporario(
  input: PrepararUploadInput
): Promise<{
  chave: string;
  uploadUrl: string;
  nomeOriginal: string;
}> {
  if (!input.clienteId?.trim()) {
    throw new Error(
      "Cliente não informado."
    );
  }

  if (!input.denunciaId?.trim()) {
    throw new Error(
      "Denúncia não informada."
    );
  }

  const tipoMime =
    normalizarTipoMime(
      input.tipoMime
    );

  validarArquivo({
    nomeArquivo:
      input.nomeArquivo,

    tipoMime,

    tamanho:
      input.tamanho,
  });

  const nomeOriginal =
    limparNomeArquivo(
      input.nomeArquivo
    );

  const chave = [
    "denuncias",
    input.clienteId.trim(),
    input.denunciaId.trim(),
    `${crypto.randomUUID()}-${nomeOriginal}`,
  ].join("/");

  /*
   * Não incluir Metadata ou ContentLength
   * na assinatura, pois o navegador teria
   * que enviar exatamente os mesmos headers.
   */
  const comando =
    new PutObjectCommand({
      Bucket: bucket,
      Key: chave,
      ContentType: tipoMime,
    });

  const uploadUrl =
    await getSignedUrl(
      storage,
      comando,
      {
        expiresIn: 10 * 60,
      }
    );

  return {
    chave,
    uploadUrl,
    nomeOriginal,
  };
}

export async function verificarArquivoNoBucket(
  chave: string
) {
  if (!chave?.trim()) {
    throw new Error(
      "Chave do arquivo não informada."
    );
  }

  return storage.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: chave.trim(),
    })
  );
}

export async function gerarUrlDownload(
  chave: string,
  nomeOriginal: string
): Promise<string> {
  if (!chave?.trim()) {
    throw new Error(
      "Chave do arquivo não informada."
    );
  }

  const nomeSeguro =
    limparNomeArquivo(
      nomeOriginal
    );

  const comando =
    new GetObjectCommand({
      Bucket: bucket,
      Key: chave.trim(),

      ResponseContentDisposition:
        `attachment; filename="${nomeSeguro}"`,
    });

  return getSignedUrl(
    storage,
    comando,
    {
      expiresIn: 15 * 60,
    }
  );
}

export async function excluirArquivoBucket(
  chave: string
) {
  if (!chave?.trim()) {
    throw new Error(
      "Chave do arquivo não informada."
    );
  }

  await storage.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: chave.trim(),
    })
  );
}