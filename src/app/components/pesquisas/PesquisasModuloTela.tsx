"use client";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  TipoModuloPesquisa,
} from "@prisma/client";
import type {
  StatusPesquisaCliente,
} from "@prisma/client";
import {
  useModuloPesquisa,
} from "@/src/app/data/hooks/useModuloPesquisa";
import RelatorioAplicacaoModuloTela from "./RelatorioAplicacaoModuloTela";
import QrCodePublico from "./QrCodePublico";
type Props = {
  modo:
    | "lista"
    | "nova"
    | "detalhe"
    | "relatorio";
  tipo:
    TipoModuloPesquisa;
  tituloModulo:
    string;
  baseHref:
    string;
  pesquisaId?:
    string;
  contexto?:
    | "mundial"
    | "cliente";
};
const STATUS = {
  ABERTA:
    "ABERTA",
  FECHADA:
    "FECHADA",
} as const;
const inputClass =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
function montarLink(
  token?: string | null
) {
  if (
    !token
  ) {
    return "";
  }
  if (
    typeof window ===
    "undefined"
  ) {
    return `/pesquisa/${token}`;
  }
  return `${window.location.origin}/pesquisa/${token}`;
}
export default function PesquisasModuloTela({
  modo,
  tipo,
  tituloModulo,
  baseHref,
  pesquisaId,
  contexto = "mundial",
}: Props) {
  const router =
    useRouter();
  const mundial =
    contexto ===
    "mundial";
  /*
   * Garante a base correta para a Avaliação de Desempenho
   * no painel da Mundial, mesmo se algum page.tsx legado
   * ainda enviar baseHref="/pesquisas".
   */
  const baseHrefEfetivo =
    mundial &&
    tipo ===
      TipoModuloPesquisa.AVALIACAO_DESEMPENHO
      ? "/avaliacao-desempenho"
      : baseHref;
  const {
    pesquisas,
    pesquisaSelecionada,
    relatorio,
    dadosFormulario,
    carregando,
    processando,
    erro,
    carregarDadosFormulario,
    carregarPesquisaPorId,
    carregarRelatorio,
    salvar,
    excluir,
    alterarStatus,
  } =
    useModuloPesquisa(
      tipo,
      modo ===
        "lista",
      contexto
    );
  const [
    titulo,
    setTitulo,
  ] =
    useState("");
  const [
    descricao,
    setDescricao,
  ] =
    useState("");
  const [
    clienteId,
    setClienteId,
  ] =
    useState("");
  const [
    modeloId,
    setModeloId,
  ] =
    useState("");
  const [
    gestorUsuarioId,
    setGestorUsuarioId,
  ] =
    useState("");
  const ehAvaliacaoDesempenho =
    tipo ===
    TipoModuloPesquisa.AVALIACAO_DESEMPENHO;
  const ehGestaoRiscosPsicossociais =
    tipo ===
    TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL;
  const arquivoImportacaoRef =
    useRef<HTMLInputElement>(null);
  const [
    importandoRespostas,
    setImportandoRespostas,
  ] =
    useState(false);
  const [
    mensagemImportacao,
    setMensagemImportacao,
  ] =
    useState<string | null>(null);
  const [
    erroImportacao,
    setErroImportacao,
  ] =
    useState<string | null>(null);
  const clienteSelecionado =
    dadosFormulario.clientes.find(
      (
        cliente: any
      ) =>
        cliente.id ===
        clienteId
    );
  const gestoresCliente =
    Array.isArray(
      clienteSelecionado?.gestores
    )
      ? clienteSelecionado.gestores
      : [];
  function alterarCliente(
    valor: string
  ) {
    setClienteId(
      valor
    );
    setGestorUsuarioId(
      ""
    );
  }
  useEffect(() => {
    if (
      modo ===
        "nova" &&
      mundial
    ) {
      void carregarDadosFormulario();
    }
    if (
      modo ===
        "detalhe" &&
      pesquisaId
    ) {
      void carregarPesquisaPorId(
        pesquisaId
      );
    }
    if (
      modo ===
        "relatorio" &&
      pesquisaId
    ) {
      void carregarRelatorio(
        pesquisaId
      );
    }
  }, [
    modo,
    pesquisaId,
    mundial,
    carregarDadosFormulario,
    carregarPesquisaPorId,
    carregarRelatorio,
  ]);
  const linkPublico =
    useMemo(
      () =>
        montarLink(
          pesquisaSelecionada?.token
        ),
      [
        pesquisaSelecionada?.token,
      ]
    );
  async function importarRespostasImpressas(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      event.target.files?.[0];
    event.target.value = "";
    if (
      !arquivo ||
      !pesquisaSelecionada ||
      !mundial ||
      !ehGestaoRiscosPsicossociais
    ) {
      return;
    }
    setMensagemImportacao(null);
    setErroImportacao(null);
    setImportandoRespostas(true);
    try {
      const formulario =
        new FormData();
      formulario.append(
        "arquivo",
        arquivo
      );
      const resposta =
        await fetch(
          `/api/pesquisas/${pesquisaSelecionada.id}/importar-respostas`,
          {
            method: "POST",
            body: formulario,
          }
        );
      const dados =
        await resposta
          .json()
          .catch(
            () =>
              null
          );
      if (
        !resposta.ok
      ) {
        throw new Error(
          dados?.mensagem ||
            "Não foi possível importar as respostas."
        );
      }
      const importadas =
        Number(
          dados?.importadas ??
            0
        );
      const ignoradas =
        Number(
          dados?.linhasEmBrancoIgnoradas ??
            0
        );
      setMensagemImportacao(
        `${importadas} resposta(s) importada(s) com sucesso${
          ignoradas > 0
            ? ` · ${ignoradas} linha(s) em branco ignorada(s)`
            : ""
        }.`
      );
      await carregarPesquisaPorId(
        pesquisaSelecionada.id
      );
      router.refresh();
    } catch (error) {
      setErroImportacao(
        error instanceof Error
          ? error.message
          : "Não foi possível importar as respostas."
      );
    } finally {
      setImportandoRespostas(false);
    }
  }
  async function enviar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (
      !mundial
    ) {
      return;
    }
    const resultado =
      await salvar({
        titulo,
        descricao:
          descricao ||
          null,
        clienteId,
        modeloId,
        setor:
          null,
        gestorUsuarioId:
          ehAvaliacaoDesempenho
            ? gestorUsuarioId
            : null,
      });
    router.push(
      `${baseHrefEfetivo}/${resultado.id}`
    );
    router.refresh();
  }
  async function excluirAtual(
    id: string
  ) {
    if (
      !mundial
    ) {
      return;
    }
    if (
      !confirm(
        "Excluir esta aplicação e todas as respostas?"
      )
    ) {
      return;
    }
    await excluir(
      id
    );
    router.push(
      baseHrefEfetivo
    );
    router.refresh();
  }
  async function alternarStatus() {
    if (
      !mundial ||
      !pesquisaSelecionada
    ) {
      return;
    }
    const novo =
      pesquisaSelecionada.status ===
      STATUS.ABERTA
        ? STATUS.FECHADA
        : STATUS.ABERTA;
    await alterarStatus(
      pesquisaSelecionada.id,
      novo as StatusPesquisaCliente
    );
  }
  /* =======================================================
   * LISTA
   * ===================================================== */
  if (
    modo ===
    "lista"
  ) {
    const abertas =
      pesquisas.filter(
        item =>
          item.status ===
          STATUS.ABERTA
      ).length;
    const fechadas =
      pesquisas.filter(
        item =>
          item.status ===
          STATUS.FECHADA
      ).length;
    const respostas =
      pesquisas.reduce(
        (
          total,
          item
        ) =>
          total +
          (
            item.totalRespostas ||
            0
          ),
        0
      );
    return (
      <main className="min-h-screen bg-slate-100">
        <Header
          modulo={
            tituloModulo
          }
          titulo={
            mundial
              ? "Aplicações"
              : tituloModulo
          }
          descricao={
            mundial
              ? `Gerencie questionários e resultados de ${tituloModulo.toLowerCase()}.`
              : `Acompanhe os resultados de ${tituloModulo.toLowerCase()} da sua empresa.`
          }
        >
          {mundial && (
            <>
              <Link
                href={`${baseHrefEfetivo}/relatorio`}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Relatório
              </Link>
              <Link
                href={`${baseHrefEfetivo}/nova`}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                + Nova aplicação
              </Link>
            </>
          )}
        </Header>
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Erro
            mensagem={
              erro
            }
          />
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              titulo="Aplicações"
              valor={
                pesquisas.length
              }
            />
            <Card
              titulo="Abertas"
              valor={
                abertas
              }
            />
            <Card
              titulo="Fechadas"
              valor={
                fechadas
              }
            />
            <Card
              titulo="Respostas"
              valor={
                respostas
              }
            />
          </div>
          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-50">
                <tr>
                  <Th>
                    Aplicação
                  </Th>
                  {mundial && (
                    <Th>
                      Cliente
                    </Th>
                  )}
                  <Th>
                    Modelo
                  </Th>
                  <Th>
                    Respostas
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
                  <Vazia
                    colSpan={
                      mundial
                        ? 6
                        : 5
                    }
                    texto="Carregando..."
                  />
                ) : pesquisas.length ===
                  0 ? (
                  <Vazia
                    colSpan={
                      mundial
                        ? 6
                        : 5
                    }
                    texto="Nenhuma aplicação encontrada."
                  />
                ) : (
                  pesquisas.map(
                    pesquisa => (
                      <tr
                        key={
                          pesquisa.id
                        }
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-4 font-bold text-slate-900">
                          {
                            pesquisa.titulo
                          }
                        </td>
                        {mundial && (
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {
                              pesquisa.cliente
                                ?.nome
                            }
                          </td>
                        )}
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {
                            pesquisa.modelo
                              ?.titulo
                          }
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-700">
                          {
                            pesquisa.totalRespostas
                          }
                        </td>
                        <td className="px-4 py-4">
                          <Status
                            valor={
                              pesquisa.status
                            }
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`${baseHrefEfetivo}/${pesquisa.id}`}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700"
                          >
                            Abrir
                          </Link>
                          <Link
                            href={`${baseHrefEfetivo}/${pesquisa.id}/relatorio`}
                            className="ml-4 text-sm font-bold text-slate-700 hover:text-slate-900"
                          >
                            Relatório
                          </Link>
                          {mundial && (
                            <button
                              type="button"
                              disabled={
                                processando
                              }
                              onClick={() =>
                                void excluirAtual(
                                  pesquisa.id
                                )
                              }
                              className="ml-4 text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              Excluir
                            </button>
                          )}
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
  /* =======================================================
   * NOVA
   * ===================================================== */
  if (
    modo ===
    "nova"
  ) {
    if (
      !mundial
    ) {
      return (
        <main className="min-h-screen bg-slate-100">
          <Header
            modulo={
              tituloModulo
            }
            titulo="Acesso restrito"
            descricao="A criação de aplicações é realizada pela Mundial RH."
          >
            <Link
              href={
                baseHrefEfetivo
              }
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              Voltar
            </Link>
          </Header>
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-slate-100">
        <Header
          modulo={
            tituloModulo
          }
          titulo="Nova aplicação"
          descricao="Selecione cliente, gestor responsável e modelo de questionário."
        >
          <Link
            href={
                baseHrefEfetivo
              }
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
          >
            Voltar
          </Link>
        </Header>
        <section className="mx-auto max-w-3xl px-4 py-6">
          <form
            onSubmit={
              enviar
            }
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <Erro
              mensagem={
                erro
              }
            />
            <Campo
              label="Título"
              value={
                titulo
              }
              onChange={
                setTitulo
              }
            />
            <Select
              label="Cliente"
              value={
                clienteId
              }
              onChange={
                alterarCliente
              }
              required
            >
              <option value="">
                Selecione
              </option>
              {dadosFormulario.clientes.map(
                (
                  cliente: any
                ) => (
                  <option
                    key={
                      cliente.id
                    }
                    value={
                      cliente.id
                    }
                  >
                    {
                      cliente.nome
                    }
                  </option>
                )
              )}
            </Select>
            {ehAvaliacaoDesempenho && (
              <>
                <Select
                  label="Gestor responsável"
                  value={
                    gestorUsuarioId
                  }
                  onChange={
                    setGestorUsuarioId
                  }
                  required
                  disabled={
                    !clienteId
                  }
                >
                  <option value="">
                    Selecione o gestor
                  </option>
                  {gestoresCliente.map(
                    (
                      gestor: any
                    ) => (
                      <option
                        key={
                          gestor.id
                        }
                        value={
                          gestor.id
                        }
                      >
                        {gestor.nome}
                        {gestor.email
                          ? ` - ${gestor.email}`
                          : ""}
                      </option>
                    )
                  )}
                </Select>
                {clienteId &&
                  gestoresCliente.length ===
                    0 && (
                    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                      Este cliente ainda não possui gestores ativos cadastrados. O cliente deve cadastrar o gestor na página “Gestores” do próprio painel antes da criação da avaliação.
                    </div>
                  )}
              </>
            )}
            <Select
              label="Modelo"
              value={
                modeloId
              }
              onChange={
                setModeloId
              }
            >
              <option value="">
                Selecione
              </option>
              {dadosFormulario.modelos.map(
                (
                  modelo: any
                ) => (
                  <option
                    key={
                      modelo.id
                    }
                    value={
                      modelo.id
                    }
                  >
                    {
                      modelo.titulo
                    }{" "}
                    (
                    {
                      modelo.perguntas
                        ?.length ||
                      0
                    }{" "}
                    perguntas)
                  </option>
                )
              )}
            </Select>
            <Area
              label="Descrição"
              value={
                descricao
              }
              onChange={
                setDescricao
              }
            />
            {dadosFormulario.modelos.length ===
              0 &&
              !carregando && (
                <div className="mb-5 rounded-2xl bg-yellow-50 p-4 text-sm font-bold text-yellow-800">
                  Não há modelos ativos deste tipo. Crie um no Construtor de
                  Modelos.
                </div>
              )}
            <button
              type="submit"
              disabled={
                processando ||
                !titulo ||
                !clienteId ||
                !modeloId ||
                (
                  ehAvaliacaoDesempenho &&
                  !gestorUsuarioId
                )
              }
              className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {processando
                ? "Gerando..."
                : "Gerar aplicação"}
            </button>
          </form>
        </section>
      </main>
    );
  }
  /* =======================================================
   * DETALHE
   * ===================================================== */
  if (
    modo ===
    "detalhe"
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Header
          modulo={
            tituloModulo
          }
          titulo={
            pesquisaSelecionada
              ?.titulo ||
            "Carregando..."
          }
          descricao={
            pesquisaSelecionada
              ? mundial
                ? `${pesquisaSelecionada.cliente?.nome || ""} · ${pesquisaSelecionada.modelo?.titulo || ""}`
                : pesquisaSelecionada.modelo?.titulo ||
                  tituloModulo
              : "Carregando aplicação..."
          }
        >
          <Link
            href={
                baseHrefEfetivo
              }
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
          >
            Voltar
          </Link>
        </Header>
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Erro
            mensagem={
              erro
            }
          />
          {!pesquisaSelecionada ? (
            <div className="rounded-3xl bg-white p-10 text-center lg:col-span-2">
              {carregando
                ? "Carregando..."
                : "Aplicação não encontrada."}
            </div>
          ) : (
            <>
              <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-lg font-black text-slate-900">
                  {mundial
                    ? "Painel"
                    : "Resumo"}
                </h2>
                <>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Link público
                  </p>
                  <div className="mb-4 break-all rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                    {linkPublico || "Link público não disponível."}
                  </div>
                  {linkPublico && (
                    <a
                      href={linkPublico}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-3 block rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white"
                    >
                      Abrir questionário
                    </a>
                  )}
                </>
                <Link
                  href={`${baseHrefEfetivo}/${pesquisaSelecionada.id}/relatorio`}
                  className="mb-5 block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Ver relatório
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <Info
                    titulo="Respostas"
                    valor={String(
                      pesquisaSelecionada.totalRespostas ||
                        0
                    )}
                  />
                  <Info
                    titulo="Perguntas"
                    valor={String(
                      pesquisaSelecionada.perguntas
                        ?.length ||
                        0
                    )}
                  />
                  {ehAvaliacaoDesempenho && (
                    <>
                      <Info
                        titulo="Gestor"
                        valor={
                          pesquisaSelecionada.gestor?.nome ||
                          "Não informado"
                        }
                      />
                    </>
                  )}
                  {!mundial && (
                    <Info
                      titulo="Status"
                      valor={
                        pesquisaSelecionada.status
                      }
                    />
                  )}
                </div>
                {mundial && (
                  <button
                    type="button"
                    disabled={
                      processando
                    }
                    onClick={() =>
                      void alternarStatus()
                    }
                    className="mt-5 min-h-12 w-full rounded-2xl bg-slate-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {pesquisaSelecionada.status ===
                    STATUS.ABERTA
                      ? "Fechar aplicação"
                      : "Reabrir aplicação"}
                  </button>
                )}
              </aside>
              <div className="min-w-0 space-y-6">
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                      Participação
                    </p>
                    <h2 className="mt-1 text-lg font-black text-slate-900">
                      Acesso público ao questionário
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {ehGestaoRiscosPsicossociais
                        ? "As respostas podem ser coletadas pelo link público ou em formulários impressos posteriormente digitalizados pela Mundial."
                        : "Todas as respostas são realizadas pelo link público. Compartilhe o endereço ou projete o QR Code no telão para que os participantes acessem pelo celular."}
                    </p>
                  </div>
                  <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Link público
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                      {linkPublico || "Link público não disponível."}
                    </p>
                  </div>
                  {linkPublico && (
                    <QrCodePublico
                      link={linkPublico}
                      titulo={`QR Code — ${tituloModulo}`}
                      descricao="Projete este QR Code no telão para que os participantes acessem o questionário."
                    />
                  )}
                </div>
                {mundial &&
                  ehGestaoRiscosPsicossociais && (
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="mb-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                        Respostas impressas
                      </p>
                      <h2 className="mt-1 text-lg font-black text-slate-900">
                        Importação em massa por Excel
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Use quando a organização responder a Gestão de Riscos Psicossociais em formulários impressos. Baixe o modelo desta aplicação, digite uma resposta por linha e importe o arquivo preenchido.
                      </p>
                    </div>
                    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                      <strong>Governança e anonimato:</strong>{" "}
                      a planilha não solicita nome nem e-mail. Setor e unidade são opcionais. A importação só é permitida enquanto a aplicação estiver aberta.
                    </div>
                    {mensagemImportacao && (
                      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        {mensagemImportacao}
                      </div>
                    )}
                    {erroImportacao && (
                      <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {erroImportacao}
                      </div>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <a
                        href={`/api/pesquisas/${pesquisaSelecionada.id}/modelo-importacao`}
                        className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        Baixar modelo Excel
                      </a>
                      <button
                        type="button"
                        disabled={
                          importandoRespostas ||
                          pesquisaSelecionada.status !==
                            STATUS.ABERTA
                        }
                        onClick={() =>
                          arquivoImportacaoRef.current?.click()
                        }
                        className="min-h-12 flex-1 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {importandoRespostas
                          ? "Importando..."
                          : "Importar planilha"}
                      </button>
                      <input
                        ref={
                          arquivoImportacaoRef
                        }
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="hidden"
                        onChange={event =>
                          void importarRespostasImpressas(
                            event
                          )
                        }
                      />
                    </div>
                    {pesquisaSelecionada.status !==
                      STATUS.ABERTA && (
                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        Reabra a aplicação para importar novas respostas.
                      </p>
                    )}
                  </div>
                )}
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h2 className="mb-4 text-lg font-black text-slate-900">
                    Perguntas
                  </h2>
                  <div className="space-y-3">
                    {pesquisaSelecionada.perguntas
                      ?.length >
                    0 ? (
                      pesquisaSelecionada.perguntas.map(
                        (
                          pergunta: any
                        ) => (
                          <div
                            key={
                              pergunta.id
                            }
                            className="rounded-2xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold text-slate-400">
                                Pergunta{" "}
                                {
                                  pergunta.ordem
                                }{" "}
                                ·{" "}
                                {
                                  pergunta.tipo
                                }
                              </p>
                              {ehGestaoRiscosPsicossociais &&
                                pergunta.tipo ===
                                  "NOTA" && (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                  Peso{" "}
                                  {
                                    Number(
                                      pergunta.peso ??
                                        1
                                    )
                                  }
                                </span>
                              )}
                            </div>
                            <p className="mt-1 font-bold text-slate-900">
                              {
                                pergunta.titulo
                              }
                            </p>
                            {pergunta.descricao && (
                              <p className="mt-2 text-sm text-slate-500">
                                {
                                  pergunta.descricao
                                }
                              </p>
                            )}
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-sm text-slate-500">
                        Nenhuma pergunta encontrada.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    );
  }
  /* =======================================================
   * RELATÓRIO INDIVIDUAL
   * ===================================================== */
  /*
   * Avaliação de Desempenho no painel do cliente/gestor:
   * mostra o conteúdo individual de cada questionário.
   *
   * O backend já garante que CLIENTE veja apenas dados
   * da própria organização e GESTOR_CLIENTE somente as
   * aplicações atribuídas ao seu usuário.
   */
  if (
    !mundial &&
    tipo ===
      TipoModuloPesquisa.AVALIACAO_DESEMPENHO
  ) {
    return (
      <RelatorioDesempenhoIndividualCliente
        relatorio={
          relatorio
        }
        carregando={
          carregando
        }
        erro={
          erro
        }
        tituloModulo={
          tituloModulo
        }
        baseHref={
          baseHrefEfetivo
        }
        pesquisaId={
          pesquisaId
        }
      />
    );
  }
  /*
   * No painel do cliente, a Gestão de Riscos Psicossociais
   * não mostra o conteúdo das respostas.
   *
   * O cliente visualiza somente o percentual de
   * respondentes que preencheu cada pergunta.
   *
   * A Mundial continua usando o relatório completo.
   */
  if (
    !mundial &&
    tipo ===
      TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
  ) {
    return (
      <RelatorioClienteSomentePercentual
        relatorio={
          relatorio
        }
        carregando={
          carregando
        }
        erro={
          erro
        }
        tituloModulo={
          tituloModulo
        }
        baseHref={
          baseHrefEfetivo
        }
        pesquisaId={
          pesquisaId
        }
      />
    );
  }
  return (
    <RelatorioAplicacaoModuloTela
      relatorio={
        relatorio
      }
      carregando={
        carregando
      }
      erro={
        erro
      }
      tipo={
        tipo
      }
      tituloModulo={
        tituloModulo
      }
      baseHref={
          baseHrefEfetivo
        }
      pesquisaId={
        pesquisaId
      }
    />
  );
}
/* =========================================================
 * COMPONENTES AUXILIARES
 * ======================================================= */
function RelatorioDesempenhoIndividualCliente({
  relatorio,
  carregando,
  erro,
  tituloModulo,
  baseHref,
  pesquisaId,
}: {
  relatorio: any;
  carregando: boolean;
  erro?: string | null;
  tituloModulo: string;
  baseHref: string;
  pesquisaId?: string;
}) {
  const respostasIndividuais =
    Array.isArray(
      relatorio?.respostasIndividuais
    )
      ? relatorio.respostasIndividuais
      : [];
  return (
    <main className="min-h-screen bg-slate-100">
      <Header
        modulo={
          tituloModulo
        }
        titulo="Relatório individual"
        descricao={
          relatorio
            ? `${relatorio.titulo} · respostas individuais da Avaliação de Desempenho`
            : "Respostas individuais da Avaliação de Desempenho."
        }
      >
        <Link
          href={
            pesquisaId
              ? `${baseHref}/${pesquisaId}`
              : baseHref
          }
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Voltar
        </Link>
      </Header>
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Erro
          mensagem={
            erro
          }
        />
        {carregando ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Carregando relatório...
          </div>
        ) : !relatorio ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Relatório não encontrado.
          </div>
        ) : respostasIndividuais.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-black text-slate-900">
              Nenhuma avaliação respondida
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Assim que uma resposta for enviada, os dados do colaborador e as respostas do questionário aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card
                titulo="Avaliações respondidas"
                valor={
                  respostasIndividuais.length
                }
              />
              <Card
                titulo="Perguntas"
                valor={
                  Array.isArray(
                    relatorio?.perguntas
                  )
                    ? relatorio.perguntas.length
                    : 0
                }
              />
            </div>
            {respostasIndividuais.map(
              (
                avaliacao: any,
                index: number
              ) => (
                <article
                  key={
                    avaliacao.id ||
                    `avaliacao-${index}`
                  }
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
                >
                  <div className="border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                          Avaliação {index + 1}
                        </p>
                        <h2 className="mt-1 text-xl font-black text-slate-900">
                          {
                            avaliacao.nome ||
                            "Colaborador não informado"
                          }
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Respostas registradas no questionário de desempenho.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
                        <span className="font-semibold text-slate-500">
                          Respondido em:
                        </span>{" "}
                        <strong className="text-slate-900">
                          {
                            formatarDataRelatorioDesempenho(
                              avaliacao.criadoEm
                            )
                          }
                        </strong>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <InfoAvaliacaoDesempenho
                        label="Colaborador"
                        valor={
                          avaliacao.nome
                        }
                      />
                      <InfoAvaliacaoDesempenho
                        label="Setor"
                        valor={
                          avaliacao.setor
                        }
                      />
                      <InfoAvaliacaoDesempenho
                        label="Cargo"
                        valor={
                          avaliacao.cargo
                        }
                      />
                      <InfoAvaliacaoDesempenho
                        label="Gestor responsável"
                        valor={
                          avaliacao.nomeGestor
                        }
                      />
                      <InfoAvaliacaoDesempenho
                        label="Data da avaliação"
                        valor={
                          formatarDataRelatorioDesempenho(
                            avaliacao.dataAvaliacao
                          )
                        }
                      />
                      <InfoAvaliacaoDesempenho
                        label="Data de admissão"
                        valor={
                          formatarDataRelatorioDesempenho(
                            avaliacao.dataAdmissao
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="mb-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                        Questionário respondido
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-900">
                        Perguntas e respostas
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Conteúdo original informado nesta avaliação.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {Array.isArray(
                        avaliacao.respostas
                      ) &&
                      avaliacao.respostas.length >
                        0 ? (
                        avaliacao.respostas.map(
                          (
                            resposta: any,
                            respostaIndex: number
                          ) => (
                            <div
                              key={
                                resposta.perguntaId ||
                                `resposta-${respostaIndex}`
                              }
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                                  Pergunta{" "}
                                  {
                                    resposta.ordem ??
                                    respostaIndex + 1
                                  }
                                </span>
                                {resposta.dimensao?.nome && (
                                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                                    {
                                      resposta.dimensao.nome
                                    }
                                  </span>
                                )}
                              </div>
                              <h4 className="mt-2 font-black leading-6 text-slate-900">
                                {
                                  resposta.titulo ||
                                  "Pergunta"
                                }
                              </h4>
                              {resposta.descricao && (
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  {
                                    resposta.descricao
                                  }
                                </p>
                              )}
                              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                  Resposta
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">
                                  {
                                    formatarRespostaDesempenho(
                                      resposta.tipo,
                                      resposta.valor
                                    )
                                  }
                                </p>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                          Nenhuma resposta encontrada neste questionário.
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}
function InfoAvaliacaoDesempenho({
  label,
  valor,
}: {
  label: string;
  valor?: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">
        {valor || "—"}
      </p>
    </div>
  );
}
function formatarDataRelatorioDesempenho(
  valor?: string | Date | null
) {
  if (!valor) {
    return "—";
  }
  if (
    typeof valor ===
    "string"
  ) {
    const dataBanco =
      valor.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/
      );
    if (dataBanco) {
      const [
        ,
        ano,
        mes,
        dia,
      ] =
        dataBanco;
      return `${dia}/${mes}/${ano}`;
    }
  }
  const data =
    valor instanceof Date
      ? valor
      : new Date(valor);
  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "—";
  }
  return data.toLocaleDateString(
    "pt-BR"
  );
}
function formatarRespostaDesempenho(
  tipo?: string | null,
  valor?: string | number | null
) {
  if (
    valor ===
      null ||
    valor ===
      undefined ||
    String(valor).trim() ===
      ""
  ) {
    return "Não respondido";
  }
  const texto =
    String(valor).trim();
  if (
    tipo ===
    "NOTA"
  ) {
    const rotulos: Record<
      string,
      string
    > = {
      "1":
        "Muito abaixo do esperado",
      "2":
        "Abaixo do esperado",
      "3":
        "Dentro do esperado",
      "4":
        "Acima do esperado",
      "5":
        "Muito acima do esperado",
    };
    return rotulos[texto]
      ? `${texto} — ${rotulos[texto]}`
      : texto;
  }
  return texto;
}
function RelatorioClienteSomentePercentual({
  relatorio,
  carregando,
  erro,
  tituloModulo,
  baseHref,
  pesquisaId,
}: {
  relatorio: any;
  carregando: boolean;
  erro?: string | null;
  tituloModulo: string;
  baseHref: string;
  pesquisaId?: string;
}) {
  const totalRespondentes =
    Number(
      relatorio?.totalRespondentes ??
      relatorio?.totalRespostas ??
      relatorio?.respostas?.length ??
      0
    ) ||
    0;
  const perguntasComResumo =
    Array.isArray(
      relatorio?.perguntasComResumo
    )
      ? relatorio.perguntasComResumo
      : [];
  const perguntas =
    Array.isArray(
      relatorio?.perguntas
    )
      ? relatorio.perguntas
      : [];
  const percentuais =
    perguntasComResumo.map(
      (
        item: any
      ) =>
        calcularPercentualRespondentesCliente(
          Number(
            item?.totalRespostas ??
            0
          ),
          totalRespondentes
        )
    );
  const preenchimentoMedio =
    percentuais.length >
    0
      ? percentuais.reduce(
          (
            total: number,
            valor: number
          ) =>
            total +
            valor,
          0
        ) /
        percentuais.length
      : 0;
  return (
    <main className="min-h-screen bg-slate-100">
      <Header
        modulo={
          tituloModulo
        }
        titulo="Relatório de participação"
        descricao="Visualização restrita do painel do cliente. O conteúdo das respostas não é exibido."
      >
        <Link
          href={
            pesquisaId
              ? `${baseHref}/${pesquisaId}`
              : baseHref
          }
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Voltar
        </Link>
      </Header>
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Erro
          mensagem={
            erro
          }
        />
        {carregando ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Carregando relatório...
          </div>
        ) : !relatorio ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Relatório não encontrado.
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
              <strong>
                Privacidade das respostas:
              </strong>{" "}
              neste painel são exibidos somente indicadores de participação.
              As respostas dadas pelos participantes, médias, scores e
              distribuições das alternativas não são mostrados ao cliente.
            </div>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card
                titulo="Respondentes"
                valor={
                  totalRespondentes
                }
              />
              <Card
                titulo="Perguntas"
                valor={
                  perguntas.length ||
                  perguntasComResumo.length
                }
              />
              <Card
                titulo="Preenchimento médio"
                valor={
                  formatarPercentualCliente(
                    preenchimentoMedio
                  )
                }
              />
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-black text-slate-900">
                  Percentual de respondentes por pergunta
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  O percentual indica quantos respondentes preencheram cada
                  pergunta em relação ao total de participantes que enviaram
                  o questionário.
                </p>
              </div>
              {perguntasComResumo.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Ainda não existem dados de participação por pergunta.
                </div>
              ) : (
                <div className="space-y-4">
                  {perguntasComResumo.map(
                    (
                      item: any,
                      index: number
                    ) => {
                      const percentual =
                        calcularPercentualRespondentesCliente(
                          Number(
                            item?.totalRespostas ??
                            0
                          ),
                          totalRespondentes
                        );
                      return (
                        <div
                          key={
                            item?.pergunta?.id ??
                            `pergunta-${index}`
                          }
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Pergunta{" "}
                                {
                                  item?.pergunta?.ordem ??
                                  index +
                                    1
                                }
                              </p>
                              <h3 className="mt-1 font-bold text-slate-900">
                                {
                                  item?.pergunta?.titulo ??
                                  "Pergunta"
                                }
                              </h3>
                            </div>
                            <strong className="shrink-0 text-xl text-blue-700">
                              {
                                formatarPercentualCliente(
                                  percentual
                                )
                              }
                            </strong>
                          </div>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width: `${limitarPercentualCliente(
                                  percentual
                                )}%`,
                              }}
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            Percentual de respondentes que preencheram esta pergunta.
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
function calcularPercentualRespondentesCliente(
  totalPergunta: number,
  totalRespondentes: number
) {
  if (
    totalRespondentes <=
    0
  ) {
    return 0;
  }
  return limitarPercentualCliente(
    (
      totalPergunta /
      totalRespondentes
    ) *
      100
  );
}
function limitarPercentualCliente(
  valor: number
) {
  if (
    !Number.isFinite(
      valor
    )
  ) {
    return 0;
  }
  return Math.min(
    100,
    Math.max(
      0,
      valor
    )
  );
}
function formatarPercentualCliente(
  valor: number
) {
  const normalizado =
    limitarPercentualCliente(
      valor
    );
  return `${normalizado
    .toFixed(
      1
    )
    .replace(
      ".",
      ","
    )}%`;
}
function Header({
  modulo,
  titulo,
  descricao,
  children,
}: {
  modulo: string;
  titulo: string;
  descricao: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            {
              modulo
            }
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">
            {
              titulo
            }
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {
              descricao
            }
          </p>
        </div>
        {children && (
          <div className="flex flex-wrap gap-3">
            {
              children
            }
          </div>
        )}
      </div>
    </header>
  );
}
function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor:
    | string
    | number;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-bold text-slate-500">
        {
          titulo
        }
      </p>
      <p className="mt-2 text-3xl font-black text-slate-900">
        {
          valor
        }
      </p>
    </div>
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
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">
        {
          titulo
        }
      </p>
      <p className="mt-1 break-words font-black text-slate-900">
        {
          valor
        }
      </p>
    </div>
  );
}
function Status({
  valor,
}: {
  valor: string;
}) {
  const classe =
    valor ===
    STATUS.ABERTA
      ? "bg-green-100 text-green-700"
      : valor ===
          STATUS.FECHADA
        ? "bg-slate-200 text-slate-700"
        : "bg-yellow-100 text-yellow-700";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${classe}`}
    >
      {
        valor
      }
    </span>
  );
}
function Erro({
  mensagem,
}: {
  mensagem?: string | null;
}) {
  if (
    !mensagem
  ) {
    return null;
  }
  return (
    <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {
        mensagem
      }
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
      className={`px-4 py-4 text-left text-sm font-bold text-slate-600 ${
        direita
          ? "text-right"
          : ""
      }`}
    >
      {
        children
      }
    </th>
  );
}
function Vazia({
  colSpan,
  texto,
}: {
  colSpan: number;
  texto: string;
}) {
  return (
    <tr>
      <td
        colSpan={
          colSpan
        }
        className="px-6 py-12 text-center text-sm text-slate-500"
      >
        {
          texto
        }
      </td>
    </tr>
  );
}
function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    valor: string
  ) => void;
}) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {
          label
        }
      </span>
      <input
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={
          inputClass
        }
      />
    </label>
  );
}
function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    valor: string
  ) => void;
}) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {
          label
        }
      </span>
      <textarea
        rows={
          4
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={
          inputClass
        }
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  children,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    valor: string
  ) => void;
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {
          label
        }
      </span>
      <select
        value={
          value
        }
        required={
          required
        }
        disabled={
          disabled
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
      >
        {
          children
        }
      </select>
    </label>
  );
}
