"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useAgendamentos } from "@/src/app/data/hooks/useAgendamentos";

type Props = {
  contexto?: "mundial" | "cliente";
};

function formatarData(data: Date | string) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatarHora(data: Date | string) {
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function chaveData(data: Date | string) {
  const d = new Date(data);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function nomeMes(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function mesmoMes(data: Date, referencia: Date) {
  return (
    data.getMonth() === referencia.getMonth() &&
    data.getFullYear() === referencia.getFullYear()
  );
}

function criarDiasCalendario(dataBase: Date) {
  const ano = dataBase.getFullYear();
  const mes = dataBase.getMonth();

  const primeiroDiaMes = new Date(ano, mes, 1);
  const ultimoDiaMes = new Date(ano, mes + 1, 0);

  const inicio = new Date(primeiroDiaMes);
  inicio.setDate(primeiroDiaMes.getDate() - primeiroDiaMes.getDay());

  const fim = new Date(ultimoDiaMes);
  fim.setDate(ultimoDiaMes.getDate() + (6 - ultimoDiaMes.getDay()));

  const dias: Date[] = [];
  const atual = new Date(inicio);

  while (atual <= fim) {
    dias.push(new Date(atual));
    atual.setDate(atual.getDate() + 1);
  }

  return dias;
}

export default function AgendamentosTela({ contexto = "mundial" }: Props) {
  const { agendamentos, carregando, erro, excluirAgendamento, processando } =
    useAgendamentos(true, contexto);

  const usuarioMundial = contexto === "mundial";
  const baseHref = usuarioMundial ? "/agendamentos" : "/meus-agendamentos";

  const hoje = new Date();

  const [mesAtual, setMesAtual] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );

  const [diaSelecionado, setDiaSelecionado] = useState(chaveData(hoje));

  const diasCalendario = useMemo(() => criarDiasCalendario(mesAtual), [mesAtual]);

  const agendamentosPorDia = useMemo(() => {
    return agendamentos.reduce<Record<string, typeof agendamentos>>(
      (acc, agendamento) => {
        const chave = chaveData(agendamento.dataHora);

        if (!acc[chave]) {
          acc[chave] = [];
        }

        acc[chave].push(agendamento);

        return acc;
      },
      {}
    );
  }, [agendamentos]);

  const agendamentosDoDia = useMemo(() => {
    return [...(agendamentosPorDia[diaSelecionado] || [])].sort(
      (a, b) =>
        new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
    );
  }, [agendamentosPorDia, diaSelecionado]);

  function voltarMes() {
    setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1));
  }

  function avancarMes() {
    setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1));
  }

  function irParaHoje() {
    const agora = new Date();
    setMesAtual(new Date(agora.getFullYear(), agora.getMonth(), 1));
    setDiaSelecionado(chaveData(agora));
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Agendamentos
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              Calendário de Agendamentos
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              {usuarioMundial
                ? "Visualize reuniões, devolutivas e apresentações em formato de calendário."
                : "Acompanhe os compromissos da sua empresa de forma simples e organizada."}
            </p>
          </div>

          {usuarioMundial && (
            <Link
              href="/agendamentos/novo"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              Novo agendamento
            </Link>
          )}
        </div>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold capitalize text-slate-900">
                  {nomeMes(mesAtual)}
                </h2>

                <p className="text-sm text-slate-500">
                  Clique em um dia para visualizar os agendamentos.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={voltarMes}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={irParaHoje}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hoje
                </button>

                <button
                  type="button"
                  onClick={avancarMes}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Próximo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 pb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
              <span>Dom</span>
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-2">
              {diasCalendario.map((dia) => {
                const chave = chaveData(dia);
                const eventos = agendamentosPorDia[chave] || [];
                const selecionado = chave === diaSelecionado;
                const diaAtual = chave === chaveData(hoje);
                const dentroMes = mesmoMes(dia, mesAtual);

                return (
                  <button
                    key={chave}
                    type="button"
                    onClick={() => setDiaSelecionado(chave)}
                    className={`min-h-[110px] rounded-2xl border p-2 text-left transition hover:border-blue-300 hover:bg-blue-50/40 ${
                      selecionado
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white"
                    } ${!dentroMes ? "opacity-40" : ""}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                          diaAtual
                            ? "bg-blue-600 text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {dia.getDate()}
                      </span>

                      {eventos.length > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                          {eventos.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {eventos.slice(0, 2).map((evento) => (
                        <div
                          key={evento.id}
                          className="truncate rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          {formatarHora(evento.dataHora)} · {evento.titulo}
                        </div>
                      ))}

                      {eventos.length > 2 && (
                        <div className="text-[11px] font-semibold text-slate-400">
                          +{eventos.length - 2} agendamento(s)
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Dia selecionado
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {new Date(`${diaSelecionado}T12:00:00`).toLocaleDateString(
                  "pt-BR",
                  {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </h2>
            </div>

            {carregando ? (
              <EstadoVazio texto="Carregando agendamentos..." />
            ) : agendamentosDoDia.length === 0 ? (
              <EstadoVazio texto="Nenhum agendamento neste dia." />
            ) : (
              <div className="space-y-3">
                {agendamentosDoDia.map((agendamento) => (
                  <article
                    key={agendamento.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-blue-600">
                          {formatarHora(agendamento.dataHora)}
                        </p>

                        <h3 className="mt-1 text-sm font-bold text-slate-900">
                          {agendamento.titulo}
                        </h3>
                      </div>

                      <Badge texto={agendamento.status} />
                    </div>

                    {usuarioMundial && (
                      <p className="mt-2 text-sm text-slate-600">
                        {agendamento.planoAcao?.pesquisa.cliente.empresa ||
                          agendamento.planoAcao?.pesquisa.cliente.nome ||
                          "Sem cliente vinculado"}
                      </p>
                    )}

                    {agendamento.descricao && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {agendamento.descricao}
                      </p>
                    )}

                    {agendamento.linkReuniao && (
                      <a
                        href={agendamento.linkReuniao}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Acessar reunião
                      </a>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge texto={agendamento.tipo} />

                      {agendamento.local && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                          {agendamento.local}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      {usuarioMundial && (
                        <>
                          <Link
                            href={`${baseHref}/${agendamento.id}`}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Abrir
                          </Link>

                          <button
                            type="button"
                            disabled={processando}
                            onClick={() => {
                              if (confirm("Deseja excluir este agendamento?")) {
                                excluirAgendamento(agendamento.id);
                              }
                            }}
                            className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function Badge({ texto }: { texto: string }) {
  const classe =
    texto === "REALIZADO"
      ? "bg-green-100 text-green-700"
      : texto === "CANCELADO"
      ? "bg-red-100 text-red-700"
      : texto === "REAGENDADO"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-blue-100 text-blue-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classe}`}>
      {formatarTexto(texto)}
    </span>
  );
}

function EstadoVazio({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      {texto}
    </div>
  );
}