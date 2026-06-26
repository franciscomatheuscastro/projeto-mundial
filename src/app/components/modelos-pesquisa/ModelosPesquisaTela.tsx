"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TipoPergunta } from "@prisma/client";
import { useModelosPesquisa } from "@/src/app/data/hooks/useModelosPesquisa";
import { PerguntaModelo } from "@/src/core/model/ModeloPesquisa";

type Props = {
  modo: "lista" | "novo" | "editar";
  modeloId?: string;
};

export default function ModelosPesquisaTela({ modo, modeloId }: Props) {
  const router = useRouter();

  const {
    modelos,
    modeloSelecionado,
    carregando,
    processando,
    erro,
    carregarModeloPorId,
    salvarModelo,
    adicionarPergunta,
    salvarPergunta,
    excluirPergunta,
    duplicarModelo,
    excluirModelo,
  } = useModelosPesquisa();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (modo === "editar" && modeloId) {
      carregarModeloPorId(modeloId);
    }
  }, [modo, modeloId]);

  useEffect(() => {
    if (modo === "editar" && modeloSelecionado) {
      setTitulo(modeloSelecionado.titulo);
      setDescricao(modeloSelecionado.descricao ?? "");
      setAtivo(modeloSelecionado.ativo ?? true);
    }
  }, [modo, modeloSelecionado]);

  async function enviarModelo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resultado = await salvarModelo({
      id: modo === "editar" ? modeloId : undefined,
      titulo,
      descricao,
      ativo,
      modeloPadrao: modeloSelecionado?.modeloPadrao ?? false,
      perguntas: modeloSelecionado?.perguntas ?? [],
    });

    router.push(`/modelos-pesquisa/${resultado.id}`);
    router.refresh();
  }

  async function duplicarAtual() {
    if (!modeloId) return;

    const novoModelo = await duplicarModelo(modeloId);

    router.push(`/modelos-pesquisa/${novoModelo.id}`);
    router.refresh();
  }

  async function excluirModeloAtual(id: string) {
    const confirmado = confirm(
      "Tem certeza que deseja excluir este modelo de pesquisa?"
    );

    if (!confirmado) return;

    await excluirModelo(id);

    router.push("/modelos-pesquisa");
    router.refresh();
  }

  if (modo === "lista") {
    const totalModelos = modelos.length;
    const totalAtivos = modelos.filter((modelo) => modelo.ativo).length;
    const totalPadrao = modelos.filter((modelo) => modelo.modeloPadrao).length;
    const totalPesquisas = modelos.reduce(
      (total, modelo) => total + modelo.totalPesquisas,
      0
    );

    return (
      <main className="min-h-screen bg-slate-100">
        <header className="flex items-center justify-between border-b bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Modelos de Pesquisa
            </h1>
            <p className="text-sm text-slate-500">
              Gerencie os formulários base da pesquisa de clima.
            </p>
          </div>

          <Link
            href="/modelos-pesquisa/novo"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo modelo
          </Link>
        </header>

        <section className="px-8 py-6">
          {erro && <AlertaErro mensagem={erro} />}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <CardResumo titulo="Modelos" valor={totalModelos} />
            <CardResumo titulo="Modelos ativos" valor={totalAtivos} />
            <CardResumo titulo="Modelos padrão" valor={totalPadrao} />
            <CardResumo titulo="Pesquisas geradas" valor={totalPesquisas} />
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Modelo</Th>
                  <Th>Perguntas</Th>
                  <Th>Pesquisas</Th>
                  <Th>Status</Th>
                  <Th direita>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      Carregando modelos...
                    </td>
                  </tr>
                ) : modelos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      Nenhum modelo cadastrado.
                    </td>
                  </tr>
                ) : (
                  modelos.map((modelo) => (
                    <tr key={modelo.id} className="border-t">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {modelo.titulo}
                        </div>
                        <div className="text-sm text-slate-500">
                          {modelo.descricao || "Sem descrição"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {modelo.totalPerguntas}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {modelo.totalPesquisas}
                      </td>

                      <td className="px-4 py-4">
                        {modelo.ativo ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            Ativo
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                            Inativo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/modelos-pesquisa/${modelo.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => excluirModeloAtual(modelo.id)}
                          className="ml-4 text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    );
  }

  if (modo === "novo") {
    return (
      <main className="min-h-screen bg-slate-100">
        <header className="border-b bg-white px-8 py-4">
          <h1 className="text-xl font-bold text-slate-900">Novo Modelo</h1>
          <p className="text-sm text-slate-500">
            Crie um novo formulário base de pesquisa.
          </p>
        </header>

        <section className="mx-auto max-w-3xl px-8 py-8">
          <form onSubmit={enviarModelo} className="rounded-xl bg-white p-6 shadow-sm">
            {erro && <AlertaErro mensagem={erro} />}

            <Campo
              label="Título do modelo"
              value={titulo}
              onChange={setTitulo}
              required
              placeholder="Ex: Pesquisa de Satisfação"
            />

            <CampoArea
              label="Descrição"
              value={descricao}
              onChange={setDescricao}
              placeholder="Explique o objetivo da pesquisa"
            />

            <div className="flex justify-between">
              <Link
                href="/modelos-pesquisa"
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </Link>

              <button
                disabled={processando}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processando ? "Criando..." : "Criar modelo"}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Construtor de Modelo
          </h1>
          <p className="text-sm text-slate-500">
            Edite perguntas, tipos de resposta e configurações do formulário.
          </p>
        </div>

        <Link
          href="/modelos-pesquisa"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>
      </header>

      <section className="grid gap-6 px-8 py-8 lg:grid-cols-[380px_1fr]">
        <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
          {erro && <AlertaErro mensagem={erro} />}

          <form onSubmit={enviarModelo}>
            <Campo label="Título" value={titulo} onChange={setTitulo} required />

            <CampoArea
              label="Descrição"
              value={descricao}
              onChange={setDescricao}
            />

            <label className="mb-6 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(event) => setAtivo(event.target.checked)}
              />
              Modelo ativo
            </label>

            <button
              disabled={processando}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processando ? "Salvando..." : "Salvar modelo"}
            </button>
          </form>

          <button
            type="button"
            onClick={duplicarAtual}
            disabled={processando}
            className="mt-3 w-full rounded-lg border px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Duplicar modelo
          </button>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Perguntas do formulário
              </h2>
              <p className="text-sm text-slate-500">
                Total: {modeloSelecionado?.perguntas.length ?? 0} pergunta(s)
              </p>
            </div>

            <button
              type="button"
              onClick={() => modeloId && adicionarPergunta(modeloId)}
              disabled={processando || !modeloId}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              + Adicionar pergunta
            </button>
          </div>

          <div className="space-y-4">
            {carregando || !modeloSelecionado ? (
              <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                Carregando modelo...
              </div>
            ) : modeloSelecionado.perguntas.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                Nenhuma pergunta cadastrada.
              </div>
            ) : (
              modeloSelecionado.perguntas.map((pergunta) => (
                <PerguntaCard
                  key={pergunta.id}
                  pergunta={pergunta}
                  processando={processando}
                  onSalvar={async (perguntaAtualizada) => {
                    if (!modeloId) return;
                    await salvarPergunta(modeloId, perguntaAtualizada);
                  }}
                  onExcluir={async (perguntaId) => {
                    if (!modeloId) return;
                    await excluirPergunta(modeloId, perguntaId);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function PerguntaCard({
  pergunta,
  processando,
  onSalvar,
  onExcluir,
}: {
  pergunta: PerguntaModelo;
  processando: boolean;
  onSalvar: (pergunta: PerguntaModelo) => Promise<void>;
  onExcluir: (perguntaId: string) => Promise<void>;
}) {
  const [titulo, setTitulo] = useState(pergunta.titulo);
  const [descricao, setDescricao] = useState(pergunta.descricao ?? "");
  const [tipo, setTipo] = useState<TipoPergunta>(pergunta.tipo);
  const [obrigatoria, setObrigatoria] = useState(pergunta.obrigatoria);
  const [opcoes, setOpcoes] = useState(
    Array.isArray(pergunta.opcoes) ? pergunta.opcoes.join("\n") : ""
  );

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSalvar({
      id: pergunta.id,
      titulo,
      descricao: descricao.trim() || null,
      tipo,
      ordem: pergunta.ordem,
      obrigatoria,
      opcoes: opcoes
        .split("\n")
        .map((opcao) => opcao.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <form onSubmit={salvar}>
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Pergunta {pergunta.ordem}
          </span>

          <span className="text-xs text-slate-400">{tipo}</span>
        </div>

        <Campo label="Enunciado" value={titulo} onChange={setTitulo} required />

        <Campo
          label="Descrição complementar"
          value={descricao}
          onChange={setDescricao}
          placeholder="Opcional"
        />

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo da pergunta
            </label>
            <select
              value={tipo}
              onChange={(event) => setTipo(event.target.value as TipoPergunta)}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="NOTA">Nota de 1 a 5</option>
              <option value="SIM_NAO">Sim ou Não</option>
              <option value="TEXTO">Texto curto</option>
              <option value="TEXTO_LONGO">Texto longo</option>
              <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
            </select>
          </div>

          <CampoArea
            label="Opções"
            value={opcoes}
            onChange={setOpcoes}
            placeholder={"Uma opção por linha\nRuim\nBom\nExcelente"}
          />
        </div>

        <label className="mb-5 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={obrigatoria}
            onChange={(event) => setObrigatoria(event.target.checked)}
          />
          Pergunta obrigatória
        </label>

        <button
          disabled={processando}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processando ? "Salvando..." : "Salvar pergunta"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => onExcluir(pergunta.id)}
        disabled={processando}
        className="mt-3 text-sm font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Excluir pergunta
      </button>
    </div>
  );
}

function CardResumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}

function Th({
  children,
  direita = false,
}: {
  children: React.ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-sm font-semibold text-slate-600 ${
        direita ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}

function CampoArea({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        rows={4}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}

function AlertaErro({ mensagem }: { mensagem: string }) {
  return (
    <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {mensagem}
    </div>
  );
}