import type React from "react";
import { prisma } from "@/src/lib/prisma";

type DashboardPageProps = {
  searchParams: Promise<{
    clienteId?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const clienteId = params?.clienteId || "todos";
  const temFiltroCliente = clienteId !== "todos";

  const clientesLista = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      empresa: true,
    },
  });

  const wherePesquisaCliente = temFiltroCliente ? { clienteId } : undefined;
  const whereRespostaPesquisa = temFiltroCliente
    ? { pesquisa: { clienteId } }
    : undefined;
  const wherePlanoAcao = temFiltroCliente
    ? { pesquisa: { clienteId } }
    : undefined;
  const whereAgendamento = temFiltroCliente
    ? { planoAcao: { pesquisa: { clienteId } } }
    : undefined;
  const whereDenuncia = temFiltroCliente ? { clienteId } : undefined;

  const [
    clientes,
    modelos,
    pesquisas,
    pesquisasAbertas,
    pesquisasFechadas,
    respostas,
    planosAcao,
    agendamentos,
    denuncias,
    denunciasCriticas,
    pesquisasCliente,
    pesquisasAbertasCliente,
    pesquisasFechadasCliente,
    respostasCliente,
    planosAcaoCliente,
    agendamentosCliente,
    denunciasCliente,
    denunciasRecebidasCliente,
    denunciasAnaliseCliente,
    denunciasTratativaCliente,
    denunciasConcluidasCliente,
    denunciasCriticasCliente,
  ] = await Promise.all([
    prisma.cliente.count(),
    prisma.modeloPesquisa.count(),
    prisma.pesquisaCliente.count(),
    prisma.pesquisaCliente.count({ where: { status: "ABERTA" } }),
    prisma.pesquisaCliente.count({ where: { status: "FECHADA" } }),
    prisma.respostaPesquisa.count(),
    prisma.planoAcao.count(),
    prisma.agendamento.count(),
    prisma.denuncia.count(),
    prisma.denuncia.count({ where: { gravidade: "CRITICA" } }),

    prisma.pesquisaCliente.count({ where: wherePesquisaCliente }),
    prisma.pesquisaCliente.count({
      where: { ...wherePesquisaCliente, status: "ABERTA" },
    }),
    prisma.pesquisaCliente.count({
      where: { ...wherePesquisaCliente, status: "FECHADA" },
    }),
    prisma.respostaPesquisa.count({ where: whereRespostaPesquisa }),
    prisma.planoAcao.count({ where: wherePlanoAcao }),
    prisma.agendamento.count({ where: whereAgendamento }),
    prisma.denuncia.count({ where: whereDenuncia }),
    prisma.denuncia.count({
      where: { ...whereDenuncia, status: "RECEBIDA" },
    }),
    prisma.denuncia.count({
      where: { ...whereDenuncia, status: "EM_ANALISE" },
    }),
    prisma.denuncia.count({
      where: { ...whereDenuncia, status: "EM_TRATATIVA" },
    }),
    prisma.denuncia.count({
      where: { ...whereDenuncia, status: "CONCLUIDA" },
    }),
    prisma.denuncia.count({
      where: { ...whereDenuncia, gravidade: "CRITICA" },
    }),
  ]);

  const clienteSelecionado =
    clienteId === "todos"
      ? "Todos os clientes"
      : clientesLista.find((cliente) => cliente.id === clienteId)?.nome ||
        "Cliente selecionado";

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Dashboard
          </p>

          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Painel Mundial
              </h1>

              <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
                Visão executiva de clima organizacional, planos de ação, agenda
                e canal de denúncias.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Bloco titulo="Métricas gerais">
          <Card titulo="Clientes" valor={clientes} />
          <Card titulo="Modelos" valor={modelos} />
          <Card titulo="Pesquisas" valor={pesquisas} />
          <Card titulo="Respostas" valor={respostas} />
          <Card titulo="Abertas" valor={pesquisasAbertas} />
          <Card titulo="Fechadas" valor={pesquisasFechadas} />
          <Card titulo="Planos" valor={planosAcao} />
          <Card titulo="Agendamentos" valor={agendamentos} />
          <Card titulo="Denúncias" valor={denuncias} />
          <Card titulo="Críticas" valor={denunciasCriticas} destaque />
        </Bloco>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                Indicadores por cliente
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-900">
                {clienteSelecionado}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Análise operacional por empresa, com visão consolidada de clima
                e denúncias.
              </p>
            </div>

            <form className="w-full lg:w-96">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Cliente
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  name="clienteId"
                  defaultValue={clienteId}
                  className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="todos">Todos os clientes</option>

                  {clientesLista.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                      {cliente.empresa ? ` - ${cliente.empresa}` : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Filtrar
                </button>
              </div>
            </form>
          </div>
        </div>

        <Bloco titulo="Pesquisa de clima">
          <Card titulo="Pesquisas" valor={pesquisasCliente} />
          <Card titulo="Abertas" valor={pesquisasAbertasCliente} />
          <Card titulo="Fechadas" valor={pesquisasFechadasCliente} />
          <Card titulo="Respostas" valor={respostasCliente} />
          <Card titulo="Planos" valor={planosAcaoCliente} />
          <Card titulo="Agendamentos" valor={agendamentosCliente} />
        </Bloco>

        <Bloco titulo="Canal de denúncias">
          <Card titulo="Denúncias" valor={denunciasCliente} />
          <Card titulo="Recebidas" valor={denunciasRecebidasCliente} />
          <Card titulo="Em análise" valor={denunciasAnaliseCliente} />
          <Card titulo="Em tratativa" valor={denunciasTratativaCliente} />
          <Card titulo="Concluídas" valor={denunciasConcluidasCliente} />
          <Card titulo="Críticas" valor={denunciasCriticasCliente} destaque />
        </Bloco>
      </section>
    </main>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-black text-slate-900 sm:text-lg">
        {titulo}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{children}</div>
    </section>
  );
}

function Card({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md ${
        destaque ? "bg-red-50 ring-red-200" : ""
      }`}
    >
      <p className="text-sm font-semibold text-slate-500">{titulo}</p>

      <strong
        className={`mt-2 block text-3xl font-black sm:text-4xl ${
          destaque ? "text-red-600" : "text-slate-900"
        }`}
      >
        {valor}
      </strong>
    </div>
  );
}