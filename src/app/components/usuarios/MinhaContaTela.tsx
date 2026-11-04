"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  alterarMinhaSenha,
} from "@/src/backend/usuario/acoesMinhaConta";


type UsuarioMinhaConta = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  criadoEm: string;
};


type Props = {
  usuario:
    UsuarioMinhaConta;
};


const inputClassName =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";


export default function MinhaContaTela({
  usuario,
}: Props) {
  const [
    senhaAtual,
    setSenhaAtual,
  ] =
    useState("");


  const [
    novaSenha,
    setNovaSenha,
  ] =
    useState("");


  const [
    confirmarSenha,
    setConfirmarSenha,
  ] =
    useState("");


  const [
    processando,
    setProcessando,
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


  async function enviar(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (
      processando
    ) {
      return;
    }


    setErro(
      null
    );


    setSucesso(
      null
    );


    if (
      !senhaAtual
    ) {
      setErro(
        "Informe a senha atual."
      );

      return;
    }


    if (
      novaSenha.length <
      8
    ) {
      setErro(
        "A nova senha deve possuir pelo menos 8 caracteres."
      );

      return;
    }


    if (
      novaSenha !==
      confirmarSenha
    ) {
      setErro(
        "A nova senha e a confirmação não coincidem."
      );

      return;
    }


    setProcessando(
      true
    );


    try {
      const resultado =
        await alterarMinhaSenha({
          senhaAtual,
          novaSenha,
          confirmarSenha,
        });


      if (
        !resultado.sucesso
      ) {
        setErro(
          resultado.mensagem
        );

        return;
      }


      setSenhaAtual(
        ""
      );


      setNovaSenha(
        ""
      );


      setConfirmarSenha(
        ""
      );


      setSucesso(
        resultado.mensagem
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha."
      );
    } finally {
      setProcessando(
        false
      );
    }
  }


  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-6 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Minha conta
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            Conta e segurança
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
            Consulte seus dados de acesso e altere sua senha de forma segura.
          </p>
        </div>
      </header>


      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <article className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Perfil
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-900">
            Dados da conta
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Informações vinculadas ao seu acesso à plataforma.
          </p>


          <div className="mt-6 space-y-4">
            <Info
              titulo="Nome"
              valor={
                usuario.nome
              }
            />

            <Info
              titulo="E-mail"
              valor={
                usuario.email
              }
            />

            <Info
              titulo="Perfil"
              valor={
                formatarPerfil(
                  usuario.perfil
                )
              }
            />

            <Info
              titulo="Conta criada em"
              valor={
                formatarData(
                  usuario.criadoEm
                )
              }
            />
          </div>
        </article>


        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Segurança
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-900">
            Alterar senha
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Confirme sua senha atual antes de definir uma nova credencial.
          </p>


          {erro && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
            >
              {
                erro
              }
            </div>
          )}


          {sucesso && (
            <div
              role="status"
              className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold leading-6 text-green-700"
            >
              {
                sucesso
              }
            </div>
          )}


          <form
            onSubmit={
              enviar
            }
            className="mt-6 space-y-5"
          >
            <CampoSenha
              label="Senha atual"
              value={
                senhaAtual
              }
              onChange={
                setSenhaAtual
              }
              autoComplete="current-password"
              disabled={
                processando
              }
            />


            <CampoSenha
              label="Nova senha"
              value={
                novaSenha
              }
              onChange={
                setNovaSenha
              }
              autoComplete="new-password"
              descricao="Utilize pelo menos 8 caracteres."
              disabled={
                processando
              }
            />


            <CampoSenha
              label="Confirmar nova senha"
              value={
                confirmarSenha
              }
              onChange={
                setConfirmarSenha
              }
              autoComplete="new-password"
              disabled={
                processando
              }
            />


            <button
              type="submit"
              disabled={
                processando
              }
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {processando
                ? "Alterando senha..."
                : "Alterar senha"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}


function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {
          titulo
        }
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-900">
        {
          valor
        }
      </p>
    </div>
  );
}


function CampoSenha({
  label,
  value,
  onChange,
  autoComplete,
  disabled = false,
  descricao,
}: {
  label: string;
  value: string;

  onChange:
    (
      valor: string
    ) => void;

  autoComplete:
    | "current-password"
    | "new-password";

  disabled?: boolean;
  descricao?: string;
}) {
  const [
    mostrar,
    setMostrar,
  ] =
    useState(false);


  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {
          label
        }
      </label>


      <div className="relative">
        <input
          type={
            mostrar
              ? "text"
              : "password"
          }
          value={
            value
          }
          onChange={
            event =>
              onChange(
                event.target.value
              )
          }
          autoComplete={
            autoComplete
          }
          maxLength={
            72
          }
          disabled={
            disabled
          }
          required
          className={`${inputClassName} pr-24`}
        />


        <button
          type="button"
          onClick={() =>
            setMostrar(
              atual =>
                !atual
            )
          }
          disabled={
            disabled
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        >
          {mostrar
            ? "Ocultar"
            : "Mostrar"}
        </button>
      </div>


      {descricao && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {
            descricao
          }
        </p>
      )}
    </div>
  );
}


function formatarPerfil(
  perfil: string
) {
  return perfil
    .replaceAll(
      "_",
      " "
    )
    .toLocaleLowerCase(
      "pt-BR"
    )
    .replace(
      /\b\w/g,
      letra =>
        letra.toLocaleUpperCase(
          "pt-BR"
        )
    );
}


function formatarData(
  valor: string
) {
  const data =
    new Date(
      valor
    );


  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "—";
  }


  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short",
    }
  ).format(
    data
  );
}