"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";


type Props = {
  link: string;

  tituloPesquisa: string;

  tituloModulo: string;

  descricaoPesquisa?: string | null;

  organizacao?: string | null;

  nomeInicial?: string | null;

  emailInicial?: string | null;

  desabilitado?: boolean;
};


export default function EnviarConviteEmailButton({
  link,
  tituloPesquisa,
  tituloModulo,
  descricaoPesquisa,
  organizacao,
  nomeInicial,
  emailInicial,
  desabilitado = false,
}: Props) {
  const [
    aberto,
    setAberto,
  ] =
    useState(false);


  const [
    nome,
    setNome,
  ] =
    useState(
      nomeInicial ??
        ""
    );


  const [
    email,
    setEmail,
  ] =
    useState(
      emailInicial ??
        ""
    );


  const [
    enviando,
    setEnviando,
  ] =
    useState(false);


  const [
    erro,
    setErro,
  ] =
    useState<string | null>(
      null
    );


  const [
    sucesso,
    setSucesso,
  ] =
    useState<string | null>(
      null
    );


  useEffect(() => {
    if (
      aberto
    ) {
      setNome(
        nomeInicial ??
          ""
      );

      setEmail(
        emailInicial ??
          ""
      );

      setErro(
        null
      );

      setSucesso(
        null
      );
    }
  }, [
    aberto,
    nomeInicial,
    emailInicial,
  ]);


  async function enviar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (
      !email.trim()
    ) {
      setErro(
        "Informe o e-mail do participante."
      );

      return;
    }


    setEnviando(
      true
    );

    setErro(
      null
    );

    setSucesso(
      null
    );


    try {
      const resposta =
        await fetch(
          "/api/pesquisas/enviar-convite-email",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  email.trim(),

                nome:
                  nome.trim() ||
                  null,

                link,

                tituloPesquisa,

                tituloModulo,

                descricaoPesquisa:
                  descricaoPesquisa ??
                  null,

                organizacao:
                  organizacao ??
                  null,
              }),
          }
        );


      const retorno =
        (await resposta.json().catch(
          () => null
        )) as
          | {
              ok?: boolean;

              error?: string;
            }
          | null;


      if (
        !resposta.ok
      ) {
        throw new Error(
          retorno?.error ||
            "Não foi possível enviar o convite."
        );
      }


      setSucesso(
        "Convite enviado com sucesso."
      );


      setTimeout(
        () => {
          setAberto(
            false
          );
        },
        900
      );
    } catch (
      error
    ) {
      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível enviar o convite."
      );
    } finally {
      setEnviando(
        false
      );
    }
  }


  return (
    <>
      <button
        type="button"
        disabled={
          desabilitado ||
          !link
        }
        onClick={() =>
          setAberto(
            true
          )
        }
        className="whitespace-nowrap text-sm font-bold text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Enviar e-mail
      </button>


      {aberto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget &&
              !enviando
            ) {
              setAberto(
                false
              );
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                  Convite individual
                </p>


                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Enviar questionário por e-mail
                </h2>


                <p className="mt-1 text-sm leading-6 text-slate-500">
                  O participante receberá as informações da aplicação e um botão
                  para acessar o link individual.
                </p>
              </div>


              <button
                type="button"
                disabled={
                  enviando
                }
                onClick={() =>
                  setAberto(
                    false
                  )
                }
                className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                Fechar
              </button>
            </div>


            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {
                  tituloModulo
                }
              </p>


              <p className="mt-1 font-black text-slate-900">
                {
                  tituloPesquisa
                }
              </p>


              {organizacao && (
                <p className="mt-1 text-xs text-slate-500">
                  Organização:{" "}
                  {
                    organizacao
                  }
                </p>
              )}


              <p className="mt-2 truncate text-xs text-slate-400">
                {
                  link
                }
              </p>
            </div>


            <form
              onSubmit={
                enviar
              }
              className="mt-5"
            >
              <label className="mb-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Nome do participante
                </span>


                <input
                  value={
                    nome
                  }
                  onChange={(
                    event
                  ) =>
                    setNome(
                      event.target.value
                    )
                  }
                  placeholder="Opcional"
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>


              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  E-mail
                </span>


                <input
                  type="email"
                  required
                  autoFocus
                  value={
                    email
                  }
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="participante@empresa.com.br"
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>


              {erro && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {
                    erro
                  }
                </div>
              )}


              {sucesso && (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {
                    sucesso
                  }
                </div>
              )}


              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    enviando
                  }
                  onClick={() =>
                    setAberto(
                      false
                    )
                  }
                  className="min-h-11 rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  disabled={
                    enviando
                  }
                  className="min-h-11 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando
                    ? "Enviando..."
                    : "Enviar convite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
