import { prisma } from "@/src/lib/prisma";

export default async function DashboardPage() {
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
    denunciasRecebidas,
    denunciasAnalise,
    denunciasTratativa,
    denunciasConcluidas,
    denunciasCriticas,
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
    prisma.denuncia.count({ where: { status: "RECEBIDA" } }),
    prisma.denuncia.count({ where: { status: "EM_ANALISE" } }),
    prisma.denuncia.count({ where: { status: "EM_TRATATIVA" } }),
    prisma.denuncia.count({ where: { status: "CONCLUIDA" } }),
    prisma.denuncia.count({ where: { gravidade: "CRITICA" } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-6">
        <p className="text-sm font-semibold text-blue-600">MundialSafe</p>
        <h1 className="text-3xl font-bold text-slate-900">Painel Mundial</h1>
        <p className="mt-1 text-slate-500">
          Visão executiva de clima organizacional, planos de ação e canal de
          denúncias.
        </p>
      </header>

      <section className="space-y-8 px-8 py-8">
        

        <Bloco titulo="Pesquisa de Clima">
          <Card titulo="Clientes" valor={clientes} />
          <Card titulo="Modelos" valor={modelos} />
          <Card titulo="Pesquisas" valor={pesquisas} />
          <Card titulo="Respostas" valor={respostas} />
          <Card titulo="Abertas" valor={pesquisasAbertas} />
          <Card titulo="Fechadas" valor={pesquisasFechadas} />
          <Card titulo="Planos de ação" valor={planosAcao} />
          <Card titulo="Agendamentos" valor={agendamentos} />
        </Bloco>

        <Bloco titulo="Canal de Denúncias">
          <Card titulo="Denúncias" valor={denuncias} />
          <Card titulo="Recebidas" valor={denunciasRecebidas} />
          <Card titulo="Em análise" valor={denunciasAnalise} />
          <Card titulo="Em tratativa" valor={denunciasTratativa} />
          <Card titulo="Concluídas" valor={denunciasConcluidas} />
          <Card titulo="Críticas" valor={denunciasCriticas} destaque />
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
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">{titulo}</h2>
      <div className="grid gap-5 md:grid-cols-4">{children}</div>
    </div>
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
      className={`rounded-2xl bg-white p-6 shadow-sm ${
        destaque ? "border border-red-200" : ""
      }`}
    >
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong
        className={`mt-2 block text-4xl ${
          destaque ? "text-red-600" : "text-slate-900"
        }`}
      >
        {valor}
      </strong>
    </div>
  );
}