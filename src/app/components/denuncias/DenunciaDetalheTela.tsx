"use client";

import { FormEvent, useEffect, useState } from "react";
import { GravidadeDenuncia, StatusDenuncia } from "@prisma/client";
import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";

type Props = {
  id: string;
  contexto?: "mundial" | "cliente";
};

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

  useEffect(() => {
    carregarDenunciaPorId(id).then((denuncia) => {
      setStatus(denuncia.status);
      setGravidade(denuncia.gravidade);
      setRespostaPublica(denuncia.respostaPublica || "");
    });
  }, [id]);

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
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <p className="text-sm text-slate-500">Carregando denúncia...</p>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      </main>
    );
  }

  if (!denunciaSelecionada) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Denúncia não encontrada.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-4">
        <h1 className="text-xl font-bold text-slate-900">
          Denúncia {denunciaSelecionada.protocolo}
        </h1>
        <p className="text-sm text-slate-500">
          {denunciaSelecionada.cliente.empresa ||
            denunciaSelecionada.cliente.nome}
        </p>
      </header>

      <section className="space-y-6 px-8 py-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Dados da denúncia
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
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

          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Descrição</p>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              {denunciaSelecionada.descricao}
            </p>
          </div>
        </div>

        {!denunciaSelecionada.anonima && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Identificação do denunciante
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
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
          </div>
        )}

        <form onSubmit={salvar} className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Gestão da denúncia
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Resposta pública para consulta do protocolo
              </label>
              <textarea
                value={respostaPublica}
                onChange={(e) => setRespostaPublica(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            disabled={processando}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Salvar andamento
          </button>
        </form>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Tratativas</h2>

          <div className="mt-4 space-y-3">
            {denunciaSelecionada.tratativas.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma tratativa registrada.
              </p>
            ) : (
              denunciaSelecionada.tratativas.map((tratativa) => (
                <div key={tratativa.id} className="rounded-lg border p-4">
                  <p className="font-medium text-slate-900">
                    {tratativa.titulo}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {tratativa.descricao}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {tratativa.responsavel || "Sem responsável"} •{" "}
                    {new Date(tratativa.criadoEm).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={novaTratativa} className="mt-6 grid gap-4">
            <input
              name="titulo"
              required
              placeholder="Título da tratativa"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />

            <input
              name="responsavel"
              placeholder="Responsável"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />

            <textarea
              name="descricao"
              required
              rows={3}
              placeholder="Descrição da tratativa"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />

            <button
              disabled={processando}
              className="w-fit rounded-lg border px-5 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              Adicionar tratativa
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{valor}</p>
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
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
      >
        {children}
      </select>
    </div>
  );
}