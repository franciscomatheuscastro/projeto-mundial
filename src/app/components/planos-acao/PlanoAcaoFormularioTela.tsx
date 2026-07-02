"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPlanoAcao } from "@prisma/client";
import { usePlanosAcao } from "@/src/app/data/hooks/usePlanosAcao";
import { usePesquisasCliente } from "@/src/app/data/hooks/UsePesquisasCliente";
import { AcaoPlanoAcao, PlanoAcaoDetalhado } from "@/src/core/model/PlanoAcao";

type Props = {
  planoInicial?: PlanoAcaoDetalhado | null;
};

export default function PlanoAcaoFormularioTela({ planoInicial }: Props) {
  const router = useRouter();
  const { salvarPlano, processando, erro } = usePlanosAcao(false);
  const { pesquisas, carregarPesquisas } = usePesquisasCliente();

  const [pesquisaId, setPesquisaId] = useState(planoInicial?.pesquisaId || "");
  const [titulo, setTitulo] = useState(planoInicial?.titulo || "");
  const [diagnostico, setDiagnostico] = useState(
    planoInicial?.diagnostico || ""
  );
  const [objetivo, setObjetivo] = useState(planoInicial?.objetivo || "");
  const [conclusao, setConclusao] = useState(planoInicial?.conclusao || "");
  const [status, setStatus] = useState<StatusPlanoAcao>(
    planoInicial?.status || "RASCUNHO"
  );
  const [acoes, setAcoes] = useState<AcaoPlanoAcao[]>(
    planoInicial?.acoes?.length
      ? planoInicial.acoes
      : [
          {
            id: "acao-1",
            titulo: "",
            descricao: "",
            responsavel: "",
            prioridade: "MEDIA",
            prazo: "",
            status: "PENDENTE",
          },
        ]
  );

  useEffect(() => {
    carregarPesquisas();
  }, []);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resultado = await salvarPlano({
      id: planoInicial?.id,
      pesquisaId,
      titulo,
      diagnostico,
      objetivo,
      conclusao,
      status,
      acoes: acoes.filter((acao) => acao.titulo.trim()),
    });

    router.push(`/planos-acao/${resultado.id}`);
  }

  function adicionarAcao() {
    setAcoes((atual) => [
      ...atual,
      {
        id: `acao-${Date.now()}`,
        titulo: "",
        descricao: "",
        responsavel: "",
        prioridade: "MEDIA",
        prazo: "",
        status: "PENDENTE",
      },
    ]);
  }

  function atualizarAcao(index: number, campo: keyof AcaoPlanoAcao, valor: any) {
    setAcoes((atual) =>
      atual.map((acao, i) => (i === index ? { ...acao, [campo]: valor } : acao))
    );
  }

  function removerAcao(index: number) {
    setAcoes((atual) => atual.filter((_, i) => i !== index));
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-4">
        <h1 className="text-xl font-bold text-slate-900">
          {planoInicial ? "Editar plano de ação" : "Novo plano de ação"}
        </h1>
        <p className="text-sm text-slate-500">
          Estruture diagnóstico, objetivos e ações práticas para apresentação ao cliente.
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
            Dados principais
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <CampoSelect
              label="Pesquisa"
              value={pesquisaId}
              onChange={setPesquisaId}
              required
              disabled={!!planoInicial}
            >
              <option value="">Selecione uma pesquisa</option>
              {pesquisas.map((pesquisa) => (
                <option key={pesquisa.id} value={pesquisa.id}>
                  {pesquisa.cliente.nome} - {pesquisa.titulo}
                </option>
              ))}
            </CampoSelect>

            <CampoSelect
              label="Status"
              value={status}
              onChange={(valor) => setStatus(valor as StatusPlanoAcao)}
            >
              <option value="RASCUNHO">Rascunho</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="ARQUIVADO">Arquivado</option>
            </CampoSelect>

            <div className="md:col-span-2">
              <Campo
                label="Título"
                value={titulo}
                onChange={setTitulo}
                required
                placeholder="Ex: Plano de ação - Pesquisa de clima operacional"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Diagnóstico estratégico
          </h2>

          <div className="space-y-4">
            <CampoTexto
              label="Diagnóstico"
              value={diagnostico}
              onChange={setDiagnostico}
              placeholder="Resumo dos principais pontos identificados na pesquisa."
            />

            <CampoTexto
              label="Objetivo"
              value={objetivo}
              onChange={setObjetivo}
              placeholder="O que este plano busca melhorar."
            />

            <CampoTexto
              label="Conclusão"
              value={conclusao}
              onChange={setConclusao}
              placeholder="Mensagem final para fechamento do relatório/apresentação."
            />
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Ações recomendadas
              </h2>
              <p className="text-sm text-slate-500">
                Liste as iniciativas sugeridas para melhoria do clima.
              </p>
            </div>

            <button
              type="button"
              onClick={adicionarAcao}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Adicionar ação
            </button>
          </div>

          <div className="space-y-4">
            {acoes.map((acao, index) => (
              <div key={acao.id} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <strong className="text-sm text-slate-700">
                    Ação {index + 1}
                  </strong>

                  {acoes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerAcao(index)}
                      className="text-xs font-medium text-red-600"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Campo
                    label="Título da ação"
                    value={acao.titulo}
                    onChange={(valor) => atualizarAcao(index, "titulo", valor)}
                    placeholder="Ex: Implantar reunião mensal de alinhamento"
                  />

                  <Campo
                    label="Responsável"
                    value={acao.responsavel || ""}
                    onChange={(valor) =>
                      atualizarAcao(index, "responsavel", valor)
                    }
                    placeholder="Ex: Gestão / RH / Liderança"
                  />

                  <CampoSelect
                    label="Prioridade"
                    value={acao.prioridade}
                    onChange={(valor) =>
                      atualizarAcao(index, "prioridade", valor)
                    }
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </CampoSelect>

                  <Campo
                    label="Prazo"
                    value={acao.prazo || ""}
                    onChange={(valor) => atualizarAcao(index, "prazo", valor)}
                    placeholder="Ex: 30 dias"
                  />

                  <CampoSelect
                    label="Status"
                    value={acao.status}
                    onChange={(valor) => atualizarAcao(index, "status", valor)}
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANDAMENTO">Em andamento</option>
                    <option value="CONCLUIDA">Concluída</option>
                  </CampoSelect>

                  <div className="md:col-span-2">
                    <CampoTexto
                      label="Descrição"
                      value={acao.descricao || ""}
                      onChange={(valor) =>
                        atualizarAcao(index, "descricao", valor)
                      }
                      placeholder="Detalhe como essa ação deve ser aplicada."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/planos-acao")}
            className="rounded-lg border px-5 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            disabled={processando}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {processando ? "Salvando..." : "Salvar plano"}
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
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
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
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
      >
        {children}
      </select>
    </div>
  );
}