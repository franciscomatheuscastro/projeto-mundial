"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPesquisaCliente } from "@prisma/client";
import { usePesquisasCliente } from "@/src/app/data/hooks/UsePesquisasCliente";

type Props = {
  modo: "lista" | "nova" | "detalhe" | "relatorio";
  pesquisaId?: string;
};

export default function PesquisasTela({ modo, pesquisaId }: Props) {
  const router = useRouter();

  const {
    pesquisas,
    pesquisaSelecionada,
    relatorio,
    dadosFormulario,
    carregando,
    processando,
    erro,
    carregarPesquisaPorId,
    carregarRelatorio,
    carregarDadosFormulario,
    salvarPesquisa,
    excluirPesquisa,
    alterarStatus,
  } = usePesquisasCliente();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [modeloId, setModeloId] = useState("");

  useEffect(() => {
    if (modo === "nova") carregarDadosFormulario();
    if (modo === "detalhe" && pesquisaId) carregarPesquisaPorId(pesquisaId);
    if (modo === "relatorio" && pesquisaId) carregarRelatorio(pesquisaId);
  }, [modo, pesquisaId]);

  const linkPublico = useMemo(() => {
    if (!pesquisaSelecionada?.token) return "";
    if (typeof window === "undefined") return `/pesquisa/${pesquisaSelecionada.token}`;
    return `${window.location.origin}/pesquisa/${pesquisaSelecionada.token}`;
  }, [pesquisaSelecionada?.token]);

  async function enviarPesquisa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resultado = await salvarPesquisa({
      titulo,
      descricao,
      clienteId,
      modeloId,
      status: StatusPesquisaCliente.ABERTA,
    });

    router.push(`/pesquisas/${resultado.id}`);
    router.refresh();
  }

  async function excluirPesquisaAtual(id: string) {
    const confirmado = confirm(
      "Tem certeza que deseja excluir esta pesquisa? As respostas também serão excluídas."
    );

    if (!confirmado) return;

    await excluirPesquisa(id);

    router.push("/pesquisas");
    router.refresh();
  }

  async function alternarStatus() {
    if (!pesquisaSelecionada) return;

    const novoStatus =
      pesquisaSelecionada.status === StatusPesquisaCliente.ABERTA
        ? StatusPesquisaCliente.FECHADA
        : StatusPesquisaCliente.ABERTA;

    await alterarStatus(pesquisaSelecionada.id, novoStatus);
    router.refresh();
  }

  if (modo === "lista") {
    const totalPesquisas = pesquisas.length;
    const totalAbertas = pesquisas.filter((p) => p.status === "ABERTA").length;
    const totalFechadas = pesquisas.filter((p) => p.status === "FECHADA").length;
    const totalRespostas = pesquisas.reduce(
      (total, pesquisa) => total + pesquisa.totalRespostas,
      0
    );

    return (
      <main className="min-h-screen bg-slate-100">
        <header className="flex items-center justify-between border-b bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pesquisas</h1>
            <p className="text-sm text-slate-500">
              Gere links de pesquisa para clientes responderem.
            </p>
          </div>

          <Link
            href="/pesquisas/nova"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nova pesquisa
          </Link>
        </header>

        <section className="px-8 py-6">
          {erro && <AlertaErro mensagem={erro} />}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card titulo="Pesquisas" valor={totalPesquisas} />
            <Card titulo="Abertas" valor={totalAbertas} />
            <Card titulo="Fechadas" valor={totalFechadas} />
            <Card titulo="Respostas" valor={totalRespostas} />
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Pesquisa</Th>
                  <Th>Cliente</Th>
                  <Th>Modelo</Th>
                  <Th>Respostas</Th>
                  <Th>Status</Th>
                  <Th direita>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia colunas={6} texto="Carregando pesquisas..." />
                ) : pesquisas.length === 0 ? (
                  <LinhaVazia colunas={6} texto="Nenhuma pesquisa gerada." />
                ) : (
                  pesquisas.map((pesquisa) => (
                    <tr key={pesquisa.id} className="border-t">
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {pesquisa.titulo}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {pesquisa.cliente.nome}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {pesquisa.modelo.titulo}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {pesquisa.totalRespostas}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={pesquisa.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/pesquisas/${pesquisa.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Abrir
                        </Link>

                        <button
                          type="button"
                          onClick={() => excluirPesquisaAtual(pesquisa.id)}
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

  if (modo === "nova") {
    return (
      <main className="min-h-screen bg-slate-100">
        <header className="border-b bg-white px-8 py-4">
          <h1 className="text-xl font-bold text-slate-900">Nova Pesquisa</h1>
          <p className="text-sm text-slate-500">
            Vincule um cliente a um modelo e gere um link público.
          </p>
        </header>

        <section className="mx-auto max-w-3xl px-8 py-8">
          <form onSubmit={enviarPesquisa} className="rounded-xl bg-white p-6 shadow-sm">
            {erro && <AlertaErro mensagem={erro} />}

            <Campo
              label="Título da pesquisa"
              value={titulo}
              onChange={setTitulo}
              required
              placeholder="Ex: Pesquisa de Clima 2026"
            />

            <Select label="Cliente" value={clienteId} onChange={setClienteId} required>
              <option value="">Selecione um cliente</option>
              {dadosFormulario.clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome} {cliente.empresa ? `- ${cliente.empresa}` : ""}
                </option>
              ))}
            </Select>

            <Select
              label="Modelo de pesquisa"
              value={modeloId}
              onChange={setModeloId}
              required
            >
              <option value="">Selecione um modelo</option>
              {dadosFormulario.modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.titulo} ({modelo.perguntas.length} pergunta(s))
                </option>
              ))}
            </Select>

            <CampoArea
              label="Descrição"
              value={descricao}
              onChange={setDescricao}
              placeholder="Mensagem de orientação para quem irá responder"
            />

            <div className="flex justify-between">
              <Link
                href="/pesquisas"
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </Link>

              <button
                disabled={processando}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processando ? "Gerando..." : "Gerar pesquisa"}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  if (modo === "detalhe") {
    return (
      <main className="min-h-screen bg-slate-100">
        <header className="flex items-center justify-between border-b bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {pesquisaSelecionada?.titulo ?? "Pesquisa"}
            </h1>
            <p className="text-sm text-slate-500">
              {pesquisaSelecionada
                ? `Cliente: ${pesquisaSelecionada.cliente.nome} | Modelo: ${pesquisaSelecionada.modelo.titulo}`
                : "Carregando informações da pesquisa..."}
            </p>
          </div>

          <Link
            href="/pesquisas"
            className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </Link>
        </header>

        <section className="grid gap-6 px-8 py-8 lg:grid-cols-[420px_1fr]">
          {erro && <AlertaErro mensagem={erro} />}

          {!pesquisaSelecionada || carregando ? (
            <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm lg:col-span-2">
              Carregando pesquisa...
            </div>
          ) : (
            <>
              <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Link público
                </h2>

                <div className="mb-4 break-all rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
                  {linkPublico}
                </div>

                <a
                  href={linkPublico}
                  target="_blank"
                  className="mb-3 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
                >
                  Abrir pesquisa pública
                </a>

                <Link
                  href={`/pesquisas/${pesquisaSelecionada.id}/relatorio`}
                  className="mb-3 block w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-700"
                >
                  Ver relatório
                </Link>

                <div className="mb-6 text-sm text-slate-500">
                  Envie esse link para o cliente responder a pesquisa.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Info titulo="Status" valor={pesquisaSelecionada.status} />
                  <Info titulo="Respostas" valor={String(pesquisaSelecionada.totalRespostas)} />
                  <Info titulo="Perguntas" valor={String(pesquisaSelecionada.perguntas.length)} />
                  <Info titulo="Cliente" valor={pesquisaSelecionada.cliente.nome} />
                </div>

                <button
                  type="button"
                  onClick={alternarStatus}
                  disabled={processando}
                  className={`mt-6 w-full rounded-lg px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                    pesquisaSelecionada.status === StatusPesquisaCliente.ABERTA
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {pesquisaSelecionada.status === StatusPesquisaCliente.ABERTA
                    ? "Fechar pesquisa"
                    : "Reabrir pesquisa"}
                </button>
              </aside>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Perguntas vinculadas
                </h2>

                <div className="space-y-3">
                  {pesquisaSelecionada.perguntas.map((pergunta) => (
                    <div key={pergunta.id} className="rounded-lg border p-4">
                      <div className="mb-1 text-xs font-medium text-slate-400">
                        Pergunta {pergunta.ordem} | {pergunta.tipo}
                      </div>

                      <div className="font-medium text-slate-900">
                        {pergunta.titulo}
                      </div>

                      {pergunta.descricao && (
                        <div className="mt-1 text-sm text-slate-500">
                          {pergunta.descricao}
                        </div>
                      )}

                      {pergunta.opcoes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {pergunta.opcoes.map((opcao) => (
                            <span
                              key={opcao}
                              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                            >
                              {opcao}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Relatório da Pesquisa
          </h1>
          <p className="text-sm text-slate-500">
            {relatorio
              ? `${relatorio.titulo} | Cliente: ${relatorio.cliente.nome}`
              : "Carregando relatório..."}
          </p>
        </div>

        <Link
          href={pesquisaId ? `/pesquisas/${pesquisaId}` : "/pesquisas"}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>
      </header>

      <section className="px-8 py-8">
        {erro && <AlertaErro mensagem={erro} />}

        {!relatorio || carregando ? (
          <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Carregando relatório...
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card titulo="Respostas" valor={relatorio.respostas.length} />
              <Card titulo="Perguntas" valor={relatorio.perguntas.length} />
              <Card titulo="Itens avaliados" valor={relatorio.perguntasComResumo.length} />
              <Card titulo="Média geral" valor={relatorio.mediaGeral.toFixed(1)} />
            </div>

            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Resumo por pergunta
              </h2>

              <div className="space-y-4">
                {relatorio.perguntasComResumo.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhuma pergunta encontrada.
                  </p>
                ) : (
                  relatorio.perguntasComResumo.map((item) => (
                    <div key={item.pergunta.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {item.pergunta.titulo}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.totalRespostas} resposta(s)
                          </p>
                        </div>

                        <strong className="text-xl text-slate-900">
                          {item.media.toFixed(1)}
                        </strong>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min((item.media / 5) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Respostas recebidas
              </h2>

              <div className="space-y-5">
                {relatorio.respostas.length === 0 ? (
                  <div className="rounded-lg border p-8 text-center text-sm text-slate-500">
                    Nenhuma resposta recebida ainda.
                  </div>
                ) : (
                  relatorio.respostas.map((resposta, index) => (
                    <div key={resposta.id} className="rounded-lg border p-5">
                      <div className="mb-4">
                        <h3 className="font-semibold text-slate-900">
                          Resposta #{relatorio.respostas.length - index}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {resposta.nome || "Anônimo"}
                          {resposta.setor ? ` | Setor: ${resposta.setor}` : ""}
                          {resposta.cargo ? ` | Cargo: ${resposta.cargo}` : ""}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {resposta.respostas.map((item) => {
                          const pergunta = relatorio.perguntas.find(
                            (p) => p.id === item.perguntaId
                          );

                          return (
                            <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                              <p className="text-xs font-medium text-slate-500">
                                {pergunta?.titulo ?? "Pergunta não encontrada"}
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-900">
                                {item.valor}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{titulo}</p>
      <strong className="text-sm text-slate-900">{valor}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "ABERTA"
      ? "bg-green-100 text-green-700"
      : status === "FECHADA"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes}`}>
      {status}
    </span>
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

function LinhaVazia({ colunas, texto }: { colunas: number; texto: string }) {
  return (
    <tr>
      <td colSpan={colunas} className="px-4 py-10 text-center text-sm text-slate-500">
        {texto}
      </td>
    </tr>
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

function Select({
  label,
  value,
  onChange,
  children,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
      >
        {children}
      </select>
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