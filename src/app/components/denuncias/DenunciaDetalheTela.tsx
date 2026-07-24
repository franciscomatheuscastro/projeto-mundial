"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DestinoTratativaDenuncia,
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
  podeLiberarTratativa?: boolean;
  colaboradorLogadoId?: string | null;
  colaboradoresDisponiveis?: ColaboradorDisponivel[];
};

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function formatarTamanho(tamanho: number) {
  if (tamanho < 1024) {
    return `${tamanho} bytes`;
  }

  if (tamanho < 1024 * 1024) {
    return `${(tamanho / 1024).toFixed(1)} KB`;
  }

  return `${(tamanho / 1024 / 1024).toFixed(2)} MB`;
}

function formatarRespostaPersonalizada(
  resposta: unknown
) {
  if (typeof resposta === "boolean") {
    return resposta ? "Sim" : "Não";
  }

  if (typeof resposta === "string") {
    return resposta.trim() || "-";
  }

  if (
    typeof resposta === "number"
  ) {
    return String(resposta);
  }

  if (
    resposta &&
    typeof resposta === "object"
  ) {
    try {
      return JSON.stringify(resposta);
    } catch {
      return "-";
    }
  }

  return "-";
}

export default function DenunciaDetalheTela({
  id,
  contexto = "mundial",
  podeGerenciar = false,
  podeTratar = false,
  podeVerTratativas = false,
  podeEditarTratativas = false,
  podeLiberarTratativa = false,
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
    liberarTratativa,
    adicionarTratativa,
    editarTratativa,
  } = useDenuncias(false, contexto);

  const [status, setStatus] =
    useState<StatusDenuncia>("RECEBIDA");
  const [gravidade, setGravidade] =
    useState<GravidadeDenuncia>("MEDIA");
  const [respostaPublica, setRespostaPublica] =
    useState("");

  const [destino, setDestino] =
    useState<DestinoTratativaDenuncia>("MUNDIAL");
  const [colaboradorId, setColaboradorId] =
    useState("");

  const [tratativaEditandoId, setTratativaEditandoId] =
    useState<string | null>(null);
  const [tituloEdicao, setTituloEdicao] = useState("");
  const [descricaoEdicao, setDescricaoEdicao] =
    useState("");

  const [mensagem, setMensagem] =
    useState<string | null>(null);
  const [erroLocal, setErroLocal] =
    useState<string | null>(null);

  const usuarioMundial = contexto === "mundial";

  useEffect(() => {
    carregarDenunciaPorId(id)
      .then((denuncia) => {
        setStatus(denuncia.status);
        setGravidade(denuncia.gravidade);
        setRespostaPublica(
          denuncia.respostaPublica || ""
        );

        setDestino(
          denuncia.destinoTratativa ||
            "MUNDIAL"
        );

        setColaboradorId(
          denuncia.colaboradorResponsavelId ||
            ""
        );
      })
      .catch(() => {});
  }, [id, carregarDenunciaPorId]);

  const tratativas = useMemo(
    () =>
      podeVerTratativas
        ? denunciaSelecionada?.tratativas ?? []
        : [],
    [denunciaSelecionada?.tratativas, podeVerTratativas]
  );

  const possuiTratativa =
    (denunciaSelecionada?.tratativas?.length ?? 0) > 0;

  const podeEditarDirecionamento =
    podeLiberarTratativa &&
    !possuiTratativa;

  const responsavelExclusivo = useMemo(() => {
    if (!denunciaSelecionada?.tratativaLiberada) {
      return "Não definido";
    }

    if (
      denunciaSelecionada.destinoTratativa === "MUNDIAL"
    ) {
      return "Mundial";
    }

    return (
      denunciaSelecionada.colaboradorResponsavel?.nome ||
      "Colaborador não localizado"
    );
  }, [denunciaSelecionada]);

  const usuarioPodeExecutarTratativa = useMemo(() => {
    if (
      !podeTratar ||
      !denunciaSelecionada?.tratativaLiberada
    ) {
      return false;
    }

    if (
      denunciaSelecionada.destinoTratativa === "MUNDIAL"
    ) {
      return usuarioMundial;
    }

    return Boolean(
      !usuarioMundial &&
        colaboradorLogadoId &&
        colaboradorLogadoId ===
          denunciaSelecionada.colaboradorResponsavelId
    );
  }, [
    podeTratar,
    denunciaSelecionada,
    usuarioMundial,
    colaboradorLogadoId,
  ]);

  async function salvarAndamento(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!denunciaSelecionada || processando) return;

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

  async function confirmarLiberacao(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      processando ||
      !denunciaSelecionada
    ) {
      return;
    }

    setMensagem(null);
    setErroLocal(null);

    const jaEstavaLiberada =
      denunciaSelecionada.tratativaLiberada;

    try {
      const resultado =
        await liberarTratativa({
          denunciaId: id,
          destino,
          colaboradorId:
            destino === "COLABORADOR"
              ? colaboradorId
              : null,
        });

      setStatus(resultado.status);

      setDestino(
        resultado.destinoTratativa ||
          "MUNDIAL"
      );

      setColaboradorId(
        resultado.colaboradorResponsavelId ||
          ""
      );

      setMensagem(
        jaEstavaLiberada
          ? "Direcionamento atualizado com sucesso."
          : destino === "MUNDIAL"
            ? "Tratativa liberada exclusivamente para a Mundial."
            : "Tratativa direcionada exclusivamente ao colaborador."
      );
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível liberar a tratativa."
      );
    }
  }

  async function novaTratativa(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (processando) return;

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
      });

      formulario.reset();
      setStatus("EM_TRATATIVA");
      setMensagem("Tratativa adicionada com sucesso.");
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
  }) {
    setTratativaEditandoId(tratativa.id);
    setTituloEdicao(tratativa.titulo);
    setDescricaoEdicao(tratativa.descricao);
  }

  function cancelarEdicao() {
    setTratativaEditandoId(null);
    setTituloEdicao("");
    setDescricaoEdicao("");
  }

  async function salvarEdicaoTratativa(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!tratativaEditandoId || processando) return;

    setMensagem(null);
    setErroLocal(null);

    try {
      await editarTratativa({
        id: tratativaEditandoId,
        denunciaId: id,
        titulo: tituloEdicao.trim(),
        descricao: descricaoEdicao.trim(),
      });

      cancelarEdicao();
      setMensagem("Tratativa atualizada com sucesso.");
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível editar a tratativa."
      );
    }
  }

  if (carregando) {
    return <Estado texto="Carregando denúncia..." />;
  }

  if (erro && !denunciaSelecionada) {
    return <Estado texto={erro} erro />;
  }

  if (!denunciaSelecionada) {
    return <Estado texto="Denúncia não encontrada." />;
  }

  const anexos = denunciaSelecionada.anexos ?? [];

  const respostasPerguntasCanal =
    denunciaSelecionada.respostasPerguntasCanal ?? [];

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Canal de Denúncias
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
          Denúncia {denunciaSelecionada.protocolo}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {denunciaSelecionada.cliente.empresa ||
            denunciaSelecionada.cliente.nome}
        </p>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {(erroLocal || erro) && (
          <Alerta tipo="erro" texto={erroLocal || erro || ""} />
        )}

        {mensagem && (
          <Alerta tipo="sucesso" texto={mensagem} />
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
              <Badge tipo="gravidade" texto={gravidade} />
              <Badge tipo="status" texto={status} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Info label="Título" valor={denunciaSelecionada.titulo} />
            <Info
              label="Categoria"
              valor={denunciaSelecionada.categoria?.nome || "-"}
            />
            <Info
              label="Responsável pelas tratativas"
              valor={responsavelExclusivo}
            />
            <Info
              label="Tratativa liberada"
              valor={
                denunciaSelecionada.tratativaLiberada
                  ? "Sim"
                  : "Não"
              }
            />
          </div>

          <p className="mt-5 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {denunciaSelecionada.descricao}
          </p>
        </section>

        {respostasPerguntasCanal.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Informações complementares
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Respostas fornecidas às perguntas
                personalizadas deste canal.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {respostasPerguntasCanal.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.perguntaEnunciado}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-900">
                      {formatarRespostaPersonalizada(
                        item.resposta
                      )}
                    </p>

                    <p className="mt-3 text-xs text-slate-400">
                      {formatarTexto(
                        item.perguntaTipo
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Anexos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Documentos e evidências disponíveis para este perfil.
            </p>
          </div>

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
                      {new Date(anexo.criadoEm).toLocaleString(
                        "pt-BR"
                      )}
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
                      className="inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 sm:w-auto"
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

        {podeEditarDirecionamento && (
            <form
              onSubmit={confirmarLiberacao}
              className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6"
            >
              <h2 className="text-lg font-bold text-amber-950">
                {denunciaSelecionada.tratativaLiberada
                  ? "Editar direcionamento"
                  : "Liberar tratativa"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                {denunciaSelecionada.tratativaLiberada
                  ? "Altere o responsável exclusivo enquanto ainda não houver tratativas registradas."
                  : "Defina quem ficará responsável por todas as tratativas desta denúncia. Mundial e colaborador não poderão atuar simultaneamente."}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <CampoSelect
                  label="Responsável exclusivo"
                  value={destino}
                  disabled={processando}
                  onChange={(valor) =>
                    setDestino(
                      valor as DestinoTratativaDenuncia
                    )
                  }
                >
                  <option value="MUNDIAL">Mundial</option>
                  <option value="COLABORADOR">
                    Colaborador do cliente
                  </option>
                </CampoSelect>

                {destino === "COLABORADOR" && (
                  <CampoSelect
                    label="Colaborador responsável"
                    value={colaboradorId}
                    disabled={processando}
                    onChange={setColaboradorId}
                  >
                    <option value="">
                      Selecione o colaborador
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
                  </CampoSelect>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  processando ||
                  (destino === "COLABORADOR" &&
                    !colaboradorId)
                }
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 sm:w-auto"
              >
                {processando
                  ? denunciaSelecionada.tratativaLiberada
                    ? "Atualizando..."
                    : "Liberando..."
                  : denunciaSelecionada.tratativaLiberada
                    ? "Salvar novo direcionamento"
                    : "Liberar tratativa"}
              </button>
            </form>
          )}

        {podeLiberarTratativa &&
          denunciaSelecionada.tratativaLiberada &&
          possuiTratativa && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Direcionamento da tratativa
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Responsável atual:{" "}
                <strong>{responsavelExclusivo}</strong>.
                O direcionamento não pode mais ser alterado porque
                já existe pelo menos uma tratativa registrada.
              </p>
            </div>
          )}

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
                  setStatus(valor as StatusDenuncia)
                }
              >
                <option value="RECEBIDA">Recebida</option>
                <option value="EM_ANALISE">Em análise</option>
                <option value="EM_TRATATIVA">
                  Em tratativa
                </option>
                <option
                  value="CONCLUIDA"
                  disabled={!possuiTratativa}
                >
                  Concluída
                </option>
                <option value="ARQUIVADA">Arquivada</option>
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
                <option value="CRITICA">Crítica</option>
              </CampoSelect>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Resposta final pública
                </label>
                <textarea
                  value={respostaPublica}
                  disabled={processando || !possuiTratativa}
                  onChange={(event) =>
                    setRespostaPublica(event.target.value)
                  }
                  rows={4}
                  placeholder={
                    possuiTratativa
                      ? "Resposta que será disponibilizada ao denunciante."
                      : "Registre pelo menos uma tratativa antes de liberar a resposta final."
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
                {!possuiTratativa && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    A resposta final e a conclusão permanecem
                    bloqueadas até existir pelo menos uma
                    tratativa.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={processando}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
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
              Responsável exclusivo: {responsavelExclusivo}.
            </p>

            <div className="mt-5 space-y-4">
              {tratativas.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Nenhuma tratativa registrada.
                </p>
              ) : (
                tratativas.map((tratativa) => {
                  const editando =
                    tratativaEditandoId === tratativa.id;

                  return (
                    <div
                      key={tratativa.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      {editando ? (
                        <form
                          onSubmit={salvarEdicaoTratativa}
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
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={processando}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Salvar edição
                            </button>
                            <button
                              type="button"
                              onClick={cancelarEdicao}
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {tratativa.titulo}
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {tratativa.descricao}
                              </p>
                            </div>

                            {podeEditarTratativas &&
                              usuarioPodeExecutarTratativa && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    iniciarEdicao(tratativa)
                                  }
                                  className="text-sm font-semibold text-blue-600"
                                >
                                  Editar
                                </button>
                              )}
                          </div>

                          <p className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500">
                            Criada por {tratativa.criadoPorNome} em{" "}
                            {new Date(
                              tratativa.criadoEm
                            ).toLocaleString("pt-BR")}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {usuarioPodeExecutarTratativa && (
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

            {!usuarioPodeExecutarTratativa &&
              denunciaSelecionada.tratativaLiberada && (
                <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  As tratativas desta denúncia são exclusivas de{" "}
                  {responsavelExclusivo}.
                </p>
              )}
          </section>
        )}

        <div className="pb-2 pt-2">
          <Link
            href={
              usuarioMundial
                ? "/denuncias"
                : "/minhas-denuncias"
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
          >
            <span aria-hidden="true">←</span>
            Voltar para denúncias
          </Link>
        </div>
      </section>
    </main>
  );
}

function Estado({
  texto,
  erro = false,
}: {
  texto: string;
  erro?: boolean;
}) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
          erro
            ? "border-red-100 bg-red-50 text-red-700"
            : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        {texto}
      </div>
    </main>
  );
}

function Alerta({
  tipo,
  texto,
}: {
  tipo: "erro" | "sucesso";
  texto: string;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
        tipo === "erro"
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-green-100 bg-green-50 text-green-700"
      }`}
    >
      {texto}
    </div>
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
        onChange={(event) => onChange(event.target.value)}
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
        onChange={(event) => onChange(event.target.value)}
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
