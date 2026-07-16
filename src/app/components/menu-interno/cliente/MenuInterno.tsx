import Link from "next/link";
import { PerfilUsuario } from "@prisma/client";
import { auth, signOut } from "@/src/auth";

export async function MenuCliente() {
  const session = await auth();

  const perfil = (session?.user as { perfil?: PerfilUsuario } | undefined)
    ?.perfil;

  async function sair() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600">
            Painel
          </p>

          <h1 className="text-xl font-bold text-slate-900">
            Cliente
            <span className="font-light text-blue-600">
              RH
            </span>
          </h1>
        </div>

        <details className="relative">
          <summary className="cursor-pointer list-none rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
            Menu
          </summary>

          <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
            <MenuConteudo
              sair={sair}
              perfil={perfil}
              mobile
            />
          </div>
        </details>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col bg-gradient-to-b from-slate-950 via-blue-900 to-cyan-700 px-5 py-6 text-white lg:flex">
        <MenuConteudo sair={sair} perfil={perfil} />
      </aside>
    </>
  );
}

function MenuConteudo({
  sair,
  perfil,
  mobile = false,
}: {
  sair: () => Promise<void>;
  perfil?: PerfilUsuario;
  mobile?: boolean;
}) {
  const administradorCliente =
    perfil === PerfilUsuario.CLIENTE;

  const membroComite =
    perfil === PerfilUsuario.COMITE_CLIENTE;

  return (
    <>
      {!mobile && (
        <div className="mb-10 px-2">
          <div className="text-xs font-semibold tracking-[0.35em] text-blue-200">
            PAINEL
          </div>

          <div className="mt-1 text-3xl font-bold">
            Cliente
            <span className="font-light text-blue-200">
              RH
            </span>
          </div>
        </div>
      )}

      <nav
        className={`flex flex-1 flex-col gap-7 ${
          mobile ? "text-slate-900" : ""
        }`}
      >
        <GrupoMenu titulo="Visão geral" mobile={mobile}>
          <MenuLink
            href="/painel-controle"
            mobile={mobile}
          >
            Dashboard
          </MenuLink>

          {administradorCliente && (
            <>
              <MenuLink
                href="/meus-agendamentos"
                mobile={mobile}
              >
                Agendamentos
              </MenuLink>

              <MenuLink
                href="/meus-planos-acao"
                mobile={mobile}
              >
                Planos de ação
              </MenuLink>

              <MenuLink
                href="/meus-colaboradores"
                mobile={mobile}
              >
                Colaboradores
              </MenuLink>
            </>
          )}
        </GrupoMenu>

        {administradorCliente && (
          <GrupoMenu
            titulo="Pesquisa de Clima"
            mobile={mobile}
          >
            <MenuLink
              href="/minhas-pesquisas"
              mobile={mobile}
            >
              Pesquisas
            </MenuLink>
          </GrupoMenu>
        )}

        {(administradorCliente || membroComite) && (
          <GrupoMenu
            titulo="Canal de Denúncias"
            mobile={mobile}
          >
            <MenuLink
              href="/minhas-denuncias"
              mobile={mobile}
            >
              Denúncias
            </MenuLink>
          </GrupoMenu>
        )}
      </nav>

      <form action={sair} className="mt-6">
        <button
          type="submit"
          className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
            mobile
              ? "bg-slate-900 text-white hover:bg-slate-700"
              : "bg-white text-blue-700 hover:bg-blue-50"
          }`}
        >
          Sair
        </button>
      </form>
    </>
  );
}

function GrupoMenu({
  titulo,
  children,
  mobile = false,
}: {
  titulo: string;
  children: React.ReactNode;
  mobile?: boolean;
}) {
  return (
    <div>
      <p
        className={`mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.25em] ${
          mobile
            ? "text-slate-400"
            : "text-blue-100/80"
        }`}
      >
        {titulo}
      </p>

      <div
        className={`ml-3 flex flex-col gap-1 border-l pl-3 ${
          mobile
            ? "border-slate-200"
            : "border-white/20"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function MenuLink({
  href,
  children,
  mobile = false,
}: {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl px-3 py-3 text-sm font-medium transition ${
        mobile
          ? "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          : "text-blue-50/90 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}