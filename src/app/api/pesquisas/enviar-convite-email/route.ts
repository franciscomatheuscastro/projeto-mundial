import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  auth,
} from "@/src/auth";

import {
  enviarEmailConvitePesquisa,
} from "@/src/lib/email";


export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";


type Body = {
  email?: unknown;

  nome?: unknown;

  link?: unknown;

  tituloPesquisa?: unknown;

  tituloModulo?: unknown;

  descricaoPesquisa?: unknown;

  organizacao?: unknown;
};


function texto(
  valor: unknown,
  limite: number
) {
  if (
    typeof valor !==
    "string"
  ) {
    return "";
  }


  return valor
    .trim()
    .slice(
      0,
      limite
    );
}


function emailValido(
  valor: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    valor
  );
}


function extrairTokenPesquisa(
  link: string
) {
  try {
    const url =
      new URL(
        link
      );


    const partes =
      url.pathname
        .split(
          "/"
        )
        .filter(
          Boolean
        );


    if (
      partes.length !==
        2 ||
      partes[0] !==
        "pesquisa"
    ) {
      return null;
    }


    const token =
      decodeURIComponent(
        partes[1]
      ).trim();


    if (
      !token ||
      token.length >
        300
    ) {
      return null;
    }


    return token;
  } catch {
    return null;
  }
}


export async function POST(
  request: NextRequest
) {
  try {
    const session =
      await auth();


    if (
      !session?.user
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário não autenticado.",
        },
        {
          status:
            401,
        }
      );
    }


    const body =
      (await request.json()) as Body;


    const email =
      texto(
        body.email,
        254
      ).toLowerCase();


    const nome =
      texto(
        body.nome,
        160
      );


    const link =
      texto(
        body.link,
        1000
      );


    const tituloPesquisa =
      texto(
        body.tituloPesquisa,
        250
      );


    const tituloModulo =
      texto(
        body.tituloModulo,
        160
      );


    const descricaoPesquisa =
      texto(
        body.descricaoPesquisa,
        1200
      );


    const organizacao =
      texto(
        body.organizacao,
        250
      );


    if (
      !email ||
      !emailValido(
        email
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um e-mail válido.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      !tituloPesquisa ||
      !tituloModulo
    ) {
      return NextResponse.json(
        {
          error:
            "Dados da pesquisa incompletos.",
        },
        {
          status:
            400,
        }
      );
    }


    const token =
      extrairTokenPesquisa(
        link
      );


    if (
      !token
    ) {
      return NextResponse.json(
        {
          error:
            "Link individual inválido.",
        },
        {
          status:
            400,
        }
      );
    }


    await enviarEmailConvitePesquisa({
      email,

      nome:
        nome ||
        null,

      tituloPesquisa,

      tituloModulo,

      descricaoPesquisa:
        descricaoPesquisa ||
        null,

      organizacao:
        organizacao ||
        null,

      token,
    });


    return NextResponse.json({
      ok:
        true,
    });
  } catch (
    error
  ) {
    console.error(
      "Erro ao enviar convite de pesquisa por e-mail:",
      error
    );


    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Não foi possível enviar o convite por e-mail.",
      },
      {
        status:
          500,
      }
    );
  }
}
