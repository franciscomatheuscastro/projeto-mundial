import nodemailer from "nodemailer";

type EnviarEmailAcessoInput = {
  nome: string;
  email: string;
  senhaTemporaria: string;
  tipoAcesso:
    | "CLIENTE"
    | "COLABORADOR";
};

type EnviarEmailNovoColaboradorInput = {
  nome: string;
  email: string;
  senhaTemporaria: string;
};

type EnviarEmailNovoClienteInput = {
  nome: string;
  email: string;
  senhaTemporaria: string;
};

const SMTP_HOST =
  process.env.SMTP_HOST?.trim() ||
  "smtp.hostinger.com";

const SMTP_PORT = Number(
  process.env.SMTP_PORT || "465"
);

const SMTP_USER =
  process.env.SMTP_USER?.trim();

const SMTP_PASSWORD =
  process.env.SMTP_PASSWORD;

const SMTP_FROM =
  process.env.SMTP_FROM?.trim() ||
  SMTP_USER;

const SMTP_FROM_NAME =
  process.env.SMTP_FROM_NAME?.trim() ||
  "Mundial Connect";

const APP_URL =
  process.env.APP_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "http://localhost:3000";

function validarConfiguracaoEmail() {
  if (!SMTP_USER) {
    throw new Error(
      "A variável SMTP_USER não foi configurada."
    );
  }

  if (!SMTP_PASSWORD) {
    throw new Error(
      "A variável SMTP_PASSWORD não foi configurada."
    );
  }

  if (!SMTP_FROM) {
    throw new Error(
      "A variável SMTP_FROM não foi configurada."
    );
  }

  if (
    !Number.isInteger(SMTP_PORT) ||
    SMTP_PORT <= 0
  ) {
    throw new Error(
      "A variável SMTP_PORT é inválida."
    );
  }
}

function escaparHtml(
  valor: string
): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function obterUrlLogin() {
  return new URL(
    "/login",
    APP_URL
  ).toString();
}

const transporter =
  nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,

    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

export async function verificarConexaoEmail(): Promise<void> {
  validarConfiguracaoEmail();

  await transporter.verify();
}

async function enviarEmailAcesso({
  nome,
  email,
  senhaTemporaria,
  tipoAcesso,
}: EnviarEmailAcessoInput): Promise<void> {
  validarConfiguracaoEmail();

  const nomeSeguro =
    escaparHtml(nome);

  const emailSeguro =
    escaparHtml(email);

  const senhaSegura =
    escaparHtml(senhaTemporaria);

  const urlLogin =
    obterUrlLogin();

  const descricaoAcesso =
    tipoAcesso === "CLIENTE"
      ? "Seu acesso de administrador da empresa foi criado na Mundial Connect."
      : "Você foi cadastrado como integrante do comitê de denúncias na Mundial Connect.";

  await transporter.sendMail({
    from: {
      name: SMTP_FROM_NAME,
      address: SMTP_FROM!,
    },

    to: {
      name: nome,
      address: email,
    },

    subject:
      "Seu acesso à Mundial Connect foi criado",

    text: [
      `Olá, ${nome}.`,
      "",
      descricaoAcesso,
      "",
      `E-mail: ${email}`,
      `Senha inicial: ${senhaTemporaria}`,
      `Acesso: ${urlLogin}`,
      "",
      "Por segurança, recomendamos alterar a senha após o primeiro acesso.",
      "",
      "Mundial Connect",
    ].join("\n"),

    html: `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#f1f5f9;
            font-family:Arial,Helvetica,sans-serif;
            color:#0f172a;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="background:#f1f5f9;padding:32px 16px;"
          >
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  style="
                    max-width:600px;
                    background:#ffffff;
                    border:1px solid #e2e8f0;
                    border-radius:20px;
                    overflow:hidden;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:24px 28px;
                        background:#0f3fce;
                        color:#ffffff;
                      "
                    >
                      <p
                        style="
                          margin:0;
                          font-size:12px;
                          font-weight:700;
                          letter-spacing:2px;
                          text-transform:uppercase;
                        "
                      >
                        Mundial Connect
                      </p>

                      <h1
                        style="
                          margin:8px 0 0;
                          font-size:24px;
                          line-height:1.3;
                        "
                      >
                        Seu acesso foi criado
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:28px;">
                      <p
                        style="
                          margin:0 0 16px;
                          font-size:16px;
                          line-height:1.6;
                        "
                      >
                        Olá, <strong>${nomeSeguro}</strong>.
                      </p>

                      <p
                        style="
                          margin:0 0 20px;
                          color:#475569;
                          font-size:15px;
                          line-height:1.6;
                        "
                      >
                        ${escaparHtml(descricaoAcesso)}
                      </p>

                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        style="
                          margin:0 0 24px;
                          background:#f8fafc;
                          border:1px solid #e2e8f0;
                          border-radius:14px;
                        "
                      >
                        <tr>
                          <td style="padding:18px;">
                            <p
                              style="
                                margin:0 0 8px;
                                color:#64748b;
                                font-size:12px;
                                font-weight:700;
                                text-transform:uppercase;
                              "
                            >
                              E-mail
                            </p>

                            <p
                              style="
                                margin:0 0 18px;
                                font-size:15px;
                                font-weight:700;
                              "
                            >
                              ${emailSeguro}
                            </p>

                            <p
                              style="
                                margin:0 0 8px;
                                color:#64748b;
                                font-size:12px;
                                font-weight:700;
                                text-transform:uppercase;
                              "
                            >
                              Senha inicial
                            </p>

                            <p
                              style="
                                margin:0;
                                font-family:Consolas,monospace;
                                font-size:16px;
                                font-weight:700;
                              "
                            >
                              ${senhaSegura}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 24px;">
                        <a
                          href="${urlLogin}"
                          style="
                            display:inline-block;
                            padding:13px 22px;
                            border-radius:12px;
                            background:#2563eb;
                            color:#ffffff;
                            font-size:14px;
                            font-weight:700;
                            text-decoration:none;
                          "
                        >
                          Acessar Mundial Connect
                        </a>
                      </p>

                      <p
                        style="
                          margin:0;
                          color:#64748b;
                          font-size:13px;
                          line-height:1.6;
                        "
                      >
                        Por segurança, recomendamos alterar a
                        senha após o primeiro acesso e não
                        compartilhar suas credenciais.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function enviarEmailNovoColaborador({
  nome,
  email,
  senhaTemporaria,
}: EnviarEmailNovoColaboradorInput): Promise<void> {
  return enviarEmailAcesso({
    nome,
    email,
    senhaTemporaria,
    tipoAcesso: "COLABORADOR",
  });
}

export async function enviarEmailNovoCliente({
  nome,
  email,
  senhaTemporaria,
}: EnviarEmailNovoClienteInput): Promise<void> {
  return enviarEmailAcesso({
    nome,
    email,
    senhaTemporaria,
    tipoAcesso: "CLIENTE",
  });
}
