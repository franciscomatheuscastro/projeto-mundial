import { auth } from "@/src/auth";
import { redirect } from "next/navigation";

export default async function ClienteDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if ((session.user as any).perfil !== "CLIENTE") {
    redirect("/dashboard");
  }

  if (!(session.user as any).clienteId) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
          Painel do Cliente
        </p>

        <h1 className="mt-3 text-3xl font-black text-slate-900">
          Bem-vindo ao painel da empresa
        </h1>

        <p className="mt-2 text-slate-500">
          Aqui o cliente verá pesquisas, relatórios, planos de ação,
          agendamentos e denúncias da própria empresa.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card titulo="Pesquisas de clima" valor="0" />
          <Card titulo="Planos de ação" valor="0" />
          <Card titulo="Denúncias" valor="0" />
        </div>
      </section>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}