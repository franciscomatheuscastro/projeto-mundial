import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";

export default async function ClienteDashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil !== "CLIENTE") redirect("/dashboard");

  const clienteId = (session.user as any).clienteId;
  if (!clienteId) redirect("/login");

  const [
    cliente,
    pesquisas,
    pesquisasAbertas,
    respostas,
    planosAcao,
    planosEmAndamento,
    agendamentos,
    proximosAgendamentos,
    denuncias,
    denunciasAnalise,
    denunciasTratativa,
    denunciasConcluidas,
    denunciasCriticas,
  ] = await Promise.all([
    prisma.cliente.findUnique({ where: { id: clienteId } }),

    prisma.pesquisaCliente.count({ where: { clienteId } }),
    prisma.pesquisaCliente.count({ where: { clienteId, status: "ABERTA" } }),

    prisma.respostaPesquisa.count({
      where: { pesquisa: { clienteId } },
    }),

    prisma.planoAcao.count({
      where: { pesquisa: { clienteId } },
    }),

    prisma.planoAcao.count({
      where: { pesquisa: { clienteId }, status: "EM_ANDAMENTO" },
    }),

    prisma.agendamento.count({
      where: { planoAcao: { pesquisa: { clienteId } } },
    }),

    prisma.agendamento.count({
      where: {
        planoAcao: { pesquisa: { clienteId } },
        dataHora: { gte: new Date() },
      },
    }),

    prisma.denuncia.count({ where: { clienteId } }),
    prisma.denuncia.count({ where: { clienteId, status: "EM_ANALISE" } }),
    prisma.denuncia.count({ where: { clienteId, status: "EM_TRATATIVA" } }),
    prisma.denuncia.count({ where: { clienteId, status: "CONCLUIDA" } }),
    prisma.denuncia.count({ where: { clienteId, gravidade: "CRITICA" } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-6">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
          Painel do Cliente
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          {cliente?.empresa || cliente?.nome || "Minha empresa"}
        </h1>

        <p className="mt-1 text-slate-500">
          Visão executiva das pesquisas, planos de ação, agendamentos e
          denúncias da empresa.
        </p>
      </header>

      <section className="space-y-8 px-8 py-8">
      
        <Bloco titulo="Pesquisa de Clima">
          <Card titulo="Pesquisas" valor={pesquisas} />
          <Card titulo="Pesquisas abertas" valor={pesquisasAbertas} />
          <Card titulo="Respostas recebidas" valor={respostas} />
          <Card titulo="Planos de ação" valor={planosAcao} />
          <Card titulo="Planos em andamento" valor={planosEmAndamento} />
          <Card titulo="Agendamentos" valor={agendamentos} />
          <Card titulo="Próximos agendamentos" valor={proximosAgendamentos} />
        </Bloco>

        <Bloco titulo="Canal de Denúncias">
          <Card titulo="Denúncias recebidas" valor={denuncias} />
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