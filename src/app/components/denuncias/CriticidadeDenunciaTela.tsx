"use client";

import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  useEffect,
  useState,
} from "react";

import {
  GravidadeDenuncia,
} from "@prisma/client";

import Backend from "@/src/backend";

import { useCriticidadeDenuncia } from "@/src/app/data/hooks/useCriticidadeDenuncia";

type CategoriaDisponivel = {
  id: string;
  nome: string;
  descricao?: string | null;
};

export default function CriticidadeDenunciaTela() {
  const {
    regras,
    carregando,
    processando,
    erro,
    salvarRegra,
    excluirRegra,
  } = useCriticidadeDenuncia();

  const [gravidade, setGravidade] =
    useState<GravidadeDenuncia>("ALTA");

  const [categoria, setCategoria] =
    useState("");

  const [
    categorias,
    setCategorias,
  ] = useState<CategoriaDisponivel[]>([]);

  const [
    carregandoCategorias,
    setCarregandoCategorias,
  ] = useState(true);

  const [
    erroCategorias,
    setErroCategorias,
  ] = useState<string | null>(null);

  useEffect(() => {
    async function carregarCategorias() {
      try {
        setCarregandoCategorias(true);
        setErroCategorias(null);

        const resultado =
          await Backend.categoriasDenuncia.obterAtivas();

        const categoriasValidas = resultado
          .filter(
            (
              item
            ): item is typeof item & {
              id: string;
            } => Boolean(item.id)
          )
          .map((item) => ({
            id: item.id,
            nome: item.nome,
            descricao:
              item.descricao ?? null,
          }));

        setCategorias(categoriasValidas);
      } catch (error) {
        setErroCategorias(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as categorias."
        );
      } finally {
        setCarregandoCategorias(false);
      }
    }

    carregarCategorias();
  }, []);

  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      processando ||
      carregandoCategorias
    ) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await salvarRegra({
        termo: String(
          formData.get("termo") || ""
        ).trim(),

        categoria:
          categoria || null,

        gravidade,
        ativo: true,
      });

      form.reset();

      setCategoria("");
      setGravidade("ALTA");
    } catch {
      // O hook já registra o erro.
    }
  }

  async function confirmarExclusao(
    id: string
  ) {
    if (
      !window.confirm(
        "Deseja excluir esta regra de criticidade?"
      )
    ) {
      return;
    }

    try {
      await excluirRegra(id);
    } catch {
      // O hook já registra o erro.
    }
  }

  const bloqueado =
    processando ||
    carregandoCategorias;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Canal de Denúncias
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Regras de criticidade
        </h1>

        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Configure palavras-chave para
          classificar denúncias
          automaticamente.
        </p>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {(erro || erroCategorias) && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro || erroCategorias}
          </div>
        )}

        <form
          onSubmit={salvar}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-4">
            <Campo
              name="termo"
              label="Termo-chave"
              required
              disabled={bloqueado}
              placeholder="Ex.: agressão, ameaça, assédio"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Categoria
              </label>

              <select
                value={categoria}
                disabled={bloqueado}
                onChange={(event) =>
                  setCategoria(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="">
                  Todas as categorias
                </option>

                {categorias.map(
                  (categoriaItem) => (
                    <option
                      key={categoriaItem.id}
                      value={categoriaItem.nome}
                    >
                      {categoriaItem.nome}
                    </option>
                  )
                )}
              </select>

            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Gravidade automática
              </label>

              <select
                value={gravidade}
                disabled={bloqueado}
                onChange={(event) =>
                  setGravidade(
                    event.target
                      .value as GravidadeDenuncia
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="BAIXA">
                  Baixa
                </option>

                <option value="MEDIA">
                  Média
                </option>

                <option value="ALTA">
                  Alta
                </option>

                <option value="CRITICA">
                  Crítica
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={bloqueado}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processando
                  ? "Salvando..."
                  : carregandoCategorias
                    ? "Carregando..."
                    : "Salvar regra"}
              </button>
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Termo</Th>
                  <Th>Categoria</Th>
                  <Th>Gravidade</Th>
                  <Th>Status</Th>
                  <Th direita>
                    Opções
                  </Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia
                    texto="Carregando regras..."
                  />
                ) : regras.length === 0 ? (
                  <LinhaVazia
                    texto="Nenhuma regra cadastrada."
                  />
                ) : (
                  regras.map((regra) => (
                    <tr
                      key={regra.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {regra.termo}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {regra.categoria ||
                          "Todas as categorias"}
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          texto={
                            regra.gravidade
                          }
                        />
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {regra.ativo
                          ? "Ativa"
                          : "Inativa"}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          disabled={
                            processando
                          }
                          onClick={() =>
                            confirmarExclusao(
                              regra.id!
                            )
                          }
                          className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Campo({
  name,
  label,
  required,
  disabled = false,
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
      />
    </div>
  );
}

function Th({
  children,
  direita = false,
}: {
  children: ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${
        direita
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Badge({
  texto,
}: {
  texto: string;
}) {
  const classe =
    texto === "CRITICA"
      ? "bg-red-100 text-red-700"
      : texto === "ALTA"
        ? "bg-orange-100 text-orange-700"
        : texto === "MEDIA"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${classe}`}
    >
      {formatarTexto(texto)}
    </span>
  );
}

function LinhaVazia({
  texto,
}: {
  texto: string;
}) {
  return (
    <tr>
      <td
        colSpan={5}
        className="px-4 py-12 text-center text-sm text-slate-500"
      >
        {texto}
      </td>
    </tr>
  );
}

function formatarTexto(
  valor: string
) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase()
    );
}