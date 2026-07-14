import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

import {
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function obterVariavel(nome) {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    throw new Error(`Variável ${nome} não configurada.`);
  }

  return valor;
}

const storage = new S3Client({
  endpoint: obterVariavel("STORAGE_ENDPOINT"),
  region: process.env.STORAGE_REGION?.trim() || "auto",

  credentials: {
    accessKeyId: obterVariavel("STORAGE_ACCESS_KEY_ID"),
    secretAccessKey: obterVariavel("STORAGE_SECRET_ACCESS_KEY"),
  },

  forcePathStyle: false,

  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const bucket = obterVariavel("STORAGE_BUCKET");

async function executar() {
  await storage.send(
    new PutBucketCorsCommand({
      Bucket: bucket,

      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [
              "http://localhost:3000",
              "http://localhost:3001",

              // Substitua pelo endereço real da Vercel.
              "https://seu-projeto.vercel.app",

              // Caso possua domínio próprio:
              // "https://sistema.mundialrh.com.br",
            ],

            AllowedMethods: ["GET", "PUT", "HEAD"],

            AllowedHeaders: [
              "*",
            ],

            ExposeHeaders: [
              "ETag",
              "Content-Length",
              "Content-Type",
            ],

            MaxAgeSeconds: 3600,
          },
        ],
      },
    })
  );

  console.log("CORS configurado com sucesso.");
}

executar().catch((error) => {
  console.error("Não foi possível configurar o CORS:");
  console.error(error);
  process.exit(1);
});