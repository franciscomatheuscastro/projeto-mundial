"use client";

import type {
  FormEvent,
} from "react";

import Image from "next/image";
import { useState } from "react";

import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";

import { Eye, EyeOff } from "lucide-react";


import type {
  ConsultaDenunciaPublica,
} from "@/src/core/model/Denuncia";

type AbaLogin =
  | "ENTRAR"
  | "ACOMPANHAR";

type Props = {
  temErro: boolean;
  entrar: (
    formData: FormData
  ) => void | Promise<void>;
};

export default function LoginPainel({
  temErro,
  entrar,
}: Props) {
  const [aba, setAba] =
    useState<AbaLogin>("ENTRAR");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-800 via-blue-600 to-cyan-400 px-4 py-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white/10 shadow-2xl backdrop-blur md:grid-cols-2 md:rounded-[36px]">
        <PainelInstitucional />

        <div className="min-h-[620px] rounded-[28px] bg-white p-6 sm:p-8 md:rounded-[32px] md:p-12">
          <Navegacao
            aba={aba}
            onChange={setAba}
          />

          <div className="mt-8">
            {aba === "ENTRAR" ? (
              <FormularioLogin
                temErro={temErro}
                entrar={entrar}
              />
            ) : (
              <ConsultaProtocolo />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function PainelInstitucional() {
  return (
    <div className="relative hidden min-h-[620px] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-800 to-cyan-500 p-10 text-white md:flex">
      <div className="absolute top-24 text-center">
        <p className="text-sm tracking-[0.3em]">
          GRUPO
        </p>

        <h2 className="text-3xl font-bold">
          MundialRH
        </h2>
      </div>

      <div className="-translate-y-8 text-center">
        <h1 className="text-6xl font-black tracking-tight">
          MundialSafe
        </h1>

        <p className="mt-7 text-2xl font-semibold leading-relaxed text-blue-100">
          Segurança e transparência
          <br />
          para quem denuncia.
          <br />
          Confiança para quem lidera.
        </p>
      </div>

      <div className="absolute bottom-16 left-1/2 flex h-36 w-36 -translate-x-1/2 items-center justify-center">
        <div className="absolute inset-0 rotate-12 rounded-[34px] border border-white/15 bg-white/10 shadow-[0_0_40px_rgba(255,255,255,0.12)] backdrop-blur-sm" />

        <div className="absolute h-24 w-24 rounded-full bg-cyan-300/35 blur-xl" />

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
  );
}

function Navegacao({
  aba,
  onChange,
}: {
  aba: AbaLogin;
  onChange: (
    aba: AbaLogin
  ) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 border-b border-slate-200"
      role="tablist"
      aria-label="Opções de acesso"
    >
      <BotaoAba
        ativo={aba === "ENTRAR"}
        onClick={() =>
          onChange("ENTRAR")
        }
      >
        Entrar
      </BotaoAba>

      <BotaoAba
        ativo={
          aba === "ACOMPANHAR"
        }
        onClick={() =>
          onChange("ACOMPANHAR")
        }
      >
        Acompanhar
      </BotaoAba>
    </div>
  );
}

function BotaoAba({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativo}
      onClick={onClick}
      className={`border-b-2 px-2 py-4 text-sm font-bold transition sm:text-base ${
        ativo
          ? "border-cyan-500 text-blue-600"
          : "border-transparent text-slate-400 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function FormularioLogin({
  temErro,
  entrar,
}: Props) {
  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  return (
    <div>
      <div className="mb-8 text-center md:text-left">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
          Acesso restrito
        </p>

        <h1 className="mt-4 text-3xl font-black text-slate-900">
          Entrar no sistema
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
          Acesse a plataforma Mundial Connect com suas credenciais.
        </p>
      </div>

      {temErro && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          E-mail ou senha inválidos. Verifique os dados e tente novamente.
        </div>
      )}

      <form
        action={entrar}
        className="space-y-5"
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
            placeholder="seu@email.com"
            autoComplete="email"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="senha"
            className="mb-2 block text-sm font-bold uppercase text-slate-600"
          >
            Senha
          </label>

          <div className="relative">
            <input
              id="senha"
              name="senha"
              type={
                mostrarSenha
                  ? "text"
                  : "password"
              }
              required
              placeholder="********"
              autoComplete="current-password"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-5 pr-14 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={() =>
                setMostrarSenha(
                  (valorAtual) =>
                    !valorAtual
                )
              }
              aria-label={
                mostrarSenha
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
              title={
                mostrarSenha
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {mostrarSenha ? (
                <EyeOff
                  size={20}
                  aria-hidden="true"
                />
              ) : (
                <Eye
                  size={20}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="h-14 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
        >
          Entrar na plataforma →
        </button>
      </form>

      <p className="mt-10 text-center text-sm text-slate-400">
        Acesso exclusivo para usuários autorizados pela Mundial.
      </p>
    </div>
  );
}

function ConsultaProtocolo() {
  const {
    consultarDenunciaPublica,
    carregando,
    erro,
    limparErro,
  } = useDenuncias(false);

  const [
    resultado,
    setResultado,
  ] =
    useState<ConsultaDenunciaPublica | null>(
      null
    );

  async function consultar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    const formData =
      new FormData(
        event.currentTarget
      );

    const protocolo =
      String(
        formData.get(
          "protocolo"
        ) || ""
      )
        .trim()
        .toUpperCase();

    if (!protocolo) {
      return;
    }

    limparErro();
    setResultado(null);

    try {
      const dados =
        await consultarDenunciaPublica(
          protocolo
        );

      setResultado(dados);
    } catch {
      // O hook já registra o erro.
    }
  }

  return (
    <div>
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-blue-600">
          ⌕
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-900">
          Acompanhar denúncia
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Digite o protocolo gerado ao registrar sua ocorrência. Nenhum dado pessoal é solicitado.
        </p>
      </div>

      {erro && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {erro}
        </div>
      )}

      <form
        onSubmit={consultar}
        className="mt-7"
      >
        <label
          htmlFor="protocolo"
          className="mb-2 block text-sm font-bold uppercase text-slate-600"
        >
          Número de protocolo
        </label>

        <input
          id="protocolo"
          name="protocolo"
          required
          autoComplete="off"
          disabled={carregando}
          placeholder="Ex.: DEN-2026-123456"
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-center font-mono text-sm uppercase tracking-wider text-slate-800 outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="mt-2 text-center text-xs text-slate-400">
          Gerado automaticamente ao concluir o registro.
        </p>

        <button
          type="submit"
          disabled={carregando}
          className="mt-5 h-14 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando
            ? "Consultando..."
            : "Consultar protocolo"}
        </button>
      </form>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-slate-600">
        🔒 Apenas quem possui o protocolo exato pode acompanhar a denúncia. Nenhuma informação pessoal é exibida.
      </div>

      {resultado && (
        <ResultadoConsulta
          resultado={resultado}
        />
      )}
    </div>
  );
}

function ResultadoConsulta({
  resultado,
}: {
  resultado:
    ConsultaDenunciaPublica;
}) {
  return (
    <section className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Resultado
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {resultado.protocolo}
          </p>
        </div>

        <Badge
          texto={resultado.status}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Info
          label="Registrada em"
          valor={formatarDataHora(
            resultado.criadoEm
          )}
        />

        <Info
          label="Última atualização"
          valor={formatarDataHora(
            resultado.atualizadoEm
          )}
        />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Resposta pública
        </p>

        <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
          {resultado.respostaPublica ||
            "Ainda não há uma resposta pública registrada."}
        </p>
      </div>

      {resultado.historico &&
        resultado.historico.length >
          0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Histórico público
            </p>

            <div className="mt-3 space-y-3">
              {resultado.historico.map(
                (evento) => (
                  <div
                    key={evento.id}
                    className="rounded-2xl bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {
                          evento.titulo
                        }
                      </p>

                      <time className="text-xs text-slate-400">
                        {formatarDataHora(
                          evento.criadoEm
                        )}
                      </time>
                    </div>

                    {evento.descricao && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {
                          evento.descricao
                        }
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </section>
  );
}

function Info({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {valor}
      </p>
    </div>
  );
}

function Badge({
  texto,
}: {
  texto: string;
}) {
  const classe =
    texto === "CONCLUIDA"
      ? "bg-green-100 text-green-700"
      : texto === "ARQUIVADA"
        ? "bg-slate-200 text-slate-700"
        : texto ===
            "EM_TRATATIVA"
          ? "bg-blue-100 text-blue-700"
          : texto ===
              "EM_ANALISE"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${classe}`}
    >
      {formatarTexto(texto)}
    </span>
  );
}

function formatarTexto(
  valor: string
) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase()
    );
}

function formatarDataHora(
  data: Date | string
) {
  const valor = new Date(data);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return "-";
  }

  return valor.toLocaleString(
    "pt-BR"
  );
}
