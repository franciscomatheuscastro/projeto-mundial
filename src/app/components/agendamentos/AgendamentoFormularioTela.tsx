"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusAgendamento, TipoAgendamento } from "@prisma/client";
import { useAgendamentos } from "@/src/app/data/hooks/useAgendamentos";
import { usePlanosAcao } from "@/src/app/data/hooks/usePlanosAcao";
import {
  AgendamentoDetalhado,
  ParticipanteAgendamento,
} from "@/src/core/model/Agendamento";

type Props = {
  agendamentoInicial?: AgendamentoDetalhado | null;
};

function paraInputDateTime(data?: Date | string) {
  if (!data) return "";

  const d = new Date(data);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

export default function AgendamentoFormularioTela({
  agendamentoInicial,
}: Props) {
  const router = useRouter();
  const { salvarAgendamento, processando, erro } = useAgendamentos(false);
  const { planos, carregarPlanos } = usePlanosAcao(false);

  const [planoAcaoId, setPlanoAcaoId] = useState(
    agendamentoInicial?.planoAcaoId || ""
  );
  const [titulo, setTitulo] = useState(agendamentoInicial?.titulo || "");
  const [descricao, setDescricao] = useState(
    agendamentoInicial?.descricao || ""
  );
  const [dataHora, setDataHora] = useState(
    paraInputDateTime(agendamentoInicial?.dataHora)
  );
  const [duracaoMin, setDuracaoMin] = useState(
    String(agendamentoInicial?.duracaoMin || 60)
  );
  const [local, setLocal] = useState(agendamentoInicial?.local || "");
  const [linkReuniao, setLinkReuniao] = useState(
    agendamentoInicial?.linkReuniao || ""
  );
  const [tipo, setTipo] = useState<TipoAgendamento>(
    agendamentoInicial?.tipo || "APRESENTACAO_PLANO"
  );
  const [status, setStatus] = useState<StatusAgendamento>(
    agendamentoInicial?.status || "AGENDADO"
  );

  const [participantes, setParticipantes] = useState<ParticipanteAgendamento[]>(
    agendamentoInicial?.participantes?.length
      ? agendamentoInicial.participantes
      : [
          {
            id: "participante-1",
            nome: "",
            email: "",
            telefone: "",
            tipo: "CLIENTE",
          },
        ]
  );

  useEffect(() => {
    carregarPlanos();
  }, []);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resultado = await salvarAgendamento({
      id: agendamentoInicial?.id,
      planoAcaoId: planoAcaoId || null,
      titulo,
      descricao,
      dataHora,
      duracaoMin: Number(duracaoMin || 60),
      local,
      linkReuniao,
      tipo,
      status,
      participantes: participantes.filter((p) => p.nome.trim()),
    });

    router.push(`/agendamentos/${resultado.id}`);
  }

  function adicionarParticipante() {
    setParticipantes((atual) => [
      ...atual,
      {
        id: `participante-${Date.now()}`,
        nome: "",
        email: "",
        telefone: "",
        tipo: "OUTRO",
      },
    ]);
  }

  function atualizarParticipante(
    index: number,
    campo: keyof ParticipanteAgendamento,
    valor: any
  ) {
    setParticipantes((atual) =>
      atual.map((participante, i) =>
        i === index ? { ...participante, [campo]: valor } : participante
      )
    );
  }

  function removerParticipante(index: number) {
    setParticipantes((atual) => atual.filter((_, i) => i !== index));
  }

  return (
    <main className="min-h-screen bg-slate-100">
    <header className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {agendamentoInicial ? "Editar agendamento" : "Novo agendamento"}
        </h1>
        <p className="text-sm text-slate-500">
          Organize a apresentação do plano de ação e as reuniões com o cliente.
        </p>
    </header>

    <section className="space-y-6 px-8 py-6">
      {erro && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      )}

      <form onSubmit={salvar} className="space-y-6">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Dados do agendamento
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <CampoSelect
              label="Plano de ação"
              value={planoAcaoId}
              onChange={setPlanoAcaoId}
            >
              <option value="">Sem plano vinculado</option>
              {planos.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.pesquisa.cliente.nome} - {plano.titulo}
                </option>
              ))}
            </CampoSelect>

            <Campo
              label="Título"
              value={titulo}
              onChange={setTitulo}
              required
              placeholder="Ex: Apresentação do plano de ação"
            />

            <Campo
              label="Data e hora"
              type="datetime-local"
              value={dataHora}
              onChange={setDataHora}
              required
            />

            <Campo
              label="Duração em minutos"
              type="number"
              value={duracaoMin}
              onChange={setDuracaoMin}
              required
            />

            <CampoSelect
              label="Tipo"
              value={tipo}
              onChange={(valor) => setTipo(valor as TipoAgendamento)}
            >
              <option value="APRESENTACAO_PLANO">Apresentação do plano</option>
              <option value="REUNIAO_ALINHAMENTO">Reunião de alinhamento</option>
              <option value="DEVOLUTIVA">Devolutiva</option>
              <option value="OUTRO">Outro</option>
            </CampoSelect>

            <CampoSelect
              label="Status"
              value={status}
              onChange={(valor) => setStatus(valor as StatusAgendamento)}
            >
              <option value="AGENDADO">Agendado</option>
              <option value="REALIZADO">Realizado</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="REAGENDADO">Reagendado</option>
            </CampoSelect>

            <Campo
              label="Local"
              value={local}
              onChange={setLocal}
              placeholder="Ex: Presencial na empresa / Online"
            />

            <Campo
              label="Link da reunião"
              value={linkReuniao}
              onChange={setLinkReuniao}
              placeholder="Ex: Google Meet, Teams ou Zoom"
            />

            <div className="md:col-span-2">
              <CampoTexto
                label="Descrição"
                value={descricao}
                onChange={setDescricao}
                placeholder="Observações internas, pauta ou orientações da reunião."
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Participantes
              </h2>
              <p className="text-sm text-slate-500">
                Cadastre quem deve participar da reunião.
              </p>
            </div>

            <button
              type="button"
              onClick={adicionarParticipante}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Adicionar
            </button>
          </div>

          <div className="space-y-4">
            {participantes.map((participante, index) => (
              <div key={participante.id} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <strong className="text-sm text-slate-700">
                    Participante {index + 1}
                  </strong>

                  {participantes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerParticipante(index)}
                      className="text-xs font-medium text-red-600"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Campo
                    label="Nome"
                    value={participante.nome}
                    onChange={(valor) =>
                      atualizarParticipante(index, "nome", valor)
                    }
                  />

                  <Campo
                    label="E-mail"
                    value={participante.email || ""}
                    onChange={(valor) =>
                      atualizarParticipante(index, "email", valor)
                    }
                  />

                  <Campo
                    label="Telefone"
                    value={participante.telefone || ""}
                    onChange={(valor) =>
                      atualizarParticipante(index, "telefone", valor)
                    }
                  />

                  <CampoSelect
                    label="Tipo"
                    value={participante.tipo || "OUTRO"}
                    onChange={(valor) =>
                      atualizarParticipante(index, "tipo", valor)
                    }
                  >
                    <option value="CLIENTE">Cliente</option>
                    <option value="INTERNO">Interno</option>
                    <option value="OUTRO">Outro</option>
                  </CampoSelect>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/agendamentos")}
            className="rounded-lg border px-5 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            disabled={processando}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
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
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
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
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
      >
        {children}
      </select>
    </div>
  );
}