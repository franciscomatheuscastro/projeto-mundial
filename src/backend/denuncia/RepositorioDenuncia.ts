import { GravidadeDenuncia } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

import {
  AnexoDenuncia,
  ConfirmarUploadDenunciaInput,
  Denuncia,
  DenunciaDetalhada,
  DenunciaPublica,
  DenunciaResumo,
  PrepararUploadDenunciaInput,
  TratativaDenuncia,
} from "@/src/core/model/Denuncia";

import RepositorioCriticidadeDenuncia from "../criticidadeDenuncia/RepositorioCriticidadeDenuncia";

import {
  gerarUploadTemporario,
  gerarUrlDownload,
  validarArquivo,
  verificarArquivoNoBucket,
} from "@/src/lib/storage";

const LIMITE_ANEXOS_POR_DENUNCIA = 5;

function gerarProtocolo() {
  const data = new Date();
  const ano = data.getFullYear();
  const numero = Math.floor(100000 + Math.random() * 900000);

  return `DEN-${ano}-${numero}`;
}

async function gerarProtocoloUnico() {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const protocolo = gerarProtocolo();

    const denunciaExistente = await prisma.denuncia.findUnique({
      where: {
        protocolo,
      },
      select: {
        id: true,
      },
    });

    if (!denunciaExistente) {
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

function montarResumo(denuncia: any): DenunciaResumo {
  const quantidadeAnexos =
    denuncia._count?.anexos ??
    (Array.isArray(denuncia.anexos) ? denuncia.anexos.length : 0);

  return {
    id: denuncia.id,
    clienteId: denuncia.clienteId,
    protocolo: denuncia.protocolo,
    titulo: denuncia.titulo,
    categoria: denuncia.categoria,
    anonima: denuncia.anonima,
    status: denuncia.status,
    gravidade: denuncia.gravidade,
    quantidadeAnexos,
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
      `Erro ao gerar URL de download do anexo ${anexo.id}:`,
      error
    );
  }

  return {
    id: anexo.id,
    chave: anexo.chave,
    nomeOriginal: anexo.nomeOriginal,
    tipoMime: anexo.tipoMime,
    tamanho: anexo.tamanho,
    criadoEm: anexo.criadoEm,
    url,
  };
}

async function montarDetalhada(
  denuncia: any
): Promise<DenunciaDetalhada> {
  const anexos: AnexoDenuncia[] = await Promise.all(
    Array.isArray(denuncia.anexos)
      ? denuncia.anexos.map(montarAnexo)
      : []
  );

  return {
    ...montarResumo(denuncia),

    descricao: denuncia.descricao,
    localOcorrido: denuncia.localOcorrido,
    dataOcorrido: denuncia.dataOcorrido,

    nomeDenunciante: denuncia.nomeDenunciante,
    emailDenunciante: denuncia.emailDenunciante,
    telefoneDenunciante: denuncia.telefoneDenunciante,

    respostaPublica: denuncia.respostaPublica,

    tratativas: Array.isArray(denuncia.tratativas)
      ? denuncia.tratativas
      : [],

    anexos,
  };
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

function validarDadosObrigatorios(dados: {
  clienteId?: string;
  titulo?: string;
  descricao?: string;
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
}

export default class RepositorioDenuncia {
  static async criarPublica(dados: DenunciaPublica): Promise<{
    id: string;
    protocolo: string;
  }> {
    validarDadosObrigatorios(dados);

    await validarCliente(dados.clienteId);

    const titulo = dados.titulo.trim();
    const descricao = dados.descricao.trim();
    const categoria = textoOpcional(dados.categoria);

    const protocolo = await gerarProtocoloUnico();

    const gravidade = await calcularGravidadeAutomatica({
      titulo,
      descricao,
      categoria,
    });

    const denuncia = await prisma.denuncia.create({
      data: {
        clienteId: dados.clienteId,
        protocolo,

        titulo,
        descricao,
        categoria,

        localOcorrido: textoOpcional(dados.localOcorrido),

        dataOcorrido: converterDataOpcional(
          dados.dataOcorrido
        ),

        anonima: dados.anonima,

        nomeDenunciante: dados.anonima
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

        gravidade,
        status: "RECEBIDA",

        respostaPublica: null,
        tratativas: [],
      },
      select: {
        id: true,
        protocolo: true,
      },
    });

    return {
      id: denuncia.id,
      protocolo: denuncia.protocolo,
    };
  }

  static async criarManual(
    dados: Denuncia
  ): Promise<DenunciaDetalhada> {
    validarDadosObrigatorios(dados);

    await validarCliente(dados.clienteId);

    const titulo = dados.titulo.trim();
    const descricao = dados.descricao.trim();
    const categoria = textoOpcional(dados.categoria);

    const protocolo = await gerarProtocoloUnico();

    const gravidade = await calcularGravidadeAutomatica({
      titulo,
      descricao,
      categoria,
      gravidade: dados.gravidade || null,
    });

    const denuncia = await prisma.denuncia.create({
      data: {
        clienteId: dados.clienteId,
        protocolo,

        titulo,
        descricao,
        categoria,

        localOcorrido: textoOpcional(
          dados.localOcorrido?.toString()
        ),

        dataOcorrido: converterDataOpcional(
          dados.dataOcorrido
        ),

        anonima: dados.anonima ?? true,

        nomeDenunciante: dados.anonima
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

        tratativas: dados.tratativas || [],
      },
      include: {
        cliente: true,

        anexos: {
          orderBy: {
            criadoEm: "asc",
          },
        },

        _count: {
          select: {
            anexos: true,
          },
        },
      },
    });

    return montarDetalhada(denuncia);
  }

  static async criarManualCliente(
    clienteId: string,
    dados: Denuncia
  ): Promise<DenunciaDetalhada> {
    return this.criarManual({
      ...dados,
      clienteId,
    });
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
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada.");
    }

    return denuncia;
  }

  static async salvar(
    denuncia: Denuncia
  ): Promise<DenunciaDetalhada> {
    if (!denuncia.id) {
      throw new Error("Denúncia não encontrada.");
    }

    const denunciaAtual = await prisma.denuncia.findUnique({
      where: {
        id: denuncia.id,
      },
    });

    if (!denunciaAtual) {
      throw new Error("Denúncia não encontrada.");
    }

    const titulo =
      denuncia.titulo?.trim() || denunciaAtual.titulo;

    const descricao =
      denuncia.descricao?.trim() || denunciaAtual.descricao;

    const categoria =
      denuncia.categoria === undefined
        ? denunciaAtual.categoria
        : textoOpcional(denuncia.categoria);

    const localOcorrido =
      denuncia.localOcorrido === undefined
        ? denunciaAtual.localOcorrido
        : textoOpcional(
            denuncia.localOcorrido?.toString()
          );

    const dataOcorrido =
      denuncia.dataOcorrido === undefined
        ? denunciaAtual.dataOcorrido
        : converterDataOpcional(denuncia.dataOcorrido);

    const anonima =
      denuncia.anonima ?? denunciaAtual.anonima;

    const gravidade = await calcularGravidadeAutomatica({
      titulo,
      descricao,
      categoria,
      gravidade:
        denuncia.gravidade || denunciaAtual.gravidade,
    });

    const resultado = await prisma.denuncia.update({
      where: {
        id: denuncia.id,
      },
      data: {
        titulo,
        descricao,
        categoria,
        localOcorrido,
        dataOcorrido,
        anonima,

        nomeDenunciante: anonima
          ? null
          : denuncia.nomeDenunciante === undefined
          ? denunciaAtual.nomeDenunciante
          : textoOpcional(denuncia.nomeDenunciante),

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
          : textoOpcional(denuncia.telefoneDenunciante),

        status: denuncia.status || denunciaAtual.status,
        gravidade,

        respostaPublica:
          denuncia.respostaPublica === undefined
            ? denunciaAtual.respostaPublica
            : textoOpcional(denuncia.respostaPublica),

        tratativas:
          denuncia.tratativas ?? denunciaAtual.tratativas,
      },
      include: {
        cliente: true,

        anexos: {
          orderBy: {
            criadoEm: "asc",
          },
        },

        _count: {
          select: {
            anexos: true,
          },
        },
      },
    });

    return montarDetalhada(resultado);
  }

  static async adicionarTratativa(
    denunciaId: string,
    tratativa: Omit<
      TratativaDenuncia,
      "id" | "criadoEm"
    >
  ): Promise<DenunciaDetalhada> {
    if (!denunciaId?.trim()) {
      throw new Error("Denúncia não encontrada.");
    }

    const denuncia = await prisma.denuncia.findUnique({
      where: {
        id: denunciaId,
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada.");
    }

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

    const tratativasAtuais = Array.isArray(
      denuncia.tratativas
    )
      ? denuncia.tratativas
      : [];

    const novaTratativa: TratativaDenuncia = {
      id: `tratativa-${crypto.randomUUID()}`,
      titulo,
      descricao,
      responsavel: textoOpcional(
        tratativa.responsavel
      ),
      criadoEm: new Date().toISOString(),
    };

    const resultado = await prisma.denuncia.update({
      where: {
        id: denunciaId,
      },
      data: {
        tratativas: [
          ...tratativasAtuais,
          novaTratativa,
        ],

        status: "EM_TRATATIVA",
      },
      include: {
        cliente: true,

        anexos: {
          orderBy: {
            criadoEm: "asc",
          },
        },

        _count: {
          select: {
            anexos: true,
          },
        },
      },
    });

    return montarDetalhada(resultado);
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

        _count: {
          select: {
            anexos: true,
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
      include: {
        cliente: true,

        anexos: {
          orderBy: {
            criadoEm: "asc",
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

    return montarDetalhada(denuncia);
  }

  static async obterPorIdECliente(
    id: string,
    clienteId: string
  ): Promise<DenunciaDetalhada> {
    if (!id?.trim()) {
      throw new Error("Denúncia não encontrada.");
    }

    if (!clienteId?.trim()) {
      throw new Error("Cliente é obrigatório.");
    }

    const denuncia = await prisma.denuncia.findFirst({
      where: {
        id,
        clienteId,
      },
      include: {
        cliente: true,

        anexos: {
          orderBy: {
            criadoEm: "asc",
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
      },
    });

    return montarAnexo(anexo);
  }
}