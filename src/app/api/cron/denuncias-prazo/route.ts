import RepositorioDenuncia from "@/src/backend/denuncia/RepositorioDenuncia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function autorizado(request: Request) {
  const segredo =
    process.env.DENUNCIAS_CRON_SECRET?.trim();

  if (!segredo) {
    return {
      ok: false,
      configurado: false,
    };
  }

  const authorization =
    request.headers.get("authorization");

  const headerSecret =
    request.headers.get("x-cron-secret");

  const ok =
    authorization === `Bearer ${segredo}` ||
    headerSecret === segredo;

  return {
    ok,
    configurado: true,
  };
}

async function processar(request: Request) {
  const acesso =
    autorizado(request);

  if (!acesso.configurado) {
    return Response.json(
      {
        erro:
          "DENUNCIAS_CRON_SECRET não configurado.",
      },
      {
        status: 500,
      }
    );
  }

  if (!acesso.ok) {
    return Response.json(
      {
        erro:
          "Não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const resultado =
      await RepositorioDenuncia
        .processarAlertasPrazoTratativaVencido();

    return Response.json({
      ok: true,
      ...resultado,
    });
  } catch (error) {
    console.error(
      "Erro ao processar alertas de prazo das denúncias:",
      error
    );

    return Response.json(
      {
        erro:
          "Não foi possível processar os alertas de prazo.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(
  request: Request
) {
  return processar(request);
}

export async function POST(
  request: Request
) {
  return processar(request);
}