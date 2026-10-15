"use client";

import {
  PerfilUsuario,
} from "@prisma/client";

import type {
  FormEvent,
} from "react";

import {
  useEffect,
  useState,
} from "react";

import {
  alterarMinhaSenha,
} from "@/src/backend/usuario/acoesMinhaConta";

import { useClientes } from "@/src/app/data/hooks/useClientes";


type UsuarioAtual = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
};


type Props = {
  usuarioAtual: UsuarioAtual;
};


function somenteNumeros(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}


function formatarTelefone(
  valor?: string | null
) {
  if (
    !valor
  ) {
    return "Não informado";
  }


  const numeros =
    somenteNumeros(
      valor
    ).slice(
      0,
      11
    );


  if (
    numeros.length ===
    10
  ) {
    return numeros.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }


  if (
    numeros.length ===
    11
  ) {
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
  if (
    !valor
  ) {
    return "Não informado";
  }


  const numeros =
    somenteNumeros(
      valor
    );


  if (
    numeros.length ===
    11
  ) {
    return numeros.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      "$1.$2.$3-$4"
    );
  }


  if (
    numeros.length ===
    14
  ) {
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
  if (
    !valor
  ) {
    return "Não informado";
  }


  const data =
    new Date(
      valor
    );


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
      dateStyle:
        "long",
    }
  ).format(
    data
  );
}


function formatarPerfil(
  perfil: PerfilUsuario
) {
  const nomes: Record<
    PerfilUsuario,
    string
  > = {
    ADMIN:
      "Administrador",

    GESTOR:
      "Gestor",

    PSICOLOGO:
      "Psicólogo",

    ASSISTENTE_SOCIAL:
      "Assistente social",

    RECEPCAO:
      "Recepção",

    CLIENTE:
      "Gestor do cliente",

    COMITE_CLIENTE:
      "Comitê do cliente",
  };


  return nomes[perfil] ??
    perfil;
}


export default function MinhaContaTela({
  usuarioAtual,
}: Props) {
  const {
    clienteSelecionado,
    carregando,
    erro,
    carregarMinhaConta,
  } =
    useClientes(
      false
    );


  const ehUsuarioMaster =
    usuarioAtual.perfil ===
    PerfilUsuario.CLIENTE;


  /*
   * Somente o usuário master precisa carregar
   * o cadastro empresarial completo por este hook.
   *
   * O colaborador/comitê usa os próprios dados
   * recebidos da sessão/página e não tenta carregar
   * o usuário master da empresa.
   */
  useEffect(
    () => {
      if (
        !ehUsuarioMaster
      ) {
        return;
      }


      carregarMinhaConta().catch(
        () => {
          // O hook já registra o erro.
        }
      );
    },
    [
      carregarMinhaConta,
      ehUsuarioMaster,
    ]
  );


  if (
    ehUsuarioMaster &&
    carregando
  ) {
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
    ehUsuarioMaster &&
    (
      erro ||
      !clienteSelecionado
    )
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


  if (
    !ehUsuarioMaster
  ) {
    return (
      <MinhaContaColaborador
        usuarioAtual={
          usuarioAtual
        }
      />
    );
  }


  const cliente =
    clienteSelecionado!;


  /*
   * Na conta master, usamos o usuário atual da sessão
   * como fonte dos dados de acesso.
   *
   * Isso evita depender do primeiro usuário retornado
   * pelo cadastro do cliente para a parte de segurança.
   */
  const usuario =
    usuarioAtual;


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
              Consulte os dados cadastrais da empresa,
              as informações do seu acesso e altere sua senha.
            </p>
          </div>

          <StatusBadge
            ativo={
              cliente.ativo &&
              usuario.ativo
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
                valor={
                  cliente.nome
                }
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
            descricao="Dados do usuário atualmente conectado."
          >
            <DadosUsuario
              usuario={
                usuario
              }
            />
          </Secao>


          <Secao
            titulo="Segurança"
            descricao="Altere a senha utilizada para entrar na Mundial Connect."
          >
            <FormularioAlterarSenha />
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


function MinhaContaColaborador({
  usuarioAtual,
}: {
  usuarioAtual: UsuarioAtual;
}) {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Perfil do usuário
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Minha conta
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Consulte as informações do seu acesso
              e altere sua senha quando necessário.
            </p>
          </div>

          <StatusBadge
            ativo={
              usuarioAtual.ativo
            }
          />
        </div>
      </header>


      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Secao
          titulo="Meu acesso"
          descricao="Informações do usuário atualmente conectado."
        >
          <DadosUsuario
            usuario={
              usuarioAtual
            }
          />
        </Secao>


        <Secao
          titulo="Segurança"
          descricao="Altere a senha utilizada para entrar na Mundial Connect."
        >
          <FormularioAlterarSenha />
        </Secao>
      </section>
    </main>
  );
}


function DadosUsuario({
  usuario,
}: {
  usuario: UsuarioAtual;
}) {
  return (
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
  );
}


function FormularioAlterarSenha() {
  const [
    senhaAtual,
    setSenhaAtual,
  ] =
    useState(
      ""
    );


  const [
    novaSenha,
    setNovaSenha,
  ] =
    useState(
      ""
    );


  const [
    confirmarSenha,
    setConfirmarSenha,
  ] =
    useState(
      ""
    );


  const [
    mostrarSenhas,
    setMostrarSenhas,
  ] =
    useState(
      false
    );


  const [
    salvando,
    setSalvando,
  ] =
    useState(
      false
    );


  const [
    feedback,
    setFeedback,
  ] =
    useState<{
      tipo:
        | "sucesso"
        | "erro";

      mensagem:
        string;
    } | null>(
      null
    );


  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (
      salvando
    ) {
      return;
    }


    setFeedback(
      null
    );


    if (
      novaSenha.length <
      8
    ) {
      setFeedback({
        tipo:
          "erro",

        mensagem:
          "A nova senha deve possuir pelo menos 8 caracteres.",
      });

      return;
    }


    if (
      novaSenha !==
      confirmarSenha
    ) {
      setFeedback({
        tipo:
          "erro",

        mensagem:
          "A nova senha e a confirmação não coincidem.",
      });

      return;
    }


    try {
      setSalvando(
        true
      );


      const resultado =
        await alterarMinhaSenha({
          senhaAtual,
          novaSenha,
          confirmarSenha,
        });


      setFeedback({
        tipo:
          resultado.sucesso
            ? "sucesso"
            : "erro",

        mensagem:
          resultado.mensagem,
      });


      if (
        resultado.sucesso
      ) {
        setSenhaAtual(
          ""
        );

        setNovaSenha(
          ""
        );

        setConfirmarSenha(
          ""
        );
      }
    } catch {
      setFeedback({
        tipo:
          "erro",

        mensagem:
          "Não foi possível alterar a senha agora. Tente novamente.",
      });
    } finally {
      setSalvando(
        false
      );
    }
  }


  const tipoInput =
    mostrarSenhas
      ? "text"
      : "password";


  return (
    <form
      onSubmit={
        salvar
      }
      className="space-y-4"
    >
      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            feedback.tipo ===
            "sucesso"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {
            feedback.mensagem
          }
        </div>
      )}


      <CampoSenha
        id="senhaAtual"
        label="Senha atual"
        value={
          senhaAtual
        }
        type={
          tipoInput
        }
        autoComplete="current-password"
        onChange={
          setSenhaAtual
        }
      />


      <CampoSenha
        id="novaSenha"
        label="Nova senha"
        value={
          novaSenha
        }
        type={
          tipoInput
        }
        autoComplete="new-password"
        onChange={
          setNovaSenha
        }
        descricao="Use pelo menos 8 caracteres."
      />


      <CampoSenha
        id="confirmarSenha"
        label="Confirmar nova senha"
        value={
          confirmarSenha
        }
        type={
          tipoInput
        }
        autoComplete="new-password"
        onChange={
          setConfirmarSenha
        }
      />


      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          checked={
            mostrarSenhas
          }
          onChange={
            event =>
              setMostrarSenhas(
                event.target.checked
              )
          }
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />

        Mostrar senhas
      </label>


      <button
        type="submit"
        disabled={
          salvando ||
          !senhaAtual ||
          !novaSenha ||
          !confirmarSenha
        }
        className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {salvando
          ? "Alterando senha..."
          : "Alterar minha senha"}
      </button>


      <p className="text-xs leading-5 text-slate-400">
        Para sua segurança, informe a senha atual antes de cadastrar uma nova senha.
      </p>
    </form>
  );
}


function CampoSenha({
  id,
  label,
  value,
  type,
  autoComplete,
  onChange,
  descricao,
}: {
  id: string;
  label: string;
  value: string;
  type: "text" | "password";
  autoComplete:
    | "current-password"
    | "new-password";
  onChange: (
    valor: string
  ) => void;
  descricao?: string;
}) {
  return (
    <div>
      <label
        htmlFor={
          id
        }
        className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
      >
        {
          label
        }
      </label>

      <input
        id={
          id
        }
        type={
          type
        }
        value={
          value
        }
        required
        minLength={
          id ===
          "senhaAtual"
            ? undefined
            : 8
        }
        maxLength={72}
        autoComplete={
          autoComplete
        }
        onChange={
          event =>
            onChange(
              event.target.value
            )
        }
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

      {descricao && (
        <p className="mt-1.5 text-xs text-slate-400">
          {
            descricao
          }
        </p>
      )}
    </div>
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
          {
            titulo
          }
        </h2>

        {descricao && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {
              descricao
            }
          </p>
        )}
      </div>

      {
        children
      }
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
        {
          label
        }
      </p>

      <p
        className={`mt-2 text-sm font-bold text-slate-900 ${
          quebrar
            ? "break-all"
            : "break-words"
        }`}
      >
        {
          valor
        }
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
