import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function obterVariavel(nome: string) {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    throw new Error(`Variável ${nome} não configurada.`);
  }

  return valor;
}

const bucket = obterVariavel("STORAGE_BUCKET");
const endpoint = obterVariavel("STORAGE_ENDPOINT");

const storage = new S3Client({
  endpoint,
  region: process.env.STORAGE_REGION?.trim() || "auto",

  credentials: {
    accessKeyId: obterVariavel("STORAGE_ACCESS_KEY_ID"),
    secretAccessKey: obterVariavel("STORAGE_SECRET_ACCESS_KEY"),
  },

  forcePathStyle: false,
});

export type PrepararUploadInput = {
  clienteId: string;
  denunciaId: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanho: number;
};

const TAMANHO_MAXIMO = 10 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function limparNomeArquivo(nome: string) {
  const nomeSemCaminho =
    nome.split(/[\\/]/).pop()?.trim() || "arquivo";

  return nomeSemCaminho
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function validarArquivo(dados: {
  nomeArquivo: string;
  tipoMime: string;
  tamanho: number;
}) {
  if (!dados.nomeArquivo?.trim()) {
    throw new Error("Nome do arquivo inválido.");
  }

  if (!dados.tipoMime?.trim()) {
    throw new Error("Tipo do arquivo não identificado.");
  }

  if (!Number.isFinite(dados.tamanho) || dados.tamanho <= 0) {
    throw new Error("Tamanho do arquivo inválido.");
  }

  if (dados.tamanho > TAMANHO_MAXIMO) {
    throw new Error("Cada arquivo pode ter no máximo 10 MB.");
  }

  if (!TIPOS_PERMITIDOS.includes(dados.tipoMime)) {
    throw new Error(
      "Formato não permitido. Envie PDF, JPG, PNG, WEBP, DOC ou DOCX."
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
  validarArquivo(input);

  const nomeOriginal = limparNomeArquivo(input.nomeArquivo);

  const chave = [
    "denuncias",
    input.clienteId,
    input.denunciaId,
    `${crypto.randomUUID()}-${nomeOriginal}`,
  ].join("/");

  /*
   * Não adicione Metadata nem ContentLength aqui.
   *
   * Quando esses campos entram na assinatura, o navegador precisa
   * enviar exatamente os mesmos cabeçalhos no PUT.
   */
  const comando = new PutObjectCommand({
    Bucket: bucket,
    Key: chave,
    ContentType: input.tipoMime,
  });

  const uploadUrl = await getSignedUrl(storage, comando, {
    expiresIn: 10 * 60,
  });

  return {
    chave,
    uploadUrl,
    nomeOriginal,
  };
}

export async function verificarArquivoNoBucket(chave: string) {
  if (!chave?.trim()) {
    throw new Error("Chave do arquivo não informada.");
  }

  return storage.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: chave,
    })
  );
}

export async function gerarUrlDownload(
  chave: string,
  nomeOriginal: string
): Promise<string> {
  if (!chave?.trim()) {
    throw new Error("Chave do arquivo não informada.");
  }

  const nomeSeguro = limparNomeArquivo(nomeOriginal);

  const comando = new GetObjectCommand({
    Bucket: bucket,
    Key: chave,
    ResponseContentDisposition: `attachment; filename="${nomeSeguro}"`,
  });

  return getSignedUrl(storage, comando, {
    expiresIn: 15 * 60,
  });
}

export async function excluirArquivoBucket(chave: string) {
  if (!chave?.trim()) {
    throw new Error("Chave do arquivo não informada.");
  }

  await storage.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: chave,
    })
  );
}