import {
  GravidadeDenuncia,
  OrigemAtorDenuncia,
  PerfilUsuario,
  Prisma,
  StatusDenuncia,
  TipoAnexoDenuncia,
  TipoEventoDenuncia,
  VisibilidadeAnexoDenuncia,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

import {
  AnexoDenuncia,
  ConfirmarUploadDenunciaInput,
  Denuncia,
  DenunciaDetalhada,
  DenunciaPublica,
  DenunciaResumo,
  EditarTratativaInput,
  LiberarTratativaInput,
  NovaTratativa,
  PrepararUploadDenunciaInput,
} from "@/src/core/model/Denuncia";

import RepositorioCriticidadeDenuncia from "../criticidadeDenuncia/RepositorioCriticidadeDenuncia";

import {
  gerarUploadTemporario,
  gerarUrlDownload,
  validarArquivo,
  verificarArquivoNoBucket,
} from "@/src/lib/storage";

const LIMITE_ANEXOS_POR_DENUNCIA = 5;

export type AtorDenuncia = {
  usuarioId?: string | null;
  nome: string;
  perfil?: PerfilUsuario | null;
  origem: OrigemAtorDenuncia;
};

export type OpcoesVisualizacaoCliente = {
  colaboradorId?: string | null;
  podeVerTratativas?: boolean;
};

function gerarProtocolo() {
  const ano = new Date().getFullYear();
  const numero = Math.floor(100000 + Math.random() * 900000);

  return `DEN-${ano}-${numero}`;
}

async function gerarProtocoloUnico() {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const protocolo = gerarProtocolo();

    const existente = await prisma.denuncia.findUnique({
      where: {
        protocolo,
      },
      select: {
        id: true,
      },
    });

    if (!existente) {
      return protocolo;
    }
  }

  throw new Error("Não foi possível gerar um protocolo único.");
}

function textoOpcional(valor?: string | null) {
  const texto = valor?.trim();

  return texto || null;
}

function converterDataOpcional(
  valor?: Date | string | null
): Date | null {
  if (!valor) {
    return null;
  }

  const data = valor instanceof Date ? valor : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    throw new Error("Data do ocorrido inválida.");
  }

  return data;
}

function formatarStatus(status: StatusDenuncia) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function classificarAnexo(tipoMime: string): {
  tipo: TipoAnexoDenuncia;
  visibilidade: VisibilidadeAnexoDenuncia;
} {
  const mime = tipoMime.toLowerCase();

  if (mime.startsWith("audio/")) {
    return {
      tipo: "AUDIO",
      visibilidade: "SOMENTE_MUNDIAL",
    };
  }

  if (mime.startsWith("video/")) {
    return {
      tipo: "VIDEO",
      visibilidade: "SOMENTE_MUNDIAL",
    };
  }

  if (mime.startsWith("image/")) {
    return {
      tipo: "IMAGEM",
      visibilidade: "MUNDIAL_E_COMITE",
    };
  }

  if (
    mime === "application/pdf" ||
    mime.includes("word") ||
    mime.includes("officedocument")
  ) {
    return {
      tipo: "DOCUMENTO",
      visibilidade: "MUNDIAL_E_COMITE",
    };
  }

  return {
    tipo: "OUTRO",
    visibilidade: "MUNDIAL_E_COMITE",
  };
}

async function validarCliente(clienteId: string) {
  const cliente = await prisma.cliente.findUnique({
    where: {
      id: clienteId,
    },
    select: {
      id: true,
    },
  });

  if (!cliente) {
    throw new Error("Cliente não encontrado.");
  }
}

async function validarCategoria(
  categoriaId: string,
  aceitarInativa = false
) {
  if (!categoriaId?.trim()) {
    throw new Error("Categoria é obrigatória.");
  }

  const categoria = await prisma.categoriaDenuncia.findFirst({
    where: {
      id: categoriaId,
      ...(aceitarInativa ? {} : { ativo: true }),
    },
    select: {
      id: true,
      nome: true,
      descricao: true,
      ativo: true,
      ordem: true,
    },
  });

  if (!categoria) {
    throw new Error("Selecione uma categoria válida.");
  }

  return categoria;
}

function validarDadosObrigatorios(dados: {
  clienteId?: string;
  titulo?: string;
  descricao?: string;
  categoriaId?: string;
}) {
  if (!dados.clienteId?.trim()) {
    throw new Error("Cliente é obrigatório.");
  }

  if (!dados.titulo?.trim()) {
    throw new Error("Título é obrigatório.");
  }

  if (!dados.descricao?.trim()) {
    throw new Error("Descrição é obrigatória.");
  }

  if (!dados.categoriaId?.trim()) {
    throw new Error("Categoria é obrigatória.");
  }
}


function converterOpcoesJson(valor: Prisma.JsonValue): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor.filter(
    (item): item is string => typeof item === "string"
  );
}

function respostaVazia(
  resposta: string | boolean | null | undefined
) {
  return (
    resposta === null ||
    resposta === undefined ||
    (typeof resposta === "string" &&
      !resposta.trim())
  );
}

type RespostaPersonalizadaValidada = {
  perguntaId: string;
  perguntaEnunciado: string;
  perguntaTipo:
    | "TEXTO"
    | "TEXTO_LONGO"
    | "SIM_NAO"
    | "MULTIPLA_ESCOLHA";
  resposta: string | boolean;
};

async function validarRespostasPersonalizadas(
  clienteId: string,
  respostasRecebidas: Array<{
    perguntaId: string;
    resposta: string | boolean | null;
  }> = []
): Promise<RespostaPersonalizadaValidada[]> {
  const perguntas =
    await prisma.perguntaCanalDenuncia.findMany({
      where: {
        ativo: true,

        clientes: {
          some: {
            clienteId,
          },
        },
      },

      orderBy: [
        {
          ordem: "asc",
        },
        {
          criadoEm: "asc",
        },
      ],

      select: {
        id: true,
        enunciado: true,
        tipo: true,
        obrigatoria: true,
        opcoes: true,
      },
    });

  const idsPermitidos = new Set(
    perguntas.map(
      (pergunta) => pergunta.id
    )
  );

  const mapaRespostas = new Map<
    string,
    string | boolean | null
  >();

  for (const item of respostasRecebidas) {
    if (!item.perguntaId?.trim()) {
      throw new Error(
        "Foi enviada uma resposta sem identificação da pergunta."
      );
    }

    if (
      !idsPermitidos.has(
        item.perguntaId
      )
    ) {
      throw new Error(
        "Uma das perguntas enviadas não pertence ao canal deste cliente ou está inativa."
      );
    }

    if (
      mapaRespostas.has(
        item.perguntaId
      )
    ) {
      throw new Error(
        "Foi enviada mais de uma resposta para a mesma pergunta."
      );
    }

    mapaRespostas.set(
      item.perguntaId,
      item.resposta
    );
  }

  const respostasValidadas:
    RespostaPersonalizadaValidada[] = [];

  for (const pergunta of perguntas) {
    const resposta =
      mapaRespostas.get(
        pergunta.id
      ) ?? null;

    const vazia =
      respostaVazia(resposta);

    if (
      pergunta.obrigatoria &&
      vazia
    ) {
      throw new Error(
        `Responda à pergunta obrigatória: ${pergunta.enunciado}`
      );
    }

    if (vazia) {
      continue;
    }

    if (
      pergunta.tipo === "TEXTO" ||
      pergunta.tipo ===
        "TEXTO_LONGO"
    ) {
      if (
        typeof resposta !== "string" ||
        !resposta.trim()
      ) {
        throw new Error(
          `Resposta inválida para: ${pergunta.enunciado}`
        );
      }

      respostasValidadas.push({
        perguntaId:
          pergunta.id,

        perguntaEnunciado:
          pergunta.enunciado,

        perguntaTipo:
          pergunta.tipo,

        resposta:
          resposta.trim(),
      });

      continue;
    }

    if (
      pergunta.tipo === "SIM_NAO"
    ) {
      if (
        typeof resposta !== "boolean"
      ) {
        throw new Error(
          `Resposta inválida para: ${pergunta.enunciado}`
        );
      }

      respostasValidadas.push({
        perguntaId:
          pergunta.id,

        perguntaEnunciado:
          pergunta.enunciado,

        perguntaTipo:
          pergunta.tipo,

        resposta,
      });

      continue;
    }

    if (
      pergunta.tipo ===
        "MULTIPLA_ESCOLHA"
    ) {
      const opcoes =
        converterOpcoesJson(
          pergunta.opcoes
        );

      if (
        typeof resposta !== "string" ||
        !opcoes.includes(resposta)
      ) {
        throw new Error(
          `Resposta inválida para: ${pergunta.enunciado}`
        );
      }

      respostasValidadas.push({
        perguntaId:
          pergunta.id,

        perguntaEnunciado:
          pergunta.enunciado,

        perguntaTipo:
          pergunta.tipo,

        resposta,
      });

      continue;
    }

    throw new Error(
      `Tipo de pergunta inválido: ${pergunta.enunciado}`
    );
  }

  return respostasValidadas;
}

function montarResumo(
  denuncia: any
): DenunciaResumo {
  const quantidadeAnexos =
    denuncia._count?.anexos ??
    (Array.isArray(denuncia.anexos)
      ? denuncia.anexos.length
      : 0);

  return {
    id: denuncia.id,
    clienteId: denuncia.clienteId,
    protocolo: denuncia.protocolo,
    titulo: denuncia.titulo,

    categoriaId:
      denuncia.categoriaId || "",

    categoria: denuncia.categoria
      ? {
          id: denuncia.categoria.id,
          nome: denuncia.categoria.nome,
          descricao:
            denuncia.categoria.descricao,
          ativo: denuncia.categoria.ativo,
          ordem: denuncia.categoria.ordem,
        }
      : {
          id: "",
          nome: "Sem categoria",
          descricao:
            "Denúncia registrada antes da implantação das categorias.",
          ativo: false,
          ordem: 9999,
        },

    anonima: denuncia.anonima,
    status: denuncia.status,
    gravidade: denuncia.gravidade,

    quantidadeAnexos,

    tratativaLiberada: denuncia.tratativaLiberada,
    destinoTratativa: denuncia.destinoTratativa,
    colaboradorResponsavelId:
      denuncia.colaboradorResponsavelId,
    colaboradorResponsavel:
      denuncia.colaboradorResponsavel
        ? {
            id: denuncia.colaboradorResponsavel.id,
            nome: denuncia.colaboradorResponsavel.nome,
            email: denuncia.colaboradorResponsavel.email,
            cargo: denuncia.colaboradorResponsavel.cargo,
            setor: denuncia.colaboradorResponsavel.setor,
          }
        : null,

    criadoEm: denuncia.criadoEm,
    atualizadoEm: denuncia.atualizadoEm,

    cliente: {
      id: denuncia.cliente.id,
      nome: denuncia.cliente.nome,
      empresa: denuncia.cliente.empresa,
    },
  };
}

async function montarAnexo(anexo: any): Promise<AnexoDenuncia> {
  let url: string | null = null;

  try {
    url = await gerarUrlDownload(
      anexo.chave,
      anexo.nomeOriginal
    );
  } catch (error) {
    console.error(
      `Erro ao gerar URL do anexo ${anexo.id}:`,
      error
    );
  }

  return {
    id: anexo.id,
    chave: anexo.chave,
    nomeOriginal: anexo.nomeOriginal,
    tipoMime: anexo.tipoMime,
    tamanho: anexo.tamanho,
    tipo: anexo.tipo,
    visibilidade: anexo.visibilidade,
    criadoEm: anexo.criadoEm,
    url,
  };
}

async function montarDetalhada(
  denuncia: any
): Promise<DenunciaDetalhada> {
  const anexos = await Promise.all(
    Array.isArray(denuncia.anexos)
      ? denuncia.anexos.map(montarAnexo)
      : []
  );

  const detalhada = {
    ...montarResumo(denuncia),

    descricao: denuncia.descricao,
    localOcorrido: denuncia.localOcorrido,
    dataOcorrido: denuncia.dataOcorrido,

    nomeDenunciante: denuncia.nomeDenunciante,
    emailDenunciante: denuncia.emailDenunciante,
    telefoneDenunciante: denuncia.telefoneDenunciante,

    respostaPublica: denuncia.respostaPublica,
    tratativaLiberadaEm:
      denuncia.tratativaLiberadaEm,

    tratativas: Array.isArray(denuncia.tratativas)
      ? denuncia.tratativas.map((tratativa: any) => ({
          id: tratativa.id,
          denunciaId: tratativa.denunciaId,
          titulo: tratativa.titulo,
          descricao: tratativa.descricao,

          criadoPorUsuarioId: tratativa.criadoPorUsuarioId,
          criadoPorNome: tratativa.criadoPorNome,
          criadoPorPerfil: tratativa.criadoPorPerfil,

          atualizadoPorUsuarioId:
            tratativa.atualizadoPorUsuarioId,
          atualizadoPorNome:
            tratativa.atualizadoPorNome,

          criadoEm: tratativa.criadoEm,
          atualizadoEm: tratativa.atualizadoEm,
        }))
      : [],

    historico: Array.isArray(denuncia.historico)
      ? denuncia.historico
      : [],

    anexos,

    respostasPerguntasCanal:
      Array.isArray(
        denuncia.respostasPerguntasCanal
      )
        ? denuncia.respostasPerguntasCanal.map(
            (resposta: any) => ({
              id: resposta.id,
              perguntaId:
                resposta.perguntaId,
              perguntaEnunciado:
                resposta.perguntaEnunciado,
              perguntaTipo:
                resposta.perguntaTipo,
              resposta: resposta.resposta,
              criadoEm: resposta.criadoEm,
            })
          )
        : [],
  };

  return detalhada;
}

async function calcularGravidadeAutomatica(dados: {
  titulo: string;
  descricao: string;
  categoria?: string | null;
  gravidade?: GravidadeDenuncia | null;
}) {
  if (dados.gravidade) {
    return dados.gravidade;
  }

  return RepositorioCriticidadeDenuncia.calcularGravidade({
    titulo: dados.titulo,
    descricao: dados.descricao,
    categoria: dados.categoria,
  });
}

const includeDetalhadaMundial = {
  cliente: true,
  categoria: true,
  colaboradorResponsavel: true,

  anexos: {
    orderBy: {
      criadoEm: "asc" as const,
    },
  },

  tratativas: {
    orderBy: {
      criadoEm: "desc" as const,
    },
  },

  historico: {
    orderBy: {
      criadoEm: "asc" as const,
    },
  },

  respostasPerguntasCanal: {
    orderBy: {
      criadoEm: "asc" as const,
    },
  },

  _count: {
    select: {
      anexos: true,
    },
  },
};

export default class RepositorioDenuncia {
  static async criarPublica(
    dados: DenunciaPublica
  ): Promise<{
    id: string;
    protocolo: string;
  }> {
    validarDadosObrigatorios(dados);

    if (!dados.aceitouTermos) {
      throw new Error(
        "É necessário aceitar os Termos de Uso e o Aviso de Privacidade."
      );
    }

    if (!dados.versaoTermosAceitos?.trim()) {
      throw new Error(
        "A versão dos termos aceitos não foi informada."
      );
    }

    await validarCliente(dados.clienteId);

    const categoria = await validarCategoria(
      dados.categoriaId
    );

    const titulo = dados.titulo.trim();
    const descricao = dados.descricao.trim();
    const protocolo = await gerarProtocoloUnico();

    const gravidade = await calcularGravidadeAutomatica({
      titulo,
      descricao,
      categoria: categoria.nome,
    });

    const respostasPersonalizadas =
      await validarRespostasPersonalizadas(
        dados.clienteId,
        dados.respostasPersonalizadas || []
      );

    const denuncia = await prisma.denuncia.create({
      data: {
        clienteId: dados.clienteId,
        protocolo,
        titulo,
        descricao,
        categoriaId: categoria.id,

        localOcorrido: textoOpcional(
          dados.localOcorrido
        ),

        dataOcorrido: converterDataOpcional(
          dados.dataOcorrido
        ),

        anonima: dados.anonima,

        nomeDenunciante: dados.anonima
          ? null
          : textoOpcional(
              dados.nomeDenunciante
            ),

        emailDenunciante: dados.anonima
          ? null
          : textoOpcional(
              dados.emailDenunciante
            )?.toLowerCase() || null,

        telefoneDenunciante: dados.anonima
          ? null
          : textoOpcional(
              dados.telefoneDenunciante
            ),

        gravidade,
        status: "RECEBIDA",

        respostaPublica: null,

        respostasPerguntasCanal: {
          create: respostasPersonalizadas,
        },

        aceiteTermosEm: new Date(),
        versaoTermosAceitos:
          dados.versaoTermosAceitos.trim(),

        historico: {
          create: {
            tipo: "DENUNCIA_REGISTRADA",
            titulo: "Denúncia registrada",
            descricao:
              "A denúncia foi recebida e será encaminhada para análise.",
            statusNovo: "RECEBIDA",
            origemAtor: "PUBLICO",
            atorNome: dados.anonima
              ? "Denunciante anônimo"
              : textoOpcional(dados.nomeDenunciante) ||
                "Denunciante",
            visivelPublicamente: true,
          },
        },
      },
      select: {
        id: true,
        protocolo: true,
      },
    });

    return denuncia;
  }

  static async criarManual(
    dados: Denuncia,
    ator: AtorDenuncia = {
      nome: "Mundial",
      origem: "MUNDIAL",
      perfil: "ADMIN",
    }
  ): Promise<DenunciaDetalhada> {
    validarDadosObrigatorios(dados);

    await validarCliente(dados.clienteId);

    const categoria = await validarCategoria(
      dados.categoriaId
    );

    const titulo = dados.titulo.trim();
    const descricao = dados.descricao.trim();
    const protocolo = await gerarProtocoloUnico();

    const gravidade = await calcularGravidadeAutomatica({
      titulo,
      descricao,
      categoria: categoria.nome,
      gravidade: dados.gravidade || null,
    });

    const anonima = dados.anonima ?? true;

    const denuncia = await prisma.denuncia.create({
      data: {
        clienteId: dados.clienteId,
        protocolo,
        titulo,
        descricao,
        categoriaId: categoria.id,

        localOcorrido: textoOpcional(
          dados.localOcorrido
        ),

        dataOcorrido: converterDataOpcional(
          dados.dataOcorrido
        ),

        anonima,

        nomeDenunciante: anonima
          ? null
          : textoOpcional(dados.nomeDenunciante),

        emailDenunciante: dados.anonima
          ? null
          : textoOpcional(
              dados.emailDenunciante
            )?.toLowerCase() || null,

        telefoneDenunciante: dados.anonima
          ? null
          : textoOpcional(dados.telefoneDenunciante),

        status: dados.status || "RECEBIDA",
        gravidade,

        respostaPublica: textoOpcional(
          dados.respostaPublica
        ),

        aceiteTermosEm: new Date(),
        versaoTermosAceitos: "CADASTRO_INTERNO",

        historico: {
          create: {
            tipo: "DENUNCIA_REGISTRADA",
            titulo: "Denúncia registrada",
            descricao:
              "A denúncia foi registrada internamente.",
            statusNovo: dados.status || "RECEBIDA",
            origemAtor: ator.origem,
            atorId: ator.usuarioId,
            atorNome: ator.nome,
            visivelPublicamente: true,
          },
        },
      },
      include: includeDetalhadaMundial,
    });

    return montarDetalhada(denuncia);
  }

  static async criarManualCliente(
    clienteId: string,
    dados: Denuncia,
    ator: AtorDenuncia
  ): Promise<DenunciaDetalhada> {
    return this.criarManual(
      {
        ...dados,
        clienteId,
      },
      ator
    );
  }

  static async consultarPublica(dados: {
    clienteId: string;
    protocolo: string;
  }) {
    if (!dados.clienteId?.trim()) {
      throw new Error("Cliente é obrigatório.");
    }

    if (!dados.protocolo?.trim()) {
      throw new Error("Protocolo é obrigatório.");
    }

    const denuncia = await prisma.denuncia.findFirst({
      where: {
        clienteId: dados.clienteId,
        protocolo: dados.protocolo.trim(),
      },
      select: {
        protocolo: true,
        status: true,
        respostaPublica: true,
        criadoEm: true,
        atualizadoEm: true,

        historico: {
          where: {
            visivelPublicamente: true,
          },
          orderBy: {
            criadoEm: "asc",
          },
          select: {
            id: true,
            titulo: true,
            descricao: true,
            statusNovo: true,
            criadoEm: true,
          },
        },
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada.");
    }

    return denuncia;
  }

  static async salvar(
    denuncia: Denuncia,
    ator: AtorDenuncia = {
      nome: "Mundial",
      origem: "MUNDIAL",
      perfil: "ADMIN",
    }
  ): Promise<DenunciaDetalhada> {
    if (!denuncia.id) {
      throw new Error("Denúncia não encontrada.");
    }

    const denunciaAtual = await prisma.denuncia.findUnique({
      where: {
        id: denuncia.id,
      },
      include: {
        categoria: true,
      },
    });

    if (!denunciaAtual) {
      throw new Error("Denúncia não encontrada.");
    }

    const titulo =
      denuncia.titulo?.trim() || denunciaAtual.titulo;

    const descricao =
      denuncia.descricao?.trim() ||
      denunciaAtual.descricao;

    const categoriaId =
      denuncia.categoriaId?.trim() ||
      denunciaAtual.categoriaId?.trim() ||
      null;

    if (!categoriaId) {
      throw new Error(
        "Esta denúncia ainda não possui uma categoria. Selecione uma categoria antes de salvar."
      );
    }

    const categoria = await validarCategoria(
      categoriaId,
      categoriaId === denunciaAtual.categoriaId
    );

    const localOcorrido =
      denuncia.localOcorrido === undefined
        ? denunciaAtual.localOcorrido
        : textoOpcional(denuncia.localOcorrido);

    const dataOcorrido =
      denuncia.dataOcorrido === undefined
        ? denunciaAtual.dataOcorrido
        : converterDataOpcional(denuncia.dataOcorrido);

    const anonima =
      denuncia.anonima ?? denunciaAtual.anonima;

    const status =
      denuncia.status || denunciaAtual.status;

    const gravidade =
      denuncia.gravidade || denunciaAtual.gravidade;

    const respostaPublica =
      denuncia.respostaPublica === undefined
        ? denunciaAtual.respostaPublica
        : textoOpcional(denuncia.respostaPublica);

    const quantidadeTratativas =
      await prisma.tratativaDenuncia.count({
        where: { denunciaId: denuncia.id },
      });

    if (
      ator.origem !== "MUNDIAL" &&
      denunciaAtual.respostaPublica !== respostaPublica
    ) {
      throw new Error(
        "Somente a Mundial pode publicar a resposta final da denúncia."
      );
    }

    if (
      (respostaPublica || status === "CONCLUIDA") &&
      quantidadeTratativas < 1
    ) {
      throw new Error(
        "A resposta final e a conclusão somente podem ser liberadas após o registro de pelo menos uma tratativa."
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.denuncia.update({
        where: {
          id: denuncia.id,
        },
        data: {
          titulo,
          descricao,
          categoriaId: categoria.id,
          localOcorrido,
          dataOcorrido,
          anonima,

          nomeDenunciante: anonima
            ? null
            : denuncia.nomeDenunciante === undefined
              ? denunciaAtual.nomeDenunciante
              : textoOpcional(
                  denuncia.nomeDenunciante
                ),

          emailDenunciante: anonima
            ? null
            : denuncia.emailDenunciante === undefined
              ? denunciaAtual.emailDenunciante
              : textoOpcional(
                  denuncia.emailDenunciante
                )?.toLowerCase() || null,

          telefoneDenunciante: anonima
            ? null
            : denuncia.telefoneDenunciante === undefined
              ? denunciaAtual.telefoneDenunciante
              : textoOpcional(
                  denuncia.telefoneDenunciante
                ),

          status,
          gravidade,
          respostaPublica,
        },
      });

      if (denunciaAtual.status !== status) {
        await tx.historicoDenuncia.create({
          data: {
            denunciaId: denuncia.id!,
            tipo: "STATUS_ALTERADO",
            titulo: `Status alterado para ${formatarStatus(
              status
            )}`,
            descricao:
              respostaPublica ||
              "O andamento da denúncia foi atualizado.",
            statusAnterior: denunciaAtual.status,
            statusNovo: status,
            origemAtor: ator.origem,
            atorId: ator.usuarioId,
            atorNome: ator.nome,
            visivelPublicamente: true,
          },
        });
      }

      if (denunciaAtual.gravidade !== gravidade) {
        await tx.historicoDenuncia.create({
          data: {
            denunciaId: denuncia.id!,
            tipo: "GRAVIDADE_ALTERADA",
            titulo: "Classificação interna atualizada",
            origemAtor: ator.origem,
            atorId: ator.usuarioId,
            atorNome: ator.nome,
            visivelPublicamente: false,
          },
        });
      }

      if (
        denunciaAtual.respostaPublica !==
        respostaPublica
      ) {
        await tx.historicoDenuncia.create({
          data: {
            denunciaId: denuncia.id!,
            tipo: "RESPOSTA_PUBLICA_ALTERADA",
            titulo: "Nova atualização disponibilizada",
            descricao:
              respostaPublica ||
              "A resposta pública foi atualizada.",
            origemAtor: ator.origem,
            atorId: ator.usuarioId,
            atorNome: ator.nome,
            visivelPublicamente: true,
          },
        });
      }
    });

    return this.obterPorId(denuncia.id);
  }

  static async liberarTratativa(
    dados: LiberarTratativaInput,
    ator: AtorDenuncia
  ): Promise<DenunciaDetalhada> {
    if (ator.origem !== "MUNDIAL") {
      throw new Error(
        "Somente a Mundial pode liberar e direcionar a tratativa."
      );
    }

    if (!dados.denunciaId?.trim()) {
      throw new Error("Denúncia não encontrada.");
    }

    if (
      dados.destino !== "MUNDIAL" &&
      dados.destino !== "COLABORADOR"
    ) {
      throw new Error("Destino da tratativa inválido.");
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: { id: dados.denunciaId },
      select: {
        id: true,
        clienteId: true,
        tratativaLiberada: true,
        tratativas: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada.");
    }

    if (denuncia.tratativaLiberada) {
      throw new Error(
        "A tratativa desta denúncia já foi liberada e direcionada."
      );
    }

    if (denuncia.tratativas.length > 0) {
      throw new Error(
        "Não é possível alterar o direcionamento porque já existem tratativas registradas."
      );
    }

    let colaboradorId: string | null = null;
    let colaboradorNome: string | null = null;

    if (dados.destino === "COLABORADOR") {
      if (!dados.colaboradorId?.trim()) {
        throw new Error(
          "Selecione o colaborador responsável pela tratativa."
        );
      }

      const colaborador =
        await prisma.colaboradorCliente.findFirst({
          where: {
            id: dados.colaboradorId,
            clienteId: denuncia.clienteId,
            ativo: true,
            podeTratarDenuncias: true,
          },
          select: {
            id: true,
            nome: true,
          },
        });

      if (!colaborador) {
        throw new Error(
          "O colaborador selecionado não pertence ao cliente ou não possui permissão para tratar denúncias."
        );
      }

      colaboradorId = colaborador.id;
      colaboradorNome = colaborador.nome;
    }

    await prisma.$transaction(async (tx) => {
      await tx.denuncia.update({
        where: { id: denuncia.id },
        data: {
          tratativaLiberada: true,
          destinoTratativa: dados.destino,
          colaboradorResponsavelId: colaboradorId,
          tratativaLiberadaEm: new Date(),
          tratativaLiberadaPorUsuarioId:
            ator.usuarioId || null,
          status: "EM_TRATATIVA",
        },
      });

      await tx.historicoDenuncia.create({
        data: {
          denunciaId: denuncia.id,
          tipo: "RESPONSAVEL_ATRIBUIDO",
          titulo:
            dados.destino === "MUNDIAL"
              ? "Tratativa liberada para a Mundial"
              : "Tratativa direcionada para colaborador",
          descricao:
            dados.destino === "MUNDIAL"
              ? "A Mundial será a responsável exclusiva pelas tratativas desta denúncia."
              : `${colaboradorNome} será o responsável exclusivo pelas tratativas desta denúncia.`,
          statusNovo: "EM_TRATATIVA",
          origemAtor: ator.origem,
          atorId: ator.usuarioId,
          atorNome: ator.nome,
          visivelPublicamente: false,
        },
      });
    });

    return this.obterPorId(denuncia.id);
  }

  private static validarPermissaoTratativa(
    denuncia: {
      tratativaLiberada: boolean;
      destinoTratativa: "MUNDIAL" | "COLABORADOR" | null;
      colaboradorResponsavelId: string | null;
    },
    ator: AtorDenuncia,
    colaboradorId?: string | null
  ) {
    if (!denuncia.tratativaLiberada) {
      throw new Error(
        "A tratativa ainda não foi liberada pela Mundial."
      );
    }

    if (denuncia.destinoTratativa === "MUNDIAL") {
      if (ator.origem !== "MUNDIAL") {
        throw new Error(
          "Esta denúncia está sob responsabilidade exclusiva da Mundial."
        );
      }

      return;
    }

    if (denuncia.destinoTratativa === "COLABORADOR") {
      if (
        ator.origem === "MUNDIAL" ||
        !colaboradorId ||
        colaboradorId !== denuncia.colaboradorResponsavelId
      ) {
        throw new Error(
          "Esta denúncia está sob responsabilidade exclusiva do colaborador designado."
        );
      }

      return;
    }

    throw new Error(
      "O direcionamento da tratativa está inconsistente."
    );
  }

  static async adicionarTratativa(
    denunciaId: string,
    tratativa: NovaTratativa,
    ator: AtorDenuncia,
    colaboradorId?: string | null
  ): Promise<DenunciaDetalhada> {
    if (!denunciaId?.trim()) {
      throw new Error("Denúncia não encontrada.");
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
      select: {
        id: true,
        tratativaLiberada: true,
        destinoTratativa: true,
        colaboradorResponsavelId: true,
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada.");
    }

    this.validarPermissaoTratativa(
      denuncia,
      ator,
      colaboradorId
    );

    const titulo = tratativa.titulo?.trim();
    const descricao = tratativa.descricao?.trim();

    if (!titulo) {
      throw new Error(
        "Título da tratativa é obrigatório."
      );
    }

    if (!descricao) {
      throw new Error(
        "Descrição da tratativa é obrigatória."
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.tratativaDenuncia.create({
        data: {
          denunciaId,
          titulo,
          descricao,
          responsavelId:
            denuncia.destinoTratativa === "COLABORADOR"
              ? denuncia.colaboradorResponsavelId
              : null,
          criadoPorUsuarioId: ator.usuarioId || null,
          criadoPorNome: ator.nome,
          criadoPorPerfil: ator.perfil || null,
          atualizadoPorUsuarioId: ator.usuarioId || null,
          atualizadoPorNome: ator.nome,
        },
      });

      await tx.denuncia.update({
        where: { id: denunciaId },
        data: { status: "EM_TRATATIVA" },
      });

      await tx.historicoDenuncia.create({
        data: {
          denunciaId,
          tipo: "TRATATIVA_CRIADA",
          titulo: "Tratativa interna registrada",
          origemAtor: ator.origem,
          atorId: ator.usuarioId,
          atorNome: ator.nome,
          visivelPublicamente: false,
        },
      });
    });

    return this.obterPorId(denunciaId);
  }

  static async editarTratativa(
    dados: EditarTratativaInput,
    ator: AtorDenuncia,
    colaboradorId?: string | null
  ): Promise<DenunciaDetalhada> {
    const tratativaAtual =
      await prisma.tratativaDenuncia.findFirst({
        where: {
          id: dados.id,
          denunciaId: dados.denunciaId,
        },
        include: {
          denuncia: {
            select: {
              tratativaLiberada: true,
              destinoTratativa: true,
              colaboradorResponsavelId: true,
            },
          },
        },
      });

    if (!tratativaAtual) {
      throw new Error("Tratativa não encontrada.");
    }

    this.validarPermissaoTratativa(
      tratativaAtual.denuncia,
      ator,
      colaboradorId
    );

    const titulo = dados.titulo?.trim();
    const descricao = dados.descricao?.trim();

    if (!titulo || !descricao) {
      throw new Error(
        "Título e descrição da tratativa são obrigatórios."
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.tratativaDenuncia.update({
        where: { id: dados.id },
        data: {
          titulo,
          descricao,
          atualizadoPorUsuarioId:
            ator.usuarioId || null,
          atualizadoPorNome: ator.nome,
        },
      });

      await tx.historicoDenuncia.create({
        data: {
          denunciaId: dados.denunciaId,
          tipo: "TRATATIVA_EDITADA",
          titulo: "Tratativa interna atualizada",
          origemAtor: ator.origem,
          atorId: ator.usuarioId,
          atorNome: ator.nome,
          visivelPublicamente: false,
        },
      });
    });

    return this.obterPorId(dados.denunciaId);
  }

  static async obterTodos(): Promise<
    DenunciaResumo[]
  > {
    const denuncias = await prisma.denuncia.findMany({
      orderBy: [
        {
          gravidade: "desc",
        },
        {
          criadoEm: "desc",
        },
      ],
      include: {
        cliente: true,
        categoria: true,
        colaboradorResponsavel: true,

        _count: {
          select: {
            anexos: true,
          },
        },
      },
    });

    return denuncias.map(montarResumo);
  }

  static async obterPorCliente(
    clienteId: string
  ): Promise<DenunciaResumo[]> {
    if (!clienteId?.trim()) {
      throw new Error("Cliente é obrigatório.");
    }

    const denuncias = await prisma.denuncia.findMany({
      where: {
        clienteId,
      },
      orderBy: [
        {
          gravidade: "desc",
        },
        {
          criadoEm: "desc",
        },
      ],
      include: {
        cliente: true,
        categoria: true,
        colaboradorResponsavel: true,

        _count: {
          select: {
            anexos: {
              where: {
                visibilidade: "MUNDIAL_E_COMITE",
              },
            },
          },
        },
      },
    });

    return denuncias.map(montarResumo);
  }

  static async obterParaRelatorio(
    filtro: {
      dataInicio?: string;
      dataFim?: string;
      clienteId?: string;
      colaboradorId?: string;
    }
  ): Promise<DenunciaResumo[]> {
    let inicio: Date | undefined;
    let fim: Date | undefined;

    if (filtro.dataInicio) {
      inicio = new Date(
        `${filtro.dataInicio}T00:00:00`
      );

      if (Number.isNaN(inicio.getTime())) {
        throw new Error(
          "Data inicial inválida."
        );
      }
    }

    if (filtro.dataFim) {
      fim = new Date(
        `${filtro.dataFim}T23:59:59.999`
      );

      if (Number.isNaN(fim.getTime())) {
        throw new Error(
          "Data final inválida."
        );
      }
    }

    if (
      inicio &&
      fim &&
      inicio > fim
    ) {
      throw new Error(
        "A data inicial não pode ser posterior à data final."
      );
    }

    const denuncias =
      await prisma.denuncia.findMany({
        where: {
          ...(filtro.clienteId
            ? {
                clienteId:
                  filtro.clienteId,
              }
            : {}),

          ...(inicio || fim
            ? {
                criadoEm: {
                  ...(inicio
                    ? {
                        gte: inicio,
                      }
                    : {}),

                  ...(fim
                    ? {
                        lte: fim,
                      }
                    : {}),
                },
              }
            : {}),

          ...(filtro.colaboradorId
            ? {
                tratativaLiberada: true,
                destinoTratativa:
                  "COLABORADOR",
                colaboradorResponsavelId:
                  filtro.colaboradorId,
              }
            : {}),
        },

        orderBy: [
          {
            gravidade: "desc",
          },
          {
            criadoEm: "desc",
          },
        ],

        include: {
          cliente: true,
          categoria: true,
          colaboradorResponsavel: true,

          _count: {
            select: {
              anexos: true,
            },
          },
        },
      });

    return denuncias.map(montarResumo);
  }


  static async obterPorClienteEColaborador(
    clienteId: string,
    colaboradorId: string
  ): Promise<DenunciaResumo[]> {
    if (!clienteId?.trim()) {
      throw new Error("Cliente é obrigatório.");
    }

    if (!colaboradorId?.trim()) {
      throw new Error("Colaborador é obrigatório.");
    }

    const denuncias = await prisma.denuncia.findMany({
      where: {
        clienteId,

        tratativaLiberada: true,
        destinoTratativa: "COLABORADOR",
        colaboradorResponsavelId: colaboradorId,
      },

      orderBy: [
        {
          gravidade: "desc",
        },
        {
          criadoEm: "desc",
        },
      ],

      include: {
        cliente: true,
        categoria: true,
        colaboradorResponsavel: true,

        _count: {
          select: {
            anexos: {
              where: {
                visibilidade: "MUNDIAL_E_COMITE",
              },
            },
          },
        },
      },
    });

    return denuncias.map(montarResumo);
  }

  static async obterPorId(
    id: string
  ): Promise<DenunciaDetalhada> {
    if (!id?.trim()) {
      throw new Error("Denúncia não encontrada.");
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: {
        id,
      },
      include: includeDetalhadaMundial,
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada.");
    }

    return montarDetalhada(denuncia);
  }

  static async obterColaboradorPorUsuario(
    usuarioId: string,
    clienteId: string
  ) {
    if (!usuarioId?.trim()) {
      throw new Error("Usuário não informado.");
    }

    if (!clienteId?.trim()) {
      throw new Error("Cliente não informado.");
    }

    return prisma.colaboradorCliente.findFirst({
      where: {
        usuarioId,
        clienteId,
      },

      select: {
        id: true,
        nome: true,
        ativo: true,
        podeVerDenuncias: true,
        podeTratarDenuncias: true,
      },
    });
  }

  static async obterPorIdECliente(
    id: string,
    clienteId: string,
    opcoes: OpcoesVisualizacaoCliente = {}
  ): Promise<DenunciaDetalhada> {
    if (!id?.trim()) {
      throw new Error("Denúncia não encontrada.");
    }

    if (!clienteId?.trim()) {
      throw new Error("Cliente é obrigatório.");
    }

    const colaboradorId =
      opcoes.colaboradorId || null;

    const podeVerTratativas =
      opcoes.podeVerTratativas === true;

    const denuncia = await prisma.denuncia.findFirst({
      where: {
        id,
        clienteId,

        ...(colaboradorId
          ? {
              tratativaLiberada: true,
              destinoTratativa: "COLABORADOR",
              colaboradorResponsavelId: colaboradorId,
            }
          : {}),
      },

      include: {
        cliente: true,
        categoria: true,
        colaboradorResponsavel: true,

        anexos: {
          where: {
            visibilidade:
              "MUNDIAL_E_COMITE",
          },
          orderBy: {
            criadoEm: "asc",
          },
        },

        tratativas:
          colaboradorId && podeVerTratativas
            ? {
                orderBy: {
                  criadoEm: "desc",
                },
              }
            : {
                where: {
                  id: "__SEM_TRATATIVAS__",
                },
              },

        historico: {
          where: {
            visivelPublicamente: true,
          },
          orderBy: {
            criadoEm: "asc",
          },
        },

        respostasPerguntasCanal: {
          orderBy: {
            criadoEm: "asc",
          },
        },

        _count: {
          select: {
            anexos: {
              where: {
                visibilidade:
                  "MUNDIAL_E_COMITE",
              },
            },
          },
        },
      },
    });

    if (!denuncia) {
      throw new Error(
        "Denúncia não encontrada ou não direcionada para este colaborador."
      );
    }

    return montarDetalhada(denuncia);
  }

  static async prepararUpload(
    dados: PrepararUploadDenunciaInput
  ): Promise<{
    chave: string;
    uploadUrl: string;
    nomeOriginal: string;
  }> {
    if (!dados.denunciaId?.trim()) {
      throw new Error("Denúncia é obrigatória.");
    }

    if (!dados.protocolo?.trim()) {
      throw new Error("Protocolo é obrigatório.");
    }

    validarArquivo({
      nomeArquivo: dados.nomeArquivo,
      tipoMime: dados.tipoMime,
      tamanho: dados.tamanho,
    });

    const denuncia = await prisma.denuncia.findFirst({
      where: {
        id: dados.denunciaId,
        protocolo: dados.protocolo.trim(),
      },
      select: {
        id: true,
        clienteId: true,

        _count: {
          select: {
            anexos: true,
          },
        },
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada.");
    }

    if (
      denuncia._count.anexos >=
      LIMITE_ANEXOS_POR_DENUNCIA
    ) {
      throw new Error(
        `A denúncia pode ter no máximo ${LIMITE_ANEXOS_POR_DENUNCIA} anexos.`
      );
    }

    return gerarUploadTemporario({
      clienteId: denuncia.clienteId,
      denunciaId: denuncia.id,
      nomeArquivo: dados.nomeArquivo,
      tipoMime: dados.tipoMime,
      tamanho: dados.tamanho,
    });
  }

  static async confirmarUpload(
    dados: ConfirmarUploadDenunciaInput
  ): Promise<AnexoDenuncia> {
    if (!dados.denunciaId?.trim()) {
      throw new Error("Denúncia é obrigatória.");
    }

    if (!dados.protocolo?.trim()) {
      throw new Error("Protocolo é obrigatório.");
    }

    validarArquivo({
      nomeArquivo: dados.nomeOriginal,
      tipoMime: dados.tipoMime,
      tamanho: dados.tamanho,
    });

    const denuncia = await prisma.denuncia.findFirst({
      where: {
        id: dados.denunciaId,
        protocolo: dados.protocolo.trim(),
      },
      select: {
        id: true,
        clienteId: true,

        anexos: {
          select: {
            tipo: true,
          },
        },

        _count: {
          select: {
            anexos: true,
          },
        },
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada.");
    }

    const classificacao = classificarAnexo(
      dados.tipoMime
    );

    if (
      classificacao.tipo === "VIDEO" &&
      denuncia.anexos.some(
        (anexo) => anexo.tipo === "VIDEO"
      )
    ) {
      throw new Error(
        "É permitido anexar somente um vídeo por denúncia."
      );
    }

    const prefixoEsperado =
      `denuncias/${denuncia.clienteId}/` +
      `${denuncia.id}/`;

    if (!dados.chave.startsWith(prefixoEsperado)) {
      throw new Error(
        "O arquivo não pertence a esta denúncia."
      );
    }

    const anexoExistente =
      await prisma.anexoDenuncia.findUnique({
        where: {
          chave: dados.chave,
        },
      });

    if (anexoExistente) {
      return montarAnexo(anexoExistente);
    }

    if (
      denuncia._count.anexos >=
      LIMITE_ANEXOS_POR_DENUNCIA
    ) {
      throw new Error(
        `A denúncia pode ter no máximo ${LIMITE_ANEXOS_POR_DENUNCIA} anexos.`
      );
    }

    let objetoNoBucket;

    try {
      objetoNoBucket =
        await verificarArquivoNoBucket(dados.chave);
    } catch {
      throw new Error(
        "O arquivo não foi encontrado no armazenamento."
      );
    }

    const tamanhoReal = Number(
      objetoNoBucket.ContentLength || 0
    );

    const tipoReal =
      objetoNoBucket.ContentType || dados.tipoMime;

    if (tamanhoReal <= 0) {
      throw new Error(
        "O arquivo armazenado está vazio ou inválido."
      );
    }

    if (tamanhoReal !== dados.tamanho) {
      throw new Error(
        "O tamanho do arquivo armazenado não corresponde ao arquivo enviado."
      );
    }

    if (tipoReal !== dados.tipoMime) {
      throw new Error(
        "O tipo do arquivo armazenado não corresponde ao arquivo enviado."
      );
    }

    const anexo = await prisma.anexoDenuncia.create({
      data: {
        denunciaId: denuncia.id,
        chave: dados.chave,
        nomeOriginal: dados.nomeOriginal,
        tipoMime: dados.tipoMime,
        tamanho: dados.tamanho,
        tipo: classificacao.tipo,
        visibilidade: classificacao.visibilidade,
      },
    });

    return montarAnexo(anexo);
  }
}