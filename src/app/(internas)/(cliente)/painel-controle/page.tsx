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
      <header className="bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Painel do Cliente
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            {cliente?.empresa || cliente?.nome || "Minha empresa"}
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
            Visão executiva das pesquisas, planos de ação, agendamentos e
            denúncias da empresa.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
            Visão consolidada
          </p>

          <h2 className="mt-3 text-2xl font-black sm:text-3xl">
            Gestão de clima e segurança organizacional
          </h2>

          <p className="mt-2 max-w-3xl text-sm text-blue-50 sm:text-base">
            Acompanhe os indicadores estratégicos da sua empresa em tempo real,
            com foco em ação, governança e melhoria contínua.
          </p>
        </div>

        <Bloco titulo="Pesquisa de clima">
          <Card titulo="Pesquisas" valor={pesquisas} />
          <Card titulo="Abertas" valor={pesquisasAbertas} />
          <Card titulo="Respostas recebidas" valor={respostas} />
          <Card titulo="Planos de ação" valor={planosAcao} />
          <Card titulo="Planos em andamento" valor={planosEmAndamento} />
          <Card titulo="Agendamentos" valor={agendamentos} />
          <Card titulo="Próximos agendamentos" valor={proximosAgendamentos} />
        </Bloco>

        <Bloco titulo="Canal de denúncias">
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
    <section>
      <h2 className="mb-3 text-base font-black text-slate-900 sm:text-lg">
        {titulo}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
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