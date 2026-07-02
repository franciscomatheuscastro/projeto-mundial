import { prisma } from "@/src/lib/prisma";
import {
  Denuncia,
  DenunciaDetalhada,
  DenunciaPublica,
  DenunciaResumo,
  TratativaDenuncia,
} from "@/src/core/model/Denuncia";

function gerarProtocolo() {
  const data = new Date();
  const ano = data.getFullYear();
  const numero = Math.floor(100000 + Math.random() * 900000);
  return `DEN-${ano}-${numero}`;
}

async function gerarProtocoloUnico() {
  for (let i = 0; i < 10; i++) {
    const protocolo = gerarProtocolo();

    const existe = await prisma.denuncia.findUnique({
      where: { protocolo },
    });

    if (!existe) return protocolo;
  }

  throw new Error("Não foi possível gerar protocolo.");
}

function montarResumo(denuncia: any): DenunciaResumo {
  return {
    id: denuncia.id,
    clienteId: denuncia.clienteId,
    protocolo: denuncia.protocolo,
    titulo: denuncia.titulo,
    categoria: denuncia.categoria,
    anonima: denuncia.anonima,
    status: denuncia.status,
    gravidade: denuncia.gravidade,
    criadoEm: denuncia.criadoEm,
    atualizadoEm: denuncia.atualizadoEm,
    cliente: {
      id: denuncia.cliente.id,
      nome: denuncia.cliente.nome,
      empresa: denuncia.cliente.empresa,
    },
  };
}

function montarDetalhada(denuncia: any): DenunciaDetalhada {
  return {
    ...montarResumo(denuncia),
    descricao: denuncia.descricao,
    localOcorrido: denuncia.localOcorrido,
    dataOcorrido: denuncia.dataOcorrido,
    nomeDenunciante: denuncia.nomeDenunciante,
    emailDenunciante: denuncia.emailDenunciante,
    telefoneDenunciante: denuncia.telefoneDenunciante,
    respostaPublica: denuncia.respostaPublica,
    tratativas: Array.isArray(denuncia.tratativas) ? denuncia.tratativas : [],
  };
}

export default class RepositorioDenuncia {
  static async criarPublica(dados: DenunciaPublica) {
    if (!dados.clienteId) throw new Error("Cliente é obrigatório.");
    if (!dados.titulo?.trim()) throw new Error("Título é obrigatório.");
    if (!dados.descricao?.trim()) throw new Error("Descrição é obrigatória.");

    const cliente = await prisma.cliente.findUnique({
      where: { id: dados.clienteId },
    });

    if (!cliente) throw new Error("Empresa não encontrada.");

    const protocolo = await gerarProtocoloUnico();

    const denuncia = await prisma.denuncia.create({
      data: {
        clienteId: dados.clienteId,
        protocolo,
        titulo: dados.titulo.trim(),
        descricao: dados.descricao.trim(),
        categoria: dados.categoria?.trim() || null,
        localOcorrido: dados.localOcorrido?.trim() || null,
        dataOcorrido: dados.dataOcorrido ? new Date(dados.dataOcorrido) : null,
        anonima: dados.anonima,
        nomeDenunciante: dados.anonima
          ? null
          : dados.nomeDenunciante?.trim() || null,
        emailDenunciante: dados.anonima
          ? null
          : dados.emailDenunciante?.trim().toLowerCase() || null,
        telefoneDenunciante: dados.anonima
          ? null
          : dados.telefoneDenunciante?.trim() || null,
      },
    });

    return {
      protocolo: denuncia.protocolo,
    };
  }

  static async consultarPublica(dados: {
    clienteId: string;
    protocolo: string;
  }) {
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

  static async salvar(denuncia: Denuncia): Promise<DenunciaDetalhada> {
    if (!denuncia.id) throw new Error("Denúncia não encontrada.");

    const resultado = await prisma.denuncia.update({
      where: { id: denuncia.id },
      data: {
        status: denuncia.status || "RECEBIDA",
        gravidade: denuncia.gravidade || "MEDIA",
        respostaPublica: denuncia.respostaPublica?.trim() || null,
        tratativas: denuncia.tratativas || [],
      },
      include: {
        cliente: true,
      },
    });

    return montarDetalhada(resultado);
  }

  static async adicionarTratativa(
    denunciaId: string,
    tratativa: Omit<TratativaDenuncia, "id" | "criadoEm">
  ) {
    const denuncia = await prisma.denuncia.findUnique({
      where: { id: denunciaId },
    });

    if (!denuncia) throw new Error("Denúncia não encontrada.");

    const tratativas = Array.isArray(denuncia.tratativas)
      ? denuncia.tratativas
      : [];

    const novaTratativa: TratativaDenuncia = {
      id: `tratativa-${Date.now()}`,
      titulo: tratativa.titulo.trim(),
      descricao: tratativa.descricao.trim(),
      responsavel: tratativa.responsavel?.trim() || null,
      criadoEm: new Date().toISOString(),
    };

    const resultado = await prisma.denuncia.update({
      where: { id: denunciaId },
      data: {
        tratativas: [...tratativas, novaTratativa],
        status: "EM_TRATATIVA",
      },
      include: {
        cliente: true,
      },
    });

    return montarDetalhada(resultado);
  }

  static async obterTodos(): Promise<DenunciaResumo[]> {
    const denuncias = await prisma.denuncia.findMany({
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        cliente: true,
      },
    });

    return denuncias.map(montarResumo);
  }

  static async obterPorIdECliente(id: string, clienteId: string) {
    const denuncia = await prisma.denuncia.findFirst({
      where: {
        id,
        clienteId,
      },
      include: {
        cliente: true,
      },
    });

    if (!denuncia) {
      throw new Error("Denúncia não encontrada.");
    }

    return {
      ...denuncia,
      tratativas: Array.isArray(denuncia.tratativas)
        ? denuncia.tratativas
        : [],
    } as any;
  }

  static async obterPorCliente(clienteId: string): Promise<DenunciaResumo[]> {
    const denuncias = await prisma.denuncia.findMany({
      where: { clienteId },
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        cliente: true,
      },
    });

    return denuncias.map(montarResumo);
  }

  static async obterPorId(id: string): Promise<DenunciaDetalhada> {
    const denuncia = await prisma.denuncia.findUnique({
      where: { id },
      include: {
        cliente: true,
      },
    });

    if (!denuncia) throw new Error("Denúncia não encontrada.");

    return montarDetalhada(denuncia);
  }
}