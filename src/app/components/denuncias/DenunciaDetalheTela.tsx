"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { GravidadeDenuncia, StatusDenuncia } from "@prisma/client";
import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";

type Props = {
  id: string;
  contexto?: "mundial" | "cliente";
};

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export default function DenunciaDetalheTela({
  id,
  contexto = "mundial",
}: Props) {
  const {
    denunciaSelecionada,
    carregando,
    erro,
    processando,
    carregarDenunciaPorId,
    salvarDenuncia,
    adicionarTratativa,
  } = useDenuncias(false, contexto);

  const [status, setStatus] = useState<StatusDenuncia>("RECEBIDA");
  const [gravidade, setGravidade] = useState<GravidadeDenuncia>("MEDIA");
  const [respostaPublica, setRespostaPublica] = useState("");

  const usuarioMundial = contexto === "mundial";

  useEffect(() => {
    carregarDenunciaPorId(id).then((denuncia) => {
      setStatus(denuncia.status);
      setGravidade(denuncia.gravidade);
      setRespostaPublica(denuncia.respostaPublica || "");
    });
  }, [id, carregarDenunciaPorId]);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!denunciaSelecionada) return;

    await salvarDenuncia({
      ...denunciaSelecionada,
      status,
      gravidade,
      respostaPublica,
    });
  }

  async function novaTratativa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await adicionarTratativa(id, {
      titulo: String(formData.get("titulo") || ""),
      descricao: String(formData.get("descricao") || ""),
      responsavel: String(formData.get("responsavel") || "") || null,
    });

    event.currentTarget.reset();
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando denúncia...
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      </main>
    );
  }

  if (!denunciaSelecionada) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Denúncia não encontrada.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            MundialSafe
          </p>

          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Denúncia {denunciaSelecionada.protocolo}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {denunciaSelecionada.cliente.empresa ||
              denunciaSelecionada.cliente.nome}
          </p>
        </div>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Dados da denúncia
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Informações registradas no protocolo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge tipo="gravidade" texto={gravidade} />
              <Badge tipo="status" texto={status} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Info label="Título" valor={denunciaSelecionada.titulo} />
            <Info
              label="Categoria"
              valor={denunciaSelecionada.categoria || "-"}
            />
            <Info
              label="Anônima"
              valor={denunciaSelecionada.anonima ? "Sim" : "Não"}
            />
            <Info
              label="Local"
              valor={denunciaSelecionada.localOcorrido || "-"}
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700">Descrição</p>
            <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {denunciaSelecionada.descricao}
            </p>
          </div>
        </section>

        {!denunciaSelecionada.anonima && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Identificação do denunciante
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Info
                label="Nome"
                valor={denunciaSelecionada.nomeDenunciante || "-"}
              />
              <Info
                label="E-mail"
                valor={denunciaSelecionada.emailDenunciante || "-"}
              />
              <Info
                label="Telefone"
                valor={denunciaSelecionada.telefoneDenunciante || "-"}
              />
            </div>
          </section>
        )}

        {usuarioMundial && (
          <form
            onSubmit={salvar}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Gestão da denúncia
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CampoSelect
                label="Status"
                value={status}
                onChange={(v) => setStatus(v as StatusDenuncia)}
              >
                <option value="RECEBIDA">Recebida</option>
                <option value="EM_ANALISE">Em análise</option>
                <option value="EM_TRATATIVA">Em tratativa</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="ARQUIVADA">Arquivada</option>
              </CampoSelect>

              <CampoSelect
                label="Gravidade"
                value={gravidade}
                onChange={(v) => setGravidade(v as GravidadeDenuncia)}
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </CampoSelect>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Resposta pública para consulta do protocolo
                </label>

                <textarea
                  value={respostaPublica}
                  onChange={(e) => setRespostaPublica(e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              disabled={processando}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {processando ? "Salvando..." : "Salvar andamento"}
            </button>
          </form>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Tratativas</h2>

          <div className="mt-5 space-y-3">
            {denunciaSelecionada.tratativas.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Nenhuma tratativa registrada.
              </p>
            ) : (
              denunciaSelecionada.tratativas.map((tratativa) => (
                <div
                  key={tratativa.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {tratativa.titulo}
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {tratativa.descricao}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    {tratativa.responsavel || "Sem responsável"} •{" "}
                    {new Date(tratativa.criadoEm).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))
            )}
          </div>

          {usuarioMundial && (
            <form onSubmit={novaTratativa} className="mt-6 grid gap-4">
              <Campo name="titulo" label="Título da tratativa" required />

              <Campo name="responsavel" label="Responsável" />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Descrição da tratativa
                </label>

                <textarea
                  name="descricao"
                  required
                  rows={3}
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                disabled={processando}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
              >
                Adicionar tratativa
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">
        {valor}
      </p>
    </div>
  );
}

function Campo({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </div>
  );
}

function Badge({
  texto,
  tipo,
}: {
  texto: string;
  tipo: "status" | "gravidade";
}) {
  const classe =
    tipo === "gravidade"
      ? texto === "CRITICA"
        ? "bg-red-100 text-red-700"
        : texto === "ALTA"
        ? "bg-orange-100 text-orange-700"
        : texto === "MEDIA"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-green-100 text-green-700"
      : texto === "CONCLUIDA"
      ? "bg-green-100 text-green-700"
      : texto === "EM_TRATATIVA"
      ? "bg-blue-100 text-blue-700"
      : texto === "EM_ANALISE"
      ? "bg-yellow-100 text-yellow-700"
      : texto === "ARQUIVADA"
      ? "bg-slate-200 text-slate-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classe}`}>
      {formatarTexto(texto)}
    </span>
  );
}