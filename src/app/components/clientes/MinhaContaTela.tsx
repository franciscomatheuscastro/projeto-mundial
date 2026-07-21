"use client";

import {
  PerfilUsuario,
} from "@prisma/client";

import {
  useEffect,
} from "react";

import { useClientes } from "@/src/app/data/hooks/useClientes";

function somenteNumeros(
  valor: string
) {
  return valor.replace(/\D/g, "");
}

function formatarTelefone(
  valor?: string | null
) {
  if (!valor) {
    return "Não informado";
  }

  const numeros =
    somenteNumeros(valor).slice(
      0,
      11
    );

  if (numeros.length === 10) {
    return numeros.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (numeros.length === 11) {
    return numeros.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  return valor;
}

function formatarDocumento(
  valor?: string | null
) {
  if (!valor) {
    return "Não informado";
  }

  const numeros =
    somenteNumeros(valor);

  if (numeros.length === 11) {
    return numeros.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      "$1.$2.$3-$4"
    );
  }

  if (numeros.length === 14) {
    return numeros.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  }

  return valor;
}

function formatarData(
  valor?: Date | string | null
) {
  if (!valor) {
    return "Não informado";
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "long",
    }
  ).format(data);
}

function formatarPerfil(
  perfil: PerfilUsuario
) {
  const nomes: Record<
    PerfilUsuario,
    string
  > = {
    ADMIN: "Administrador",
    GESTOR: "Gestor",
    PSICOLOGO: "Psicólogo",
    ASSISTENTE_SOCIAL:
      "Assistente social",
    RECEPCAO: "Recepção",
    CLIENTE:
      "Gestor do cliente",
    COMITE_CLIENTE:
      "Comitê do cliente",
  };

  return nomes[perfil] ?? perfil;
}

export default function MinhaContaTela() {
  const {
    clienteSelecionado,
    carregando,
    erro,
    carregarMinhaConta,
  } = useClientes(false);

  useEffect(() => {
    carregarMinhaConta().catch(
      () => {
        // O hook já registra o erro.
      }
    );
  }, [carregarMinhaConta]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Cabecalho />

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Carregando informações da conta...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (
    erro ||
    !clienteSelecionado
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Cabecalho />

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">
              Não foi possível carregar a conta
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {erro ||
                "Dados da conta indisponíveis."}
            </p>

            <button
              type="button"
              onClick={() => {
                carregarMinhaConta().catch(
                  () => {
                    // O hook registra o erro.
                  }
                );
              }}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </section>
      </main>
    );
  }

  const cliente =
    clienteSelecionado;

  const usuario =
    cliente.usuarioMaster;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Perfil empresarial
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Minha conta
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Consulte os dados cadastrais da
              empresa e as informações do seu
              acesso à plataforma.
            </p>
          </div>

          <StatusBadge
            ativo={
              cliente.ativo &&
              Boolean(usuario?.ativo)
            }
          />
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)] lg:px-8">
        <div className="space-y-6">
          <Secao
            titulo="Dados da empresa"
            descricao="Informações cadastradas pela Mundial."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Informacao
                label="Nome do cliente"
                valor={cliente.nome}
              />

              <Informacao
                label="Razão social ou empresa"
                valor={
                  cliente.empresa ||
                  "Não informado"
                }
              />

              <Informacao
                label="CPF ou CNPJ"
                valor={formatarDocumento(
                  cliente.documento
                )}
              />

              <Informacao
                label="Situação cadastral"
                valor={
                  cliente.ativo
                    ? "Ativo"
                    : "Inativo"
                }
              />
            </div>
          </Secao>

          <Secao
            titulo="Dados de contato"
            descricao="Canais de contato registrados para a empresa."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Informacao
                label="E-mail"
                valor={
                  cliente.email ||
                  "Não informado"
                }
                quebrar
              />

              <Informacao
                label="Telefone"
                valor={formatarTelefone(
                  cliente.telefone
                )}
              />
            </div>
          </Secao>

          <Secao
            titulo="Informações complementares"
            descricao="Observações vinculadas ao cadastro."
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {cliente.observacoes ||
                  "Nenhuma informação complementar cadastrada."}
              </p>
            </div>
          </Secao>
        </div>

        <div className="space-y-6">
          <Secao
            titulo="Meu acesso"
            descricao="Dados do usuário responsável pelo acesso da empresa."
          >
            {usuario ? (
              <div className="space-y-4">
                <Informacao
                  label="Nome"
                  valor={
                    usuario.nome
                  }
                />

                <Informacao
                  label="E-mail de acesso"
                  valor={
                    usuario.email
                  }
                  quebrar
                />

                <Informacao
                  label="Perfil"
                  valor={formatarPerfil(
                    usuario.perfil
                  )}
                />

                <Informacao
                  label="Status do acesso"
                  valor={
                    usuario.ativo
                      ? "Acesso ativo"
                      : "Acesso inativo"
                  }
                />

                <Informacao
                  label="Acesso criado em"
                  valor={formatarData(
                    usuario.criadoEm
                  )}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                Nenhum usuário master foi
                localizado para este cliente.
              </div>
            )}
          </Secao>

          

          <Secao titulo="Dados do cadastro">
            <div className="space-y-4">
              <Informacao
                label="Cliente desde"
                valor={formatarData(
                  cliente.criadoEm
                )}
              />

              <Informacao
                label="Última atualização"
                valor={formatarData(
                  cliente.atualizadoEm
                )}
              />
            </div>
          </Secao>
        </div>
      </section>
    </main>
  );
}

function Cabecalho() {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
          Perfil empresarial
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
          Minha conta
        </h1>
      </div>
    </header>
  );
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">
          {titulo}
        </h2>

        {descricao && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {descricao}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function Informacao({
  label,
  valor,
  quebrar = false,
}: {
  label: string;
  valor: string;
  quebrar?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-bold text-slate-900 ${
          quebrar
            ? "break-all"
            : "break-words"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function StatusBadge({
  ativo,
}: {
  ativo: boolean;
}) {
  return (
    <span
      className={`w-fit rounded-full px-4 py-2 text-xs font-bold ${
        ativo
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {ativo
        ? "Conta ativa"
        : "Conta inativa"}
    </span>
  );
}