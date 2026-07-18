import { prisma } from "@/src/lib/prisma";

import type {
  CategoriaDenuncia,
} from "@/src/core/model/CategoriaDenuncia";

function textoOpcional(
  valor?: string | null
) {
  const texto = valor?.trim();

  return texto || null;
}

function validarDados(
  categoria: Partial<CategoriaDenuncia>
) {
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
}

function montarCategoria(
  categoria: any
): CategoriaDenuncia {
  return {
    id: categoria.id,
    nome: categoria.nome,
    descricao: categoria.descricao,
    ativo: categoria.ativo,
    ordem: categoria.ordem,

    criadoEm: categoria.criadoEm,
    atualizadoEm: categoria.atualizadoEm,

    quantidadeDenuncias:
      categoria._count?.denuncias ?? 0,
  };
}

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

        include: {
          _count: {
            select: {
              denuncias: true,
            },
          },
        },
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

        include: {
          _count: {
            select: {
              denuncias: true,
            },
          },
        },
      });

    return categorias.map(
      montarCategoria
    );
  }

  static async obterPorId(
    id: string
  ): Promise<CategoriaDenuncia> {
    if (!id?.trim()) {
      throw new Error(
        "Categoria não encontrada."
      );
    }

    const categoria =
      await prisma.categoriaDenuncia.findUnique({
        where: {
          id,
        },

        include: {
          _count: {
            select: {
              denuncias: true,
            },
          },
        },
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

          data: {
            nome,
            descricao: textoOpcional(
              categoria.descricao
            ),
            ativo:
              categoria.ativo ?? true,
            ordem:
              categoria.ordem ?? 0,
          },

          include: {
            _count: {
              select: {
                denuncias: true,
              },
            },
          },
        });

      return montarCategoria(atualizada);
    }

    const criada =
      await prisma.categoriaDenuncia.create({
        data: {
          nome,
          descricao: textoOpcional(
            categoria.descricao
          ),
          ativo:
            categoria.ativo ?? true,
          ordem:
            categoria.ordem ?? 0,
        },

        include: {
          _count: {
            select: {
              denuncias: true,
            },
          },
        },
      });

    return montarCategoria(criada);
  }

  static async alterarStatus(
    id: string,
    ativo: boolean
  ): Promise<CategoriaDenuncia> {
    if (!id?.trim()) {
      throw new Error(
        "Categoria não encontrada."
      );
    }

    const categoria =
      await prisma.categoriaDenuncia.findUnique({
        where: {
          id,
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
          id,
        },

        data: {
          ativo,
        },

        include: {
          _count: {
            select: {
              denuncias: true,
            },
          },
        },
      });

    return montarCategoria(atualizada);
  }
}