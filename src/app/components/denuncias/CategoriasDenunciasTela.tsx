"use client";

import type {
  FormEvent,
} from "react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  GravidadeDenuncia,
} from "@prisma/client";

import Backend from "@/src/backend";

import type {
  CategoriaDenuncia,
} from "@/src/core/model/CategoriaDenuncia";

const CATEGORIA_INICIAL: CategoriaDenuncia = {
  nome: "",
  descricao: "",
  gravidade:
    GravidadeDenuncia.MEDIA,
  ativo: true,
  ordem: 0,
};

const GRAVIDADES: Array<{
  valor: GravidadeDenuncia;
  nome: string;
  descricao: string;
}> = [
  {
    valor: GravidadeDenuncia.BAIXA,
    nome: "Baixa",
    descricao:
      "Situação de menor impacto ou urgência.",
  },
  {
    valor: GravidadeDenuncia.MEDIA,
    nome: "Média",
    descricao:
      "Situação relevante que exige avaliação.",
  },
  {
    valor: GravidadeDenuncia.ALTA,
    nome: "Alta",
    descricao:
      "Situação grave que exige prioridade.",
  },
  {
    valor: GravidadeDenuncia.CRITICA,
    nome: "Crítica",
    descricao:
      "Situação emergencial ou de risco elevado.",
  },
];

export default function CategoriasDenunciaTela() {
  const [categorias, setCategorias] =
    useState<CategoriaDenuncia[]>([]);

  const [
    categoriaEditando,
    setCategoriaEditando,
  ] = useState<CategoriaDenuncia>({
    ...CATEGORIA_INICIAL,
  });

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState<string | null>(null);

  const [mensagem, setMensagem] =
    useState<string | null>(null);

  const [
    processando,
    iniciarTransicao,
  ] = useTransition();

  const editando = Boolean(
    categoriaEditando.id
  );

  const categoriasAtivas = useMemo(
    () =>
      categorias.filter(
        (categoria) =>
          categoria.ativo
      ).length,
    [categorias]
  );

  const categoriasCriticas = useMemo(
    () =>
      categorias.filter(
        (categoria) =>
          categoria.ativo &&
          categoria.gravidade ===
            GravidadeDenuncia.CRITICA
      ).length,
    [categorias]
  );

  const carregarCategorias =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro(null);

        const dados =
          await Backend.categoriasDenuncia.obterTodas();

        setCategorias(dados);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as categorias."
        );
      } finally {
        setCarregando(false);
      }
    }, []);

  useEffect(() => {
    void carregarCategorias();
  }, [carregarCategorias]);

  function limparFormulario() {
    setCategoriaEditando({
      ...CATEGORIA_INICIAL,
    });
  }

  function editar(
    categoria: CategoriaDenuncia
  ) {
    setMensagem(null);
    setErro(null);

    setCategoriaEditando({
      ...categoria,

      descricao:
        categoria.descricao ?? "",

      gravidade:
        categoria.gravidade ??
        GravidadeDenuncia.MEDIA,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (processando) {
      return;
    }

    setErro(null);
    setMensagem(null);

    iniciarTransicao(async () => {
      try {
        await Backend.categoriasDenuncia.salvar({
          id: categoriaEditando.id,

          nome:
            categoriaEditando.nome.trim(),

          descricao:
            categoriaEditando.descricao?.trim() ||
            null,

          gravidade:
            categoriaEditando.gravidade,

          ativo:
            categoriaEditando.ativo,

          ordem: Number(
            categoriaEditando.ordem
          ),
        });

        setMensagem(
          editando
            ? "Categoria atualizada com sucesso."
            : "Categoria criada com sucesso."
        );

        limparFormulario();

        await carregarCategorias();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a categoria."
        );
      }
    });
  }

  async function alterarStatus(
    categoria: CategoriaDenuncia
  ) {
    if (
      !categoria.id ||
      processando
    ) {
      return;
    }

    const novoStatus =
      !categoria.ativo;

    const acao = novoStatus
      ? "reativar"
      : "desativar";

    const confirmar =
      window.confirm(
        `Deseja realmente ${acao} a categoria "${categoria.nome}"?`
      );

    if (!confirmar) {
      return;
    }

    setErro(null);
    setMensagem(null);

    iniciarTransicao(async () => {
      try {
        await Backend.categoriasDenuncia.alterarStatus(
          categoria.id!,
          novoStatus
        );

        setMensagem(
          novoStatus
            ? "Categoria reativada com sucesso."
            : "Categoria desativada com sucesso."
        );

        if (
          categoriaEditando.id ===
          categoria.id
        ) {
          limparFormulario();
        }

        await carregarCategorias();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível alterar o status da categoria."
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Canal de Denúncias
          </p>

          <h1 className="mt-1 text-2xl font-black text-slate-900">
            Categorias de denúncias
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Configure as categorias e a
            gravidade automática aplicada
            no registro de cada denúncia.
          </p>
        </div>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {mensagem}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <CardResumo
            titulo="Total"
            valor={categorias.length}
          />

          <CardResumo
            titulo="Ativas"
            valor={categoriasAtivas}
          />

          <CardResumo
            titulo="Críticas"
            valor={categoriasCriticas}
          />
        </div>

        <form
          onSubmit={salvar}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editando
                  ? "Editar categoria"
                  : "Nova categoria"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                A gravidade selecionada
                será aplicada automaticamente
                às novas denúncias desta
                categoria.
              </p>
            </div>

            {editando && (
              <button
                type="button"
                disabled={processando}
                onClick={limparFormulario}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                Cancelar edição
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <label
                htmlFor="nome"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nome
              </label>

              <input
                id="nome"
                required
                disabled={processando}
                value={
                  categoriaEditando.nome
                }
                onChange={(event) =>
                  setCategoriaEditando(
                    (atual) => ({
                      ...atual,
                      nome:
                        event.target.value,
                    })
                  )
                }
                placeholder="Ex.: Assédio moral"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="gravidade"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Gravidade automática
              </label>

              <select
                id="gravidade"
                required
                disabled={processando}
                value={
                  categoriaEditando.gravidade
                }
                onChange={(event) =>
                  setCategoriaEditando(
                    (atual) => ({
                      ...atual,

                      gravidade:
                        event.target
                          .value as GravidadeDenuncia,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                {GRAVIDADES.map(
                  (item) => (
                    <option
                      key={item.valor}
                      value={item.valor}
                    >
                      {item.nome}
                    </option>
                  )
                )}
              </select>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {
                  GRAVIDADES.find(
                    (item) =>
                      item.valor ===
                      categoriaEditando.gravidade
                  )?.descricao
                }
              </p>
            </div>

            <div>
              <label
                htmlFor="ordem"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Ordem de exibição
              </label>

              <input
                id="ordem"
                type="number"
                min={0}
                step={1}
                required
                disabled={processando}
                value={
                  categoriaEditando.ordem
                }
                onChange={(event) =>
                  setCategoriaEditando(
                    (atual) => ({
                      ...atual,

                      ordem: Number(
                        event.target.value
                      ),
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={
                  categoriaEditando.ativo
                }
                disabled={processando}
                onChange={(event) =>
                  setCategoriaEditando(
                    (atual) => ({
                      ...atual,

                      ativo:
                        event.target.checked,
                    })
                  )
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm text-slate-900">
                  Categoria ativa
                </strong>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Categorias ativas aparecem
                  nos formulários de denúncia.
                </span>
              </span>
            </label>

            <div className="lg:col-span-2">
              <label
                htmlFor="descricao"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Descrição
              </label>

              <textarea
                id="descricao"
                rows={4}
                disabled={processando}
                value={
                  categoriaEditando.descricao ??
                  ""
                }
                onChange={(event) =>
                  setCategoriaEditando(
                    (atual) => ({
                      ...atual,

                      descricao:
                        event.target.value,
                    })
                  )
                }
                placeholder="Explique em quais situações esta categoria deve ser utilizada."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={processando}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {processando
              ? "Salvando..."
              : editando
                ? "Salvar alterações"
                : "Criar categoria"}
          </button>
        </form>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Categorias cadastradas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Alterações de gravidade afetam
              apenas novas denúncias. Denúncias
              existentes mantêm sua classificação.
            </p>
          </div>

          {carregando ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Carregando categorias...
            </div>
          ) : categorias.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Nenhuma categoria cadastrada.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categorias.map(
                (categoria) => (
                  <div
                    key={categoria.id}
                    className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {categoria.nome}
                        </p>

                        <GravidadeBadge
                          gravidade={
                            categoria.gravidade
                          }
                        />

                        <StatusBadge
                          ativo={
                            categoria.ativo
                          }
                        />
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {categoria.descricao ||
                          "Sem descrição cadastrada."}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>
                          Ordem:{" "}
                          {categoria.ordem}
                        </span>

                        <span>
                          Denúncias vinculadas:{" "}
                          {categoria.quantidadeDenuncias ??
                            0}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={processando}
                        onClick={() =>
                          editar(categoria)
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        disabled={processando}
                        onClick={() =>
                          alterarStatus(
                            categoria
                          )
                        }
                        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                          categoria.ativo
                            ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {categoria.ativo
                          ? "Desativar"
                          : "Reativar"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {titulo}
      </p>

      <strong className="mt-2 block text-3xl font-bold text-slate-900">
        {valor}
      </strong>
    </div>
  );
}

function GravidadeBadge({
  gravidade,
}: {
  gravidade: GravidadeDenuncia;
}) {
  const configuracao = {
    BAIXA:
      "bg-green-100 text-green-700",

    MEDIA:
      "bg-yellow-100 text-yellow-700",

    ALTA:
      "bg-orange-100 text-orange-700",

    CRITICA:
      "bg-red-100 text-red-700",
  }[gravidade];

  const texto = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    CRITICA: "Crítica",
  }[gravidade];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${configuracao}`}
    >
      {texto}
    </span>
  );
}

function StatusBadge({
  ativo,
}: {
  ativo: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        ativo
          ? "bg-blue-100 text-blue-700"
          : "bg-slate-200 text-slate-700"
      }`}
    >
      {ativo ? "Ativa" : "Inativa"}
    </span>
  );
}