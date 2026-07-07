"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { GravidadeDenuncia } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";
import { useClientes } from "@/src/app/data/hooks/useClientes";
import { Denuncia } from "@/src/core/model/Denuncia";

type Props = {
  contexto?: "mundial" | "cliente";
};

export default function DenunciaFormularioTela({
  contexto = "mundial",
}: Props) {
  const router = useRouter();

  const { processando, erro, criarDenunciaManual, criarMinhaDenunciaManual } =
    useDenuncias(false, contexto);

  const { clientes, carregarClientes } = useClientes();

  const [anonima, setAnonima] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [gravidade, setGravidade] = useState<GravidadeDenuncia>("MEDIA");

  const usuarioMundial = contexto === "mundial";
  const baseHref = usuarioMundial ? "/denuncias" : "/minhas-denuncias";

  useEffect(() => {
    if (usuarioMundial) {
      carregarClientes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioMundial]);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const denuncia: Denuncia = {
      clienteId: usuarioMundial ? clienteId : "",

      titulo: String(form.get("titulo") || ""),
      descricao: String(form.get("descricao") || ""),
      categoria: String(form.get("categoria") || "") || null,
      localOcorrido: String(form.get("local") || "") || null,
      dataOcorrido: String(form.get("data") || "") || null,

      anonima,

      nomeDenunciante: anonima
        ? null
        : String(form.get("nome") || "") || null,

      emailDenunciante: anonima
        ? null
        : String(form.get("email") || "") || null,

      telefoneDenunciante: anonima
        ? null
        : String(form.get("telefone") || "") || null,

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

    if (usuarioMundial) {
      await criarDenunciaManual(denuncia);
    } else {
      await criarMinhaDenunciaManual(denuncia);
    }

    router.push(baseHref);
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
            Cadastro manual de denúncia para registro, análise e tratativa.
          </p>
        </div>
      </header>

      <form
        onSubmit={salvar}
        className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      >
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
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
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Selecione o cliente</option>

                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.empresa || cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Campo label="Título" name="titulo" required />
            <Campo label="Categoria" name="categoria" />
            <Campo label="Local do ocorrido" name="local" />
            <Campo label="Data do ocorrido" name="data" type="date" />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Gravidade
              </label>

              <select
                value={gravidade}
                onChange={(e) =>
                  setGravidade(e.target.value as GravidadeDenuncia)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
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
                placeholder="Descreva o ocorrido com o máximo de informações relevantes."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
              onChange={(e) => setAnonima(e.target.checked)}
              className="mt-1"
            />

            <span>
              <strong className="block text-slate-900">
                Denúncia anônima
              </strong>
              Os dados do denunciante não serão registrados neste atendimento.
            </span>
          </label>

          {!anonima && (
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <Campo label="Nome" name="nome" />
              <Campo label="E-mail" name="email" type="email" />
              <Campo label="Telefone" name="telefone" />
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push(baseHref)}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>

          <button
            disabled={processando}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {processando ? "Salvando..." : "Salvar denúncia"}
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
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
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
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}