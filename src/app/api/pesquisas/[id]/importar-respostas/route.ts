import {
  PerfilUsuario,
  Prisma,
  StatusPesquisaCliente,
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";
import {
  randomUUID,
} from "crypto";
import ExcelJS, { type CellValue } from "exceljs";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

const TAMANHO_MAXIMO_ARQUIVO =
  5 * 1024 * 1024;
const MAXIMO_RESPOSTAS_POR_ARQUIVO =
  2000;
const TAMANHO_LOTE =
  200;

const PERFIS_MUNDIAL =
  new Set<PerfilUsuario>([
    PerfilUsuario.ADMIN,
    PerfilUsuario.GESTOR,
    PerfilUsuario.PSICOLOGO,
    PerfilUsuario.ASSISTENTE_SOCIAL,
    PerfilUsuario.RECEPCAO,
  ]);

type PerguntaImportacao = {
  id: string;
  titulo: string;
  tipo: TipoPergunta;
  ordem: number;
  obrigatoria: boolean;
  opcoes: string[];
};

type RespostaImportada = {
  setor: string | null;
  unidade: string | null;
  respostas: {
    id: string;
    perguntaId: string;
    valor: string;
  }[];
};

function textoSeguro(
  valor: unknown
) {
  return String(
    valor ??
      ""
  ).trim();
}

function normalizarTexto(
  valor: string
) {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLocaleLowerCase(
      "pt-BR"
    );
}

function valorCelula(
  valor: CellValue
): string {
  if (
    valor ===
      null ||
    valor ===
      undefined
  ) {
    return "";
  }

  if (
    typeof valor ===
      "string" ||
    typeof valor ===
      "number" ||
    typeof valor ===
      "boolean"
  ) {
    return String(
      valor
    ).trim();
  }

  if (
    valor instanceof Date
  ) {
    return valor
      .toISOString()
      .slice(
        0,
        10
      );
  }

  if (
    typeof valor ===
    "object"
  ) {
    if (
      "text" in valor
    ) {
      return textoSeguro(
        valor.text
      );
    }

    if (
      "result" in valor
    ) {
      return valorCelula(
        valor.result as CellValue
      );
    }

    if (
      "richText" in valor &&
      Array.isArray(
        valor.richText
      )
    ) {
      return valor.richText
        .map(item =>
          textoSeguro(
            item.text
          )
        )
        .join("")
        .trim();
    }
  }

  return textoSeguro(
    valor
  );
}

function normalizarPerguntas(
  valor: unknown
): PerguntaImportacao[] {
  if (
    !Array.isArray(
      valor
    )
  ) {
    return [];
  }

  return valor
    .map(
      (
        item,
        index
      ): PerguntaImportacao | null => {
        if (
          !item ||
          typeof item !==
            "object" ||
          Array.isArray(
            item
          )
        ) {
          return null;
        }

        const dados =
          item as Record<
            string,
            unknown
          >;

        const tipo =
          Object.values(
            TipoPergunta
          ).includes(
            dados.tipo as TipoPergunta
          )
            ? (
                dados.tipo as TipoPergunta
              )
            : TipoPergunta.NOTA;

        return {
          id:
            textoSeguro(
              dados.id
            ) ||
            `pergunta-${
              index + 1
            }`,
          titulo:
            textoSeguro(
              dados.titulo
            ) ||
            `Pergunta ${
              index + 1
            }`,
          tipo,
          ordem:
            Number(
              dados.ordem
            ) ||
            index + 1,
          obrigatoria:
            dados.obrigatoria !==
            false,
          opcoes:
            Array.isArray(
              dados.opcoes
            )
              ? dados.opcoes
                  .map(opcao =>
                    textoSeguro(
                      opcao
                    )
                  )
                  .filter(
                    Boolean
                  )
              : [],
        };
      }
    )
    .filter(
      (
        item
      ): item is PerguntaImportacao =>
        Boolean(
          item
        )
    )
    .sort(
      (
        a,
        b
      ) =>
        a.ordem -
        b.ordem
    );
}

function normalizarSetores(
  valor: unknown
): string[] {
  if (
    !Array.isArray(
      valor
    )
  ) {
    return [];
  }

  return valor
    .map(item =>
      textoSeguro(
        item
      )
    )
    .filter(
      Boolean
    );
}

function validarSetor(
  setor: string,
  setores: string[]
) {
  if (
    !setor ||
    setores.length ===
      0
  ) {
    return;
  }

  const mapa =
    new Map(
      setores.map(
        item => [
          normalizarTexto(
            item
          ),
          item,
        ]
      )
    );

  const encontrado =
    mapa.get(
      normalizarTexto(
        setor
      )
    );

  if (
    !encontrado
  ) {
    throw new Error(
      `Setor "${setor}" não está cadastrado para esta organização.`
    );
  }

  return encontrado;
}

function validarValorPergunta(
  pergunta: PerguntaImportacao,
  valorRecebido: string,
  escalaMinima: number,
  escalaMaxima: number,
  numeroLinha: number
) {
  const valor =
    valorRecebido.trim();

  if (
    !valor
  ) {
    if (
      pergunta.obrigatoria
    ) {
      throw new Error(
        `Linha ${numeroLinha}: a pergunta P${pergunta.ordem} — "${pergunta.titulo}" é obrigatória.`
      );
    }

    return null;
  }

  if (
    pergunta.tipo ===
    TipoPergunta.NOTA
  ) {
    const nota =
      Number(
        valor.replace(
          ",",
          "."
        )
      );

    if (
      !Number.isFinite(
        nota
      ) ||
      nota <
        escalaMinima ||
      nota >
        escalaMaxima
    ) {
      throw new Error(
        `Linha ${numeroLinha}: P${pergunta.ordem} deve possuir nota entre ${escalaMinima} e ${escalaMaxima}.`
      );
    }

    return String(
      nota
    );
  }

  if (
    pergunta.tipo ===
    TipoPergunta.SIM_NAO
  ) {
    const normalizado =
      normalizarTexto(
        valor
      );

    if (
      normalizado ===
      "sim"
    ) {
      return "Sim";
    }

    if (
      normalizado ===
        "nao" ||
      normalizado ===
        "não"
    ) {
      return "Não";
    }

    throw new Error(
      `Linha ${numeroLinha}: P${pergunta.ordem} aceita apenas "Sim" ou "Não".`
    );
  }

  if (
    pergunta.tipo ===
      TipoPergunta.MULTIPLA_ESCOLHA &&
    pergunta.opcoes.length >
      0
  ) {
    const opcao =
      pergunta.opcoes.find(
        item =>
          normalizarTexto(
            item
          ) ===
          normalizarTexto(
            valor
          )
      );

    if (
      !opcao
    ) {
      throw new Error(
        `Linha ${numeroLinha}: P${pergunta.ordem} possui uma alternativa inválida.`
      );
    }

    return opcao;
  }

  return valor;
}

async function autorizarMundial() {
  const session =
    await auth();

  const usuario =
    session?.user as
      | {
          id?: string;
          perfil?: PerfilUsuario;
        }
      | undefined;

  return Boolean(
    usuario?.id &&
      usuario.perfil &&
      PERFIS_MUNDIAL.has(
        usuario.perfil
      )
  );
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  if (
    !(await autorizarMundial())
  ) {
    return Response.json(
      {
        mensagem:
          "Acesso não autorizado.",
      },
      {
        status: 403,
      }
    );
  }

  const { id } =
    await params;

  const pesquisa =
    await prisma.pesquisaCliente.findFirst({
      where: {
        id,
        tipo:
          TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
      },
      select: {
        id: true,
        tipo: true,
        status: true,
        perguntas: true,
        configuracaoAnalise: true,
        cliente: {
          select: {
            setores: true,
          },
        },
      },
    });

  if (
    !pesquisa
  ) {
    return Response.json(
      {
        mensagem:
          "Aplicação de Gestão de Riscos Psicossociais não encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    pesquisa.status !==
    StatusPesquisaCliente.ABERTA
  ) {
    return Response.json(
      {
        mensagem:
          "A aplicação precisa estar aberta para receber respostas importadas.",
      },
      {
        status: 409,
      }
    );
  }

  const formulario =
    await request.formData();

  const arquivo =
    formulario.get(
      "arquivo"
    );

  if (
    !arquivo ||
    typeof arquivo ===
      "string"
  ) {
    return Response.json(
      {
        mensagem:
          "Selecione uma planilha .xlsx.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !arquivo.name
      .toLocaleLowerCase()
      .endsWith(
        ".xlsx"
      )
  ) {
    return Response.json(
      {
        mensagem:
          "O arquivo deve estar no formato .xlsx.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    arquivo.size >
    TAMANHO_MAXIMO_ARQUIVO
  ) {
    return Response.json(
      {
        mensagem:
          "A planilha excede o limite de 5 MB.",
      },
      {
        status: 413,
      }
    );
  }

  const workbook =
    new ExcelJS.Workbook();

  try {
    const arrayBuffer =
      await arquivo.arrayBuffer();

    await workbook.xlsx.load(
      arrayBuffer
    );
  } catch {
    return Response.json(
      {
        mensagem:
          "Não foi possível ler a planilha. Baixe um novo modelo Excel desta aplicação e tente novamente.",
      },
      {
        status: 400,
      }
    );
  }

  const metadados =
    workbook.getWorksheet(
      "Metadados"
    );

  const pesquisaIdModelo =
    metadados
      ? valorCelula(
          metadados.getCell(
            "B1"
          ).value
        )
      : "";

  const tipoModelo =
    metadados
      ? valorCelula(
          metadados.getCell(
            "B2"
          ).value
        )
      : "";

  if (
    pesquisaIdModelo !==
      pesquisa.id ||
    tipoModelo !==
      TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
  ) {
    return Response.json(
      {
        mensagem:
          "Esta planilha não pertence a esta aplicação. Baixe o modelo Excel diretamente desta página.",
      },
      {
        status: 400,
      }
    );
  }

  const planilha =
    workbook.getWorksheet(
      "Respostas"
    );

  if (
    !planilha
  ) {
    return Response.json(
      {
        mensagem:
          'A aba "Respostas" não foi encontrada.',
      },
      {
        status: 400,
      }
    );
  }

  const perguntas =
    normalizarPerguntas(
      pesquisa.perguntas
    );

  if (
    perguntas.length ===
    0
  ) {
    return Response.json(
      {
        mensagem:
          "A aplicação não possui perguntas.",
      },
      {
        status: 400,
      }
    );
  }

  const configuracao =
    pesquisa.configuracaoAnalise &&
    typeof pesquisa.configuracaoAnalise ===
      "object" &&
    !Array.isArray(
      pesquisa.configuracaoAnalise
    )
      ? (
          pesquisa.configuracaoAnalise as Record<
            string,
            unknown
          >
        )
      : {};

  const escalaMinima =
    Number(
      configuracao.escalaMinima ??
        1
    ) || 1;

  const escalaMaxima =
    Number(
      configuracao.escalaMaxima ??
        5
    ) || 5;

  const setores =
    normalizarSetores(
      pesquisa.cliente.setores
    );

  if (
    planilha.rowCount <
    3
  ) {
    return Response.json(
      {
        mensagem:
          "A planilha não possui linhas de respostas.",
      },
      {
        status: 400,
      }
    );
  }

  const cabecalho =
    perguntas.map(
      (
        _,
        index
      ) =>
        valorCelula(
          planilha.getCell(
            1,
            index + 3
          ).value
        )
    );

  const cabecalhoValido =
    cabecalho.every(
      (
        valor,
        index
      ) =>
        valor ===
        `P${index + 1}`
    );

  if (
    !cabecalhoValido
  ) {
    return Response.json(
      {
        mensagem:
          "Os cabeçalhos da planilha foram alterados. Baixe um novo modelo e mantenha as colunas P1, P2, P3...",
      },
      {
        status: 400,
      }
    );
  }

  let ultimaLinhaComConteudo =
    2;

  for (
    let numeroLinha = 3;
    numeroLinha <=
      planilha.rowCount;
    numeroLinha++
  ) {
    const valoresLinha = [
      valorCelula(
        planilha.getCell(
          numeroLinha,
          1
        ).value
      ),
      valorCelula(
        planilha.getCell(
          numeroLinha,
          2
        ).value
      ),
      ...perguntas.map(
        (
          _,
          index
        ) =>
          valorCelula(
            planilha.getCell(
              numeroLinha,
              index + 3
            ).value
          )
      ),
    ];

    if (
      valoresLinha.some(
        valor =>
          Boolean(
            valor
          )
      )
    ) {
      ultimaLinhaComConteudo =
        numeroLinha;
    }
  }

  if (
    ultimaLinhaComConteudo <
    3
  ) {
    return Response.json(
      {
        mensagem:
          "Nenhuma resposta preenchida foi encontrada na planilha.",
      },
      {
        status: 400,
      }
    );
  }

  const respostasImportadas:
    RespostaImportada[] =
      [];

  let linhasEmBrancoIgnoradas =
    0;

  for (
    let numeroLinha = 3;
    numeroLinha <=
      ultimaLinhaComConteudo;
    numeroLinha++
  ) {
    const setorBruto =
      valorCelula(
        planilha.getCell(
          numeroLinha,
          1
        ).value
      );

    const unidade =
      valorCelula(
        planilha.getCell(
          numeroLinha,
          2
        ).value
      );

    const valoresPerguntas =
      perguntas.map(
        (
          _,
          index
        ) =>
          valorCelula(
            planilha.getCell(
              numeroLinha,
              index + 3
            ).value
          )
      );

    const linhaVazia =
      !setorBruto &&
      !unidade &&
      valoresPerguntas.every(
        valor =>
          !valor
      );

    if (
      linhaVazia
    ) {
      linhasEmBrancoIgnoradas++;
      continue;
    }

    if (
      respostasImportadas.length >=
      MAXIMO_RESPOSTAS_POR_ARQUIVO
    ) {
      return Response.json(
        {
          mensagem:
            `O limite é de ${MAXIMO_RESPOSTAS_POR_ARQUIVO} respostas por importação.`,
        },
        {
          status: 400,
        }
      );
    }

    let setor:
      string | null =
        null;

    try {
      setor =
        setorBruto
          ? validarSetor(
              setorBruto,
              setores
            ) ||
            setorBruto
          : null;
    } catch (
      error
    ) {
      return Response.json(
        {
          mensagem:
            error instanceof Error
              ? `Linha ${numeroLinha}: ${error.message}`
              : `Linha ${numeroLinha}: setor inválido.`,
        },
        {
          status: 400,
        }
      );
    }

    const respostas:
      RespostaImportada["respostas"] =
        [];

    try {
      perguntas.forEach(
        (
          pergunta,
          index
        ) => {
          const valor =
            validarValorPergunta(
              pergunta,
              valoresPerguntas[
                index
              ],
              escalaMinima,
              escalaMaxima,
              numeroLinha
            );

          if (
            valor ===
            null
          ) {
            return;
          }

          respostas.push({
            id:
              randomUUID(),
            perguntaId:
              pergunta.id,
            valor,
          });
        }
      );
    } catch (
      error
    ) {
      return Response.json(
        {
          mensagem:
            error instanceof Error
              ? error.message
              : `Linha ${numeroLinha}: resposta inválida.`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      respostas.length ===
      0
    ) {
      return Response.json(
        {
          mensagem:
            `Linha ${numeroLinha}: nenhuma resposta foi preenchida.`,
        },
        {
          status: 400,
        }
      );
    }

    respostasImportadas.push({
      setor,
      unidade:
        unidade ||
        null,
      respostas,
    });
  }

  if (
    respostasImportadas.length ===
    0
  ) {
    return Response.json(
      {
        mensagem:
          "Nenhuma resposta preenchida foi encontrada na planilha.",
      },
      {
        status: 400,
      }
    );
  }

  const dados:
    Prisma.RespostaPesquisaCreateManyInput[] =
      respostasImportadas.map(
        item => ({
          pesquisaId:
            pesquisa.id,
          nome:
            null,
          email:
            null,
          setor:
            item.setor,
          cargo:
            null,
          unidade:
            item.unidade,
          funcionarioId:
            null,
          nomeGestor:
            null,
          dataAvaliacao:
            null,
          dataAdmissao:
            null,
          respostas:
            item.respostas as unknown as Prisma.InputJsonValue,
        })
      );

  try {
    await prisma.$transaction(
      async tx => {
        for (
          let inicio = 0;
          inicio <
          dados.length;
          inicio +=
          TAMANHO_LOTE
        ) {
          await tx.respostaPesquisa.createMany({
            data:
              dados.slice(
                inicio,
                inicio +
                  TAMANHO_LOTE
              ),
          });
        }
      }
    );
  } catch {
    return Response.json(
      {
        mensagem:
          "A planilha foi validada, mas não foi possível gravar as respostas. Nenhuma linha foi importada.",
      },
      {
        status: 500,
      }
    );
  }

  return Response.json({
    sucesso: true,
    importadas:
      respostasImportadas.length,
    linhasEmBrancoIgnoradas,
  });
}
