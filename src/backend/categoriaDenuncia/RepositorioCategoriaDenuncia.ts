import {
  GravidadeDenuncia,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

import type {
  CategoriaDenuncia,
} from "@/src/core/model/CategoriaDenuncia";

function textoOpcional(
  valor?: string | null
): string | null {
  const texto = valor?.trim();

  return texto || null;
}

function gravidadeValida(
  valor: unknown
): valor is GravidadeDenuncia {
  return Object.values(
    GravidadeDenuncia
  ).includes(
    valor as GravidadeDenuncia
  );
}

function validarDados(
  categoria: Partial<CategoriaDenuncia>
): void {
  if (!categoria.nome?.trim()) {
    throw new Error(
      "O nome da categoria é obrigatório."
    );
  }

  if (
    categoria.ordem !== undefined &&
    (!Number.isInteger(categoria.ordem) ||
      categoria.ordem < 0)
  ) {
    throw new Error(
      "A ordem deve ser um número inteiro maior ou igual a zero."
    );
  }

  if (
    categoria.gravidade !== undefined &&
    !gravidadeValida(
      categoria.gravidade
    )
  ) {
    throw new Error(
      "A gravidade informada é inválida."
    );
  }
}

function montarCategoria(
  categoria: {
    id: string;
    nome: string;
    descricao: string | null;
    gravidade: GravidadeDenuncia;
    ativo: boolean;
    ordem: number;
    criadoEm: Date;
    atualizadoEm: Date;

    _count?: {
      denuncias: number;
    };
  }
): CategoriaDenuncia {
  return {
    id: categoria.id,
    nome: categoria.nome,
    descricao: categoria.descricao,
    gravidade: categoria.gravidade,
    ativo: categoria.ativo,
    ordem: categoria.ordem,

    criadoEm: categoria.criadoEm,
    atualizadoEm:
      categoria.atualizadoEm,

    quantidadeDenuncias:
      categoria._count?.denuncias ??
      0,
  };
}

const includeQuantidadeDenuncias = {
  _count: {
    select: {
      denuncias: true,
    },
  },
} as const;

export default class RepositorioCategoriaDenuncia {
  static async obterTodas(): Promise<
    CategoriaDenuncia[]
  > {
    const categorias =
      await prisma.categoriaDenuncia.findMany({
        orderBy: [
          {
            ativo: "desc",
          },
          {
            ordem: "asc",
          },
          {
            nome: "asc",
          },
        ],

        include:
          includeQuantidadeDenuncias,
      });

    return categorias.map(
      montarCategoria
    );
  }

  static async obterAtivas(): Promise<
    CategoriaDenuncia[]
  > {
    const categorias =
      await prisma.categoriaDenuncia.findMany({
        where: {
          ativo: true,
        },

        orderBy: [
          {
            ordem: "asc",
          },
          {
            nome: "asc",
          },
        ],

        include:
          includeQuantidadeDenuncias,
      });

    return categorias.map(
      montarCategoria
    );
  }

  static async obterPorId(
    id: string
  ): Promise<CategoriaDenuncia> {
    const categoriaId = id?.trim();

    if (!categoriaId) {
      throw new Error(
        "Categoria não encontrada."
      );
    }

    const categoria =
      await prisma.categoriaDenuncia.findUnique({
        where: {
          id: categoriaId,
        },

        include:
          includeQuantidadeDenuncias,
      });

    if (!categoria) {
      throw new Error(
        "Categoria não encontrada."
      );
    }

    return montarCategoria(categoria);
  }

  static async salvar(
    categoria: Partial<CategoriaDenuncia>
  ): Promise<CategoriaDenuncia> {
    validarDados(categoria);

    const nome = categoria.nome!.trim();

    const categoriaMesmoNome =
      await prisma.categoriaDenuncia.findFirst({
        where: {
          nome: {
            equals: nome,
            mode: "insensitive",
          },

          ...(categoria.id
            ? {
                id: {
                  not: categoria.id,
                },
              }
            : {}),
        },

        select: {
          id: true,
        },
      });

    if (categoriaMesmoNome) {
      throw new Error(
        "Já existe uma categoria com este nome."
      );
    }

    const dados = {
      nome,

      descricao: textoOpcional(
        categoria.descricao
      ),

      gravidade:
        categoria.gravidade ??
        GravidadeDenuncia.MEDIA,

      ativo: categoria.ativo ?? true,

      ordem: categoria.ordem ?? 0,
    };

    if (categoria.id) {
      const existente =
        await prisma.categoriaDenuncia.findUnique({
          where: {
            id: categoria.id,
          },

          select: {
            id: true,
          },
        });

      if (!existente) {
        throw new Error(
          "Categoria não encontrada."
        );
      }

      const atualizada =
        await prisma.categoriaDenuncia.update({
          where: {
            id: categoria.id,
          },

          data: dados,

          include:
            includeQuantidadeDenuncias,
        });

      return montarCategoria(atualizada);
    }

    const criada =
      await prisma.categoriaDenuncia.create({
        data: dados,

        include:
          includeQuantidadeDenuncias,
      });

    return montarCategoria(criada);
  }

  static async alterarStatus(
    id: string,
    ativo: boolean
  ): Promise<CategoriaDenuncia> {
    const categoriaId = id?.trim();

    if (!categoriaId) {
      throw new Error(
        "Categoria não encontrada."
      );
    }

    const categoria =
      await prisma.categoriaDenuncia.findUnique({
        where: {
          id: categoriaId,
        },

        select: {
          id: true,
        },
      });

    if (!categoria) {
      throw new Error(
        "Categoria não encontrada."
      );
    }

    const atualizada =
      await prisma.categoriaDenuncia.update({
        where: {
          id: categoriaId,
        },

        data: {
          ativo,
        },

        include:
          includeQuantidadeDenuncias,
      });

    return montarCategoria(atualizada);
  }

  static async obterGravidade(
    id: string
  ): Promise<GravidadeDenuncia> {
    const categoriaId = id?.trim();

    if (!categoriaId) {
      throw new Error(
        "A categoria da denúncia é obrigatória."
      );
    }

    const categoria =
      await prisma.categoriaDenuncia.findFirst({
        where: {
          id: categoriaId,
          ativo: true,
        },

        select: {
          gravidade: true,
        },
      });

    if (!categoria) {
      throw new Error(
        "A categoria selecionada não existe ou está inativa."
      );
    }

    return categoria.gravidade;
  }
}