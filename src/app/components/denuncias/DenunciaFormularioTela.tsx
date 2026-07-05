"use client";

import { FormEvent, useEffect, useState } from "react";
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

  useEffect(() => {
    if (contexto === "mundial") {
      carregarClientes();
    }
  }, [contexto]);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    const denuncia: Denuncia = {
        clienteId: contexto === "mundial" ? clienteId : "",

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
        tratativas: [],
        cliente: {
            id: "",
            nome: "",
            empresa: null,
        },
        };

    if (contexto === "cliente") {
      await criarMinhaDenunciaManual(denuncia);
      router.push("/minhas-denuncias");
    } else {
      await criarDenunciaManual(denuncia);
      router.push("/denuncias");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-slate-900">Nova denúncia</h1>
        <p className="text-slate-500">Cadastro manual de denúncia.</p>
      </header>

      <form onSubmit={salvar} className="mx-auto max-w-5xl space-y-6 px-8 py-8">
        {erro && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">{erro}</div>
        )}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            {contexto === "mundial" && (
              <div className="md:col-span-2">
                <label className="mb-2 block font-medium text-slate-700">
                  Cliente
                </label>

                <select
                  value={clienteId}
                  required
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3"
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
              <label className="mb-2 block font-medium text-slate-700">
                Gravidade
              </label>

              <select
                value={gravidade}
                onChange={(e) =>
                  setGravidade(e.target.value as GravidadeDenuncia)
                }
                className="w-full rounded-lg border px-4 py-3"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block font-medium text-slate-700">
              Descrição
            </label>

            <textarea
              name="descricao"
              required
              rows={8}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <label className="flex items-center gap-3 text-slate-700">
            <input
              type="checkbox"
              checked={anonima}
              onChange={(e) => setAnonima(e.target.checked)}
            />
            Denúncia anônima
          </label>

          {!anonima && (
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <Campo label="Nome" name="nome" />
              <Campo label="E-mail" name="email" />
              <Campo label="Telefone" name="telefone" />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            disabled={processando}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
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
      <label className="mb-2 block font-medium text-slate-700">{label}</label>

      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border px-4 py-3"
      />
    </div>
  );
}