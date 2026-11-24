import {
  OrigemAtorDenuncia,
  PerfilUsuario,
  Prisma,
  StatusDenuncia,
  TipoAnexoDenuncia,
  VisibilidadeAnexoDenuncia,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

import {
  AnexoDenuncia,
  ConfirmarUploadDenunciaInput,
  Denuncia,
  DenunciaDetalhada,
  DenunciaPublica,
  DenunciaRelatorio,
  DenunciaResumo,
  EditarTratativaInput,
  LiberarTratativaInput,
  NovaTratativa,
  PrepararUploadDenunciaInput,
} from "@/src/core/model/Denuncia";


import {
  gerarUploadTemporario,
  gerarUrlDownload,
  validarArquivo,
  verificarArquivoNoBucket,
} from "@/src/lib/storage";

import {
  enviarEmailDirecionamentoTratativaCliente,
  enviarEmailNovaDenunciaMundial,
  enviarEmailPrazoTratativaVencidoCliente,
  enviarEmailTratativaClienteMundial,
} from "@/src/lib/email";

const LIMITE_ANEXOS_POR_DENUNCIA = 5;
const PRAZO_TRATATIVA_DIAS_UTEIS = 5;

const FERIADOS_TRATATIVA = new Set(
  String(process.env.DENUNCIAS_FERIADOS ?? "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
);

function chaveDataSaoPaulo(data: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const mapa = Object.fromEntries(
    partes.map((parte) => [parte.type, parte.value])
  );

  return `${mapa.year}-${mapa.month}-${mapa.day}`;
}

function ehDiaUtilTratativa(data: Date) {
  const diaSemana = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(data);

  if (diaSemana === "Sat" || diaSemana === "Sun") {
    return false;
  }

  return !FERIADOS_TRATATIVA.has(chaveDataSaoPaulo(data));
}

function adicionarDiasUteisTratativa(inicio: Date, quantidade: number) {
  const resultado = new Date(inicio);
  let restantes = Math.max(0, Math.trunc(quantidade));

  while (restantes > 0) {
    resultado.setUTCDate(resultado.getUTCDate() + 1);

    if (ehDiaUtilTratativa(resultado)) {
      restantes -= 1;
    }
  }

  return resultado;
}

function obterEmailResponsavel(colaborador: {
  email?: string | null;
  usuario?: { email?: string | null } | null;
} | null) {
  return (
    colaborador?.email?.trim().toLowerCase() ||
    colaborador?.usuario?.email?.trim().toLowerCase() ||
    null
  );
}

async function obterDestinatariosComiteEtica() {
  const integrantes =
    await prisma.usuario.findMany({
      where: {
        ativo:
          true,

        membroComiteEtica:
          true,

        /*
         * Garante que sejam usuários internos da Mundial,
         * e não usuários vinculados a um cliente.
         */
        clienteId:
          null,
      },

      orderBy: {
        nome:
          "asc",
      },

      select: {
        nome:
          true,

        email:
          true,
      },
    });

  return integrantes
    .map(
      integrante => ({
        nome:
          integrante.nome,

        email:
          integrante.email
            .trim()
            .toLowerCase(),
      })
    )
    .filter(
      integrante =>
        Boolean(
          integrante.email
        )
    );
}

async function tentarNotificarNovaDenunciaMundial(denunciaId: string) {
  try {
    const denuncia = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
      select: {
        id: true,
        protocolo: true,
        gravidade: true,
        criadoEm: true,
        cliente: { select: { nome: true, empresa: true } },
        categoria: { select: { nome: true } },
      },
    });

    if (!denuncia) return;

    const destinatarios =
      await obterDestinatariosComiteEtica();

    if (
      destinatarios.length ===
      0
    ) {
      console.warn(
        `Alerta da denúncia ${denuncia.protocolo} não enviado: nenhum integrante ativo do Comitê de Ética da Mundial possui e-mail cadastrado.`
      );

      return;
    }

    await enviarEmailNovaDenunciaMundial({
      denunciaId: denuncia.id,
      protocolo: denuncia.protocolo,
      clienteNome: denuncia.cliente.empresa || denuncia.cliente.nome,
      categoria: denuncia.categoria?.nome || null,
      gravidade: denuncia.gravidade,
      criadoEm: denuncia.criadoEm,
      destinatarios,
    });
  } catch (error) {
    console.error(
      "Erro ao enviar alerta de nova denúncia para a Mundial:",
      error
    );
  }
}

async function tentarNotificarTratativaClienteMundial(
  denunciaId: string,
  responsavelNome: string,
  tituloTratativa: string
) {
  try {
    const denuncia = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
      select: {
        id: true,
        protocolo: true,
        cliente: { select: { nome: true, empresa: true } },
      },
    });

    if (!denuncia) return;

    const destinatarios =
      await obterDestinatariosComiteEtica();

    if (
      destinatarios.length ===
      0
    ) {
      console.warn(
        `Alerta da tratativa da denúncia ${denuncia.protocolo} não enviado: nenhum integrante ativo do Comitê de Ética da Mundial possui e-mail cadastrado.`
      );

      return;
    }

    await enviarEmailTratativaClienteMundial({
      denunciaId: denuncia.id,
      protocolo: denuncia.protocolo,
      clienteNome: denuncia.cliente.empresa || denuncia.cliente.nome,
      responsavelNome,
      tituloTratativa,
      destinatarios,
    });
  } catch (error) {
    console.error(
      "Erro ao enviar alerta de tratativa do cliente para a Mundial:",
      error
    );
  }
}

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

function obterMensagemPublicaStatus(
  status: StatusDenuncia
): {
  titulo: string;
  descricao: string;
} {
  switch (status) {
    case "RECEBIDA":
      return {
        titulo: "Denúncia recebida",
        descricao:
          "A denúncia foi recebida com sucesso e aguarda análise inicial.",
      };

    case "EM_ANALISE":
      return {
        titulo: "Denúncia em análise",
        descricao:
          "A denúncia está sendo analisada pela equipe responsável.",
      };

    case "EM_TRATATIVA":
      return {
        titulo: "Denúncia em tratativa",
        descricao:
          "A análise inicial foi realizada e a denúncia está em processo de tratativa.",
      };

    case "CONCLUIDA":
      return {
        titulo: "Denúncia concluída",
        descricao:
          "A análise e as tratativas foram concluídas. Consulte a resposta pública disponibilizada.",
      };

    case "ARQUIVADA":
      return {
        titulo: "Denúncia arquivada",
        descricao:
          "O processamento desta denúncia foi encerrado e o registro foi arquivado.",
      };

    default:
      return {
        titulo: `Status alterado para ${formatarStatus(status)}`,
        descricao:
          "O andamento da denúncia foi atualizado.",
      };
  }
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
      gravidade: true,
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
  complemento?: string | null;
  exclusivaMundial: boolean;
};

async function validarRespostasPersonalizadas(
  clienteId: string,
  respostasRecebidas: Array<{
    perguntaId: string;
    resposta: string | boolean | null;
    complemento?: string | null;
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
        abrirComplementoSim: true,
        opcoes: true,
        exclusivaMundial: true,
      },
    });

  const idsPermitidos = new Set(
    perguntas.map((pergunta) => pergunta.id)
  );

  const mapaRespostas = new Map<
    string,
    {
      resposta: string | boolean | null;
      complemento?: string | null;
    }
  >();

  for (const item of respostasRecebidas) {
    if (!item.perguntaId?.trim()) {
      throw new Error(
        "Foi enviada uma resposta sem identificação da pergunta."
      );
    }

    if (!idsPermitidos.has(item.perguntaId)) {
      throw new Error(
        "Uma das perguntas enviadas não pertence ao canal deste cliente ou está inativa."
      );
    }

    if (mapaRespostas.has(item.perguntaId)) {
      throw new Error(
        "Foi enviada mais de uma resposta para a mesma pergunta."
      );
    }

    mapaRespostas.set(item.perguntaId, {
      resposta: item.resposta,
      complemento: textoOpcional(item.complemento),
    });
  }

  const respostasValidadas: RespostaPersonalizadaValidada[] = [];

  for (const pergunta of perguntas) {
    const itemRecebido = mapaRespostas.get(pergunta.id);

    const resposta = itemRecebido?.resposta ?? null;
    const complemento = textoOpcional(itemRecebido?.complemento);

    const vazia = respostaVazia(resposta);

    if (pergunta.obrigatoria && vazia) {
      throw new Error(
        `Responda à pergunta obrigatória: ${pergunta.enunciado}`
      );
    }

    if (vazia) {
      continue;
    }

    if (
      pergunta.tipo === "TEXTO" ||
      pergunta.tipo === "TEXTO_LONGO"
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
        perguntaId: pergunta.id,
        perguntaEnunciado: pergunta.enunciado,
        perguntaTipo: pergunta.tipo,
        resposta: resposta.trim(),
        complemento: null,
        exclusivaMundial:
          pergunta.exclusivaMundial,
      });

      continue;
    }

    if (pergunta.tipo === "SIM_NAO") {
      if (typeof resposta !== "boolean") {
        throw new Error(
          `Resposta inválida para: ${pergunta.enunciado}`
        );
      }

      respostasValidadas.push({
        perguntaId: pergunta.id,
        perguntaEnunciado: pergunta.enunciado,
        perguntaTipo: pergunta.tipo,
        resposta,
        complemento:
          resposta && pergunta.abrirComplementoSim
            ? complemento
            : null,
        exclusivaMundial:
          pergunta.exclusivaMundial,
      });

      continue;
    }

    if (pergunta.tipo === "MULTIPLA_ESCOLHA") {
      const opcoes = converterOpcoesJson(pergunta.opcoes);

      if (
        typeof resposta !== "string" ||
        !opcoes.includes(resposta)
      ) {
        throw new Error(
          `Resposta inválida para: ${pergunta.enunciado}`
        );
      }

      respostasValidadas.push({
        perguntaId: pergunta.id,
        perguntaEnunciado: pergunta.enunciado,
        perguntaTipo: pergunta.tipo,
        resposta,
        complemento: null,
        exclusivaMundial:
          pergunta.exclusivaMundial,
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
          gravidade:
            denuncia.categoria.gravidade,
          ativo: denuncia.categoria.ativo,
          ordem: denuncia.categoria.ordem,
        }
      : {
          id: "",
          nome: "Sem categoria",
          descricao:
            "Denúncia registrada antes da implantação das categorias.",
          gravidade: denuncia.gravidade,
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

    visualizadores: Array.isArray(denuncia.visualizadores)
      ? denuncia.visualizadores.map((vinculo: any) => ({
          id: vinculo.colaborador.id,
          nome: vinculo.colaborador.nome,
          email: vinculo.colaborador.email,
          cargo: vinculo.colaborador.cargo,
          setor: vinculo.colaborador.setor,
        }))
      : [],

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
    pessoaOuSetorDenunciado: denuncia.pessoaOuSetorDenunciado,
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
              complemento: resposta.complemento,
              exclusivaMundial:
                resposta.exclusivaMundial,
              criadoEm: resposta.criadoEm,
            })
          )
        : [],
  };

  return detalhada;
}

const includeDetalhadaMundial = {
  cliente: true,
  categoria: true,
  colaboradorResponsavel: true,
  visualizadores: {
    include: {
      colaborador: true,
    },
    orderBy: {
      criadoEm: "asc" as const,
    },
  },

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

        pessoaOuSetorDenunciado: textoOpcional(
          dados.pessoaOuSetorDenunciado
        ),

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

        gravidade: categoria.gravidade,
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
              "A denúncia foi recebida com sucesso e aguarda análise inicial.",
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

    await tentarNotificarNovaDenunciaMundial(denuncia.id);

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

    const anonima = dados.anonima ?? true;

    const denuncia = await prisma.denuncia.create({
      data: {
        clienteId: dados.clienteId,
        protocolo,
        titulo,
        descricao,
        categoriaId: categoria.id,

        pessoaOuSetorDenunciado: textoOpcional(
          dados.pessoaOuSetorDenunciado
        ),

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

        emailDenunciante: anonima
          ? null
          : textoOpcional(
              dados.emailDenunciante
            )?.toLowerCase() || null,

        telefoneDenunciante: anonima
          ? null
          : textoOpcional(dados.telefoneDenunciante),

        status: dados.status || "RECEBIDA",
        gravidade: categoria.gravidade,

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

    if (ator.origem !== "MUNDIAL") {
      await tentarNotificarNovaDenunciaMundial(denuncia.id);
    }

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
    protocolo: string;
  }) {
    const protocolo =
      dados.protocolo?.trim().toUpperCase();

    if (!protocolo) {
      throw new Error("Protocolo é obrigatório.");
    }

    const denuncia =
      await prisma.denuncia.findUnique({
        where: {
          protocolo,
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
      throw new Error(
        "Denúncia não encontrada. Verifique o protocolo informado."
      );
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

    const pessoaOuSetorDenunciado =
      denuncia.pessoaOuSetorDenunciado === undefined
        ? denunciaAtual.pessoaOuSetorDenunciado
        : textoOpcional(denuncia.pessoaOuSetorDenunciado);

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
          pessoaOuSetorDenunciado,
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
        const mensagemPublica =
          obterMensagemPublicaStatus(status);

        await tx.historicoDenuncia.create({
          data: {
            denunciaId: denuncia.id!,
            tipo: "STATUS_ALTERADO",
            titulo: mensagemPublica.titulo,
            descricao:
              status === "CONCLUIDA" && respostaPublica
                ? respostaPublica
                : mensagemPublica.descricao,
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
      throw new Error(
        "Denúncia não encontrada."
      );
    }

    if (
      dados.destino !== "MUNDIAL" &&
      dados.destino !== "COLABORADOR"
    ) {
      throw new Error(
        "Destino da tratativa inválido."
      );
    }

    const denuncia =
      await prisma.denuncia.findUnique({
        where: {
          id:
            dados.denunciaId,
        },

        select: {
          id:
            true,

          clienteId:
            true,

          tratativaLiberada:
            true,

          destinoTratativa:
            true,

          colaboradorResponsavelId:
            true,

          status:
            true,

          prazoTratativaEm:
            true,

          visualizadores: {
            select: {
              colaboradorId:
                true,
            },
          },

          tratativas: {
            select: {
              id:
                true,
            },

            take:
              1,
          },
        },
      });

    if (!denuncia) {
      throw new Error(
        "Denúncia não encontrada."
      );
    }

    if (
      denuncia.status ===
        "CONCLUIDA" ||
      denuncia.status ===
        "ARQUIVADA"
    ) {
      throw new Error(
        "Não é possível adicionar responsáveis enquanto a denúncia estiver concluída ou arquivada."
      );
    }

    const possuiTratativas =
      denuncia.tratativas.length >
      0;

    /*
     * Depois que já existe uma tratativa:
     *
     * - o destino principal é preservado;
     * - se o destino principal for Comitê, o integrante
     *   principal também é preservado;
     * - a Mundial pode apenas acrescentar novos
     *   co-responsáveis do Comitê de Ética.
     *
     * Isso permite atuação conjunta Mundial + Comitê
     * sem reescrever a responsabilidade histórica.
     */
    if (
      possuiTratativas
    ) {
      if (
        !denuncia.tratativaLiberada ||
        !denuncia.destinoTratativa
      ) {
        throw new Error(
          "A denúncia não possui um direcionamento válido."
        );
      }

      if (
        dados.destino !==
        denuncia.destinoTratativa
      ) {
        throw new Error(
          "Depois que existem tratativas, o responsável principal da denúncia não pode mais ser alterado. É permitido apenas adicionar integrantes do Comitê de Ética como co-responsáveis."
        );
      }

      if (
        denuncia.destinoTratativa ===
          "COLABORADOR" &&
        (
          !denuncia.colaboradorResponsavelId ||
          dados.colaboradorId?.trim() !==
            denuncia.colaboradorResponsavelId
        )
      ) {
        throw new Error(
          "Depois que existem tratativas, o integrante principal não pode mais ser alterado."
        );
      }
    }

    let colaboradorPrincipal:
      | {
          id: string;
          nome: string;
          email: string | null;
          usuario: {
            email: string | null;
          } | null;
        }
      | null =
      null;

    if (
      dados.destino ===
      "COLABORADOR"
    ) {
      if (
        !dados.colaboradorId?.trim()
      ) {
        throw new Error(
          "Selecione o integrante principal responsável pela tratativa."
        );
      }

      colaboradorPrincipal =
        await prisma.colaboradorCliente.findFirst({
          where: {
            id:
              dados.colaboradorId,

            clienteId:
              denuncia.clienteId,

            ativo:
              true,

            podeTratarDenuncias:
              true,

            podeVerDenuncias:
              true,
          },

          select: {
            id:
              true,

            nome:
              true,

            email:
              true,

            usuario: {
              select: {
                email:
                  true,
              },
            },
          },
        });

      if (
        !colaboradorPrincipal
      ) {
        throw new Error(
          "O integrante principal selecionado não pertence ao cliente ou não possui permissão para tratar denúncias."
        );
      }

      if (
        !obterEmailResponsavel(
          colaboradorPrincipal
        )
      ) {
        throw new Error(
          "O integrante principal precisa possuir um e-mail cadastrado."
        );
      }
    }

    const permiteCoResponsaveis =
      dados.destino ===
        "COLABORADOR" ||
      (
        possuiTratativas &&
        denuncia.destinoTratativa ===
          "MUNDIAL" &&
        dados.destino ===
          "MUNDIAL"
      );

    const idsAdicionaisRecebidos =
      permiteCoResponsaveis
        ? Array.from(
            new Set(
              (
                dados.visualizadorIds ||
                []
              )
                .map(
                  id =>
                    id?.trim()
                )
                .filter(
                  (
                    id
                  ): id is string =>
                    Boolean(
                      id
                    )
                )
            )
          ).filter(
            id =>
              id !==
              colaboradorPrincipal?.id
          )
        : [];

    const idsAdicionaisAtuais =
      denuncia.visualizadores.map(
        item =>
          item.colaboradorId
      );

    /*
     * Quando já há tratativas, os responsáveis que
     * já participaram do fluxo não podem ser removidos.
     * A operação passa a ser exclusivamente aditiva.
     */
    if (
      possuiTratativas
    ) {
      const idsRecebidosSet =
        new Set(
          idsAdicionaisRecebidos
        );

      const tentouRemover =
        idsAdicionaisAtuais.some(
          id =>
            !idsRecebidosSet.has(
              id
            )
        );

      if (
        tentouRemover
      ) {
        throw new Error(
          "Depois que existem tratativas, integrantes já autorizados não podem ser removidos. É permitido apenas adicionar novos integrantes."
        );
      }
    }

    const colaboradoresAdicionais =
      idsAdicionaisRecebidos.length >
      0
        ? await prisma.colaboradorCliente.findMany({
            where: {
              id: {
                in:
                  idsAdicionaisRecebidos,
              },

              clienteId:
                denuncia.clienteId,

              ativo:
                true,

              podeVerDenuncias:
                true,

              podeTratarDenuncias:
                true,
            },

            select: {
              id:
                true,

              nome:
                true,

              email:
                true,

              usuario: {
                select: {
                  email:
                    true,
                },
              },
            },
          })
        : [];

    if (
      colaboradoresAdicionais.length !==
      idsAdicionaisRecebidos.length
    ) {
      throw new Error(
        "Um ou mais integrantes adicionais são inválidos ou não possuem permissão para tratar denúncias."
      );
    }

    for (
      const colaborador of
      colaboradoresAdicionais
    ) {
      if (
        !obterEmailResponsavel(
          colaborador
        )
      ) {
        throw new Error(
          `O integrante ${colaborador.nome} precisa possuir um e-mail cadastrado.`
        );
      }
    }

    const idsAdicionaisAtuaisSet =
      new Set(
        idsAdicionaisAtuais
      );

    const novosColaboradoresAdicionais =
      colaboradoresAdicionais.filter(
        colaborador =>
          !idsAdicionaisAtuaisSet.has(
            colaborador.id
          )
      );

    /*
     * Fluxo posterior:
     * se já existe tratativa, não reescrevemos
     * direcionamento, prazo ou responsáveis anteriores.
     * Apenas acrescentamos novos co-responsáveis.
     */
    if (
      possuiTratativas
    ) {
      if (
        novosColaboradoresAdicionais.length ===
        0
      ) {
        return this.obterPorId(
          denuncia.id
        );
      }

      await prisma.$transaction(
        async tx => {
          await tx.denunciaVisualizador.createMany({
            data:
              novosColaboradoresAdicionais.map(
                colaborador => ({
                  denunciaId:
                    denuncia.id,

                  colaboradorId:
                    colaborador.id,
                })
              ),

            skipDuplicates:
              true,
          });

          await tx.historicoDenuncia.create({
            data: {
              denunciaId:
                denuncia.id,

              tipo:
                "RESPONSAVEL_ATRIBUIDO",

              titulo:
                "Novos integrantes autorizados para a tratativa",

              descricao:
                denuncia.destinoTratativa ===
                  "MUNDIAL"
                  ? `A Mundial permanece responsável pelo caso e autorizou também os seguintes integrantes do Comitê de Ética do cliente para realizar novas tratativas: ${novosColaboradoresAdicionais
                      .map(
                        colaborador =>
                          colaborador.nome
                      )
                      .join(
                        ", "
                      )}.`
                  : `A Mundial adicionou os seguintes integrantes do Comitê de Ética do cliente para realizar novas tratativas: ${novosColaboradoresAdicionais
                      .map(
                        colaborador =>
                          colaborador.nome
                      )
                      .join(
                        ", "
                      )}.`,

              statusNovo:
                denuncia.status,

              origemAtor:
                ator.origem,

              atorId:
                ator.usuarioId,

              atorNome:
                ator.nome,

              visivelPublicamente:
                false,
            },
          });
        }
      );

      /*
       * A inclusão posterior não reinicia o SLA global
       * de 5 dias úteis, pois já existe uma tratativa.
       * O e-mail é enviado sem novo prazo.
       */
      try {
        const dadosEmail =
          await prisma.denuncia.findUnique({
            where: {
              id:
                denuncia.id,
            },

            select: {
              id:
                true,

              protocolo:
                true,

              cliente: {
                select: {
                  nome:
                    true,

                  empresa:
                    true,
                },
              },
            },
          });

        if (
          dadosEmail
        ) {
          for (
            const responsavel of
            novosColaboradoresAdicionais
          ) {
            const responsavelEmail =
              obterEmailResponsavel(
                responsavel
              );

            if (
              !responsavelEmail
            ) {
              continue;
            }

            try {
              await enviarEmailDirecionamentoTratativaCliente({
                denunciaId:
                  dadosEmail.id,

                protocolo:
                  dadosEmail.protocolo,

                clienteNome:
                  dadosEmail.cliente.empresa ||
                  dadosEmail.cliente.nome,

                responsavelNome:
                  responsavel.nome,

                responsavelEmail,

                prazoTratativaEm:
                  null,
              });
            } catch (
              error
            ) {
              console.error(
                `Erro ao enviar e-mail de nova atribuição da denúncia ${dadosEmail.protocolo} para ${responsavel.nome}:`,
                error
              );
            }
          }
        }
      } catch (
        error
      ) {
        console.error(
          "Erro ao preparar e-mails dos novos responsáveis da tratativa:",
          error
        );
      }

      return this.obterPorId(
        denuncia.id
      );
    }

    /*
     * Primeira liberação / edição antes de existir tratativa:
     * mantém o comportamento completo de configuração.
     */
    const colaboradorPrincipalId =
      colaboradorPrincipal?.id ||
      null;

    const idsAdicionaisNovos =
      colaboradoresAdicionais
        .map(
          colaborador =>
            colaborador.id
        )
        .sort();

    const idsAtuaisOrdenados =
      [...idsAdicionaisAtuais]
        .sort();

    const adicionaisAlterados =
      idsAtuaisOrdenados.length !==
        idsAdicionaisNovos.length ||
      idsAtuaisOrdenados.some(
        (
          id,
          indice
        ) =>
          id !==
          idsAdicionaisNovos[
            indice
          ]
      );

    const primeiraLiberacao =
      !denuncia.tratativaLiberada;

    const direcionamentoAlterado =
      denuncia.tratativaLiberada &&
      (
        denuncia.destinoTratativa !==
          dados.destino ||
        denuncia.colaboradorResponsavelId !==
          colaboradorPrincipalId ||
        adicionaisAlterados
      );

    if (
      !primeiraLiberacao &&
      !direcionamentoAlterado
    ) {
      return this.obterPorId(
        denuncia.id
      );
    }

    const novoStatus:
      StatusDenuncia =
      "EM_TRATATIVA";

    const momentoDirecionamento =
      new Date();

    const prazoTratativaEm =
      dados.destino ===
      "COLABORADOR"
        ? adicionarDiasUteisTratativa(
            momentoDirecionamento,
            PRAZO_TRATATIVA_DIAS_UTEIS
          )
        : null;

    await prisma.$transaction(
      async tx => {
        await tx.denuncia.update({
          where: {
            id:
              denuncia.id,
          },

          data: {
            tratativaLiberada:
              true,

            destinoTratativa:
              dados.destino,

            colaboradorResponsavelId:
              colaboradorPrincipalId,

            tratativaLiberadaEm:
              momentoDirecionamento,

            tratativaLiberadaPorUsuarioId:
              ator.usuarioId ||
              null,

            prazoTratativaEm,

            alertaPrazoTratativaEnviadoEm:
              null,

            status:
              novoStatus,
          },
        });

        await tx.denunciaVisualizador.deleteMany({
          where: {
            denunciaId:
              denuncia.id,
          },
        });

        if (
          colaboradoresAdicionais.length >
          0
        ) {
          await tx.denunciaVisualizador.createMany({
            data:
              colaboradoresAdicionais.map(
                colaborador => ({
                  denunciaId:
                    denuncia.id,

                  colaboradorId:
                    colaborador.id,
                })
              ),
          });
        }

        const nomesAdicionais =
          colaboradoresAdicionais
            .map(
              colaborador =>
                colaborador.nome
            )
            .join(
              ", "
            );

        await tx.historicoDenuncia.create({
          data: {
            denunciaId:
              denuncia.id,

            tipo:
              "RESPONSAVEL_ATRIBUIDO",

            titulo:
              primeiraLiberacao
                ? dados.destino ===
                  "MUNDIAL"
                  ? "Tratativa liberada para a Mundial"
                  : "Tratativa direcionada ao Comitê de Ética do cliente"
                : "Responsáveis da tratativa atualizados",

            descricao:
              dados.destino ===
              "MUNDIAL"
                ? "A Mundial será a responsável pelas tratativas desta denúncia."
                : [
                    `${colaboradorPrincipal?.nome} será o integrante principal responsável pela tratativa.`,
                    colaboradoresAdicionais.length >
                    0
                      ? `Também poderão registrar e editar tratativas: ${nomesAdicionais}.`
                      : "Nenhum integrante adicional foi autorizado para a tratativa.",
                  ].join(
                    " "
                  ),

            statusNovo:
              novoStatus,

            origemAtor:
              ator.origem,

            atorId:
              ator.usuarioId,

            atorNome:
              ator.nome,

            visivelPublicamente:
              false,
          },
        });

        if (
          denuncia.status !==
          novoStatus
        ) {
          const mensagemPublica =
            obterMensagemPublicaStatus(
              novoStatus
            );

          await tx.historicoDenuncia.create({
            data: {
              denunciaId:
                denuncia.id,

              tipo:
                "STATUS_ALTERADO",

              titulo:
                mensagemPublica.titulo,

              descricao:
                mensagemPublica.descricao,

              statusAnterior:
                denuncia.status,

              statusNovo:
                novoStatus,

              origemAtor:
                ator.origem,

              atorId:
                ator.usuarioId,

              atorNome:
                ator.nome,

              visivelPublicamente:
                true,
            },
          });
        }
      }
    );

    if (
      dados.destino ===
        "COLABORADOR" &&
      colaboradorPrincipal &&
      prazoTratativaEm
    ) {
      try {
        const dadosEmail =
          await prisma.denuncia.findUnique({
            where: {
              id:
                denuncia.id,
            },

            select: {
              id:
                true,

              protocolo:
                true,

              cliente: {
                select: {
                  nome:
                    true,

                  empresa:
                    true,
                },
              },
            },
          });

        if (
          dadosEmail
        ) {
          const destinatarios = [
            colaboradorPrincipal,
            ...colaboradoresAdicionais,
          ];

          for (
            const responsavel of
            destinatarios
          ) {
            const responsavelEmail =
              obterEmailResponsavel(
                responsavel
              );

            if (
              !responsavelEmail
            ) {
              continue;
            }

            try {
              await enviarEmailDirecionamentoTratativaCliente({
                denunciaId:
                  dadosEmail.id,

                protocolo:
                  dadosEmail.protocolo,

                clienteNome:
                  dadosEmail.cliente.empresa ||
                  dadosEmail.cliente.nome,

                responsavelNome:
                  responsavel.nome,

                responsavelEmail,

                prazoTratativaEm,
              });
            } catch (
              error
            ) {
              console.error(
                `Erro ao enviar e-mail de direcionamento da denúncia ${dadosEmail.protocolo} para ${responsavel.nome}:`,
                error
              );
            }
          }
        }
      } catch (
        error
      ) {
        console.error(
          "Erro ao preparar os e-mails de direcionamento da tratativa ao cliente:",
          error
        );
      }
    }

    return this.obterPorId(
      denuncia.id
    );
  }

  private static validarPermissaoTratativa(
    denuncia: {
      tratativaLiberada: boolean;
      destinoTratativa:
        | "MUNDIAL"
        | "COLABORADOR"
        | null;
      colaboradorResponsavelId:
        | string
        | null;
      visualizadores?: Array<{
        colaboradorId: string;
      }>;
    },
    ator: AtorDenuncia,
    colaboradorId?: string | null
  ) {
    if (!denuncia.tratativaLiberada) {
      throw new Error(
        "A tratativa ainda não foi liberada pela Mundial."
      );
    }

    if (
      denuncia.destinoTratativa ===
      "MUNDIAL"
    ) {
      if (
        ator.origem ===
        "MUNDIAL"
      ) {
        return;
      }

      const coResponsavelComite =
        Boolean(
          colaboradorId &&
          (
            denuncia.visualizadores ||
            []
          ).some(
            item =>
              item.colaboradorId ===
              colaboradorId
          )
        );

      if (
        !coResponsavelComite
      ) {
        throw new Error(
          "Esta denúncia está sob responsabilidade da Mundial e não foi compartilhada com este integrante do Comitê de Ética."
        );
      }

      return;
    }

    if (
      denuncia.destinoTratativa ===
      "COLABORADOR"
    ) {
      const responsavelPrincipal =
        Boolean(
          colaboradorId &&
          colaboradorId ===
            denuncia.colaboradorResponsavelId
        );

      const responsavelAdicional =
        Boolean(
          colaboradorId &&
          (denuncia.visualizadores || []).some(
            item =>
              item.colaboradorId ===
              colaboradorId
          )
        );

      if (
        ator.origem ===
          "MUNDIAL" ||
        !colaboradorId ||
        (
          !responsavelPrincipal &&
          !responsavelAdicional
        )
      ) {
        throw new Error(
          "Esta denúncia não está liberada para este integrante realizar tratativas."
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
      throw new Error(
        "Denúncia não encontrada."
      );
    }

    const denuncia =
      await prisma.denuncia.findUnique({
        where: {
          id:
            denunciaId,
        },

        select: {
          id:
            true,

          clienteId:
            true,

          tratativaLiberada:
            true,

          destinoTratativa:
            true,

          colaboradorResponsavelId:
            true,

          status:
            true,

          visualizadores: {
            select: {
              colaboradorId:
                true,
            },
          },
        },
      });

    if (!denuncia) {
      throw new Error(
        "Denúncia não encontrada."
      );
    }

    this.validarPermissaoTratativa(
      denuncia,
      ator,
      colaboradorId
    );

    const titulo =
      tratativa.titulo?.trim();

    const descricao =
      tratativa.descricao?.trim();

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

    await prisma.$transaction(
      async tx => {
        await tx.tratativaDenuncia.create({
          data: {
            denunciaId,

            titulo,

            descricao,

            /*
             * Em tratativas do cliente, grava quem realmente
             * executou a ação, inclusive quando for um dos
             * co-responsáveis adicionais.
             */
            responsavelId:
              colaboradorId ||
              null,

            criadoPorUsuarioId:
              ator.usuarioId ||
              null,

            criadoPorNome:
              ator.nome,

            criadoPorPerfil:
              ator.perfil ||
              null,

            atualizadoPorUsuarioId:
              ator.usuarioId ||
              null,

            atualizadoPorNome:
              ator.nome,
          },
        });

        await tx.denuncia.update({
          where: {
            id:
              denunciaId,
          },

          data: {
            status:
              "EM_TRATATIVA",
          },
        });

        await tx.historicoDenuncia.create({
          data: {
            denunciaId,

            tipo:
              "TRATATIVA_CRIADA",

            titulo:
              "Tratativa interna registrada",

            origemAtor:
              ator.origem,

            atorId:
              ator.usuarioId,

            atorNome:
              ator.nome,

            visivelPublicamente:
              false,
          },
        });

        if (
          denuncia.status !==
          "EM_TRATATIVA"
        ) {
          const mensagemPublica =
            obterMensagemPublicaStatus(
              "EM_TRATATIVA"
            );

          await tx.historicoDenuncia.create({
            data: {
              denunciaId,

              tipo:
                "STATUS_ALTERADO",

              titulo:
                mensagemPublica.titulo,

              descricao:
                mensagemPublica.descricao,

              statusAnterior:
                denuncia.status,

              statusNovo:
                "EM_TRATATIVA",

              origemAtor:
                ator.origem,

              atorId:
                ator.usuarioId,

              atorNome:
                ator.nome,

              visivelPublicamente:
                true,
            },
          });
        }
      }
    );

    if (
      (
        ator.origem ===
          "COMITE_CLIENTE" ||
        ator.origem ===
          "CLIENTE"
      ) &&
      colaboradorId
    ) {
      await tentarNotificarTratativaClienteMundial(
        denunciaId,
        ator.nome,
        titulo
      );
    }

    if (
      ator.origem ===
        "COMITE_CLIENTE" &&
      colaboradorId
    ) {
      return this.obterPorIdECliente(
        denunciaId,
        denuncia.clienteId,
        {
          colaboradorId,
          podeVerTratativas:
            true,
        }
      );
    }

    return this.obterPorId(
      denunciaId
    );
  }

  static async editarTratativa(
    dados: EditarTratativaInput,
    ator: AtorDenuncia,
    colaboradorId?: string | null
  ): Promise<DenunciaDetalhada> {
    const tratativaAtual =
      await prisma.tratativaDenuncia.findFirst({
        where: {
          id:
            dados.id,

          denunciaId:
            dados.denunciaId,
        },

        include: {
          denuncia: {
            select: {
              clienteId:
                true,

              tratativaLiberada:
                true,

              destinoTratativa:
                true,

              colaboradorResponsavelId:
                true,

              visualizadores: {
                select: {
                  colaboradorId:
                    true,
                },
              },
            },
          },
        },
      });

    if (!tratativaAtual) {
      throw new Error(
        "Tratativa não encontrada."
      );
    }

    this.validarPermissaoTratativa(
      tratativaAtual.denuncia,
      ator,
      colaboradorId
    );

    const titulo =
      dados.titulo?.trim();

    const descricao =
      dados.descricao?.trim();

    if (
      !titulo ||
      !descricao
    ) {
      throw new Error(
        "Título e descrição da tratativa são obrigatórios."
      );
    }

    await prisma.$transaction(
      async tx => {
        await tx.tratativaDenuncia.update({
          where: {
            id:
              dados.id,
          },

          data: {
            titulo,

            descricao,

            atualizadoPorUsuarioId:
              ator.usuarioId ||
              null,

            atualizadoPorNome:
              ator.nome,
          },
        });

        await tx.historicoDenuncia.create({
          data: {
            denunciaId:
              dados.denunciaId,

            tipo:
              "TRATATIVA_EDITADA",

            titulo:
              "Tratativa interna atualizada",

            origemAtor:
              ator.origem,

            atorId:
              ator.usuarioId,

            atorNome:
              ator.nome,

            visivelPublicamente:
              false,
          },
        });
      }
    );

    if (
      ator.origem ===
        "COMITE_CLIENTE" &&
      colaboradorId
    ) {
      return this.obterPorIdECliente(
        dados.denunciaId,
        tratativaAtual.denuncia.clienteId,
        {
          colaboradorId,
          podeVerTratativas:
            true,
        }
      );
    }

    return this.obterPorId(
      dados.denunciaId
    );
  }

  static async processarAlertasPrazoTratativaVencido() {
    const agora =
      new Date();

    const denuncias =
      await prisma.denuncia.findMany({
        where: {
          tratativaLiberada:
            true,

          destinoTratativa:
            "COLABORADOR",

          colaboradorResponsavelId: {
            not:
              null,
          },

          prazoTratativaEm: {
            lte:
              agora,
          },

          alertaPrazoTratativaEnviadoEm:
            null,

          status: {
            notIn: [
              StatusDenuncia.CONCLUIDA,
              StatusDenuncia.ARQUIVADA,
            ],
          },

          tratativas: {
            none: {},
          },
        },

        select: {
          id:
            true,

          protocolo:
            true,

          prazoTratativaEm:
            true,

          cliente: {
            select: {
              nome:
                true,

              empresa:
                true,
            },
          },

          colaboradorResponsavel: {
            select: {
              id:
                true,

              nome:
                true,

              email:
                true,

              usuario: {
                select: {
                  email:
                    true,
                },
              },
            },
          },

          /*
           * Relação histórica chamada visualizadores.
           * Agora estes integrantes também podem tratar a denúncia.
           */
          visualizadores: {
            select: {
              colaborador: {
                select: {
                  id:
                    true,

                  nome:
                    true,

                  email:
                    true,

                  usuario: {
                    select: {
                      email:
                        true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    let enviados =
      0;

    let emailsEnviados =
      0;

    let falhas =
      0;

    let semEmail =
      0;

    for (
      const denuncia of
      denuncias
    ) {
      if (
        !denuncia.prazoTratativaEm
      ) {
        continue;
      }

      const mapaResponsaveis =
        new Map<
          string,
          {
            id: string;
            nome: string;
            email: string | null;
            usuario: {
              email: string | null;
            } | null;
          }
        >();

      if (
        denuncia.colaboradorResponsavel
      ) {
        mapaResponsaveis.set(
          denuncia.colaboradorResponsavel.id,
          denuncia.colaboradorResponsavel
        );
      }

      for (
        const vinculo of
        denuncia.visualizadores
      ) {
        mapaResponsaveis.set(
          vinculo.colaborador.id,
          vinculo.colaborador
        );
      }

      let houveEnvio =
        false;

      for (
        const responsavel of
        mapaResponsaveis.values()
      ) {
        const emailResponsavel =
          obterEmailResponsavel(
            responsavel
          );

        if (!emailResponsavel) {
          semEmail +=
            1;

          console.warn(
            `Alerta de prazo não enviado para ${denuncia.protocolo}: ${responsavel.nome} está sem e-mail cadastrado.`
          );

          continue;
        }

        try {
          await enviarEmailPrazoTratativaVencidoCliente({
            denunciaId:
              denuncia.id,

            protocolo:
              denuncia.protocolo,

            clienteNome:
              denuncia.cliente.empresa ||
              denuncia.cliente.nome,

            responsavelNome:
              responsavel.nome,

            responsavelEmail:
              emailResponsavel,

            prazoTratativaEm:
              denuncia.prazoTratativaEm,
          });

          emailsEnviados +=
            1;

          houveEnvio =
            true;
        } catch (error) {
          falhas +=
            1;

          console.error(
            `Erro ao enviar alerta de prazo vencido da denúncia ${denuncia.protocolo} para ${responsavel.nome}:`,
            error
          );
        }
      }

      if (!houveEnvio) {
        continue;
      }

      const atualizado =
        await prisma.denuncia.updateMany({
          where: {
            id:
              denuncia.id,

            alertaPrazoTratativaEnviadoEm:
              null,

            tratativas: {
              none: {},
            },
          },

          data: {
            alertaPrazoTratativaEnviadoEm:
              new Date(),
          },
        });

      if (
        atualizado.count >
        0
      ) {
        enviados +=
          1;
      }
    }

    return {
      analisadas:
        denuncias.length,

      enviados,

      emailsEnviados,

      falhas,

      semEmail,
    };
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
        visualizadores: {
          include: {
            colaborador: true,
          },
        },

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
        visualizadores: {
          include: {
            colaborador: true,
          },
        },

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
  ): Promise<DenunciaRelatorio[]> {
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
                        gte:
                          inicio,
                      }
                    : {}),

                  ...(fim
                    ? {
                        lte:
                          fim,
                      }
                    : {}),
                },
              }
            : {}),

          ...(filtro.colaboradorId
            ? {
                tratativaLiberada:
                  true,

                OR: [
                  {
                    destinoTratativa:
                      "COLABORADOR",

                    colaboradorResponsavelId:
                      filtro.colaboradorId,
                  },
                  {
                    visualizadores: {
                      some: {
                        colaboradorId:
                          filtro.colaboradorId,
                      },
                    },
                  },
                ],
              }
            : {}),
        },

        orderBy: [
          {
            gravidade:
              "desc",
          },
          {
            criadoEm:
              "desc",
          },
        ],

        include: {
          cliente:
            true,

          categoria:
            true,

          colaboradorResponsavel:
            true,

          visualizadores: {
            include: {
              colaborador:
                true,
            },
          },

          /*
           * O relatório exibe somente o histórico
           * disponibilizado no acompanhamento da denúncia.
           *
           * Tratativas internas, mudanças internas de
           * classificação e demais eventos restritos
           * continuam fora do relatório.
           */
          historico: {
            where: {
              visivelPublicamente:
                true,
            },

            orderBy: {
              criadoEm:
                "asc",
            },

            select: {
              id:
                true,

              tipo:
                true,

              titulo:
                true,

              descricao:
                true,

              statusAnterior:
                true,

              statusNovo:
                true,

              criadoEm:
                true,
            },
          },

          _count: {
            select: {
              anexos:
                true,
            },
          },
        },
      });

    return denuncias.map(
      (denuncia): DenunciaRelatorio => ({
        ...montarResumo(
          denuncia
        ),

        respostaPublica:
          denuncia.respostaPublica ||
          null,

        historico:
          denuncia.historico.map(
            evento => ({
              id:
                evento.id,

              tipo:
                evento.tipo,

              titulo:
                evento.titulo,

              descricao:
                evento.descricao,

              statusAnterior:
                evento.statusAnterior,

              statusNovo:
                evento.statusNovo,

              criadoEm:
                evento.criadoEm,
            })
          ),
      })
    );
  }

  static async obterPorClienteMaster(
    clienteId: string
  ): Promise<Array<{
    id: string;
    clienteId: string;
    protocolo: string;
    status: StatusDenuncia;
    criadoEm: Date;
    atualizadoEm: Date;
    cliente: {
      id: string;
      nome: string;
      empresa: string | null;
    };
  }>> {
    if (!clienteId?.trim()) {
      throw new Error("Cliente é obrigatório.");
    }

    return prisma.denuncia.findMany({
      where: {
        clienteId,
      },
      orderBy: {
        criadoEm: "desc",
      },
      select: {
        id: true,
        clienteId: true,
        protocolo: true,
        status: true,
        criadoEm: true,
        atualizadoEm: true,
        cliente: {
          select: {
            id: true,
            nome: true,
            empresa: true,
          },
        },
      },
    });
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
        OR: [
          {
            destinoTratativa: "COLABORADOR",
            colaboradorResponsavelId: colaboradorId,
          },
          {
            visualizadores: {
              some: {
                colaboradorId,
              },
            },
          },
        ],
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
        visualizadores: {
          include: {
            colaborador: true,
          },
        },

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

  static async obterAcessoColaboradorNaDenuncia(
    denunciaId: string,
    clienteId: string,
    colaboradorId: string
  ): Promise<{
    possuiAcesso: boolean;
    responsavelPrincipal: boolean;
    visualizadorAdicional: boolean;
  }> {
    if (!denunciaId?.trim()) {
      throw new Error(
        "Denúncia não informada."
      );
    }

    if (!clienteId?.trim()) {
      throw new Error(
        "Cliente não informado."
      );
    }

    if (!colaboradorId?.trim()) {
      throw new Error(
        "Colaborador não informado."
      );
    }

    const denuncia =
      await prisma.denuncia.findFirst({
        where: {
          id:
            denunciaId,

          clienteId,

          tratativaLiberada:
            true,
        },

        select: {
          destinoTratativa:
            true,

          colaboradorResponsavelId:
            true,

          visualizadores: {
            where: {
              colaboradorId,
            },

            select: {
              colaboradorId:
                true,
            },

            take:
              1,
          },
        },
      });

    if (!denuncia) {
      return {
        possuiAcesso:
          false,

        responsavelPrincipal:
          false,

        visualizadorAdicional:
          false,
      };
    }

    const ehPrincipal =
      denuncia.destinoTratativa ===
        "COLABORADOR" &&
      denuncia.colaboradorResponsavelId ===
        colaboradorId;

    const ehAdicional =
      denuncia.visualizadores.length >
      0;

    const possuiAcesso =
      ehPrincipal ||
      ehAdicional;

    return {
      possuiAcesso,

      /*
       * Mantido por compatibilidade com as camadas já existentes.
       * A partir desta regra, qualquer integrante autorizado
       * é considerado responsável para fins de permissão.
       */
      responsavelPrincipal:
        possuiAcesso,

      /*
       * Nome legado do vínculo N:N. Agora indica que o usuário
       * é um co-responsável adicional, e não somente visualizador.
       */
      visualizadorAdicional:
        ehAdicional,
    };
  }

  static async obterPorIdECliente(
    id: string,
    clienteId: string,
    opcoes: OpcoesVisualizacaoCliente = {}
  ): Promise<DenunciaDetalhada> {
    const denunciaId = id?.trim();
    const clienteIdNormalizado = clienteId?.trim();
    const colaboradorId =
      opcoes.colaboradorId?.trim() || null;

    if (!denunciaId) {
      throw new Error("Denúncia não encontrada.");
    }

    if (!clienteIdNormalizado) {
      throw new Error("Cliente é obrigatório.");
    }

    if (!colaboradorId) {
      throw new Error(
        "O perfil master do cliente não possui acesso aos detalhes das denúncias."
      );
    }

    const acesso =
      await this.obterAcessoColaboradorNaDenuncia(
        denunciaId,
        clienteIdNormalizado,
        colaboradorId
      );

    if (!acesso.possuiAcesso) {
      throw new Error(
        "Denúncia não encontrada ou não liberada para este colaborador."
      );
    }

    /*
     * Todos os integrantes autorizados pela Mundial podem
     * visualizar as tratativas. A flag da camada superior
     * continua necessária como segunda barreira de permissão.
     */
    const podeVerTratativas =
      opcoes.podeVerTratativas === true &&
      acesso.possuiAcesso;

    const denuncia = await prisma.denuncia.findFirst({
      where: {
        id: denunciaId,
        clienteId: clienteIdNormalizado,
        tratativaLiberada: true,
        OR: [
          {
            destinoTratativa: "COLABORADOR",
            colaboradorResponsavelId: colaboradorId,
          },
          {
            visualizadores: {
              some: {
                colaboradorId,
              },
            },
          },
        ],
      },

      include: {
        cliente: true,
        categoria: true,
        colaboradorResponsavel: true,

        visualizadores: {
          include: {
            colaborador: true,
          },
          orderBy: {
            criadoEm: "asc",
          },
        },

        anexos: {
          where: {
            visibilidade: "MUNDIAL_E_COMITE",
          },
          orderBy: {
            criadoEm: "asc",
          },
        },

        tratativas: podeVerTratativas
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
          where: {
            exclusivaMundial:
              false,

            OR: [
              {
                perguntaId:
                  null,
              },

              {
                pergunta: {
                  is: {
                    exclusivaMundial:
                      false,
                  },
                },
              },
            ],
          },

          orderBy: {
            criadoEm: "asc",
          },
        },

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

    if (!denuncia) {
      throw new Error(
        "Denúncia não encontrada ou não liberada para este colaborador."
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