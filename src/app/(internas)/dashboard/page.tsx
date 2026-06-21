import { auth, signOut } from "@/src/auth";
import { redirect } from "next/navigation";
import { MenuInterno } from "@/src/components/MenuInterno";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  async function sair() {
    "use server";
    await signOut({
      redirectTo: "/login",
    });
  }

  const nome = session.user.name ?? "Usuário";
  const perfil = (session.user as any).perfil ?? "USUÁRIO";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <MenuInterno />

        <section className="flex-1">
          <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-6 py-5 backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-cyan-400">
                Painel institucional
              </p>
              <h2 className="text-2xl font-black">Dashboard</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="font-bold">{nome}</p>
                <p className="text-xs font-semibold text-slate-400">{perfil}</p>
              </div>

              <form action={sair}>
                <button className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-700">
                  Sair
                </button>
              </form>
            </div>
          </header>

          <div className="p-6">
            <section className="mb-8 overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-8 shadow-2xl shadow-blue-950/40">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-100">
                Bem-vindo, {nome}
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
                Gestão psicossocial com visão operacional e inteligência de dados.
              </h1>

              <p className="mt-4 max-w-2xl text-blue-100">
                Centralize agenda, atendimentos, prontuários, relatórios e indicadores em uma única plataforma.
              </p>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Pacientes ativos", "0", "Base assistencial"],
                ["Atendimentos hoje", "0", "Agenda operacional"],
                ["Profissionais", "0", "Equipe técnica"],
                ["Relatórios", "0", "Gestão e compliance"],
              ].map(([titulo, valor, legenda]) => (
                <div
                  key={titulo}
                  className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-xl"
                >
                  <p className="text-sm font-semibold text-slate-400">{titulo}</p>
                  <h3 className="mt-3 text-4xl font-black">{valor}</h3>
                  <p className="mt-2 text-sm text-cyan-400">{legenda}</p>
                </div>
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 xl:col-span-2">
                <h3 className="text-xl font-black">Fluxo operacional</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Módulos principais para estruturar a jornada psicossocial.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    "Cadastro de pacientes",
                    "Agenda de atendimentos",
                    "Registro de evolução",
                    "Relatórios técnicos",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                    >
                      <p className="font-bold">{item}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Em implantação
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-xl font-black">Status do sistema</h3>

                <div className="mt-6 space-y-4">
                  {[
                    ["Login", "Ativo"],
                    ["Banco de dados", "Conectado"],
                    ["Permissões", "Em estruturação"],
                    ["Dashboard", "Em construção"],
                  ].map(([item, status]) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-4 py-3"
                    >
                      <span className="text-sm font-semibold text-slate-300">
                        {item}
                      </span>
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}