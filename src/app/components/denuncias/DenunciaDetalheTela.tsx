"use client";

import type {
  FormEvent,
  ReactNode,
} from "react";

import { useEffect, useMemo, useState } from "react";

import {
  GravidadeDenuncia,
  StatusDenuncia,
} from "@prisma/client";

import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";

type ColaboradorDisponivel = {
  id: string;
  nome: string;
  email?: string | null;
  cargo?: string | null;
  setor?: string | null;
};

type Props = {
  id: string;
  contexto?: "mundial" | "cliente";

  podeGerenciar?: boolean;
  podeTratar?: boolean;
  podeVerTratativas?: boolean;
  podeEditarTratativas?: boolean;
  podeAtribuirResponsavel?: boolean;

  colaboradorLogadoId?: string | null;
  colaboradoresDisponiveis?: ColaboradorDisponivel[];
};

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase()
    );
}

function formatarTamanho(tamanho: number) {
  if (tamanho < 1024) {
    return `${tamanho} bytes`;
  }

  if (tamanho < 1024 * 1024) {
    return `${(tamanho / 1024).toFixed(1)} KB`;
  }

  return `${(tamanho / 1024 / 1024).toFixed(
    2
  )} MB`;
}

export default function DenunciaDetalheTela({
  id,
  contexto = "mundial",

  podeGerenciar = false,
  podeTratar = false,
  podeVerTratativas = false,
  podeEditarTratativas = false,
  podeAtribuirResponsavel = false,

  colaboradorLogadoId = null,
  colaboradoresDisponiveis = [],
}: Props) {
  const {
    denunciaSelecionada,
    carregando,
    erro,
    processando,

    carregarDenunciaPorId,
    salvarDenuncia,
    adicionarTratativa,
    editarTratativa,
  } = useDenuncias(false, contexto);

  const [status, setStatus] =
    useState<StatusDenuncia>("RECEBIDA");

  const [gravidade, setGravidade] =
    useState<GravidadeDenuncia>("MEDIA");

  const [respostaPublica, setRespostaPublica] =
    useState("");

  const [tratativaEditandoId, setTratativaEditandoId] =
    useState<string | null>(null);

  const [tituloEdicao, setTituloEdicao] =
    useState("");

  const [descricaoEdicao, setDescricaoEdicao] =
    useState("");

  const [responsavelEdicao, setResponsavelEdicao] =
    useState("");

  const [mensagem, setMensagem] = useState<
    string | null
  >(null);

  const [erroLocal, setErroLocal] = useState<
    string | null
  >(null);

  const usuarioMundial = contexto === "mundial";

  useEffect(() => {
    carregarDenunciaPorId(id)
      .then((denuncia) => {
        setStatus(denuncia.status);
        setGravidade(denuncia.gravidade);
        setRespostaPublica(
          denuncia.respostaPublica || ""
        );
      })
      .catch(() => {
        // O hook já registra o erro.
      });
  }, [id, carregarDenunciaPorId]);

  const tratativasVisiveis = useMemo(() => {
    if (!podeVerTratativas) {
      return [];
    }

    return denunciaSelecionada?.tratativas ?? [];
  }, [
    denunciaSelecionada?.tratativas,
    podeVerTratativas,
  ]);

  async function salvarAndamento(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!denunciaSelecionada || processando) {
      return;
    }

    setMensagem(null);
    setErroLocal(null);

    try {
      await salvarDenuncia({
        ...denunciaSelecionada,
        status,
        gravidade,
        respostaPublica,
      });

      setMensagem(
        "Andamento da denúncia salvo com sucesso."
      );
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a denúncia."
      );
    }
  }

  async function novaTratativa(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (processando) {
      return;
    }

    const formulario = event.currentTarget;
    const formData = new FormData(formulario);

    setMensagem(null);
    setErroLocal(null);

    try {
      await adicionarTratativa(id, {
        titulo: String(
          formData.get("titulo") || ""
        ).trim(),

        descricao: String(
          formData.get("descricao") || ""
        ).trim(),

        responsavelId:
          String(
            formData.get("responsavelId") || ""
          ).trim() || null,
      });

      formulario.reset();

      setStatus("EM_TRATATIVA");

      setMensagem(
        "Tratativa adicionada com sucesso."
      );
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar a tratativa."
      );
    }
  }

  function iniciarEdicao(tratativa: {
    id: string;
    titulo: string;
    descricao: string;
    responsavelId?: string | null;
  }) {
    setTratativaEditandoId(tratativa.id);
    setTituloEdicao(tratativa.titulo);
    setDescricaoEdicao(tratativa.descricao);
    setResponsavelEdicao(
      tratativa.responsavelId || ""
    );
  }

  function cancelarEdicao() {
    setTratativaEditandoId(null);
    setTituloEdicao("");
    setDescricaoEdicao("");
    setResponsavelEdicao("");
  }

  async function salvarEdicaoTratativa(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !tratativaEditandoId ||
      processando
    ) {
      return;
    }

    setMensagem(null);
    setErroLocal(null);

    try {
      await editarTratativa({
        id: tratativaEditandoId,
        denunciaId: id,
        titulo: tituloEdicao.trim(),
        descricao: descricaoEdicao.trim(),
        responsavelId:
          responsavelEdicao || null,
      });

      cancelarEdicao();

      setMensagem(
        "Tratativa atualizada com sucesso."
      );
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível editar a tratativa."
      );
    }
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando denúncia...
        </div>
      </main>
    );
  }

  if (erro && !denunciaSelecionada) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      </main>
    );
  }

  if (!denunciaSelecionada) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Denúncia não encontrada.
        </div>
      </main>
    );
  }

  const anexos =
    denunciaSelecionada.anexos ?? [];

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Canal de Denúncias
          </p>

          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Denúncia{" "}
            {denunciaSelecionada.protocolo}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {denunciaSelecionada.cliente
              .empresa ||
              denunciaSelecionada.cliente.nome}
          </p>
        </div>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {(erroLocal || erro) && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erroLocal || erro}
          </div>
        )}

        {mensagem && (
          <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {mensagem}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Dados da denúncia
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Informações registradas no protocolo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                tipo="gravidade"
                texto={gravidade}
              />

              <Badge tipo="status" texto={status} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Info
              label="Título"
              valor={denunciaSelecionada.titulo}
            />

            <Info
              label="Categoria"
              valor={
                denunciaSelecionada.categoria
                  ?.nome || "-"
              }
            />

            <Info
              label="Anônima"
              valor={
                denunciaSelecionada.anonima
                  ? "Sim"
                  : "Não"
              }
            />

            <Info
              label="Local"
              valor={
                denunciaSelecionada.localOcorrido ||
                "-"
              }
            />

            <Info
              label="Data do ocorrido"
              valor={
                denunciaSelecionada.dataOcorrido
                  ? new Date(
                      denunciaSelecionada.dataOcorrido
                    ).toLocaleDateString("pt-BR")
                  : "-"
              }
            />

            <Info
              label="Data do registro"
              valor={new Date(
                denunciaSelecionada.criadoEm
              ).toLocaleString("pt-BR")}
            />

            <Info
              label="Última atualização"
              valor={new Date(
                denunciaSelecionada.atualizadoEm
              ).toLocaleString("pt-BR")}
            />

            <Info
              label="Quantidade de anexos"
              valor={String(anexos.length)}
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700">
              Descrição
            </p>

            <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {denunciaSelecionada.descricao}
            </p>
          </div>
        </section>

        {!denunciaSelecionada.anonima && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Identificação do denunciante
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Info
                label="Nome"
                valor={
                  denunciaSelecionada.nomeDenunciante ||
                  "-"
                }
              />

              <Info
                label="E-mail"
                valor={
                  denunciaSelecionada.emailDenunciante ||
                  "-"
                }
              />

              <Info
                label="Telefone"
                valor={
                  denunciaSelecionada.telefoneDenunciante ||
                  "-"
                }
              />
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Anexos
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Documentos e evidências disponíveis para o seu
            perfil.
          </p>

          <div className="mt-5 space-y-3">
            {anexos.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Nenhum anexo disponível.
              </p>
            ) : (
              anexos.map((anexo) => (
                <div
                  key={anexo.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-900">
                      {anexo.nomeOriginal}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatarTexto(anexo.tipo)}
                      {" • "}
                      {formatarTamanho(anexo.tamanho)}
                      {" • "}
                      {new Date(
                        anexo.criadoEm
                      ).toLocaleString("pt-BR")}
                    </p>

                    {usuarioMundial &&
                      anexo.visibilidade ===
                        "SOMENTE_MUNDIAL" && (
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          Arquivo restrito à Mundial
                        </p>
                      )}
                  </div>

                  {anexo.url ? (
                    <a
                      href={anexo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 sm:w-auto"
                    >
                      Abrir anexo
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-red-600">
                      Anexo indisponível
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {podeGerenciar && (
          <form
            onSubmit={salvarAndamento}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Gestão da denúncia
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CampoSelect
                label="Status"
                value={status}
                disabled={processando}
                onChange={(valor) =>
                  setStatus(
                    valor as StatusDenuncia
                  )
                }
              >
                <option value="RECEBIDA">
                  Recebida
                </option>
                <option value="EM_ANALISE">
                  Em análise
                </option>
                <option value="EM_TRATATIVA">
                  Em tratativa
                </option>
                <option value="CONCLUIDA">
                  Concluída
                </option>
                <option value="ARQUIVADA">
                  Arquivada
                </option>
              </CampoSelect>

              <CampoSelect
                label="Gravidade"
                value={gravidade}
                disabled={processando}
                onChange={(valor) =>
                  setGravidade(
                    valor as GravidadeDenuncia
                  )
                }
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">
                  Crítica
                </option>
              </CampoSelect>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Atualização pública
                </label>

                <textarea
                  value={respostaPublica}
                  disabled={processando}
                  onChange={(event) =>
                    setRespostaPublica(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Esta informação poderá ser visualizada pelo denunciante através do protocolo."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processando}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
            >
              {processando
                ? "Salvando..."
                : "Salvar andamento"}
            </button>
          </form>
        )}

        {podeVerTratativas && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Tratativas internas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Conteúdo interno não exibido na consulta
              pública.
            </p>

            <div className="mt-5 space-y-4">
              {tratativasVisiveis.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Nenhuma tratativa disponível.
                </p>
              ) : (
                tratativasVisiveis.map((tratativa) => {
                  const responsavelPodeEditar =
                    colaboradorLogadoId &&
                    tratativa.responsavelId ===
                      colaboradorLogadoId;

                  const exibirEdicao =
                    podeEditarTratativas &&
                    (usuarioMundial ||
                      responsavelPodeEditar);

                  const editando =
                    tratativaEditandoId ===
                    tratativa.id;

                  return (
                    <div
                      key={tratativa.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      {editando ? (
                        <form
                          onSubmit={
                            salvarEdicaoTratativa
                          }
                          className="space-y-4"
                        >
                          <CampoControlado
                            label="Título"
                            value={tituloEdicao}
                            disabled={processando}
                            onChange={setTituloEdicao}
                          />

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Descrição
                            </label>

                            <textarea
                              value={descricaoEdicao}
                              disabled={processando}
                              onChange={(event) =>
                                setDescricaoEdicao(
                                  event.target.value
                                )
                              }
                              rows={4}
                              required
                              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                            />
                          </div>

                          {podeAtribuirResponsavel && (
                            <CampoSelect
                              label="Responsável"
                              value={
                                responsavelEdicao
                              }
                              disabled={processando}
                              onChange={
                                setResponsavelEdicao
                              }
                            >
                              <option value="">
                                Sem responsável
                              </option>

                              {colaboradoresDisponiveis.map(
                                (colaborador) => (
                                  <option
                                    key={
                                      colaborador.id
                                    }
                                    value={
                                      colaborador.id
                                    }
                                  >
                                    {colaborador.nome}
                                  </option>
                                )
                              )}
                            </CampoSelect>
                          )}

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="submit"
                              disabled={processando}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Salvar edição
                            </button>

                            <button
                              type="button"
                              disabled={processando}
                              onClick={cancelarEdicao}
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {tratativa.titulo}
                              </p>

                              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {
                                  tratativa.descricao
                                }
                              </p>
                            </div>

                            {exibirEdicao && (
                              <button
                                type="button"
                                onClick={() =>
                                  iniciarEdicao(
                                    tratativa
                                  )
                                }
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                              >
                                Editar
                              </button>
                            )}
                          </div>

                          <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
                            <p>
                              Responsável:{" "}
                              {tratativa.responsavel
                                ?.nome ||
                                "Não atribuído"}
                            </p>

                            <p>
                              Criada por{" "}
                              {
                                tratativa.criadoPorNome
                              }{" "}
                              em{" "}
                              {new Date(
                                tratativa.criadoEm
                              ).toLocaleString(
                                "pt-BR"
                              )}
                            </p>

                            {tratativa.atualizadoPorNome && (
                              <p>
                                Última edição por{" "}
                                {
                                  tratativa.atualizadoPorNome
                                }{" "}
                                em{" "}
                                {new Date(
                                  tratativa.atualizadoEm
                                ).toLocaleString(
                                  "pt-BR"
                                )}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {podeTratar && (
              <form
                onSubmit={novaTratativa}
                className="mt-6 grid gap-4 border-t border-slate-200 pt-6"
              >
                <Campo
                  name="titulo"
                  label="Título da tratativa"
                  required
                  disabled={processando}
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Descrição da tratativa
                  </label>

                  <textarea
                    name="descricao"
                    required
                    rows={4}
                    disabled={processando}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                {podeAtribuirResponsavel && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Direcionar para
                    </label>

                    <select
                      name="responsavelId"
                      disabled={processando}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      <option value="">
                        Somente Mundial
                      </option>

                      {colaboradoresDisponiveis.map(
                        (colaborador) => (
                          <option
                            key={colaborador.id}
                            value={colaborador.id}
                          >
                            {colaborador.nome}
                            {colaborador.cargo
                              ? ` — ${colaborador.cargo}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processando}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 sm:w-fit"
                >
                  {processando
                    ? "Adicionando..."
                    : "Adicionar tratativa"}
                </button>
              </form>
            )}
          </section>
        )}
      </section>
    </main>
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
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-900">
        {valor}
      </p>
    </div>
  );
}

function Campo({
  name,
  label,
  required,
  disabled = false,
}: {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
      />
    </div>
  );
}

function CampoControlado({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        required
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
      />
    </div>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
      >
        {children}
      </select>
    </div>
  );
}

function Badge({
  texto,
  tipo,
}: {
  texto: string;
  tipo: "status" | "gravidade";
}) {
  const classe =
    tipo === "gravidade"
      ? texto === "CRITICA"
        ? "bg-red-100 text-red-700"
        : texto === "ALTA"
          ? "bg-orange-100 text-orange-700"
          : texto === "MEDIA"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"
      : texto === "CONCLUIDA"
        ? "bg-green-100 text-green-700"
        : texto === "EM_TRATATIVA"
          ? "bg-blue-100 text-blue-700"
          : texto === "EM_ANALISE"
            ? "bg-yellow-100 text-yellow-700"
            : texto === "ARQUIVADA"
              ? "bg-slate-200 text-slate-700"
              : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${classe}`}
    >
      {formatarTexto(texto)}
    </span>
  );
}