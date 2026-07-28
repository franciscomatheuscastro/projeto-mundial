"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusAgendamento, TipoAgendamento } from "@prisma/client";
import { useAgendamentos } from "@/src/app/data/hooks/useAgendamentos";
import { usePlanosAcao } from "@/src/app/data/hooks/usePlanosAcao";
import {
  AgendamentoDetalhado,
  ParticipanteAgendamento,
  ParticipanteClienteDisponivel,
} from "@/src/core/model/Agendamento";

type Props = {
  agendamentoInicial?: AgendamentoDetalhado | null;
  contexto?: "mundial" | "cliente";
};

function paraInputDateTime(data?: Date | string) {
  if (!data) return "";
  const d = new Date(data);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function formatarTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function telefoneValido(valor?: string | null) {
  if (!valor) return true;
  const tamanho = valor.replace(/\D/g, "").length;
  return tamanho === 10 || tamanho === 11;
}

export default function AgendamentoFormularioTela({
  agendamentoInicial,
  contexto = "mundial",
}: Props) {
  const router = useRouter();
  const {
    salvarAgendamento,
    obterParticipantesCliente,
    processando,
    erro,
  } = useAgendamentos(false, contexto);
  const { planos, carregarPlanos } = usePlanosAcao(false, contexto);

  const usuarioMundial = contexto === "mundial";
  const baseHref = usuarioMundial ? "/agendamentos" : "/meus-agendamentos";

  const [planoAcaoId, setPlanoAcaoId] = useState(agendamentoInicial?.planoAcaoId || "");
  const [titulo, setTitulo] = useState(agendamentoInicial?.titulo || "");
  const [descricao, setDescricao] = useState(agendamentoInicial?.descricao || "");
  const [dataHora, setDataHora] = useState(paraInputDateTime(agendamentoInicial?.dataHora));
  const [duracaoMin, setDuracaoMin] = useState(String(agendamentoInicial?.duracaoMin || 60));
  const [local, setLocal] = useState(agendamentoInicial?.local || "");
  const [linkReuniao, setLinkReuniao] = useState(agendamentoInicial?.linkReuniao || "");
  const [tipo, setTipo] = useState<TipoAgendamento>(
    agendamentoInicial?.tipo || "APRESENTACAO_PLANO"
  );
  const [status, setStatus] = useState<StatusAgendamento>(
    agendamentoInicial?.status || "AGENDADO"
  );
  const [participantes, setParticipantes] = useState<ParticipanteAgendamento[]>(
    agendamentoInicial?.participantes?.length
      ? agendamentoInicial.participantes.map((p) => ({
          ...p,
          telefone: formatarTelefone(p.telefone || ""),
        }))
      : []
  );
  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<
    ParticipanteClienteDisponivel[]
  >([]);
  const [participanteSelecionado, setParticipanteSelecionado] = useState("");
  const [carregandoParticipantes, setCarregandoParticipantes] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  useEffect(() => {
    if (usuarioMundial) carregarPlanos();
  }, [usuarioMundial, carregarPlanos]);

  const planoSelecionado = useMemo(
    () => planos.find((plano) => plano.id === planoAcaoId),
    [planos, planoAcaoId]
  );

  const clienteSelecionado =
    planoSelecionado?.pesquisa?.cliente || planoSelecionado?.denuncia?.cliente;

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!clienteSelecionado?.id) {
        setParticipantesDisponiveis([]);
        return;
      }

      try {
        setCarregandoParticipantes(true);
        const dados = await obterParticipantesCliente(clienteSelecionado.id);
        if (ativo) setParticipantesDisponiveis(dados);
      } finally {
        if (ativo) setCarregandoParticipantes(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [clienteSelecionado?.id, obterParticipantesCliente]);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErroLocal(null);

    const telefoneInvalido = participantes.find(
      (participante) => !telefoneValido(participante.telefone)
    );

    if (telefoneInvalido) {
      setErroLocal(`Confira o telefone de ${telefoneInvalido.nome || "um participante"}.`);
      return;
    }

    try {
      const resultado = await salvarAgendamento({
        id: agendamentoInicial?.id,
        planoAcaoId: planoAcaoId || null,
        titulo,
        descricao,
        dataHora: new Date(dataHora).toISOString(),
        duracaoMin: Number(duracaoMin || 60),
        local,
        linkReuniao,
        tipo,
        status,
        participantes: participantes.filter((p) => p.nome.trim()),
      });

      sessionStorage.setItem(
        "mensagem-agendamento",
        resultado.avisoEmail || "Agendamento salvo com sucesso."
      );
      sessionStorage.setItem(
        "tipo-mensagem-agendamento",
        resultado.avisoEmail ? "aviso" : "sucesso"
      );
      router.push(baseHref);
      router.refresh();
    } catch {
      // O hook já expõe a mensagem de erro.
    }
  }

  function adicionarParticipanteManual() {
    setParticipantes((atual) => [
      ...atual,
      {
        id: `participante-${Date.now()}`,
        nome: "",
        email: "",
        telefone: "",
        tipo: "OUTRO",
        origem: "MANUAL",
        origemId: null,
      },
    ]);
  }

  function adicionarParticipanteVinculado() {
    const disponivel = participantesDisponiveis.find(
      (item) => `${item.origem}:${item.id}` === participanteSelecionado
    );
    if (!disponivel) return;

    const jaAdicionado = participantes.some(
      (item) => item.origem === disponivel.origem && item.origemId === disponivel.id
    );
    if (jaAdicionado) {
      setErroLocal("Este participante já foi adicionado.");
      return;
    }

    setParticipantes((atual) => [
      ...atual,
      {
        id: `participante-${Date.now()}`,
        nome: disponivel.nome,
        email: disponivel.email,
        telefone: formatarTelefone(disponivel.telefone || ""),
        tipo: "CLIENTE",
        origem: disponivel.origem,
        origemId: disponivel.id,
      },
    ]);
    setParticipanteSelecionado("");
    setErroLocal(null);
  }

  function atualizarParticipante(
    index: number,
    campo: keyof ParticipanteAgendamento,
    valor: string
  ) {
    setParticipantes((atual) =>
      atual.map((participante, i) =>
        i === index
          ? {
              ...participante,
              [campo]: campo === "telefone" ? formatarTelefone(valor) : valor,
            }
          : participante
      )
    );
  }

  function removerParticipante(index: number) {
    setParticipantes((atual) => atual.filter((_, i) => i !== index));
  }

  if (!usuarioMundial) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Mundial Connect</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Acesso restrito</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            O cliente pode visualizar os agendamentos, mas não editar ou criar registros.
          </p>
          <button type="button" onClick={() => router.push(baseHref)} className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
            Voltar para agendamentos
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Mundial Connect</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
          {agendamentoInicial ? "Editar agendamento" : "Novo agendamento"}
        </h1>
      </header>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        {(erro || erroLocal) && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erroLocal || erro}
          </div>
        )}

        <form onSubmit={salvar} className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Dados do agendamento</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <CampoSelect label="Plano de ação" value={planoAcaoId} onChange={setPlanoAcaoId}>
                <option value="">Sem plano vinculado</option>
                {planos.map((plano) => {
                  const cliente = plano.pesquisa?.cliente || plano.denuncia?.cliente;
                  const origem = plano.tipoOrigem === "DENUNCIA"
                    ? `Denúncia ${plano.denuncia?.protocolo || ""}`
                    : "Pesquisa de clima";
                  return (
                    <option key={plano.id} value={plano.id}>
                      {cliente?.empresa || cliente?.nome || "Cliente não identificado"} - {origem} - {plano.titulo}
                    </option>
                  );
                })}
              </CampoSelect>

              <Campo label="Título" value={titulo} onChange={setTitulo} required />
              <Campo label="Data e hora" type="datetime-local" value={dataHora} onChange={setDataHora} required />
              <Campo label="Duração em minutos" type="number" value={duracaoMin} onChange={setDuracaoMin} required min="1" />

              <CampoSelect label="Tipo" value={tipo} onChange={(v) => setTipo(v as TipoAgendamento)}>
                <option value="APRESENTACAO_PLANO">Apresentação do plano</option>
                <option value="REUNIAO_ALINHAMENTO">Reunião de alinhamento</option>
                <option value="DEVOLUTIVA">Devolutiva</option>
                <option value="OUTRO">Outro</option>
              </CampoSelect>

              <CampoSelect label="Status" value={status} onChange={(v) => setStatus(v as StatusAgendamento)}>
                <option value="AGENDADO">Agendado</option>
                <option value="REALIZADO">Realizado</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="REAGENDADO">Reagendado</option>
              </CampoSelect>

              <Campo label="Local" value={local} onChange={setLocal} />
              <Campo label="Link da reunião" type="url" value={linkReuniao} onChange={setLinkReuniao} />
              <div className="lg:col-span-2">
                <CampoTexto label="Descrição" value={descricao} onChange={setDescricao} />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Participantes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Vincule o cliente master, colaboradores cadastrados ou inclua alguém manualmente.
            </p>

            {clienteSelecionado && (
              <div className="mt-5 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-[1fr_auto]">
                <select
                  value={participanteSelecionado}
                  onChange={(e) => setParticipanteSelecionado(e.target.value)}
                  disabled={carregandoParticipantes}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">
                    {carregandoParticipantes ? "Carregando participantes..." : "Selecione um participante do cliente"}
                  </option>
                  {participantesDisponiveis.map((item) => (
                    <option key={`${item.origem}:${item.id}`} value={`${item.origem}:${item.id}`}>
                      {item.nome} — {item.descricao}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={adicionarParticipanteVinculado} disabled={!participanteSelecionado} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  Vincular participante
                </button>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button type="button" onClick={adicionarParticipanteManual} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">
                Adicionar manualmente
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {participantes.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Nenhum participante adicionado.
                </div>
              )}

              {participantes.map((participante, index) => (
                <div key={participante.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <strong className="text-sm text-slate-700">Participante {index + 1}</strong>
                    <button type="button" onClick={() => removerParticipante(index)} className="text-xs font-bold text-red-600">
                      Remover
                    </button>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Campo label="Nome" value={participante.nome} onChange={(v) => atualizarParticipante(index, "nome", v)} required />
                    <Campo label="E-mail" type="email" value={participante.email || ""} onChange={(v) => atualizarParticipante(index, "email", v)} />
                    <Campo label="Telefone" type="tel" inputMode="numeric" maxLength={15} value={participante.telefone || ""} onChange={(v) => atualizarParticipante(index, "telefone", v)} />
                    <CampoSelect label="Tipo" value={participante.tipo || "OUTRO"} onChange={(v) => atualizarParticipante(index, "tipo", v)}>
                      <option value="CLIENTE">Cliente</option>
                      <option value="INTERNO">Interno</option>
                      <option value="OUTRO">Outro</option>
                    </CampoSelect>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => router.push(baseHref)} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">
              Cancelar
            </button>
            <button disabled={processando} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {processando ? "Salvando..." : "Salvar agendamento"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  required,
  type = "text",
  min,
  maxLength,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  maxLength?: number;
  inputMode?: "numeric" | "tel" | "text";
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={min}
        maxLength={maxLength}
        inputMode={inputMode}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function CampoTexto({ label, value, onChange }: { label: string; value: string; onChange: (valor: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
    </div>
  );
}

function CampoSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (valor: string) => void; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
        {children}
      </select>
    </div>
  );
}
