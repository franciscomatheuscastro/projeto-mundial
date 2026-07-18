"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { TipoPerguntaCanalDenuncia } from "@prisma/client";
import { useRouter } from "next/navigation";
import Backend from "@/src/backend";
import { useClientes } from "@/src/app/data/hooks/useClientes";
import type { PerguntaCanalDenuncia } from "@/src/core/model/PerguntaCanalDenuncia";

type Props = {
  perguntaInicial?: PerguntaCanalDenuncia | null;
};

export default function PerguntaCanalDenunciaFormulario({
  perguntaInicial = null,
}: Props) {
  const router = useRouter();
  const { clientes, carregarClientes } = useClientes();

  const [enunciado, setEnunciado] = useState(
    perguntaInicial?.enunciado || ""
  );
  const [descricao, setDescricao] = useState(
    perguntaInicial?.descricao || ""
  );
  const [tipo, setTipo] =
    useState<TipoPerguntaCanalDenuncia>(
      perguntaInicial?.tipo || "TEXTO"
    );
  const [obrigatoria, setObrigatoria] = useState(
    perguntaInicial?.obrigatoria || false
  );
  const [ativo, setAtivo] = useState(
    perguntaInicial?.ativo ?? true
  );
  const [ordem, setOrdem] = useState(
    perguntaInicial?.ordem || 0
  );
  const [clienteIds, setClienteIds] = useState<string[]>(
    perguntaInicial?.clienteIds || []
  );
  const [opcoesTexto, setOpcoesTexto] = useState(
    perguntaInicial?.opcoes.join("\n") || ""
  );

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  function alternarCliente(id: string) {
    setClienteIds((atual) =>
      atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id]
    );
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;

    try {
      setSalvando(true);
      setErro(null);

      await Backend.perguntasCanalDenuncia.salvar({
        id: perguntaInicial?.id,
        enunciado,
        descricao: descricao || null,
        tipo,
        obrigatoria,
        ativo,
        ordem,
        clienteIds,
        opcoes:
          tipo === "MULTIPLA_ESCOLHA"
            ? opcoesTexto.split("\n")
            : [],
      });

      router.push("/denuncias/perguntas");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a pergunta."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
          Canal de denúncias
        </p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">
          {perguntaInicial ? "Editar pergunta" : "Nova pergunta"}
        </h1>
      </header>

      <form
        onSubmit={salvar}
        className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6"
      >
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {erro}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Pergunta
              </label>
              <input
                value={enunciado}
                onChange={(event) => setEnunciado(event.target.value)}
                required
                disabled={salvando}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Texto de apoio
              </label>
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={3}
                disabled={salvando}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(event) =>
                  setTipo(
                    event.target.value as TipoPerguntaCanalDenuncia
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="TEXTO">Texto curto</option>
                <option value="TEXTO_LONGO">Texto longo</option>
                <option value="SIM_NAO">Sim ou não</option>
                <option value="MULTIPLA_ESCOLHA">
                  Múltipla escolha
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ordem
              </label>
              <input
                type="number"
                value={ordem}
                onChange={(event) =>
                  setOrdem(Number(event.target.value))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            {tipo === "MULTIPLA_ESCOLHA" && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Opções — uma por linha
                </label>
                <textarea
                  value={opcoesTexto}
                  onChange={(event) =>
                    setOpcoesTexto(event.target.value)
                  }
                  required
                  rows={5}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>
            )}

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={obrigatoria}
                onChange={(event) =>
                  setObrigatoria(event.target.checked)
                }
              />
              Pergunta obrigatória
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(event) => setAtivo(event.target.checked)}
              />
              Pergunta ativa
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Canais em que a pergunta aparecerá
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Selecione um ou mais clientes.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {clientes.map((cliente) => (
              <label
                key={cliente.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
              >
                <input
                  type="checkbox"
                  checked={clienteIds.includes(cliente.id)}
                  onChange={() => alternarCliente(cliente.id)}
                />
                <span className="text-sm font-semibold text-slate-800">
                  {cliente.empresa || cliente.nome}
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={salvando}
            onClick={() => router.push("/denuncias/perguntas")}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar pergunta"}
          </button>
        </div>
      </form>
    </main>
  );
}
