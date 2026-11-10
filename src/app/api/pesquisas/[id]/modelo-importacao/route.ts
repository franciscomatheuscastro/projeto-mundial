import {
  PerfilUsuario,
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";
import ExcelJS from "exceljs";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

const PERFIS_MUNDIAL = new Set<PerfilUsuario>([
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
  peso: number;
};

function textoSeguro(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarPerguntas(valor: unknown): PerguntaImportacao[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor
    .map((item, index): PerguntaImportacao | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const dados = item as Record<string, unknown>;
      const tipo = Object.values(TipoPergunta).includes(
        dados.tipo as TipoPergunta
      )
        ? (dados.tipo as TipoPergunta)
        : TipoPergunta.NOTA;

      const pesoBruto = Number(dados.peso ?? 1);
      const peso =
        Number.isFinite(pesoBruto) && pesoBruto > 0
          ? pesoBruto
          : 1;

      return {
        id: textoSeguro(dados.id) || `pergunta-${index + 1}`,
        titulo:
          textoSeguro(dados.titulo) ||
          `Pergunta ${index + 1}`,
        tipo,
        ordem: Number(dados.ordem) || index + 1,
        obrigatoria: dados.obrigatoria !== false,
        opcoes: Array.isArray(dados.opcoes)
          ? dados.opcoes
              .map(opcao => textoSeguro(opcao))
              .filter(Boolean)
          : [],
        peso,
      };
    })
    .filter(
      (item): item is PerguntaImportacao =>
        Boolean(item)
    )
    .sort((a, b) => a.ordem - b.ordem);
}

function normalizarSetores(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor
    .map(item => textoSeguro(item))
    .filter(Boolean);
}

function nomeArquivoSeguro(valor: string) {
  const normalizado = valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return normalizado || "gestao_riscos_psicossociais";
}

async function autorizarMundial() {
  const session = await auth();
  const usuario = session?.user as
    | {
        id?: string;
        perfil?: PerfilUsuario;
      }
    | undefined;

  return Boolean(
    usuario?.id &&
      usuario.perfil &&
      PERFIS_MUNDIAL.has(usuario.perfil)
  );
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  if (!(await autorizarMundial())) {
    return Response.json(
      {
        mensagem: "Acesso não autorizado.",
      },
      {
        status: 403,
      }
    );
  }

  const { id } = await params;

  const pesquisa =
    await prisma.pesquisaCliente.findFirst({
      where: {
        id,
        tipo:
          TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
      },
      select: {
        id: true,
        titulo: true,
        perguntas: true,
        configuracaoAnalise: true,
        cliente: {
          select: {
            nome: true,
            empresa: true,
            setores: true,
          },
        },
      },
    });

  if (!pesquisa) {
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

  const perguntas =
    normalizarPerguntas(
      pesquisa.perguntas
    );

  if (perguntas.length === 0) {
    return Response.json(
      {
        mensagem:
          "Esta aplicação não possui perguntas para exportação.",
      },
      {
        status: 400,
      }
    );
  }

  const setores =
    normalizarSetores(
      pesquisa.cliente.setores
    );

  const configuracao =
    pesquisa.configuracaoAnalise &&
    typeof pesquisa.configuracaoAnalise ===
      "object" &&
    !Array.isArray(
      pesquisa.configuracaoAnalise
    )
      ? (pesquisa.configuracaoAnalise as Record<
          string,
          unknown
        >)
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

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Mundial RH";
  workbook.created =
    new Date();

  const instrucoes =
    workbook.addWorksheet(
      "Instrucoes"
    );

  instrucoes.columns = [
    {
      header: "Item",
      key: "item",
      width: 28,
    },
    {
      header: "Orientação",
      key: "orientacao",
      width: 90,
    },
  ];

  instrucoes.addRows([
    {
      item: "Aplicação",
      orientacao:
        pesquisa.titulo,
    },
    {
      item: "Organização",
      orientacao:
        pesquisa.cliente.empresa ||
        pesquisa.cliente.nome,
    },
    {
      item: "Como preencher",
      orientacao:
        "Cada linha da aba Respostas representa um formulário impresso respondido por uma pessoa.",
    },
    {
      item: "Anonimato",
      orientacao:
        "Não inclua nome, e-mail, CPF ou qualquer identificador pessoal. Setor e unidade são opcionais.",
    },
    {
      item: "Cabeçalhos",
      orientacao:
        "Não altere SETOR, UNIDADE, P1, P2, P3... nem exclua as duas primeiras linhas da aba Respostas.",
    },
    {
      item: "Perguntas obrigatórias",
      orientacao:
        "Todas as perguntas marcadas como obrigatórias devem possuir resposta em cada linha importada.",
    },
    {
      item: "Escala de nota",
      orientacao:
        `Perguntas do tipo NOTA aceitam valores entre ${escalaMinima} e ${escalaMaxima}.`,
    },
    {
      item: "Importação",
      orientacao:
        "Salve o arquivo em .xlsx e importe pela própria aplicação no painel da Mundial.",
    },
  ]);

  instrucoes.getRow(1).font = {
    bold: true,
  };

  const respostas =
    workbook.addWorksheet(
      "Respostas",
      {
        views: [
          {
            state: "frozen",
            ySplit: 2,
            xSplit: 2,
          },
        ],
      }
    );

  const cabecalhos = [
    "SETOR",
    "UNIDADE",
    ...perguntas.map(
      (_, index) =>
        `P${index + 1}`
    ),
  ];

  respostas.addRow(
    cabecalhos
  );

  respostas.addRow([
    "Opcional",
    "Opcional",
    ...perguntas.map(
      pergunta =>
        `${pergunta.titulo}${
          pergunta.obrigatoria
            ? " [Obrigatória]"
            : ""
        }`
    ),
  ]);

  respostas.getRow(1).font = {
    bold: true,
  };

  respostas.getRow(2).font = {
    italic: true,
  };

  respostas.getColumn(1).width =
    24;
  respostas.getColumn(2).width =
    24;

  perguntas.forEach(
    (pergunta, index) => {
      const coluna =
        respostas.getColumn(
          index + 3
        );

      coluna.width =
        Math.min(
          45,
          Math.max(
            14,
            pergunta.titulo.length /
              2
          )
        );

      for (
        let linha = 3;
        linha <= 1002;
        linha++
      ) {
        const celula =
          respostas.getCell(
            linha,
            index + 3
          );

        if (
          pergunta.tipo ===
          TipoPergunta.NOTA
        ) {
          celula.dataValidation = {
            type: "decimal",
            operator: "between",
            allowBlank:
              !pergunta.obrigatoria,
            formulae: [
              escalaMinima,
              escalaMaxima,
            ],
            showErrorMessage: true,
            errorTitle:
              "Nota inválida",
            error:
              `Informe um valor entre ${escalaMinima} e ${escalaMaxima}.`,
          };
        }

        if (
          pergunta.tipo ===
          TipoPergunta.SIM_NAO
        ) {
          celula.dataValidation = {
            type: "list",
            allowBlank:
              !pergunta.obrigatoria,
            formulae: [
              '"Sim,Não"',
            ],
            showErrorMessage: true,
            errorTitle:
              "Resposta inválida",
            error:
              'Use "Sim" ou "Não".',
          };
        }

        if (
          pergunta.tipo ===
            TipoPergunta.MULTIPLA_ESCOLHA &&
          pergunta.opcoes.length > 0 &&
          pergunta.opcoes.every(
            opcao =>
              !opcao.includes(",")
          )
        ) {
          const lista =
            pergunta.opcoes
              .map(opcao =>
                opcao.replace(
                  /"/g,
                  '""'
                )
              )
              .join(",");

          if (
            lista.length <=
            250
          ) {
            celula.dataValidation = {
              type: "list",
              allowBlank:
                !pergunta.obrigatoria,
              formulae: [
                `"${lista}"`,
              ],
              showErrorMessage:
                true,
              errorTitle:
                "Resposta inválida",
              error:
                "Selecione uma das alternativas cadastradas.",
            };
          }
        }
      }
    }
  );

  if (
    setores.length > 0
  ) {
    const listas =
      workbook.addWorksheet(
        "Listas"
      );

    listas.state =
      "veryHidden";

    listas.getCell("A1").value =
      "SETORES";

    setores.forEach(
      (setor, index) => {
        listas.getCell(
          index + 2,
          1
        ).value =
          setor;
      }
    );

    for (
      let linha = 3;
      linha <= 1002;
      linha++
    ) {
      respostas.getCell(
        linha,
        1
      ).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [
          `'Listas'!$A$2:$A$${
            setores.length +
            1
          }`,
        ],
        showErrorMessage: true,
        errorTitle:
          "Setor inválido",
        error:
          "Selecione um setor cadastrado para esta organização.",
      };
    }
  }

  const metadados =
    workbook.addWorksheet(
      "Metadados"
    );

  metadados.state =
    "veryHidden";

  metadados.addRows([
    [
      "PESQUISA_ID",
      pesquisa.id,
    ],
    [
      "TIPO",
      TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL,
    ],
    [
      "VERSAO",
      "1",
    ],
  ]);

  perguntas.forEach(
    (pergunta, index) => {
      metadados.addRow([
        `P${index + 1}`,
        pergunta.id,
        pergunta.tipo,
        pergunta.obrigatoria
          ? "SIM"
          : "NAO",
        pergunta.peso,
        pergunta.titulo,
      ]);
    }
  );

  const buffer =
    await workbook.xlsx.writeBuffer();

  const nomeArquivo =
    `${nomeArquivoSeguro(
      pesquisa.titulo
    )}_respostas.xlsx`;

  return new Response(
    new Uint8Array(
      buffer
    ),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="${nomeArquivo}"`,
        "Cache-Control":
          "no-store",
      },
    }
  );
}
