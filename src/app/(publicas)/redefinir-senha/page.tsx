import Image from "next/image";

import Link from "next/link";

import {
  hash,
} from "bcryptjs";

import {
  redirect,
} from "next/navigation";

import {
  prisma,
} from "@/src/lib/prisma";

import {
  validarTokenRedefinicaoSenha,
} from "@/src/lib/redefinicaoSenha";


type Props = {
  searchParams: Promise<{
    token?: string;
    erro?: string;
  }>;
};


function mensagemErro(
  erro?: string
) {
  if (
    erro ===
    "senhas_diferentes"
  ) {
    return "As senhas informadas são diferentes.";
  }


  if (
    erro ===
    "senha_curta"
  ) {
    return "A nova senha deve possuir pelo menos 8 caracteres.";
  }


  if (
    erro ===
    "token_invalido"
  ) {
    return "O link de redefinição é inválido, expirou ou já foi utilizado.";
  }


  return null;
}


export default async function RedefinirSenhaPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;


  const token =
    params.token?.trim() ||
    "";


  const usuario =
    await validarTokenRedefinicaoSenha(
      token
    );


  const erro =
    mensagemErro(
      params.erro
    );


  async function redefinirSenha(
    formData: FormData
  ) {
    "use server";


    const tokenFormulario =
      String(
        formData.get(
          "token"
        ) ??
        ""
      ).trim();


    const senha =
      String(
        formData.get(
          "senha"
        ) ??
        ""
      );


    const confirmarSenha =
      String(
        formData.get(
          "confirmarSenha"
        ) ??
        ""
      );


    const tokenCodificado =
      encodeURIComponent(
        tokenFormulario
      );


    if (
      senha.length <
      8
    ) {
      redirect(
        `/redefinir-senha?token=${tokenCodificado}&erro=senha_curta`
      );
    }


    if (
      senha !==
      confirmarSenha
    ) {
      redirect(
        `/redefinir-senha?token=${tokenCodificado}&erro=senhas_diferentes`
      );
    }


    const usuarioValido =
      await validarTokenRedefinicaoSenha(
        tokenFormulario
      );


    if (
      !usuarioValido
    ) {
      redirect(
        `/redefinir-senha?token=${tokenCodificado}&erro=token_invalido`
      );
    }


    const senhaCriptografada =
      await hash(
        senha,
        12
      );


    await prisma.usuario.update({
      where: {
        id:
          usuarioValido.id,
      },

      data: {
        senha:
          senhaCriptografada,
      },
    });


    /*
     * O token deixa de ser válido automaticamente,
     * pois sua assinatura utiliza o hash anterior
     * da senha do usuário.
     */
    redirect(
      "/login?senhaRedefinida=1"
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
          Criar nova senha
        </h1>


        {!usuario ? (
          <>
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
              Este link de redefinição é inválido, expirou ou já foi utilizado.
            </div>


            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/esqueci-senha"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Solicitar novo link
              </Link>

              <Link
                href="/login"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Voltar ao login
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Defina uma nova senha para{" "}
              <strong className="text-slate-700">
                {
                  usuario.email
                }
              </strong>
              .
            </p>


            {erro && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                {
                  erro
                }
              </div>
            )}


            <form
              action={
                redefinirSenha
              }
              className="mt-7 space-y-5"
            >
              <input
                type="hidden"
                name="token"
                value={
                  token
                }
              />


              <div>
                <label
                  htmlFor="senha"
                  className="mb-2 block text-sm font-bold uppercase text-slate-600"
                >
                  Nova senha
                </label>

                <input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>


              <div>
                <label
                  htmlFor="confirmarSenha"
                  className="mb-2 block text-sm font-bold uppercase text-slate-600"
                >
                  Confirmar nova senha
                </label>

                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>


              <button
                type="submit"
                className="h-14 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
              >
                Salvar nova senha
              </button>
            </form>


            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              O link é válido por 30 minutos e deixa de funcionar
              depois que a senha é alterada.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
