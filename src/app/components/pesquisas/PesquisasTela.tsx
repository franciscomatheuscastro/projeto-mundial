"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPesquisaCliente } from "@prisma/client";
import { usePesquisasCliente } from "@/src/app/data/hooks/UsePesquisasCliente";

type Contexto = "mundial" | "cliente";

type Props = {
  modo: "lista" | "nova" | "detalhe" | "relatorio";
  pesquisaId?: string;
  contexto?: Contexto;
};

type DistribuicaoResposta = {
  valor: string;
  total: number;
  percentual: number;
};

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const CORES_GRAFICO = [
  "#2563eb",
  "#dc2626",
  "#f59e0b",
  "#16a34a",
  "#9333ea",
  "#0891b2",
  "#db2777",
];

function montarLink(token?: string | null) {
  if (!token) return "";

  if (typeof window === "undefined") {
    return `/pesquisa/${token}`;
  }

  return `${window.location.origin}/pesquisa/${token}`;
}

export default function PesquisasTela({
  modo,
  pesquisaId,
  contexto = "mundial",
}: Props) {
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
    gerarConvites,
  } = usePesquisasCliente(true, contexto);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [modeloId, setModeloId] = useState("");

  const usuarioMundial = contexto === "mundial";
  const baseHref = usuarioMundial ? "/pesquisas" : "/minhas-pesquisas";

  const [quantidadeConvites, setQuantidadeConvites] = useState(30);

  useEffect(() => {
    if (modo === "nova" && usuarioMundial) {
      carregarDadosFormulario();
    }

    if (modo === "detalhe" && pesquisaId) {
      carregarPesquisaPorId(pesquisaId);
    }

    if (modo === "relatorio" && pesquisaId) {
      carregarRelatorio(pesquisaId);
    }
  }, [
    modo,
    pesquisaId,
    usuarioMundial,
    carregarDadosFormulario,
    carregarPesquisaPorId,
    carregarRelatorio,
  ]);

  const linkPublico = useMemo(() => {
    return montarLink(pesquisaSelecionada?.token);
  }, [pesquisaSelecionada?.token]);

  async function enviarPesquisa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resultado = await salvarPesquisa({
      titulo,
      descricao: descricao || null,
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
        <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                Pesquisa de Clima
              </p>

              <h1 className="mt-1 text-2xl font-black text-slate-900">
                Pesquisas
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {usuarioMundial
                  ? "Gere links de pesquisa e acompanhe os relatórios dos clientes."
                  : "Acompanhe as pesquisas vinculadas à sua empresa."}
              </p>
            </div>

            {usuarioMundial && (
              <Link
                href="/pesquisas/nova"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                + Nova pesquisa
              </Link>
            )}
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <AlertaErro mensagem={erro} />

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card titulo="Pesquisas" valor={totalPesquisas} />
            <Card titulo="Abertas" valor={totalAbertas} />
            <Card titulo="Fechadas" valor={totalFechadas} />
            <Card titulo="Respostas" valor={totalRespostas} />
          </div>

          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[820px] border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Pesquisa de Clima</Th>
                  {usuarioMundial && <Th>Cliente</Th>}
                  <Th>Modelo</Th>
                  <Th>Respostas</Th>
                  <Th>Status</Th>
                  <Th direita>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia
                    colunas={usuarioMundial ? 6 : 5}
                    texto="Carregando pesquisas..."
                  />
                ) : pesquisas.length === 0 ? (
                  <LinhaVazia
                    colunas={usuarioMundial ? 6 : 5}
                    texto="Nenhuma pesquisa encontrada."
                  />
                ) : (
                  pesquisas.map((pesquisa) => (
                    <tr key={pesquisa.id} className="border-t border-slate-100">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">
                          {pesquisa.titulo}
                        </div>
                        <div className="text-sm text-slate-500">
                          Criada para acompanhamento de clima
                        </div>
                      </td>

                      {usuarioMundial && (
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {pesquisa.cliente.nome}
                        </td>
                      )}

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {pesquisa.modelo.titulo}
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-700">
                        {pesquisa.totalRespostas}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={pesquisa.status} />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`${baseHref}/${pesquisa.id}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                          Abrir
                        </Link>

                        <Link
                          href={`${baseHref}/${pesquisa.id}/relatorio`}
                          className="ml-4 text-sm font-bold text-slate-700 hover:text-slate-900"
                        >
                          Relatório
                        </Link>

                        {usuarioMundial && (
                          <button
                            type="button"
                            onClick={() => excluirPesquisaAtual(pesquisa.id)}
                            disabled={processando}
                            className="ml-4 text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-60"
                          >
                            Excluir
                          </button>
                        )}
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
    if (!usuarioMundial) {
      return (
        <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Acesso não permitido.
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-slate-100">
        <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                Nova pesquisa
              </p>

              <h1 className="mt-1 text-2xl font-black text-slate-900">
                Gerar Pesquisa
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Vincule um cliente a um modelo e gere uma pesquisa.
              </p>
            </div>

            <Link
              href="/pesquisas"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <form
            onSubmit={enviarPesquisa}
            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
          >
            <AlertaErro mensagem={erro} />

            <Campo
              label="Título da pesquisa"
              value={titulo}
              onChange={setTitulo}
              required
              placeholder="Ex: Pesquisa de Clima 2026"
            />

            <Select
              label="Cliente"
              value={clienteId}
              onChange={setClienteId}
              required
            >
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

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Link
                href="/pesquisas"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={processando}
                className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    const convites = pesquisaSelecionada?.convites || [];
    const totalConvites = pesquisaSelecionada?.totalConvites || convites.length;
    const totalConvitesRespondidos =
      pesquisaSelecionada?.totalConvitesRespondidos ||
      convites.filter((convite) => convite.respondido).length;

    return (
      <main className="min-h-screen bg-slate-100">
        <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                Pesquisa de Clima
              </p>

              <h1 className="mt-1 text-2xl font-black text-slate-900">
                {pesquisaSelecionada?.titulo ?? "Carregando pesquisa..."}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {pesquisaSelecionada
                  ? `Cliente: ${pesquisaSelecionada.cliente.nome} · Modelo: ${pesquisaSelecionada.modelo.titulo}`
                  : "Carregando informações da pesquisa..."}
              </p>
            </div>

            <Link
              href={baseHref}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar
            </Link>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
          <div className="lg:col-span-2">
            <AlertaErro mensagem={erro} />
          </div>

          {!pesquisaSelecionada || carregando ? (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
              Carregando pesquisa...
            </div>
          ) : (
            <>
              <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <h2 className="mb-4 text-lg font-black text-slate-900">
                  Painel da pesquisa
                </h2>

                {usuarioMundial && (
                  <>
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      Link público
                    </p>

                    <div className="mb-4 break-all rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {linkPublico}
                    </div>

                    <a
                      href={linkPublico}
                      target="_blank"
                      className="mb-3 block w-full rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-700"
                    >
                      Abrir pesquisa pública
                    </a>
                  </>
                )}

                <Link
                  href={`${baseHref}/${pesquisaSelecionada.id}/relatorio`}
                  className="mb-3 block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white hover:bg-slate-700"
                >
                  Ver relatório
                </Link>

                <div className="mb-6 text-sm text-slate-500">
                  {usuarioMundial
                    ? "Gerencie o status da pesquisa e acompanhe o relatório."
                    : "Acompanhe os indicadores consolidados da pesquisa."}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Info titulo="Status" valor={pesquisaSelecionada.status} />
                  <Info
                    titulo="Respostas"
                    valor={String(pesquisaSelecionada.totalRespostas)}
                  />
                  <Info
                    titulo="Perguntas"
                    valor={String(pesquisaSelecionada.perguntas.length)}
                  />
                  <Info titulo="Cliente" valor={pesquisaSelecionada.cliente.nome} />

                  {usuarioMundial && (
                    <>
                      <Info titulo="Convites" valor={String(totalConvites)} />
                      <Info
                        titulo="Respondidos"
                        valor={String(totalConvitesRespondidos)}
                      />
                    </>
                  )}
                </div>

                {usuarioMundial && (
                  <button
                    type="button"
                    onClick={alternarStatus}
                    disabled={processando}
                    className={`mt-6 min-h-12 w-full rounded-2xl px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                      pesquisaSelecionada.status === StatusPesquisaCliente.ABERTA
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {pesquisaSelecionada.status === StatusPesquisaCliente.ABERTA
                      ? "Fechar pesquisa"
                      : "Reabrir pesquisa"}
                  </button>
                )}
              </aside>

              <div className="space-y-6">
                {usuarioMundial && (
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">
                          Links individuais
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Cada link individual só pode ser respondido uma vez.
                        </p>
                      </div>
                    </div>

                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Quantidade de links
                        </label>

                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={quantidadeConvites}
                          onChange={(event) =>
                            setQuantidadeConvites(Number(event.target.value))
                          }
                          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={processando}
                        onClick={() =>
                          gerarConvites(pesquisaSelecionada.id, quantidadeConvites)
                        }
                        className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processando ? "Gerando..." : "Gerar links"}
                      </button>
                    </div>

                    {convites.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                        Nenhum convite individual foi gerado para esta pesquisa.
                        O link público continua funcionando, mas permite mais de
                        uma resposta.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[720px] border-collapse">
                          <thead className="bg-slate-50">
                            <tr>
                              <Th>Participante</Th>
                              <Th>Status</Th>
                              <Th>Link</Th>
                            </tr>
                          </thead>

                          <tbody>
                            {convites.map((convite) => {
                              const linkConvite = montarLink(convite.token);

                              return (
                                <tr
                                  key={convite.id}
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-4 py-4">
                                    <div className="text-sm font-bold text-slate-900">
                                      {convite.nome || "Participante"}
                                    </div>

                                    <div className="text-xs text-slate-500">
                                      {convite.email ||
                                        convite.setor ||
                                        "Sem identificação"}
                                    </div>
                                  </td>

                                  <td className="px-4 py-4">
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                                        convite.respondido
                                          ? "bg-green-100 text-green-700"
                                          : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {convite.respondido
                                        ? "Respondido"
                                        : "Pendente"}
                                    </span>
                                  </td>

                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="max-w-[380px] truncate text-xs text-slate-500">
                                        {linkConvite}
                                      </div>

                                      <a
                                        href={linkConvite}
                                        target="_blank"
                                        className="text-sm font-bold text-blue-600 hover:text-blue-800"
                                      >
                                        Abrir
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                  <h2 className="mb-4 text-lg font-black text-slate-900">
                    Perguntas vinculadas
                  </h2>

                  <div className="space-y-3">
                    {pesquisaSelecionada.perguntas.map((pergunta) => (
                      <div
                        key={pergunta.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                          Pergunta {pergunta.ordem} · {pergunta.tipo}
                        </div>

                        <div className="font-bold text-slate-900">
                          {pergunta.titulo}
                        </div>

                        {pergunta.descricao && (
                          <div className="mt-1 text-sm text-slate-500">
                            {pergunta.descricao}
                          </div>
                        )}

                        {pergunta.opcoes.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {pergunta.opcoes.map((opcao, index) => (
                              <span
                                key={`${pergunta.id}-${opcao}-${index}`}
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
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
              </div>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
              Pesquisa de Clima
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Relatório da Pesquisa
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {relatorio
                ? `${relatorio.titulo} · Cliente: ${relatorio.cliente.nome}`
                : "Carregando relatório..."}
            </p>
          </div>

          <Link
            href={pesquisaId ? `${baseHref}/${pesquisaId}` : baseHref}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AlertaErro mensagem={erro} />

        {!relatorio || carregando ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Carregando relatório...
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card titulo="Respostas" valor={relatorio.respostas.length} />
              <Card titulo="Perguntas" valor={relatorio.perguntas.length} />
              <Card
                titulo="Itens avaliados"
                valor={relatorio.perguntasComResumo.length}
              />
              <Card
                titulo="Média geral"
                valor={Number(relatorio.mediaGeral).toFixed(1)}
              />
            </div>

            <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <h2 className="mb-2 text-lg font-black text-slate-900">
                Indicadores por pergunta
              </h2>

              <p className="mb-6 text-sm text-slate-500">
                Distribuição percentual das respostas consolidadas.
              </p>

              <div className="space-y-6">
                {relatorio.perguntasComResumo.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhuma pergunta encontrada.
                  </p>
                ) : (
                  relatorio.perguntasComResumo.map((item, index) => {
                    const distribuicao = calcularDistribuicao(item.respostas);

                    return (
                      <GraficoPergunta
                        key={item.pergunta.id}
                        numero={index + 1}
                        titulo={item.pergunta.titulo}
                        totalRespostas={item.totalRespostas}
                        media={item.media}
                        distribuicao={distribuicao}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {usuarioMundial && (
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <h2 className="mb-4 text-lg font-black text-slate-900">
                  Respostas individuais
                </h2>

                <div className="space-y-5">
                  {relatorio.respostas.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                      Nenhuma resposta recebida ainda.
                    </div>
                  ) : (
                    relatorio.respostas.map((resposta, index) => (
                      <div
                        key={resposta.id}
                        className="rounded-2xl border border-slate-200 p-5"
                      >
                        <div className="mb-4">
                          <h3 className="font-black text-slate-900">
                            Resposta #{relatorio.respostas.length - index}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {resposta.nome || "Anônimo"}
                            {resposta.setor ? ` · Setor: ${resposta.setor}` : ""}
                            {resposta.cargo ? ` · Cargo: ${resposta.cargo}` : ""}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {resposta.respostas.map((item) => {
                            const pergunta = relatorio.perguntas.find(
                              (p) => p.id === item.perguntaId
                            );

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl bg-slate-50 p-4"
                              >
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  {pergunta?.titulo ?? "Pergunta não encontrada"}
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-900">
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
            )}
          </>
        )}
      </section>
    </main>
  );
}

function calcularDistribuicao(respostas: { valor: string }[]): DistribuicaoResposta[] {
  const mapa = new Map<string, number>();

  respostas.forEach((resposta) => {
    const valor = String(resposta.valor || "Sem resposta").trim();
    mapa.set(valor, (mapa.get(valor) || 0) + 1);
  });

  const total = respostas.length || 1;

  return Array.from(mapa.entries())
    .map(([valor, quantidade]) => ({
      valor,
      total: quantidade,
      percentual: (quantidade / total) * 100,
    }))
    .sort((a, b) => b.total - a.total);
}

function GraficoPergunta({
  numero,
  titulo,
  totalRespostas,
  media,
  distribuicao,
}: {
  numero: number;
  titulo: string;
  totalRespostas: number;
  media: number;
  distribuicao: DistribuicaoResposta[];
}) {
  const gradiente = gerarGradientePizza(distribuicao);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-base font-black text-slate-900">
            {numero}. {titulo}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {totalRespostas} resposta(s)
          </p>
        </div>

        <div className="w-fit rounded-2xl bg-slate-50 px-4 py-2 sm:text-right">
          <p className="text-xs text-slate-500">Média</p>
          <strong className="text-xl text-slate-900">
            {Number(media).toFixed(1)}
          </strong>
        </div>
      </div>

      {distribuicao.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          Sem dados para exibir.
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="flex justify-center">
            <div
              className="h-56 w-56 rounded-full sm:h-64 sm:w-64"
              style={{ background: gradiente }}
            />
          </div>

          <div className="space-y-3">
            {distribuicao.map((item, index) => (
              <div key={item.valor}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CORES_GRAFICO[index % CORES_GRAFICO.length],
                      }}
                    />

                    <span className="truncate text-sm font-semibold text-slate-700">
                      {item.valor}
                    </span>
                  </div>

                  <span className="text-sm font-black text-slate-900">
                    {formatarPercentual(item.percentual)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentual}%`,
                      backgroundColor:
                        CORES_GRAFICO[index % CORES_GRAFICO.length],
                    }}
                  />
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {item.total} resposta(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function gerarGradientePizza(distribuicao: DistribuicaoResposta[]) {
  if (distribuicao.length === 0) return "#e2e8f0";

  let acumulado = 0;

  const partes = distribuicao.map((item, index) => {
    const inicio = acumulado;
    const fim = acumulado + item.percentual;
    acumulado = fim;

    const cor = CORES_GRAFICO[index % CORES_GRAFICO.length];

    return `${cor} ${inicio}% ${fim}%`;
  });

  return `conic-gradient(${partes.join(", ")})`;
}

function formatarPercentual(valor: number) {
  const arredondado = Number(valor.toFixed(1));

  if (Number.isInteger(arredondado)) {
    return `${arredondado}%`;
  }

  return `${arredondado.toFixed(1).replace(".", ",")}%`;
}

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-500">{titulo}</p>

      <strong className="mt-2 block text-3xl font-black text-slate-900">
        {valor}
      </strong>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{titulo}</p>
      <strong className="break-words text-sm text-slate-900">{valor}</strong>
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
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${classes}`}>
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
      className={`px-4 py-3 text-sm font-bold text-slate-600 ${
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
      <td
        colSpan={colunas}
        className="px-4 py-10 text-center text-sm text-slate-500"
      >
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
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClassName}
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
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        rows={4}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClassName}
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
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      >
        {children}
      </select>
    </div>
  );
}

function AlertaErro({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null;

  return (
    <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
      {mensagem}
    </div>
  );
}