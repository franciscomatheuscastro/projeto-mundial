"use client";

import type {
  FormEvent,
  ReactNode,
} from "react";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useClientes } from "@/src/app/data/hooks/useClientes";

type ClientesTelaProps = {
  modo:
    | "lista"
    | "novo"
    | "editar";
  clienteId?: string;
};

function somenteNumeros(
  valor: string
) {
  return valor.replace(/\D/g, "");
}

function formatarTelefone(
  valor: string
) {
  const numeros =
    somenteNumeros(valor).slice(
      0,
      11
    );

  if (!numeros) {
    return "";
  }

  if (numeros.length <= 2) {
    return numeros.replace(
      /^(\d{0,2})/,
      "($1"
    );
  }

  if (numeros.length <= 6) {
    return numeros.replace(
      /^(\d{2})(\d+)/,
      "($1) $2"
    );
  }

  if (numeros.length <= 10) {
    return numeros.replace(
      /^(\d{2})(\d{4})(\d+)/,
      "($1) $2-$3"
    );
  }

  return numeros.replace(
    /^(\d{2})(\d{5})(\d{4})$/,
    "($1) $2-$3"
  );
}

function formatarDocumento(
  valor: string
) {
  const numeros =
    somenteNumeros(valor).slice(
      0,
      14
    );

  if (numeros.length <= 11) {
    return numeros
      .replace(
        /(\d{3})(\d)/,
        "$1.$2"
      )
      .replace(
        /(\d{3})(\d)/,
        "$1.$2"
      )
      .replace(
        /(\d{3})(\d{1,2})$/,
        "$1-$2"
      );
  }

  return numeros
    .replace(
      /^(\d{2})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1/$2"
    )
    .replace(
      /(\d{4})(\d)/,
      "$1-$2"
    );
}

function formatarTelefoneExibicao(
  valor?: string | null
) {
  return valor
    ? formatarTelefone(valor)
    : "Sem telefone";
}

export default function ClientesTela({
  modo,
  clienteId,
}: ClientesTelaProps) {
  const router = useRouter();

  const {
    clientes,
    clienteSelecionado,
    carregando,
    processando,
    erro,
    carregarClientePorId,
    excluirCliente,
    salvarCliente,
    salvarUsuarioMaster,
    excluirUsuarioMaster,
  } = useClientes();

  const [nome, setNome] =
    useState("");

  const [empresa, setEmpresa] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefone, setTelefone] =
    useState("");

  const [
    documento,
    setDocumento,
  ] = useState("");

  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  const [ativo, setAtivo] =
    useState(true);

  const [
    criarUsuarioMaster,
    setCriarUsuarioMaster,
  ] = useState(false);

  const [
    nomeUsuarioMaster,
    setNomeUsuarioMaster,
  ] = useState("");

  const [
    emailUsuarioMaster,
    setEmailUsuarioMaster,
  ] = useState("");

  const [
    senhaUsuarioMaster,
    setSenhaUsuarioMaster,
  ] = useState("");

  const [
    modalUsuarioAberto,
    setModalUsuarioAberto,
  ] = useState(false);

  const [
    nomeUsuarioEdicao,
    setNomeUsuarioEdicao,
  ] = useState("");

  const [
    emailUsuarioEdicao,
    setEmailUsuarioEdicao,
  ] = useState("");

  const [
    novaSenhaUsuario,
    setNovaSenhaUsuario,
  ] = useState("");

  const [
    usuarioEdicaoAtivo,
    setUsuarioEdicaoAtivo,
  ] = useState(true);

  const [
    mostrarNovaSenha,
    setMostrarNovaSenha,
  ] = useState(false);

  const [
    erroLocal,
    setErroLocal,
  ] = useState<string | null>(
    null
  );

  const [copiado, setCopiado] =
    useState<string | null>(
      null
    );

  const baseUrl = useMemo(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return "";
      }

      return window.location.origin;
    },
    []
  );

  const linkCanalDenuncias =
    modo === "editar" &&
    clienteId
      ? `${baseUrl}/canal-denuncias/${clienteId}`
      : "";

  const linkConsultaDenuncias =
    modo === "editar" &&
    clienteId
      ? `${baseUrl}/canal-denuncias/${clienteId}/consultar`
      : "";

  const usuarioMaster =
    clienteSelecionado?.usuarioMaster ??
    null;

  const podeCriarUsuarioMaster =
    modo === "novo" ||
    !usuarioMaster;

  useEffect(() => {
    if (
      modo === "editar" &&
      clienteId
    ) {
      carregarClientePorId(
        clienteId
      ).catch(() => {
        // O hook já registra o erro.
      });
    }
  }, [
    modo,
    clienteId,
    carregarClientePorId,
  ]);

  useEffect(() => {
    if (
      modo === "editar" &&
      clienteSelecionado
    ) {
      setNome(
        clienteSelecionado.nome
      );

      setEmpresa(
        clienteSelecionado.empresa ??
          ""
      );

      setEmail(
        clienteSelecionado.email ??
          ""
      );

      setTelefone(
        formatarTelefone(
          clienteSelecionado.telefone ??
            ""
        )
      );

      setDocumento(
        formatarDocumento(
          clienteSelecionado.documento ??
            ""
        )
      );

      setObservacoes(
        clienteSelecionado.observacoes ??
          ""
      );

      setAtivo(
        clienteSelecionado.ativo
      );

      setCriarUsuarioMaster(
        false
      );
    }
  }, [
    modo,
    clienteSelecionado,
  ]);

  useEffect(() => {
    if (
      criarUsuarioMaster
    ) {
      setNomeUsuarioMaster(
        nome ||
          empresa ||
          ""
      );

      setEmailUsuarioMaster(
        email || ""
      );
    }
  }, [
    criarUsuarioMaster,
    nome,
    empresa,
    email,
  ]);

  async function copiarTexto(
    texto: string,
    tipo: string
  ) {
    if (!texto) {
      return;
    }

    await navigator.clipboard.writeText(
      texto
    );

    setCopiado(tipo);

    window.setTimeout(() => {
      setCopiado(null);
    }, 2000);
  }


  function abrirModalUsuario() {
    if (!usuarioMaster) {
      return;
    }

    setNomeUsuarioEdicao(
      usuarioMaster.nome
    );

    setEmailUsuarioEdicao(
      usuarioMaster.email
    );

    setUsuarioEdicaoAtivo(
      usuarioMaster.ativo
    );

    setNovaSenhaUsuario("");
    setMostrarNovaSenha(false);
    setErroLocal(null);
    setModalUsuarioAberto(true);
  }

  async function salvarEdicaoUsuario() {
    if (
      !clienteId ||
      !usuarioMaster
    ) {
      return;
    }

    try {
      setErroLocal(null);

      await salvarUsuarioMaster({
        clienteId,
        usuarioId:
          usuarioMaster.id,
        nome:
          nomeUsuarioEdicao,
        email:
          emailUsuarioEdicao,
        senha:
          novaSenhaUsuario ||
          undefined,
        ativo:
          usuarioEdicaoAtivo,
      });

      setModalUsuarioAberto(false);
      setNovaSenhaUsuario("");
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar o usuário master."
      );
    }
  }

  async function removerUsuarioMaster() {
    if (
      !clienteId ||
      !usuarioMaster
    ) {
      return;
    }

    const confirmado =
      window.confirm(
        "Tem certeza que deseja remover o acesso master deste cliente?"
      );

    if (!confirmado) {
      return;
    }

    try {
      setErroLocal(null);

      await excluirUsuarioMaster({
        clienteId,
        usuarioId:
          usuarioMaster.id,
      });

      setModalUsuarioAberto(false);
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Erro ao remover o usuário master."
      );
    }
  }

  async function enviarFormulario(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setErroLocal(null);

      if (
        criarUsuarioMaster &&
        usuarioMaster
      ) {
        throw new Error(
          "Este cliente já possui um usuário master."
        );
      }

      if (
        criarUsuarioMaster
      ) {
        if (
          !nomeUsuarioMaster.trim()
        ) {
          throw new Error(
            "Nome do usuário master é obrigatório."
          );
        }

        if (
          !emailUsuarioMaster.trim()
        ) {
          throw new Error(
            "E-mail do usuário master é obrigatório."
          );
        }

        if (
          !senhaUsuarioMaster.trim()
        ) {
          throw new Error(
            "Senha provisória do usuário master é obrigatória."
          );
        }
      }

      const resultado =
        await salvarCliente({
          id:
            modo === "editar"
              ? clienteId
              : undefined,

          nome:
            nome.trim(),

          empresa:
            empresa.trim(),

          email:
            email
              .trim()
              .toLowerCase(),

          telefone:
            somenteNumeros(
              telefone
            ),

          documento:
            somenteNumeros(
              documento
            ),

          observacoes:
            observacoes.trim(),

          ativo,
        });

      if (
        criarUsuarioMaster
      ) {
        await salvarUsuarioMaster({
          clienteId:
            resultado.id!,
          nome:
            nomeUsuarioMaster.trim(),
          email:
            emailUsuarioMaster
              .trim()
              .toLowerCase(),
          senha:
            senhaUsuarioMaster,
          ativo: true,
        });
      }

      router.push(
        `/clientes/${resultado.id}`
      );

      router.refresh();
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Erro ao salvar cliente."
      );
    }
  }

  async function excluirClienteAtual(
    id: string
  ) {
    const confirmado =
      window.confirm(
        "Tem certeza que deseja excluir este cliente?\n\n" +
          "Esta ação excluirá também usuários, denúncias, pesquisas, " +
          "colaboradores e outros registros vinculados.\n\n" +
          "Esta ação não poderá ser desfeita."
      );

    if (!confirmado) {
      return;
    }

    try {
      setErroLocal(null);

      await excluirCliente(id);

      router.push("/clientes");
      router.refresh();
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Erro ao excluir cliente."
      );
    }
  }

  if (modo === "lista") {
    const totalClientes =
      clientes.length;

    const totalAtivos =
      clientes.filter(
        (cliente) =>
          cliente.ativo
      ).length;

    const totalPesquisas =
      clientes.reduce(
        (total, cliente) =>
          total +
          cliente.totalPesquisas,
        0
      );

    return (
      <main className="min-h-screen min-w-0 overflow-x-clip bg-slate-100">
        <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                Clientes
              </p>

              <h1 className="mt-1 text-2xl font-black text-slate-900">
                Gestão de Clientes
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Gerencie empresas,
                pesquisas e acessos ao
                painel do cliente.
              </p>
            </div>

            <Link
              href="/clientes/novo"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              + Novo cliente
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {(erro ||
            erroLocal) && (
            <AlertaErro
              mensagem={
                erro ||
                erroLocal
              }
            />
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CardResumo
              titulo="Clientes"
              valor={
                totalClientes
              }
            />

            <CardResumo
              titulo="Ativos"
              valor={totalAtivos}
            />

            <CardResumo
              titulo="Pesquisas vinculadas"
              valor={
                totalPesquisas
              }
            />
          </div>

          <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[520px] border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>
                    Cliente
                  </Th>

                  <Th>
                    Contato
                  </Th>

                  <Th>
                    Pesquisas
                  </Th>

                  <Th>
                    Status
                  </Th>

                  <Th direita>
                    Ações
                  </Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia
                    colunas={5}
                    texto="Carregando clientes..."
                  />
                ) : clientes.length ===
                  0 ? (
                  <LinhaVazia
                    colunas={5}
                    texto="Nenhum cliente cadastrado."
                  />
                ) : (
                  clientes.map(
                    (cliente) => (
                      <tr
                        key={
                          cliente.id
                        }
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900">
                            {
                              cliente.nome
                            }
                          </div>

                          <div className="text-sm text-slate-500">
                            {cliente.empresa ||
                              "Sem empresa informada"}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          <div>
                            {cliente.email ||
                              "Sem e-mail"}
                          </div>

                          <div className="text-slate-500">
                            {formatarTelefoneExibicao(
                              cliente.telefone
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          {
                            cliente.totalPesquisas
                          }
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            ativo={
                              cliente.ativo
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              excluirClienteAtual(
                                cliente.id
                              )
                            }
                            disabled={
                              processando
                            }
                            className="ml-4 text-sm font-bold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
              Cliente
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              {modo === "novo"
                ? "Novo Cliente"
                : "Editar Cliente"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Cadastre a empresa e
              gerencie o acesso ao
              painel do cliente.
            </p>
          </div>

          <Link
            href="/clientes"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section
        className={
          modo === "novo"
            ? "mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8"
            : "mx-auto grid min-w-0 max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:px-6 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)] xl:px-8"
        }
      >
        <form
          onSubmit={
            enviarFormulario
          }
          className="h-fit min-w-0 space-y-5"
        >
          {(erro ||
            erroLocal) && (
            <AlertaErro
              mensagem={
                erro ||
                erroLocal
              }
            />
          )}

          <SecaoFormulario
            titulo="Informações da empresa"
            descricao="Dados cadastrais e informações de contato."
          >
            <Campo
              label="Nome do cliente"
              value={nome}
              onChange={setNome}
              required
              placeholder="Ex.: Transordi"
            />

            <Campo
              label="Empresa"
              value={empresa}
              onChange={
                setEmpresa
              }
              placeholder="Ex.: Transordi Transportes"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Campo
                label="E-mail"
                type="email"
                value={email}
                onChange={
                  setEmail
                }
                placeholder="contato@empresa.com"
              />

              <Campo
                label="Telefone"
                value={telefone}
                onChange={(
                  valor
                ) =>
                  setTelefone(
                    formatarTelefone(
                      valor
                    )
                  )
                }
                placeholder="(00) 00000-0000"
                inputMode="tel"
                maxLength={15}
              />
            </div>

            <Campo
              label="CPF ou CNPJ"
              value={documento}
              onChange={(
                valor
              ) =>
                setDocumento(
                  formatarDocumento(
                    valor
                  )
                )
              }
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              inputMode="numeric"
              maxLength={18}
            />
          </SecaoFormulario>

          <SecaoFormulario
            titulo="Configurações"
            descricao="Status e informações complementares do cliente."
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Observações
              </label>

              <textarea
                rows={4}
                value={
                  observacoes
                }
                onChange={(
                  event
                ) =>
                  setObservacoes(
                    event.target
                      .value
                  )
                }
                placeholder="Informações complementares sobre o cliente"
                className={
                  inputClassName
                }
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Cliente ativo
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Clientes inativos
                  permanecem no histórico,
                  mas não devem operar
                  normalmente.
                </p>
              </div>

              <input
                type="checkbox"
                checked={ativo}
                onChange={(
                  event
                ) =>
                  setAtivo(
                    event.target
                      .checked
                  )
                }
                className="h-5 w-5 shrink-0 accent-blue-600"
              />
            </label>
          </SecaoFormulario>

          <SecaoFormulario
            titulo="Acesso ao painel"
            descricao="Gerencie o usuário responsável pelo acesso da empresa."
          >
            {modo === "editar" &&
            carregando ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Verificando acesso...
              </div>
            ) : usuarioMaster ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                      <p className="text-sm font-bold text-green-900">
                        Usuário master criado
                      </p>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      {
                        usuarioMaster.nome
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {
                        usuarioMaster.email
                      }
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                      usuarioMaster.ativo
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {usuarioMaster.ativo
                      ? "Acesso ativo"
                      : "Acesso inativo"}
                  </span>
                </div>

                <div className="mt-4 border-t border-green-200 pt-4">
                  <button
                    type="button"
                    onClick={
                      abrirModalUsuario
                    }
                    className="min-h-11 w-full rounded-2xl bg-green-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-800"
                  >
                    Editar acesso master
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      criarUsuarioMaster
                    }
                    onChange={(
                      event
                    ) =>
                      setCriarUsuarioMaster(
                        event.target
                          .checked
                      )
                    }
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <span>
                    <span className="block text-sm font-bold text-blue-950">
                      Criar usuário master
                    </span>

                    <small className="mt-1 block text-xs font-normal leading-5 text-blue-800">
                      Libera o acesso inicial
                      do gestor ao painel da
                      empresa.
                    </small>
                  </span>
                </label>

                {criarUsuarioMaster && (
                  <div className="mt-5 border-t border-blue-200 pt-5">
                    <Campo
                      label="Nome do usuário"
                      value={
                        nomeUsuarioMaster
                      }
                      onChange={
                        setNomeUsuarioMaster
                      }
                      required
                      placeholder="Ex.: Gestor Transordi"
                    />

                    <Campo
                      label="E-mail de acesso"
                      type="email"
                      value={
                        emailUsuarioMaster
                      }
                      onChange={
                        setEmailUsuarioMaster
                      }
                      required
                      placeholder="gestor@empresa.com"
                    />

                    <Campo
                      label="Senha provisória"
                      type="password"
                      value={
                        senhaUsuarioMaster
                      }
                      onChange={
                        setSenhaUsuarioMaster
                      }
                      required
                      placeholder="Defina uma senha provisória"
                    />
                  </div>
                )}
              </div>
            )}
          </SecaoFormulario>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <button
              disabled={
                processando
              }
              className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processando
                ? "Salvando..."
                : "Salvar cliente"}
            </button>
          </div>

          
        </form>

        {modo === "editar" && (
          <div className="min-w-0 space-y-5">
            <Painel
              titulo="Canal de denúncias"
              subtitulo="Link público exclusivo para os colaboradores deste cliente."
            >
              <div className="mb-5 flex justify-start">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  Canal ativo
                </span>
              </div>

              <div className="space-y-4">
                <BlocoLink
                  titulo="Link para registrar denúncia"
                  valor={
                    linkCanalDenuncias
                  }
                  copiado={
                    copiado ===
                    "canal"
                  }
                  onCopiar={() =>
                    copiarTexto(
                      linkCanalDenuncias,
                      "canal"
                    )
                  }
                />

                <BlocoLink
                  titulo="Página para consultar protocolo"
                  valor={
                    linkConsultaDenuncias
                  }
                  copiado={
                    copiado ===
                    "consulta"
                  }
                  onCopiar={() =>
                    copiarTexto(
                      linkConsultaDenuncias,
                      "consulta"
                    )
                  }
                />
              </div>
            </Painel>

            <Painel
              titulo="Pesquisas do cliente"
              subtitulo="Histórico de pesquisas geradas para este cliente."
              acao={
                <Link
                  href="/pesquisas/nova"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                  + Nova pesquisa
                </Link>
              }
            >
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[600px] border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>
                        Pesquisa
                      </Th>

                      <Th>
                        Modelo
                      </Th>

                      <Th>
                        Status
                      </Th>
                    </tr>
                  </thead>

                  <tbody>
                    {!clienteSelecionado ||
                    carregando ? (
                      <LinhaVazia
                        colunas={3}
                        texto="Carregando pesquisas..."
                      />
                    ) : clienteSelecionado
                        .pesquisas
                        .length ===
                      0 ? (
                      <LinhaVazia
                        colunas={3}
                        texto="Nenhuma pesquisa gerada para este cliente."
                      />
                    ) : (
                      clienteSelecionado.pesquisas.map(
                        (
                          pesquisa
                        ) => (
                          <tr
                            key={
                              pesquisa.id
                            }
                            className="border-t border-slate-100"
                          >
                            <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                              {
                                pesquisa.titulo
                              }
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {
                                pesquisa.modelo
                                  .titulo
                              }
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {
                                pesquisa.status
                              }
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </Painel>
          </div>
        )}
      </section>


      {modalUsuarioAberto &&
        usuarioMaster &&
        clienteId && (
          <ModalUsuarioMaster
            nome={
              nomeUsuarioEdicao
            }
            email={
              emailUsuarioEdicao
            }
            ativo={
              usuarioEdicaoAtivo
            }
            novaSenha={
              novaSenhaUsuario
            }
            mostrarSenha={
              mostrarNovaSenha
            }
            processando={
              processando
            }
            onNomeChange={
              setNomeUsuarioEdicao
            }
            onEmailChange={
              setEmailUsuarioEdicao
            }
            onAtivoChange={
              setUsuarioEdicaoAtivo
            }
            onNovaSenhaChange={
              setNovaSenhaUsuario
            }
            onAlternarSenha={() =>
              setMostrarNovaSenha(
                (valor) => !valor
              )
            }
            onSalvar={
              salvarEdicaoUsuario
            }
            onExcluir={
              removerUsuarioMaster
            }
            onFechar={() =>
              setModalUsuarioAberto(
                false
              )
            }
          />
        )}
    </main>
  );
}


function ModalUsuarioMaster({
  nome,
  email,
  ativo,
  novaSenha,
  mostrarSenha,
  processando,
  onNomeChange,
  onEmailChange,
  onAtivoChange,
  onNovaSenhaChange,
  onAlternarSenha,
  onSalvar,
  onExcluir,
  onFechar,
}: {
  nome: string;
  email: string;
  ativo: boolean;
  novaSenha: string;
  mostrarSenha: boolean;
  processando: boolean;
  onNomeChange: (
    valor: string
  ) => void;
  onEmailChange: (
    valor: string
  ) => void;
  onAtivoChange: (
    valor: boolean
  ) => void;
  onNovaSenhaChange: (
    valor: string
  ) => void;
  onAlternarSenha: () => void;
  onSalvar: () => void;
  onExcluir: () => void;
  onFechar: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editar usuário master"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Acesso do cliente
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-900">
              Editar usuário master
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Altere os dados de acesso
              sem sair do cadastro do
              cliente.
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xl text-slate-600 transition hover:bg-slate-100"
          >
            ×
          </button>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <Campo
            label="Nome do usuário"
            value={nome}
            onChange={onNomeChange}
            required
          />

          <Campo
            label="E-mail de acesso"
            type="email"
            value={email}
            onChange={onEmailChange}
            required
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nova senha
            </label>

            <div className="relative">
              <input
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                value={novaSenha}
                onChange={(
                  event
                ) =>
                  onNovaSenhaChange(
                    event.target.value
                  )
                }
                placeholder="Deixe em branco para manter a senha atual"
                autoComplete="new-password"
                className={`${inputClassName} pr-24`}
              />

              <button
                type="button"
                onClick={
                  onAlternarSenha
                }
                className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-xl px-3 text-xs font-bold text-blue-600 transition hover:bg-blue-50"
              >
                {mostrarSenha
                  ? "Ocultar"
                  : "Mostrar"}
              </button>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Preencha somente quando
              quiser redefinir a senha.
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Acesso ativo
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Quando desativado, este
                usuário não poderá entrar
                no sistema.
              </p>
            </div>

            <input
              type="checkbox"
              checked={ativo}
              onChange={(
                event
              ) =>
                onAtivoChange(
                  event.target.checked
                )
              }
              className="h-5 w-5 shrink-0 accent-blue-600"
            />
          </label>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-between sm:p-6">
          <button
            type="button"
            onClick={onExcluir}
            disabled={processando}
            className="min-h-11 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            Remover acesso
          </button>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onFechar}
              disabled={processando}
              className="min-h-11 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onSalvar}
              disabled={processando}
              className="min-h-11 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {processando
                ? "Salvando..."
                : "Salvar acesso"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100";

function Campo({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  inputMode,
  maxLength,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    valor: string
  ) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?:
    | "text"
    | "email"
    | "tel"
    | "numeric"
    | "decimal"
    | "search"
    | "url";
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={
          placeholder
        }
        inputMode={
          inputMode
        }
        maxLength={
          maxLength
        }
        disabled={disabled}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={
          inputClassName
        }
      />
    </div>
  );
}

function SecaoFormulario({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
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

      <div className="space-y-5">
        {children}
      </div>
    </section>
  );
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-500">
        {titulo}
      </p>

      <strong className="mt-2 block text-3xl font-black text-slate-900">
        {valor}
      </strong>
    </div>
  );
}

function Painel({
  titulo,
  subtitulo,
  children,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            {titulo}
          </h2>

          {subtitulo && (
            <p className="mt-1 text-sm text-slate-500">
              {subtitulo}
            </p>
          )}
        </div>

        {acao}
      </div>

      {children}
    </div>
  );
}

function BlocoLink({
  titulo,
  valor,
  copiado,
  onCopiar,
}: {
  titulo: string;
  valor: string;
  copiado: boolean;
  onCopiar: () => void;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm font-semibold text-slate-700">
        {titulo}
      </p>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={valor}
          title={valor}
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
        />

        <button
          type="button"
          onClick={onCopiar}
          className="min-h-12 shrink-0 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          {copiado
            ? "Copiado"
            : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({
  ativo,
}: {
  ativo: boolean;
}) {
  return ativo ? (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      Ativo
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
      Inativo
    </span>
  );
}

function AlertaErro({
  mensagem,
}: {
  mensagem:
    | string
    | null;
}) {
  if (!mensagem) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
      {mensagem}
    </div>
  );
}

function Th({
  children,
  direita = false,
}: {
  children: ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-sm font-bold text-slate-600 ${
        direita
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function LinhaVazia({
  colunas,
  texto,
}: {
  colunas: number;
  texto: string;
}) {
  return (
    <tr>
      <td
        colSpan={colunas}
        className="px-4 py-10 text-center text-sm text-slate-500"
      >
        {texto}
      </td>
    </tr>
  );
}
