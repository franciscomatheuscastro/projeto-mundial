import { GravidadeDenuncia } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  Denuncia,
  DenunciaDetalhada,
  DenunciaPublica,
  DenunciaResumo,
  TratativaDenuncia,
} from "@/src/core/model/Denuncia";
import RepositorioCriticidadeDenuncia from "../criticidadeDenuncia/RepositorioCriticidadeDenuncia";

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

async function calcularGravidadeAutomatica(dados: {
  titulo: string;
  descricao: string;
  categoria?: string | null;
  gravidade?: GravidadeDenuncia | null;
}) {
  if (dados.gravidade) return dados.gravidade;

  return RepositorioCriticidadeDenuncia.calcularGravidade({
    titulo: dados.titulo,
    descricao: dados.descricao,
    categoria: dados.categoria,
  });
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

    const titulo = dados.titulo.trim();
    const descricao = dados.descricao.trim();
    const categoria = dados.categoria?.trim() || null;

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
        gravidade,
        status: "RECEBIDA",
        tratativas: [],
      },
    });

    return {
      protocolo: denuncia.protocolo,
    };
  }

  static async criarManual(dados: Denuncia): Promise<DenunciaDetalhada> {
    if (!dados.clienteId) throw new Error("Cliente é obrigatório.");
    if (!dados.titulo?.trim()) throw new Error("Título é obrigatório.");
    if (!dados.descricao?.trim()) throw new Error("Descrição é obrigatória.");

    const cliente = await prisma.cliente.findUnique({
      where: { id: dados.clienteId },
    });

    if (!cliente) throw new Error("Cliente não encontrado.");

    const titulo = dados.titulo.trim();
    const descricao = dados.descricao.trim();
    const categoria = dados.categoria?.trim() || null;

    const protocolo = await gerarProtocoloUnico();

    const gravidade = await calcularGravidadeAutomatica({
      titulo,
      descricao,
      categoria,
      gravidade: dados.gravidade || null,
    });

    const resultado = await prisma.denuncia.create({
      data: {
        clienteId: dados.clienteId,
        protocolo,
        titulo,
        descricao,
        categoria,
        localOcorrido: dados.localOcorrido?.toString().trim() || null,
        dataOcorrido: dados.dataOcorrido ? new Date(dados.dataOcorrido) : null,
        anonima: dados.anonima ?? true,
        nomeDenunciante: dados.anonima
          ? null
          : dados.nomeDenunciante?.trim() || null,
        emailDenunciante: dados.anonima
          ? null
          : dados.emailDenunciante?.trim().toLowerCase() || null,
        telefoneDenunciante: dados.anonima
          ? null
          : dados.telefoneDenunciante?.trim() || null,
        status: dados.status || "RECEBIDA",
        gravidade,
        respostaPublica: dados.respostaPublica?.trim() || null,
        tratativas: dados.tratativas || [],
      },
      include: {
        cliente: true,
      },
    });

    return montarDetalhada(resultado);
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

    const denunciaAtual = await prisma.denuncia.findUnique({
      where: { id: denuncia.id },
    });

    if (!denunciaAtual) throw new Error("Denúncia não encontrada.");

    const titulo = denuncia.titulo?.trim() || denunciaAtual.titulo;
    const descricao = denuncia.descricao?.trim() || denunciaAtual.descricao;
    const categoria = denuncia.categoria?.trim() || denunciaAtual.categoria;

    const gravidade = await calcularGravidadeAutomatica({
      titulo,
      descricao,
      categoria,
      gravidade: denuncia.gravidade || null,
    });

    const resultado = await prisma.denuncia.update({
      where: { id: denuncia.id },
      data: {
        titulo,
        descricao,
        categoria,
        localOcorrido: denuncia.localOcorrido?.toString().trim() || null,
        dataOcorrido: denuncia.dataOcorrido
          ? new Date(denuncia.dataOcorrido)
          : denunciaAtual.dataOcorrido,
        anonima: denuncia.anonima ?? denunciaAtual.anonima,
        nomeDenunciante:
          denuncia.anonima === true
            ? null
            : denuncia.nomeDenunciante?.trim() ||
              denunciaAtual.nomeDenunciante,
        emailDenunciante:
          denuncia.anonima === true
            ? null
            : denuncia.emailDenunciante?.trim().toLowerCase() ||
              denunciaAtual.emailDenunciante,
        telefoneDenunciante:
          denuncia.anonima === true
            ? null
            : denuncia.telefoneDenunciante?.trim() ||
              denunciaAtual.telefoneDenunciante,
        status: denuncia.status || denunciaAtual.status,
        gravidade,
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

    const titulo = tratativa.titulo?.trim();
    const descricao = tratativa.descricao?.trim();

    if (!titulo) throw new Error("Título da tratativa é obrigatório.");
    if (!descricao) throw new Error("Descrição da tratativa é obrigatória.");

    const tratativas = Array.isArray(denuncia.tratativas)
      ? denuncia.tratativas
      : [];

    const novaTratativa: TratativaDenuncia = {
      id: `tratativa-${Date.now()}`,
      titulo,
      descricao,
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
      },
    });

    return denuncias.map(montarResumo);
  }

  static async obterPorCliente(clienteId: string): Promise<DenunciaResumo[]> {
    const denuncias = await prisma.denuncia.findMany({
      where: { clienteId },
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

  static async obterPorIdECliente(
    id: string,
    clienteId: string
  ): Promise<DenunciaDetalhada> {
    const denuncia = await prisma.denuncia.findFirst({
      where: {
        id,
        clienteId,
      },
      include: {
        cliente: true,
      },
    });

    if (!denuncia) throw new Error("Denúncia não encontrada.");

    return montarDetalhada(denuncia);
  }
}