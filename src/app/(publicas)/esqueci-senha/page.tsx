import Image from "next/image";

import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  prisma,
} from "@/src/lib/prisma";

import {
  criarTokenRedefinicaoSenha,
} from "@/src/lib/redefinicaoSenha";

import {
  enviarEmailRedefinicaoSenha,
} from "@/src/lib/email";


type Props = {
  searchParams: Promise<{
    enviado?: string;
  }>;
};


export default async function EsqueciSenhaPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;


  const enviado =
    params.enviado ===
    "1";


  async function solicitarRedefinicao(
    formData: FormData
  ) {
    "use server";


    const email =
      String(
        formData.get(
          "email"
        ) ??
        ""
      )
        .trim()
        .toLowerCase();


    if (
      !email
    ) {
      redirect(
        "/esqueci-senha"
      );
    }


    const usuario =
      await prisma.usuario.findUnique({
        where: {
          email,
        },

        select: {
          id:
            true,

          nome:
            true,

          email:
            true,

          senha:
            true,

          ativo:
            true,
        },
      });


    /*
     * A resposta pública é sempre a mesma.
     * Isso evita revelar se determinado e-mail
     * possui ou não uma conta cadastrada.
     */
    if (
      usuario?.ativo
    ) {
      try {
        const token =
          criarTokenRedefinicaoSenha({
            usuarioId:
              usuario.id,

            senhaHash:
              usuario.senha,
          });


        await enviarEmailRedefinicaoSenha({
          nome:
            usuario.nome,

          email:
            usuario.email,

          token,
        });
      } catch (error) {
        console.error(
          "Falha ao enviar e-mail de redefinição de senha:",
          {
            usuarioId:
              usuario.id,

            error,
          }
        );
      }
    }


    redirect(
      "/esqueci-senha?enviado=1"
    );
  }


  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <Image
        src="/fundo-login-mundial.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />


      <div className="absolute inset-0 bg-slate-950/45" />

      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/35 via-blue-800/15 to-cyan-700/20" />


      <section className="relative z-10 w-full max-w-lg rounded-[28px] border border-white/20 bg-white p-6 shadow-2xl sm:p-8 md:rounded-[32px] md:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
          Mundial Connect
        </p>


        <h1 className="mt-4 text-3xl font-black text-slate-900">
          Esqueci minha senha
        </h1>


        <p className="mt-2 text-sm leading-6 text-slate-500">
          Informe o e-mail utilizado no seu acesso.
          Se houver uma conta ativa vinculada a ele,
          enviaremos um link para criar uma nova senha.
        </p>


        {enviado && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-800">
            Se o e-mail informado estiver vinculado a uma conta ativa,
            você receberá uma mensagem com as instruções para redefinir a senha.
            Verifique também a caixa de spam.
          </div>
        )}


        <form
          action={
            solicitarRedefinicao
          }
          className="mt-7 space-y-5"
        >
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
              autoComplete="email"
              placeholder="seu@email.com"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>


          <button
            type="submit"
            className="h-14 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
          >
            Enviar link de redefinição
          </button>
        </form>


        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-bold text-blue-600 transition hover:text-blue-800 hover:underline"
          >
            Voltar para o login
          </Link>
        </div>
      </section>
    </main>
  );
}
