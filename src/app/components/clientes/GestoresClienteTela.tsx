"use client";

import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  useState,
} from "react";

import {
  alterarStatusGestorCliente,
  salvarGestorCliente,
} from "@/src/backend/usuario/acoesGestoresCliente";

import type {
  GestorClienteResumo,
} from "@/src/backend/usuario/acoesGestoresCliente";


type Props = {
  gestoresIniciais: GestorClienteResumo[];
};


type FormularioGestor = {
  id: string | null;
  nome: string;
  email: string;
  senha: string;
};


const formularioVazio: FormularioGestor = {
  id:
    null,

  nome:
    "",

  email:
    "",

  senha:
    "",
};


export default function GestoresClienteTela({
  gestoresIniciais,
}: Props) {
  const [
    gestores,
    setGestores,
  ] =
    useState(
      gestoresIniciais
    );


  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioGestor>(
      formularioVazio
    );


  const [
    processando,
    setProcessando,
  ] =
    useState(
      false
    );


  const [
    erro,
    setErro,
  ] =
    useState<
      string | null
    >(
      null
    );


  const [
    sucesso,
    setSucesso,
  ] =
    useState<
      string | null
    >(
      null
    );


  const editando =
    Boolean(
      formulario.id
    );


  function atualizarGestorNaLista(
    gestor: GestorClienteResumo
  ) {
    setGestores(
      atuais => {
        const existe =
          atuais.some(
            item =>
              item.id ===
              gestor.id
          );


        const lista =
          existe
            ? atuais.map(
                item =>
                  item.id ===
                  gestor.id
                    ? gestor
                    : item
              )
            : [
                gestor,
                ...atuais,
              ];


        return lista.sort(
          (
            a,
            b
          ) =>
            Number(
              b.ativo
            ) -
              Number(
                a.ativo
              ) ||
            a.nome.localeCompare(
              b.nome,
              "pt-BR"
            )
        );
      }
    );
  }


  async function enviar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    setErro(
      null
    );

    setSucesso(
      null
    );


    const senha =
      formulario.senha.trim();


    if (
      !formulario.nome.trim()
    ) {
      setErro(
        "Nome do gestor é obrigatório."
      );

      return;
    }


    if (
      !formulario.email.trim()
    ) {
      setErro(
        "E-mail do gestor é obrigatório."
      );

      return;
    }


    if (
      !editando &&
      senha.length <
        8
    ) {
      setErro(
        "A senha provisória deve ter pelo menos 8 caracteres."
      );

      return;
    }


    if (
      editando &&
      senha &&
      senha.length <
        8
    ) {
      setErro(
        "A nova senha deve ter pelo menos 8 caracteres."
      );

      return;
    }


    try {
      setProcessando(
        true
      );


      const resultado =
        await salvarGestorCliente({
          id:
            formulario.id ||
            undefined,

          nome:
            formulario.nome,

          email:
            formulario.email,

          senha:
            senha ||
            undefined,

          ativo:
            true,
        });


      if (
        !resultado.sucesso
      ) {
        setErro(
          resultado.erro
        );

        return;
      }


      atualizarGestorNaLista(
        resultado.gestor
      );


      setFormulario(
        formularioVazio
      );


      setSucesso(
        editando
          ? "Gestor atualizado com sucesso."
          : "Gestor criado com sucesso."
      );
    } catch {
      setErro(
        "Não foi possível salvar o gestor."
      );
    } finally {
      setProcessando(
        false
      );
    }
  }


  function editar(
    gestor: GestorClienteResumo
  ) {
    setErro(
      null
    );

    setSucesso(
      null
    );


    setFormulario({
      id:
        gestor.id,

      nome:
        gestor.nome,

      email:
        gestor.email,

      senha:
        "",
    });


    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }


  async function alterarStatus(
    gestor: GestorClienteResumo
  ) {
    setErro(
      null
    );

    setSucesso(
      null
    );


    try {
      setProcessando(
        true
      );


      const resultado =
        await alterarStatusGestorCliente(
          gestor.id,
          !gestor.ativo
        );


      if (
        !resultado.sucesso
      ) {
        setErro(
          resultado.erro
        );

        return;
      }


      atualizarGestorNaLista(
        resultado.gestor
      );


      setSucesso(
        resultado.gestor.ativo
          ? "Acesso do gestor ativado."
          : "Acesso do gestor desativado."
      );
    } catch {
      setErro(
        "Não foi possível alterar o acesso do gestor."
      );
    } finally {
      setProcessando(
        false
      );
    }
  }


  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Avaliação de Desempenho
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            Gestores
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Cadastre os gestores que poderão realizar as avaliações de desempenho dos colaboradores.
          </p>
        </div>
      </header>


      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {erro}
          </div>
        )}


        {sucesso && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {sucesso}
          </div>
        )}


        <form
          onSubmit={
            enviar
          }
          className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {editando
                  ? "Editar gestor"
                  : "Novo gestor"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                O e-mail e a senha são usados no acesso individual do gestor.
              </p>
            </div>


            {editando && (
              <button
                type="button"
                onClick={() =>
                  setFormulario(
                    formularioVazio
                  )
                }
                className="text-sm font-bold text-slate-500 hover:text-slate-900"
              >
                Cancelar edição
              </button>
            )}
          </div>


          <div className="grid gap-4 md:grid-cols-3">
            <Campo
              label="Nome do gestor"
              value={
                formulario.nome
              }
              onChange={valor =>
                setFormulario(
                  atual => ({
                    ...atual,
                    nome:
                      valor,
                  })
                )
              }
              required
            />

            <Campo
              label="E-mail"
              type="email"
              value={
                formulario.email
              }
              onChange={valor =>
                setFormulario(
                  atual => ({
                    ...atual,
                    email:
                      valor,
                  })
                )
              }
              required
            />

            <Campo
              label={
                editando
                  ? "Nova senha"
                  : "Senha provisória"
              }
              type="password"
              value={
                formulario.senha
              }
              onChange={valor =>
                setFormulario(
                  atual => ({
                    ...atual,
                    senha:
                      valor,
                  })
                )
              }
              required={
                !editando
              }
              placeholder={
                editando
                  ? "Deixe em branco para manter"
                  : "Mínimo de 8 caracteres"
              }
            />
          </div>


          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={
                processando
              }
              className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processando
                ? "Salvando..."
                : editando
                  ? "Salvar alterações"
                  : "Criar gestor"}
            </button>
          </div>
        </form>


        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-lg font-black text-slate-900">
              Gestores cadastrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {gestores.length} gestor(es) cadastrado(s).
            </p>
          </div>


          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Gestor</Th>
                  <Th>E-mail</Th>
                  <Th>Avaliações</Th>
                  <Th>Status</Th>
                  <Th direita>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {gestores.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={
                        5
                      }
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      Nenhum gestor cadastrado.
                    </td>
                  </tr>
                ) : (
                  gestores.map(
                    gestor => (
                      <tr
                        key={
                          gestor.id
                        }
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-4 font-bold text-slate-900">
                          {gestor.nome}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {gestor.email}
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-slate-700">
                          {gestor.totalAvaliacoes}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              gestor.ativo
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {gestor.ativo
                              ? "Ativo"
                              : "Inativo"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              editar(
                                gestor
                              )
                            }
                            disabled={
                              processando
                            }
                            className="text-sm font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void alterarStatus(
                                gestor
                              )
                            }
                            disabled={
                              processando
                            }
                            className={`ml-4 text-sm font-bold disabled:opacity-50 ${
                              gestor.ativo
                                ? "text-red-600 hover:text-red-800"
                                : "text-green-600 hover:text-green-800"
                            }`}
                          >
                            {gestor.ativo
                              ? "Desativar"
                              : "Ativar"}
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}


function Campo({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    valor: string
  ) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={
          type
        }
        value={
          value
        }
        required={
          required
        }
        minLength={
          type ===
          "password"
            ? 8
            : undefined
        }
        placeholder={
          placeholder
        }
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}


function Th({
  children,
  direita = false,
}: {
  children:
    ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-500 ${
        direita
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
