"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Props = {
  link: string;
  titulo?: string;
  descricao?: string;
};

export default function QrCodePublico({
  link,
  titulo = "QR Code da pesquisa",
  descricao = "Aponte a câmera do celular para acessar o questionário.",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!link || !canvasRef.current) return;

    setErro(null);

    void QRCode.toCanvas(canvasRef.current, link, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
    }).catch((error) => {
      console.error("Erro ao gerar QR Code:", error);
      setErro("Não foi possível gerar o QR Code.");
    });
  }, [link]);

  function abrirTelaCheia() {
    const canvas =
      canvasRef.current;


    if (
      !canvas
    ) {
      return;
    }


    const imagem =
      canvas.toDataURL(
        "image/png"
      );


    const novaJanela =
      window.open(
        "",
        "_blank"
      );


    if (
      !novaJanela
    ) {
      alert(
        "O navegador bloqueou a abertura da tela. Libere pop-ups para este site."
      );

      return;
    }


    novaJanela.opener =
      null;


    novaJanela.document.open();


    novaJanela.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>${escaparHtml(
            titulo
          )}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              min-height: 100%;
              background: #020617;
              font-family: Arial, Helvetica, sans-serif;
            }

            body {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 32px;
            }

            .card {
              width: min(760px, 100%);
              background: #ffffff;
              border-radius: 32px;
              padding: 40px;
              text-align: center;
              box-shadow: 0 30px 90px rgba(0, 0, 0, 0.28);
            }

            .marca {
              margin-bottom: 12px;
              color: #2563eb;
              font-size: 13px;
              font-weight: 800;
              letter-spacing: 3px;
              text-transform: uppercase;
            }

            h1 {
              margin: 0;
              color: #0f172a;
              font-size: clamp(28px, 5vw, 48px);
              line-height: 1.1;
            }

            p {
              margin: 14px auto 0;
              max-width: 620px;
              color: #64748b;
              font-size: clamp(16px, 2.2vw, 22px);
              line-height: 1.5;
            }

            img {
              display: block;
              width: min(520px, 84vw);
              height: auto;
              margin: 32px auto 0;
              image-rendering: pixelated;
            }

            .instrucao {
              margin-top: 24px;
              color: #0f172a;
              font-size: 18px;
              font-weight: 700;
            }

            .link {
              margin-top: 18px;
              color: #94a3b8;
              font-size: 13px;
              overflow-wrap: anywhere;
            }
          </style>
        </head>

        <body>
          <main class="card">
            <div class="marca">
              Mundial Connect
            </div>

            <h1>
              ${escaparHtml(
                titulo
              )}
            </h1>

            <p>
              ${escaparHtml(
                descricao
              )}
            </p>

            <img
              src="${imagem}"
              alt="QR Code da pesquisa"
            />

            <div class="instrucao">
              Aponte a câmera do celular para o QR Code
            </div>

            <div class="link">
              ${escaparHtml(
                link
              )}
            </div>
          </main>
        </body>
      </html>
    `);


    novaJanela.document.close();
  }

  function baixarQrCode() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const linkDownload = document.createElement("a");
    linkDownload.download = "qr-code-pesquisa.png";
    linkDownload.href = canvas.toDataURL("image/png");
    linkDownload.click();
  }

  if (!link) return null;

  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Acesso coletivo
        </p>

        <h3 className="mt-1 text-lg font-black text-slate-900">
          {titulo}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {descricao}
        </p>
      </div>

      <div className="mt-5 flex flex-col items-center">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <canvas ref={canvasRef} className="h-auto max-w-full" />
        </div>

        {erro && (
          <p className="mt-3 text-sm font-bold text-red-600">
            {erro}
          </p>
        )}

        <div className="mt-5 flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={abrirTelaCheia}
            className="min-h-12 flex-1 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Exibir no telão
          </button>

          <button
            type="button"
            onClick={baixarQrCode}
            className="min-h-12 flex-1 rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Baixar QR Code
          </button>
        </div>
      </div>
    </section>
  );
}

function escaparHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
