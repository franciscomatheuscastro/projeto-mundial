import "server-only";

import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import {
  prisma,
} from "@/src/lib/prisma";


const DURACAO_TOKEN_MS =
  30 *
  60 *
  1000;


type PayloadTokenRedefinicao = {
  sub: string;
  exp: number;
};


type CriarTokenRedefinicaoSenhaInput = {
  usuarioId: string;
  senhaHash: string;
};


function obterSegredoRedefinicaoSenha() {
  const segredo =
    process.env.PASSWORD_RESET_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();


  if (
    !segredo
  ) {
    throw new Error(
      "Configure PASSWORD_RESET_SECRET, AUTH_SECRET ou NEXTAUTH_SECRET para habilitar a redefinição de senha."
    );
  }


  return segredo;
}


function assinarPayload(
  payload: string,
  senhaHash: string
) {
  const segredo =
    obterSegredoRedefinicaoSenha();


  /*
   * O hash atual da senha faz parte da chave.
   * Assim que a senha é alterada, qualquer token
   * emitido anteriormente deixa de ser válido.
   */
  return createHmac(
    "sha256",
    `${segredo}:${senhaHash}`
  )
    .update(
      payload
    )
    .digest(
      "base64url"
    );
}


export function criarTokenRedefinicaoSenha({
  usuarioId,
  senhaHash,
}: CriarTokenRedefinicaoSenhaInput) {
  const payload: PayloadTokenRedefinicao = {
    sub:
      usuarioId,

    exp:
      Date.now() +
      DURACAO_TOKEN_MS,
  };


  const payloadCodificado =
    Buffer.from(
      JSON.stringify(
        payload
      ),
      "utf8"
    ).toString(
      "base64url"
    );


  const assinatura =
    assinarPayload(
      payloadCodificado,
      senhaHash
    );


  return `${payloadCodificado}.${assinatura}`;
}


export async function validarTokenRedefinicaoSenha(
  token?: string | null
) {
  const tokenLimpo =
    token?.trim();


  if (
    !tokenLimpo
  ) {
    return null;
  }


  const partes =
    tokenLimpo.split(
      "."
    );


  if (
    partes.length !==
    2
  ) {
    return null;
  }


  const [
    payloadCodificado,
    assinaturaRecebida,
  ] =
    partes;


  let payload:
    | PayloadTokenRedefinicao
    | null = null;


  try {
    payload =
      JSON.parse(
        Buffer.from(
          payloadCodificado,
          "base64url"
        ).toString(
          "utf8"
        )
      ) as PayloadTokenRedefinicao;
  } catch {
    return null;
  }


  if (
    !payload?.sub ||
    !Number.isFinite(
      payload.exp
    ) ||
    payload.exp <
      Date.now()
  ) {
    return null;
  }


  const usuario =
    await prisma.usuario.findUnique({
      where: {
        id:
          payload.sub,
      },

      select: {
        id:
          true,

        nome:
          true,

        email:
          true,

        senha:
          true,

        ativo:
          true,
      },
    });


  if (
    !usuario ||
    !usuario.ativo
  ) {
    return null;
  }


  const assinaturaEsperada =
    assinarPayload(
      payloadCodificado,
      usuario.senha
    );


  const recebido =
    Buffer.from(
      assinaturaRecebida,
      "utf8"
    );

  const esperado =
    Buffer.from(
      assinaturaEsperada,
      "utf8"
    );


  if (
    recebido.length !==
    esperado.length
  ) {
    return null;
  }


  if (
    !timingSafeEqual(
      recebido,
      esperado
    )
  ) {
    return null;
  }


  return {
    id:
      usuario.id,

    nome:
      usuario.nome,

    email:
      usuario.email,
  };
}
