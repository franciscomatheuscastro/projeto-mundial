import { GravidadeDenuncia } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { RegraCriticidadeDenuncia } from "@/src/core/model/RegraCriticidadeDenuncia";

export default class RepositorioCriticidadeDenuncia {
  static async salvar(regra: RegraCriticidadeDenuncia) {
    const termo = regra.termo?.trim().toLowerCase();

    if (!termo) {
      throw new Error("Termo da regra é obrigatório.");
    }

    const dados = {
      termo,
      categoria: regra.categoria?.trim().toLowerCase() || null,
      gravidade: regra.gravidade || "ALTA",
      ativo: regra.ativo ?? true,
    };

    if (regra.id) {
      return prisma.regraCriticidadeDenuncia.update({
        where: { id: regra.id },
        data: dados,
      });
    }

    return prisma.regraCriticidadeDenuncia.create({
      data: dados,
    });
  }

  static async obterTodos() {
    return prisma.regraCriticidadeDenuncia.findMany({
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  static async excluir(id: string) {
    await prisma.regraCriticidadeDenuncia.delete({
      where: { id },
    });

    return id;
  }

  static async calcularGravidade(dados: {
    titulo: string;
    descricao: string;
    categoria?: string | null;
  }): Promise<GravidadeDenuncia> {
    const regras = await prisma.regraCriticidadeDenuncia.findMany({
      where: {
        ativo: true,
      },
    });

    const texto = `${dados.titulo} ${dados.descricao} ${
      dados.categoria || ""
    }`.toLowerCase();

    const regrasEncontradas = regras.filter((regra) => {
      const encontrouTermo = texto.includes(regra.termo.toLowerCase());

      const categoriaConfere =
        !regra.categoria ||
        regra.categoria.toLowerCase() === dados.categoria?.toLowerCase();

      return encontrouTermo && categoriaConfere;
    });

    if (regrasEncontradas.some((regra) => regra.gravidade === "CRITICA")) {
      return "CRITICA";
    }

    if (regrasEncontradas.some((regra) => regra.gravidade === "ALTA")) {
      return "ALTA";
    }

    if (regrasEncontradas.some((regra) => regra.gravidade === "MEDIA")) {
      return "MEDIA";
    }

    if (regrasEncontradas.some((regra) => regra.gravidade === "BAIXA")) {
      return "BAIXA";
    }

    return "MEDIA";
  }
}