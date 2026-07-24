"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useColaboradoresCliente } from "@/src/app/data/hooks/useColaboradoresCliente";
import { ColaboradorCliente } from "@/src/core/model/ColaboradorCliente";

function criarFormularioInicial(): ColaboradorCliente {
  return {
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    setor: "",
    cargo: "",
    ativo: true,
    podeVerDenuncias: true,
    podeTratarDenuncias: true,
  };
}

function obterDigitosTelefone(
  valor?: string | null
): string {
  return valor?.replace(/\D/g, "").slice(0, 11) ?? "";
}

function formatarTelefone(
  valor?: string | null
): string {
  const digitos = obterDigitosTelefone(valor);

  if (!digitos) {
    return "";
  }

  if (digitos.length <= 2) {
    return `(${digitos}`;
  }

  if (digitos.length <= 6) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  }

  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export default function MeusColaboradoresTela() {
  const {
    colaboradores,
    colaboradorSelecionado,
    setColaboradorSelecionado,
    carregando,
    processando,
    erro,
    salvarColaborador,
    excluirColaborador,
  } = useColaboradoresCliente();

  const [formulario, setFormulario] =
    useState<ColaboradorCliente>(
      criarFormularioInicial()
    );

  const [modalAberto, setModalAberto] =
    useState(false);

  const [erroLocal, setErroLocal] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!colaboradorSelecionado) {
      return;
    }

    setFormulario({
      id: colaboradorSelecionado.id,
      nome: colaboradorSelecionado.nome,
      email:
        colaboradorSelecionado.email ?? "",
      senha: "",
      telefone: formatarTelefone(
        colaboradorSelecionado.telefone
      ),
      setor:
        colaboradorSelecionado.setor ?? "",
      cargo:
        colaboradorSelecionado.cargo ?? "",
      ativo: colaboradorSelecionado.ativo,
      podeVerDenuncias:
        colaboradorSelecionado
          .podeVerDenuncias,
      podeTratarDenuncias:
        colaboradorSelecionado
          .podeTratarDenuncias,
    });

    setErroLocal(null);
    setModalAberto(true);
  }, [colaboradorSelecionado]);

  function abrirNovo() {
    setColaboradorSelecionado(null);
    setFormulario(criarFormularioInicial());
    setErroLocal(null);
    setModalAberto(true);
  }

  function fecharModal() {
    if (processando) {
      return;
    }

    setModalAberto(false);
    setColaboradorSelecionado(null);
    setFormulario(criarFormularioInicial());
    setErroLocal(null);
  }

  function alterarCampo<
    K extends keyof ColaboradorCliente
  >(
    campo: K,
    valor: ColaboradorCliente[K]
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function alterarPermissaoVisualizacao(
    marcado: boolean
  ) {
    setFormulario((atual) => ({
      ...atual,
      podeVerDenuncias: marcado,

      /*
       * Sem permissão para visualizar, também
       * não pode realizar tratativas.
       */
      podeTratarDenuncias: marcado
        ? atual.podeTratarDenuncias
        : false,
    }));
  }

  function alterarPermissaoTratativa(
    marcado: boolean
  ) {
    setFormulario((atual) => ({
      ...atual,

      /*
       * Para tratar uma denúncia, o colaborador
       * obrigatoriamente precisa visualizá-la.
       */
      podeVerDenuncias: marcado
        ? true
        : atual.podeVerDenuncias,

      podeTratarDenuncias: marcado,
    }));
  }

  async function enviar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (processando) {
      return;
    }

    setErroLocal(null);

    const nome = formulario.nome.trim();
    const email = formulario.email
      .trim()
      .toLowerCase();

    const telefoneDigitos =
      obterDigitosTelefone(formulario.telefone);

    if (!nome) {
      setErroLocal("Informe o nome.");
      return;
    }

    if (!email) {
      setErroLocal("Informe o e-mail.");
      return;
    }

    if (
      telefoneDigitos &&
      telefoneDigitos.length !== 10 &&
      telefoneDigitos.length !== 11
    ) {
      setErroLocal(
        "Informe um telefone válido com DDD."
      );
      return;
    }

    if (
      !formulario.id &&
      !formulario.senha?.trim()
    ) {
      setErroLocal(
        "Informe a senha inicial do colaborador."
      );
      return;
    }

    try {
      await salvarColaborador({
        ...formulario,
        nome,
        email,
        telefone:
          telefoneDigitos || null,
        setor:
          formulario.setor?.trim() || null,
        cargo:
          formulario.cargo?.trim() || null,
        senha:
          formulario.senha?.trim() ||
          undefined,
        ativo: formulario.ativo ?? true,
        podeVerDenuncias:
          formulario.podeVerDenuncias ??
          true,
        podeTratarDenuncias:
          formulario.podeTratarDenuncias ??
          true,
      });

      fecharModal();
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o colaborador."
      );
    }
  }

  async function confirmarExclusao(
    id: string,
    nome: string
  ) {
    if (processando) {
      return;
    }

    const confirmado = window.confirm(
      `Deseja realmente excluir o acesso de ${nome}?`
    );

    if (!confirmado) {
      return;
    }

    setErroLocal(null);

    try {
      await excluirColaborador(id);
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o colaborador."
      );
    }
  }

  const mensagemErro = erroLocal || erro;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Comitê de denúncias
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Colaboradores
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Gerencie os integrantes responsáveis
              pela análise e pelas tratativas das
              denúncias da empresa.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovo}
            disabled={processando}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Novo colaborador
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {mensagemErro && !modalAberto && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {mensagemErro}
          </div>
        )}

        <ResumoColaboradores
          total={colaboradores.length}
          ativos={
            colaboradores.filter(
              (colaborador) =>
                colaborador.ativo
            ).length
          }
          podemTratar={
            colaboradores.filter(
              (colaborador) =>
                colaborador.ativo &&
                colaborador
                  .podeTratarDenuncias
            ).length
          }
        />

        {carregando ? (
          <EstadoCarregando />
        ) : colaboradores.length === 0 ? (
          <EstadoVazio onClick={abrirNovo} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {colaboradores.map(
              (colaborador) => (
                <article
                  key={colaborador.id}
                  className="flex min-h-[330px] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black text-slate-900">
                        {colaborador.nome}
                      </h2>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {colaborador.email ||
                          "E-mail não informado"}
                      </p>
                    </div>

                    <StatusBadge
                      ativo={colaborador.ativo}
                    />
                  </div>

                  <div className="mt-6 grid gap-3">
                    <Informacao
                      label="Setor"
                      valor={
                        colaborador.setor ||
                        "Não informado"
                      }
                    />

                    <Informacao
                      label="Cargo"
                      valor={
                        colaborador.cargo ||
                        "Não informado"
                      }
                    />

                    <Informacao
                      label="Telefone"
                      valor={
                        colaborador.telefone ||
                        "Não informado"
                      }
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <PermissaoBadge
                      ativa={
                        colaborador
                          .podeVerDenuncias
                      }
                      textoAtivo="Visualiza denúncias"
                      textoInativo="Sem visualização"
                      tipo="visualizacao"
                    />

                    <PermissaoBadge
                      ativa={
                        colaborador
                          .podeTratarDenuncias
                      }
                      textoAtivo="Realiza tratativas"
                      textoInativo="Sem tratativas"
                      tipo="tratativa"
                    />
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-3 pt-7">
                    <button
                      type="button"
                      disabled={processando}
                      onClick={() =>
                        setColaboradorSelecionado(
                          colaborador
                        )
                      }
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      disabled={processando}
                      onClick={() =>
                        confirmarExclusao(
                          colaborador.id,
                          colaborador.nome
                        )
                      }
                      className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {modalAberto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-colaborador"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <form onSubmit={enviar}>
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    Comitê de denúncias
                  </p>

                  <h2
                    id="titulo-modal-colaborador"
                    className="mt-1 text-xl font-black text-slate-900 sm:text-2xl"
                  >
                    {formulario.id
                      ? "Editar colaborador"
                      : "Novo colaborador"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Configure os dados de acesso e
                    as permissões do integrante.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={processando}
                  aria-label="Fechar modal"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                {mensagemErro && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {mensagemErro}
                  </div>
                )}

                <section>
                  <h3 className="text-base font-black text-slate-900">
                    Dados do colaborador
                  </h3>

                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <Campo
                      label="Nome"
                      obrigatorio
                      disabled={processando}
                      valor={formulario.nome}
                      placeholder="Nome completo"
                      onChange={(valor) =>
                        alterarCampo(
                          "nome",
                          valor
                        )
                      }
                    />

                    <Campo
                      label="E-mail de acesso"
                      type="email"
                      obrigatorio
                      disabled={processando}
                      valor={formulario.email}
                      placeholder="nome@empresa.com.br"
                      onChange={(valor) =>
                        alterarCampo(
                          "email",
                          valor
                        )
                      }
                    />

                    <Campo
                      label={
                        formulario.id
                          ? "Nova senha"
                          : "Senha inicial"
                      }
                      type="password"
                      obrigatorio={!formulario.id}
                      disabled={processando}
                      valor={
                        formulario.senha ?? ""
                      }
                      placeholder={
                        formulario.id
                          ? "Deixe vazio para manter"
                          : "Informe a senha inicial"
                      }
                      descricao={
                        formulario.id
                          ? "Preencha somente para alterar a senha atual."
                          : "A senha será utilizada no primeiro acesso."
                      }
                      onChange={(valor) =>
                        alterarCampo(
                          "senha",
                          valor
                        )
                      }
                    />

                    <Campo
                      label="Telefone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={15}
                      disabled={processando}
                      valor={
                        formulario.telefone ?? ""
                      }
                      placeholder="(00) 00000-0000"
                      onChange={(valor) =>
                        alterarCampo(
                          "telefone",
                          formatarTelefone(valor)
                        )
                      }
                    />

                    <Campo
                      label="Setor"
                      disabled={processando}
                      valor={
                        formulario.setor ?? ""
                      }
                      placeholder="Ex.: Recursos Humanos"
                      onChange={(valor) =>
                        alterarCampo(
                          "setor",
                          valor
                        )
                      }
                    />

                    <Campo
                      label="Cargo"
                      disabled={processando}
                      valor={
                        formulario.cargo ?? ""
                      }
                      placeholder="Ex.: Analista de RH"
                      onChange={(valor) =>
                        alterarCampo(
                          "cargo",
                          valor
                        )
                      }
                    />
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6">
                  <h3 className="text-base font-black text-slate-900">
                    Acesso e permissões
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Defina o escopo de atuação do
                    integrante dentro do canal de
                    denúncias.
                  </p>

                  <div className="mt-4 grid gap-3">
                    <Checkbox
                      label="Usuário ativo"
                      descricao="Permite que o colaborador entre na plataforma."
                      marcado={
                        formulario.ativo ?? true
                      }
                      disabled={processando}
                      onChange={(valor) =>
                        alterarCampo(
                          "ativo",
                          valor
                        )
                      }
                    />

                    <Checkbox
                      label="Visualizar denúncias"
                      descricao="Permite consultar denúncias, anexos, histórico e resposta final."
                      marcado={
                        formulario
                          .podeVerDenuncias ??
                        true
                      }
                      disabled={processando}
                      onChange={
                        alterarPermissaoVisualizacao
                      }
                    />

                    <Checkbox
                      label="Realizar tratativas"
                      descricao="Permite registrar tratativas internas nas denúncias da empresa."
                      marcado={
                        formulario
                          .podeTratarDenuncias ??
                        true
                      }
                      disabled={processando}
                      onChange={
                        alterarPermissaoTratativa
                      }
                    />
                  </div>
                </section>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={processando}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={processando}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {processando
                    ? "Salvando..."
                    : formulario.id
                      ? "Salvar alterações"
                      : "Cadastrar colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function ResumoColaboradores({
  total,
  ativos,
  podemTratar,
}: {
  total: number;
  ativos: number;
  podemTratar: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <CardResumo
        titulo="Colaboradores"
        valor={total}
      />

      <CardResumo
        titulo="Usuários ativos"
        valor={ativos}
      />

      <CardResumo
        titulo="Com permissão de tratativa"
        valor={podemTratar}
      />
    </div>
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {titulo}
      </p>

      <strong className="mt-2 block text-3xl font-black text-slate-900">
        {valor}
      </strong>
    </div>
  );
}

function EstadoCarregando() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

      <p className="mt-4 text-sm font-medium text-slate-500">
        Carregando colaboradores...
      </p>
    </div>
  );
}

function EstadoVazio({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-600">
        +
      </div>

      <h2 className="mt-5 text-xl font-black text-slate-900">
        Nenhum colaborador cadastrado
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Cadastre os integrantes que farão
        parte do comitê responsável pelas
        tratativas das denúncias.
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
      >
        Cadastrar primeiro colaborador
      </button>
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
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
        ativo
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

function PermissaoBadge({
  ativa,
  textoAtivo,
  textoInativo,
  tipo,
}: {
  ativa: boolean;
  textoAtivo: string;
  textoInativo: string;
  tipo: "visualizacao" | "tratativa";
}) {
  const classeAtiva =
    tipo === "visualizacao"
      ? "bg-blue-50 text-blue-700"
      : "bg-violet-50 text-violet-700";

  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
        ativa
          ? classeAtiva
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {ativa ? textoAtivo : textoInativo}
    </span>
  );
}

function Informacao({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
      <span className="font-bold text-slate-700">
        {label}:
      </span>

      <span className="break-words text-slate-600">
        {valor}
      </span>
    </div>
  );
}

function Campo({
  label,
  valor,
  onChange,
  type = "text",
  placeholder,
  descricao,
  obrigatorio = false,
  disabled = false,
  inputMode,
  maxLength,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  type?: string;
  placeholder?: string;
  descricao?: string;
  obrigatorio?: boolean;
  disabled?: boolean;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {obrigatorio && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={valor}
        inputMode={inputMode}
        maxLength={maxLength}
        required={obrigatorio}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      />

      {descricao && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {descricao}
        </span>
      )}
    </label>
  );
}

function Checkbox({
  label,
  descricao,
  marcado,
  onChange,
  disabled = false,
}: {
  label: string;
  descricao: string;
  marcado: boolean;
  onChange: (valor: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-2xl border border-slate-200 p-4 transition ${
        disabled
          ? "cursor-not-allowed bg-slate-50 opacity-70"
          : "cursor-pointer bg-white hover:border-blue-200 hover:bg-blue-50/30"
      }`}
    >
      <input
        type="checkbox"
        checked={marcado}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />

      <span>
        <span className="block text-sm font-bold text-slate-800">
          {label}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {descricao}
        </span>
      </span>
    </label>
  );
}