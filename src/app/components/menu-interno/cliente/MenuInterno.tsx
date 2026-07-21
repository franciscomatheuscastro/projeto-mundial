import Link from "next/link";

import {
  PerfilUsuario,
} from "@prisma/client";

import {
  auth,
  signOut,
} from "@/src/auth";

export async function MenuCliente() {
  const session = await auth();

  const perfil = (
    session?.user as
      | {
          perfil?: PerfilUsuario;
        }
      | undefined
  )?.perfil;

  async function sair() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
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

        <details className="group relative">
          <summary className="cursor-pointer list-none rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
            Menu
          </summary>

          <div className="absolute right-0 mt-3 max-h-[calc(100vh-90px)] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <MenuMobile
              sair={sair}
              perfil={perfil}
            />
          </div>
        </details>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 overflow-hidden bg-gradient-to-b from-slate-950 via-blue-900 to-cyan-700 text-white shadow-xl lg:block">
        <div className="flex h-full flex-col">
          <div className="shrink-0 px-7 pb-5 pt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-200">
              Painel
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Cliente
              <span className="font-light text-blue-200">
                RH
              </span>
            </h1>
          </div>

          <div className="relative min-h-0 flex-1">
            <div className="h-full overflow-y-auto px-5 pb-24 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <MenuNavegacao
                perfil={perfil}
              />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cyan-700 via-cyan-700/90 to-transparent" />
          </div>

          <div className="shrink-0 border-t border-white/10 bg-cyan-700/95 px-5 py-4 backdrop-blur-sm">
            <form action={sair}>
              <button
                type="submit"
                className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-white hover:shadow-md"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

function MenuNavegacao({
  perfil,
  mobile = false,
}: {
  perfil?: PerfilUsuario;
  mobile?: boolean;
}) {
  const administradorCliente =
    perfil === PerfilUsuario.CLIENTE;

  const membroComite =
    perfil ===
    PerfilUsuario.COMITE_CLIENTE;

  return (
    <nav
      className={`flex flex-col gap-7 ${
        mobile ? "text-slate-900" : ""
      }`}
    >
      <GrupoMenu
        titulo="Visão geral"
        mobile={mobile}
      >
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

      {(administradorCliente ||
        membroComite) && (
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

      <GrupoMenu titulo="Suporte" mobile={mobile}>

        <MenuLink
          href="/minha-conta"
          mobile={mobile}
        >
          Minha conta
        </MenuLink>
        
        <MenuLink
          href="/minha-central-ajuda"
          mobile={mobile}
        >
          Central de ajuda
        </MenuLink>

        

      </GrupoMenu>

      
    </nav>
  );
}

function MenuMobile({
  sair,
  perfil,
}: {
  sair: () => Promise<void>;
  perfil?: PerfilUsuario;
}) {
  return (
    <div>
      <MenuNavegacao
        perfil={perfil}
        mobile
      />

      <form
        action={sair}
        className="mt-7 border-t border-slate-200 pt-4"
      >
        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
        >
          Sair
        </button>
      </form>
    </div>
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
    <section>
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
    </section>
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
      className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        mobile
          ? "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          : "text-blue-50/90 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}