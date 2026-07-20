import { auth, signIn } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import Image from "next/image";

type LoginPageProps = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

function obterRotaInicial(perfil?: PerfilUsuario | null): string {
  if (
    perfil === PerfilUsuario.CLIENTE ||
    perfil === PerfilUsuario.COMITE_CLIENTE
  ) {
    return "/painel-controle";
  }

  return "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    const perfil = (session.user as {
      perfil?: PerfilUsuario;
    }).perfil;

    redirect(obterRotaInicial(perfil));
  }

  const params = await searchParams;
  const temErro = params?.erro === "1";

  async function entrar(formData: FormData) {
    "use server";

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const senha = String(formData.get("senha") ?? "");

    if (!email || !senha) {
      redirect("/login?erro=1");
    }

    try {
      await signIn("credentials", {
        email,
        senha,
        redirectTo: "/",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?erro=1");
      }

      throw error;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-800 via-blue-600 to-cyan-400 px-4 py-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white/10 shadow-2xl backdrop-blur md:grid-cols-2 md:rounded-[36px]">
        <div className="relative hidden min-h-[620px] flex-col items-center justify-center bg-gradient-to-b from-blue-800 to-cyan-500 p-10 text-white md:flex">
          <div className="absolute top-28 text-center">
            <p className="text-sm tracking-[0.3em]">
              MUNDIAL
            </p>

            <h2 className="text-3xl font-bold">
              Connect
            </h2>
          </div>

          <div className="-translate-y-10 text-center">
            <h1 className="text-6xl font-black tracking-tight">
              Mundial
            </h1>

            <p className="mt-8 text-2xl font-semibold leading-relaxed text-blue-100">
              Gestão psicossocial <br />
              com segurança, controle <br />
              e inteligência operacional.
            </p>
          </div>

          <div className="absolute bottom-20 left-1/2 flex h-32 w-32 -translate-x-1/2 items-center justify-center">
            <div className="absolute inset-0 rounded-[30px] border border-white/15 bg-white/10 shadow-[0_0_40px_rgba(255,255,255,0.12)] backdrop-blur-sm" />

            <div className="absolute  h-20 w-20 rounded-full bg-cyan-300/35 blur-xl" />

            <Image
              src="/logo-pessoas.png"
              alt="Logo Mundial"
              width={150}
              height={150}
              priority
              className="relative z-10 h-auto w-[150px] object-contain drop-shadow-lg"
            />
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-6 sm:p-8 md:rounded-[32px] md:p-14">
          <div className="mb-8 text-center md:text-left">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
              Acesso restrito
            </p>

            <h1 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl md:text-3xl">
              Entrar no sistema
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Acesse a plataforma Mundial Connect com suas
              credenciais.
            </p>
          </div>

          {temErro && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              E-mail ou senha inválidos. Verifique os dados e
              tente novamente.
            </div>
          )}

          <form action={entrar} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold uppercase text-slate-600"
              >
                E-mail
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                autoComplete="email"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-bold uppercase text-slate-600"
              >
                Senha
              </label>

              <input
                id="senha"
                name="senha"
                type="password"
                required
                placeholder="********"
                autoComplete="current-password"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="h-14 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
            >
              Entrar na plataforma →
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-slate-400">
            Acesso exclusivo para usuários autorizados pela
            Mundial.
          </p>
        </div>
      </section>
    </main>
  );
}