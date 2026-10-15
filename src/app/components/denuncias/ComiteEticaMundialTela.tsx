"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  alterarStatusUsuarioComiteEticaMundial,
  excluirUsuarioComiteEticaMundial,
  salvarUsuarioComiteEticaMundial,
} from "@/src/backend/denuncia/acoesComiteEticaMundial";

import type {
  UsuarioComiteEticaMundial,
} from "@/src/backend/denuncia/acoesComiteEticaMundial";


type Props = {
  usuariosIniciais: UsuarioComiteEticaMundial[];
};


type Formulario = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  ativo: boolean;
};


const FORMULARIO_VAZIO: Formulario = {
  id:
    "",

  nome:
    "",

  email:
    "",

  senha:
    "",

  ativo:
    true,
};


export default function ComiteEticaMundialTela({
  usuariosIniciais,
}: Props) {
  const [
    usuarios,
    setUsuarios,
  ] =
    useState(
      usuariosIniciais
    );


  const [
    formulario,
    setFormulario,
  ] =
    useState<Formulario>(
      FORMULARIO_VAZIO
    );


  const [
    salvando,
    setSalvando,
  ] =
    useState(
      false
    );


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


  const editando =
    Boolean(
      formulario.id
    );


  const ativos =
    useMemo(
      () =>
        usuarios.filter(
          usuario =>
            usuario.ativo
        ).length,
      [
        usuarios,
      ]
    );


  function atualizar(
    campo: keyof Formulario,
    valor:
      | string
      | boolean
  ) {
    setFormulario(
      atual => ({
        ...atual,

        [campo]:
          valor,
      })
    );
  }


  function limparFormulario() {
    setFormulario(
      FORMULARIO_VAZIO
    );

    setErro(
      null
    );

    setSucesso(
      null
    );
  }


  function editar(
    usuario: UsuarioComiteEticaMundial
  ) {
    setFormulario({
      id:
        usuario.id,

      nome:
        usuario.nome,

      email:
        usuario.email,

      senha:
        "",

      ativo:
        usuario.ativo,
    });

    setErro(
      null
    );

    setSucesso(
      null
    );

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }


  async function salvar() {
    if (
      salvando
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
      !formulario.nome.trim()
    ) {
      setErro(
        "Informe o nome do usuário."
      );

      return;
    }


    if (
      !formulario.email.trim()
    ) {
      setErro(
        "Informe o e-mail do usuário."
      );

      return;
    }


    if (
      !editando &&
      formulario.senha.length <
        8
    ) {
      setErro(
        "Informe uma senha provisória com pelo menos 8 caracteres."
      );

      return;
    }


    if (
      editando &&
      formulario.senha &&
      formulario.senha.length <
        8
    ) {
      setErro(
        "A nova senha deve possuir pelo menos 8 caracteres."
      );

      return;
    }


    try {
      setSalvando(
        true
      );


      const usuario =
        await salvarUsuarioComiteEticaMundial({
          id:
            formulario.id ||
            undefined,

          nome:
            formulario.nome,

          email:
            formulario.email,

          senha:
            formulario.senha ||
            undefined,

          ativo:
            formulario.ativo,
        });


      setUsuarios(
        atuais => {
          const existe =
            atuais.some(
              item =>
                item.id ===
                usuario.id
            );


          if (
            existe
          ) {
            return atuais.map(
              item =>
                item.id ===
                usuario.id
                  ? usuario
                  : item
            );
          }


          return [
            usuario,
            ...atuais,
          ];
        }
      );


      setFormulario(
        FORMULARIO_VAZIO
      );


      setSucesso(
        editando
          ? "Usuário atualizado com sucesso."
          : "Usuário do Comitê de Ética criado com sucesso."
      );
    } catch (
      error
    ) {
      setErro(
        error instanceof
        Error
          ? error.message
          : "Não foi possível salvar o usuário."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }


  async function alterarStatus(
    usuario: UsuarioComiteEticaMundial
  ) {
    setErro(
      null
    );

    setSucesso(
      null
    );


    try {
      await alterarStatusUsuarioComiteEticaMundial(
        usuario.id,
        !usuario.ativo
      );


      setUsuarios(
        atuais =>
          atuais.map(
            item =>
              item.id ===
              usuario.id
                ? {
                    ...item,

                    ativo:
                      !item.ativo,
                  }
                : item
          )
      );
    } catch (
      error
    ) {
      setErro(
        error instanceof
        Error
          ? error.message
          : "Não foi possível alterar o status."
      );
    }
  }


  async function excluir(
    usuario: UsuarioComiteEticaMundial
  ) {
    const confirmar =
      window.confirm(
        `Excluir o acesso de ${usuario.nome}?`
      );


    if (
      !confirmar
    ) {
      return;
    }


    setErro(
      null
    );

    setSucesso(
      null
    );


    try {
      await excluirUsuarioComiteEticaMundial(
        usuario.id
      );


      setUsuarios(
        atuais =>
          atuais.filter(
            item =>
              item.id !==
              usuario.id
          )
      );


      if (
        formulario.id ===
        usuario.id
      ) {
        setFormulario(
          FORMULARIO_VAZIO
        );
      }
    } catch (
      error
    ) {
      setErro(
        error instanceof
        Error
          ? error.message
          : "Não foi possível excluir o usuário."
      );
    }
  }


  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
            Canal de Denúncias
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Comitê de Ética
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Gerencie os usuários internos da Mundial responsáveis pelo Comitê de Ética.
            Os membros são criados como administradores da Mundial e possuem acesso administrativo à plataforma.
          </p>
        </div>
      </header>


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {
              erro
            }
          </div>
        )}


        {sucesso && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {
              sucesso
            }
          </div>
        )}


        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <ResumoCard
            titulo="Usuários cadastrados"
            valor={
              usuarios.length
            }
          />

          <ResumoCard
            titulo="Acessos ativos"
            valor={
              ativos
            }
          />

          <ResumoCard
            titulo="Acessos inativos"
            valor={
              usuarios.length -
              ativos
            }
          />
        </div>


        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                {
                  editando
                    ? "Editar acesso"
                    : "Novo acesso"
                }
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                {
                  editando
                    ? "Usuário do Comitê"
                    : "Adicionar ao Comitê"
                }
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                O usuário criado aqui terá perfil de Administrador da Mundial e será identificado como membro do Comitê de Ética.
              </p>
            </div>


            <div className="mt-6 space-y-4">
              <Campo
                label="Nome"
              >
                <input
                  value={
                    formulario.nome
                  }
                  onChange={
                    event =>
                      atualizar(
                        "nome",
                        event.target.value
                      )
                  }
                  placeholder="Nome completo"
                  className={
                    inputClass
                  }
                />
              </Campo>


              <Campo
                label="E-mail"
              >
                <input
                  type="email"
                  value={
                    formulario.email
                  }
                  onChange={
                    event =>
                      atualizar(
                        "email",
                        event.target.value
                      )
                  }
                  placeholder="usuario@mundialrh.com.br"
                  className={
                    inputClass
                  }
                />
              </Campo>


              <Campo
                label={
                  editando
                    ? "Nova senha (opcional)"
                    : "Senha provisória"
                }
                descricao={
                  editando
                    ? "Deixe em branco para manter a senha atual."
                    : "Mínimo de 8 caracteres."
                }
              >
                <input
                  type="password"
                  value={
                    formulario.senha
                  }
                  onChange={
                    event =>
                      atualizar(
                        "senha",
                        event.target.value
                      )
                  }
                  autoComplete="new-password"
                  className={
                    inputClass
                  }
                />
              </Campo>


              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    formulario.ativo
                  }
                  onChange={
                    event =>
                      atualizar(
                        "ativo",
                        event.target.checked
                      )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Acesso ativo
                  </p>

                  <p className="text-xs text-slate-500">
                    Permite que o usuário entre na plataforma.
                  </p>
                </div>
              </label>
            </div>


            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={
                  salvando
                }
                onClick={
                  salvar
                }
                className="min-h-12 flex-1 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando
                  ? "Salvando..."
                  : editando
                    ? "Salvar alterações"
                    : "Criar usuário"}
              </button>

              {editando && (
                <button
                  type="button"
                  onClick={
                    limparFormulario
                  }
                  className="min-h-12 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </section>


          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Usuários do Comitê de Ética
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  A desativação é preferível à exclusão quando o usuário já possui histórico no canal.
                </p>
              </div>
            </div>


            {usuarios.length ===
            0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Nenhum usuário do Comitê de Ética cadastrado.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {usuarios.map(
                  usuario => (
                    <article
                      key={
                        usuario.id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-900">
                              {
                                usuario.nome
                              }
                            </h3>

                            <Status
                              ativo={
                                usuario.ativo
                              }
                            />
                          </div>

                          <p className="mt-1 break-all text-sm text-slate-500">
                            {
                              usuario.email
                            }
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            Criado em{" "}
                            {
                              formatarData(
                                usuario.criadoEm
                              )
                            }
                          </p>
                        </div>


                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              editar(
                                usuario
                              )
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              alterarStatus(
                                usuario
                              )
                            }
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                              usuario.ativo
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            }`}
                          >
                            {usuario.ativo
                              ? "Desativar"
                              : "Ativar"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              excluir(
                                usuario
                              )
                            }
                            className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </div>


        <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
          <strong>
            Acesso administrativo:
          </strong>{" "}
          os membros do Comitê de Ética são usuários ADMIN da Mundial. Eles entram
          normalmente pelo Dashboard e utilizam as mesmas áreas administrativas.
          O marcador de Comitê serve apenas para identificar esses usuários no cadastro.
        </div>
      </section>
    </main>
  );
}


const inputClass =
  "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";


function Campo({
  label,
  descricao,
  children,
}: {
  label: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {
          label
        }
      </label>

      {
        children
      }

      {descricao && (
        <p className="mt-1.5 text-xs leading-5 text-slate-400">
          {
            descricao
          }
        </p>
      )}
    </div>
  );
}


function ResumoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {
          titulo
        }
      </p>

      <strong className="mt-2 block text-3xl font-black text-slate-950">
        {
          valor
        }
      </strong>
    </div>
  );
}


function Status({
  ativo,
}: {
  ativo: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
        ativo
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {ativo
        ? "Ativo"
        : "Inativo"}
    </span>
  );
}


function formatarData(
  valor: Date | string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  ).format(
    new Date(
      valor
    )
  );
}
