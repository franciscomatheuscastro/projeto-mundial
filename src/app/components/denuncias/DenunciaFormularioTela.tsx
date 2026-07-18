"use client";

import type { FormEvent } from "react";

import { useEffect, useState } from "react";

import { GravidadeDenuncia } from "@prisma/client";
import { useRouter } from "next/navigation";

import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";
import { useClientes } from "@/src/app/data/hooks/useClientes";

import { Denuncia } from "@/src/core/model/Denuncia";

import CampoAnexos from "@/src/app/components/denuncias/CampoAnexos";

type CategoriaDisponivel = {
  id: string;
  nome: string;
  descricao?: string | null;
};

type Props = {
  contexto?: "mundial" | "cliente";
  categorias: CategoriaDisponivel[];
};

export default function DenunciaFormularioTela({
  contexto = "mundial",
  categorias,
}: Props) {
  const router = useRouter();

  const {
    processando,
    erro,
    criarDenunciaManual,
    criarMinhaDenunciaManual,
    enviarAnexos,
  } = useDenuncias(false, contexto);

  const { clientes, carregarClientes } =
    useClientes();

  const [anonima, setAnonima] =
    useState(false);

  const [clienteId, setClienteId] =
    useState("");

  const [categoriaId, setCategoriaId] =
    useState("");

  const [gravidade, setGravidade] =
    useState<GravidadeDenuncia>("MEDIA");

  const [arquivos, setArquivos] =
    useState<File[]>([]);

  const [
    enviandoArquivos,
    setEnviandoArquivos,
  ] = useState(false);

  const [erroLocal, setErroLocal] =
    useState<string | null>(null);

  const usuarioMundial =
    contexto === "mundial";

  const baseHref = usuarioMundial
    ? "/denuncias"
    : "/minhas-denuncias";

  const enviando =
    processando || enviandoArquivos;

  useEffect(() => {
    if (usuarioMundial) {
      carregarClientes();
    }
  }, [usuarioMundial, carregarClientes]);

  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (enviando) {
      return;
    }

    if (!categoriaId) {
      setErroLocal(
        "Selecione uma categoria."
      );

      return;
    }

    if (usuarioMundial && !clienteId) {
      setErroLocal(
        "Selecione o cliente."
      );

      return;
    }

    const formulario = event.currentTarget;
    const form = new FormData(formulario);

    setErroLocal(null);

    const denuncia: Denuncia = {
      clienteId: usuarioMundial
        ? clienteId
        : "",

      titulo: String(
        form.get("titulo") || ""
      ).trim(),

      descricao: String(
        form.get("descricao") || ""
      ).trim(),

      categoriaId,

      localOcorrido:
        String(
          form.get("local") || ""
        ).trim() || null,

      dataOcorrido:
        String(
          form.get("data") || ""
        ).trim() || null,

      anonima,

      nomeDenunciante: anonima
        ? null
        : String(
            form.get("nome") || ""
          ).trim() || null,

      emailDenunciante: anonima
        ? null
        : String(
            form.get("email") || ""
          ).trim() || null,

      telefoneDenunciante: anonima
        ? null
        : String(
            form.get("telefone") || ""
          ).trim() || null,

      gravidade,
      status: "RECEBIDA",
      respostaPublica: null,
      tratativas: [],

      cliente: {
        id: "",
        nome: "",
        empresa: null,
      },
    };

    try {
      const resultado = usuarioMundial
        ? await criarDenunciaManual(
            denuncia
          )
        : await criarMinhaDenunciaManual(
            denuncia
          );

      if (arquivos.length > 0) {
        setEnviandoArquivos(true);

        try {
          await enviarAnexos(
            {
              id: resultado.id,
              protocolo:
                resultado.protocolo,
            },
            arquivos
          );
        } catch (error) {
          setErroLocal(
            error instanceof Error
              ? `A denúncia foi salva, mas houve erro no envio dos anexos: ${error.message}`
              : "A denúncia foi salva, mas houve erro no envio dos anexos."
          );

          return;
        } finally {
          setEnviandoArquivos(false);
        }
      }

      router.push(
        `${baseHref}/${resultado.id}`
      );
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a denúncia."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            MundialSafe
          </p>

          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Nova denúncia
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Cadastro manual para registro,
            análise e tratativa.
          </p>
        </div>
      </header>

      <form
        onSubmit={salvar}
        className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      >
        {(erro || erroLocal) && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erroLocal || erro}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Dados da denúncia
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {usuarioMundial && (
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Cliente
                </label>

                <select
                  value={clienteId}
                  required
                  disabled={enviando}
                  onChange={(event) =>
                    setClienteId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    Selecione o cliente
                  </option>

                  {clientes.map((cliente) => (
                    <option
                      key={cliente.id}
                      value={cliente.id}
                    >
                      {cliente.empresa ||
                        cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Campo
              label="Título"
              name="titulo"
              required
              disabled={enviando}
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Categoria
              </label>

              <select
                value={categoriaId}
                required
                disabled={enviando}
                onChange={(event) =>
                  setCategoriaId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="">
                  Selecione a categoria
                </option>

                {categorias.map(
                  (categoria) => (
                    <option
                      key={categoria.id}
                      value={categoria.id}
                    >
                      {categoria.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <Campo
              label="Local do ocorrido"
              name="local"
              disabled={enviando}
            />

            <Campo
              label="Data do ocorrido"
              name="data"
              type="date"
              disabled={enviando}
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Gravidade
              </label>

              <select
                value={gravidade}
                disabled={enviando}
                onChange={(event) =>
                  setGravidade(
                    event.target
                      .value as GravidadeDenuncia
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
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

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Descrição
              </label>

              <textarea
                name="descricao"
                required
                rows={8}
                disabled={enviando}
                placeholder="Descreva o ocorrido com o máximo de informações relevantes."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div className="lg:col-span-2">
              <CampoAnexos
                arquivos={arquivos}
                onChange={setArquivos}
                disabled={enviando}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Identificação do denunciante
          </h2>

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={anonima}
              disabled={enviando}
              onChange={(event) =>
                setAnonima(
                  event.target.checked
                )
              }
              className="mt-1"
            />

            <span>
              <strong className="block text-slate-900">
                Denúncia anônima
              </strong>

              Os dados pessoais do denunciante
              não serão registrados.
            </span>
          </label>

          {!anonima && (
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <Campo
                label="Nome"
                name="nome"
                disabled={enviando}
              />

              <Campo
                label="E-mail"
                name="email"
                type="email"
                disabled={enviando}
              />

              <Campo
                label="Telefone"
                name="telefone"
                disabled={enviando}
              />
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={enviando}
            onClick={() =>
              router.push(baseHref)
            }
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
          >
            {enviandoArquivos
              ? "Enviando anexos..."
              : processando
                ? "Salvando..."
                : "Salvar denúncia"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Campo({
  label,
  name,
  required,
  type = "text",
  disabled = false,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
      />
    </div>
  );
}