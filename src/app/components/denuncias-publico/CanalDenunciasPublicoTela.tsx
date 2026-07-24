"use client";

import type { FormEvent, ReactNode } from "react";

import { useState } from "react";

import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";

import CampoAnexos from "@/src/app/components/denuncias/CampoAnexos";

import type {
  PerguntaCanalPublica,
  RespostaPerguntaCanalInput,
} from "@/src/core/model/PerguntaCanalDenuncia";

type CategoriaDisponivel = {
  id: string;
  nome: string;
  descricao?: string | null;
};

type Props = {
  clienteId: string;
  categorias: CategoriaDisponivel[];
  perguntasPersonalizadas?: PerguntaCanalPublica[];
};

const VERSAO_TERMOS = "2026-07-01";

export default function CanalDenunciasPublicoTela({
  clienteId,
  categorias,
  perguntasPersonalizadas = [],
}: Props) {
  const { criarDenunciaPublica, enviarAnexos, processando, erro } =
    useDenuncias(false);

  const [leuOrientacoes, setLeuOrientacoes] = useState(false);

  const [orientacoesConfirmadas, setOrientacoesConfirmadas] = useState(false);

  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [modalAberto, setModalAberto] = useState<
    "TERMOS" | "PRIVACIDADE" | null
  >(null);

  const [anonima, setAnonima] = useState(false);

  const [telefoneDenunciante, setTelefoneDenunciante] =
    useState("");

  const [categoriaId, setCategoriaId] = useState("");

  const [protocolo, setProtocolo] = useState<string | null>(null);

  const [protocoloCopiado, setProtocoloCopiado] = useState(false);

  const [arquivos, setArquivos] = useState<File[]>([]);

  const [enviandoArquivos, setEnviandoArquivos] = useState(false);

  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const enviando = processando || enviandoArquivos;

  const hojeParaInput = (() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(
      hoje.getMonth() + 1
    ).padStart(2, "0");
    const dia = String(
      hoje.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  })();

  function formatarTelefone(
    valor: string
  ): string {
    const digitos = valor
      .replace(/\D/g, "")
      .slice(0, 11);

    if (digitos.length <= 2) {
      return digitos
        ? `(${digitos}`
        : "";
    }

    if (digitos.length <= 6) {
      return `(${digitos.slice(
        0,
        2
      )}) ${digitos.slice(2)}`;
    }

    if (digitos.length <= 10) {
      return `(${digitos.slice(
        0,
        2
      )}) ${digitos.slice(
        2,
        6
      )}-${digitos.slice(6)}`;
    }

    return `(${digitos.slice(
      0,
      2
    )}) ${digitos.slice(
      2,
      7
    )}-${digitos.slice(7)}`;
  }

  function normalizarTelefone(
    valor: string
  ): string | null {
    const digitos =
      valor.replace(/\D/g, "");

    return digitos || null;
  }

  function montarRespostasPersonalizadas(
    formData: FormData,
  ): RespostaPerguntaCanalInput[] {
    return perguntasPersonalizadas.map((pergunta) => {
      const valor = formData.get(`pergunta_${pergunta.id}`);

      if (pergunta.tipo === "SIM_NAO") {
        return {
          perguntaId: pergunta.id,
          resposta: valor === "SIM" ? true : valor === "NAO" ? false : null,
        };
      }

      return {
        perguntaId: pergunta.id,
        resposta: typeof valor === "string" ? valor.trim() || null : null,
      };
    });
  }

  function validarRespostasPersonalizadas(
    respostas: RespostaPerguntaCanalInput[],
  ) {
    const mapaRespostas = new Map(
      respostas.map((item) => [item.perguntaId, item.resposta]),
    );

    for (const pergunta of perguntasPersonalizadas) {
      if (!pergunta.obrigatoria) {
        continue;
      }

      const resposta = mapaRespostas.get(pergunta.id);

      const respostaVazia =
        resposta === null ||
        resposta === undefined ||
        (typeof resposta === "string" && !resposta.trim());

      if (respostaVazia) {
        throw new Error(
          `Responda à pergunta obrigatória: ${pergunta.enunciado}`,
        );
      }
    }
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) {
      return;
    }

    if (!categoriaId) {
      setErroLocal("Selecione a categoria da denúncia.");

      return;
    }

    if (!aceitouTermos) {
      setErroLocal(
        "É necessário aceitar os Termos de Uso e o Aviso de Privacidade.",
      );

      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const dataOcorrido = String(
      formData.get("dataOcorrido") || ""
    ).trim();

    if (
      dataOcorrido &&
      dataOcorrido > hojeParaInput
    ) {
      setErroLocal(
        "A data do ocorrido não pode ser futura."
      );

      return;
    }

    const telefoneNormalizado =
      normalizarTelefone(
        telefoneDenunciante
      );

    if (
      !anonima &&
      telefoneNormalizado &&
      telefoneNormalizado.length !== 10 &&
      telefoneNormalizado.length !== 11
    ) {
      setErroLocal(
        "Informe um telefone válido com DDD."
      );

      return;
    }

    setErroLocal(null);

    try {
      const respostasPersonalizadas = montarRespostasPersonalizadas(formData);

      validarRespostasPersonalizadas(respostasPersonalizadas);

      const resultado = await criarDenunciaPublica({
        clienteId,

        titulo:
          categorias.find(
            (categoria) =>
              categoria.id === categoriaId
          )?.nome || "Denúncia",

        descricao: String(formData.get("descricao") || "").trim(),

        categoriaId,

        localOcorrido:
          String(formData.get("localOcorrido") || "").trim() || null,

        dataOcorrido:
          dataOcorrido || null,

        anonima,

        nomeDenunciante: anonima
          ? null
          : String(formData.get("nomeDenunciante") || "").trim() || null,

        emailDenunciante: anonima
          ? null
          : String(formData.get("emailDenunciante") || "").trim() || null,

        telefoneDenunciante: anonima
          ? null
          : telefoneNormalizado,

        respostasPersonalizadas,

        aceitouTermos,

        versaoTermosAceitos: VERSAO_TERMOS,
      });

      if (arquivos.length > 0) {
        setEnviandoArquivos(true);

        try {
          await enviarAnexos(
            {
              id: resultado.id,
              protocolo: resultado.protocolo,
            },
            arquivos,
          );
        } catch (error) {
          setErroLocal(
            error instanceof Error
              ? `A denúncia foi registrada com o protocolo ${resultado.protocolo}, mas houve erro no envio dos anexos: ${error.message}`
              : `A denúncia foi registrada com o protocolo ${resultado.protocolo}, mas houve erro no envio dos anexos.`,
          );

          setProtocolo(resultado.protocolo);

          return;
        } finally {
          setEnviandoArquivos(false);
        }
      }

      setProtocolo(resultado.protocolo);
      setArquivos([]);
      setCategoriaId("");
      setAceitouTermos(false);

      form.reset();

      setAnonima(false);
      setTelefoneDenunciante("");
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a denúncia.",
      );
    }
  }

  async function copiarProtocolo() {
    if (!protocolo) {
      return;
    }

    try {
      await navigator.clipboard.writeText(protocolo);
      setProtocoloCopiado(true);

      window.setTimeout(() => {
        setProtocoloCopiado(false);
      }, 2500);
    } catch {
      setErroLocal("Não foi possível copiar o protocolo automaticamente.");
    }
  }

  function reiniciarFormulario() {
    setProtocolo(null);
    setErroLocal(null);
    setOrientacoesConfirmadas(false);
    setLeuOrientacoes(false);
    setAceitouTermos(false);
    setModalAberto(null);
    setCategoriaId("");
    setArquivos([]);
    setAnonima(false);
    setTelefoneDenunciante("");
    setProtocoloCopiado(false);
  }

  if (!orientacoesConfirmadas) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
        <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Antes de continuar
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Entenda o Canal de Denúncias
          </h1>

          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              O Canal de Denúncias é um ambiente seguro destinado ao relato de
              comportamentos, práticas ou situações que possam violar normas
              internas, princípios éticos, direitos, legislações ou comprometer
              a integridade das pessoas e da organização.
            </p>

            <p>
              Utilize este canal com responsabilidade, fornecendo informações
              verdadeiras e, sempre que possível, detalhes que permitam a
              análise adequada do ocorrido.
            </p>

            <p>
              A denúncia poderá ser realizada de forma anônima. Quando houver
              identificação, os dados pessoais serão tratados de maneira
              restrita e conforme a legislação aplicável.
            </p>

            <p>
              Os documentos e imagens poderão ser disponibilizados ao comitê
              responsável pela apuração. Áudios e vídeos permanecerão restritos
              à equipe da Mundial.
            </p>

            <p>
              Não utilize este canal para solicitações administrativas, dúvidas
              operacionais, reclamações comerciais ou emergências. Em caso de
              risco imediato à integridade física de alguém, procure os serviços
              públicos de emergência.
            </p>

            <p>
              O uso consciente deste canal contribui para uma apuração
              responsável, imparcial e protegida contra retaliações.
            </p>
          </div>

          <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={leuOrientacoes}
              onChange={(event) => setLeuOrientacoes(event.target.checked)}
              className="mt-1"
            />

            <span>
              Declaro que li e compreendi as orientações para utilização do
              Canal de Denúncias.
            </span>
          </label>

          <button
            type="button"
            disabled={!leuOrientacoes}
            onClick={() => setOrientacoesConfirmadas(true)}
            className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prosseguir para a denúncia
          </button>
        </section>
      </main>
    );
  }

  if (protocolo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
            ✓
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Denúncia registrada
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Guarde este protocolo para acompanhar o andamento.
          </p>

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-100 p-3 sm:p-4">
            <span className="min-w-0 flex-1 break-all text-xl font-bold text-blue-700 sm:text-2xl">
              {protocolo}
            </span>

            <button
              type="button"
              onClick={copiarProtocolo}
              aria-label="Copiar protocolo"
              title="Copiar protocolo"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>

              {protocoloCopiado ? "Copiado" : "Copiar"}
            </button>
          </div>

          <button
            type="button"
            onClick={reiniciarFormulario}
            className="mt-6 w-full rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Registrar nova denúncia
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Canal seguro
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Canal de denúncias
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Registre sua denúncia com o máximo de informações relevantes. Você
            pode se identificar ou permanecer anônimo.
          </p>
        </div>

        <p className="mb-5 text-xs font-medium text-slate-500">
          <span className="font-bold text-red-600">*</span> Campos obrigatórios
        </p>

        {(erro || erroLocal) && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {erroLocal || erro}
          </div>
        )}

        <form onSubmit={enviar} className="space-y-5">
          <Card
            titulo="Identificação"
            descricao="Você pode optar por não informar seus dados pessoais."
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={anonima}
                disabled={enviando}
                onChange={(event) => setAnonima(event.target.checked)}
              />
              Quero realizar a denúncia de forma anônima
            </label>

            {!anonima && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Campo
                  name="nomeDenunciante"
                  label="Nome"
                  disabled={enviando}
                />

                <Campo
                  name="emailDenunciante"
                  label="E-mail"
                  type="email"
                  disabled={enviando}
                />

                <div>
                  <label
                    htmlFor="telefoneDenunciante"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Telefone
                  </label>

                  <input
                    id="telefoneDenunciante"
                    name="telefoneDenunciante"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={telefoneDenunciante}
                    disabled={enviando}
                    maxLength={15}
                    placeholder="(00) 00000-0000"
                    onChange={(event) =>
                      setTelefoneDenunciante(
                        formatarTelefone(
                          event.target.value
                        )
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>
              </div>
            )}
          </Card>

          <Card titulo="Dados da denúncia">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Categoria
                  <Obrigatorio />
                </label>

                <select
                  value={categoriaId}
                  required
                  disabled={enviando}
                  onChange={(event) => setCategoriaId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">Selecione a categoria</option>

                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              <Campo
                name="localOcorrido"
                label="Local do ocorrido"
                placeholder="Ex: Refeitório"
                disabled={enviando}
              />

              <div>
                <label
                  htmlFor="dataOcorrido"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Data do ocorrido
                </label>

                <input
                  id="dataOcorrido"
                  name="dataOcorrido"
                  type="date"
                  max={hojeParaInput}
                  disabled={enviando}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Descrição
                  <Obrigatorio />
                </label>

                <textarea
                  name="descricao"
                  required
                  rows={7}
                  disabled={enviando}
                  placeholder="Descreva o ocorrido, as pessoas envolvidas e outros detalhes relevantes."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <CampoAnexos
                  arquivos={arquivos}
                  onChange={setArquivos}
                  disabled={enviando}
                />
              </div>
            </div>
          </Card>

          {perguntasPersonalizadas.length > 0 && (
            <Card
              titulo="Informações complementares"
              descricao="Responda às perguntas adicionais configuradas para este canal."
            >
              <div className="grid gap-5">
                {perguntasPersonalizadas.map((pergunta) => (
                  <CampoPerguntaPersonalizada
                    key={pergunta.id}
                    pergunta={pergunta}
                    disabled={enviando}
                  />
                ))}
              </div>
            </Card>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <input
                id="aceitouTermos"
                type="checkbox"
                checked={aceitouTermos}
                disabled={enviando}
                onChange={(event) => setAceitouTermos(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-blue-600"
              />

              <div className="min-w-0">
                <label
                  htmlFor="aceitouTermos"
                  className="cursor-pointer text-sm leading-6 text-slate-700"
                >
                  Declaro que li e aceito os <Obrigatorio />
                </label>

                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => setModalAberto("TERMOS")}
                  className="text-sm font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Termos de Uso
                </button>

                <span className="text-sm leading-6 text-slate-700"> e o </span>

                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => setModalAberto("PRIVACIDADE")}
                  className="text-sm font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Aviso de Privacidade
                </button>

                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => setModalAberto("PRIVACIDADE")}
                  aria-label="Saiba como seus dados pessoais são tratados"
                  title="Saiba como seus dados pessoais são tratados"
                  className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 align-middle text-xs font-bold text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ?
                </button>

                <label
                  htmlFor="aceitouTermos"
                  className="cursor-pointer text-sm leading-6 text-slate-700"
                >
                  , e confirmo que as informações fornecidas são verdadeiras
                  segundo o meu conhecimento.
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <button
              type="submit"
              disabled={enviando || !aceitouTermos}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviandoArquivos
                ? "Enviando anexos..."
                : processando
                  ? "Registrando denúncia..."
                  : "Registrar denúncia"}
            </button>
          </div>
        </form>
      </section>

      {modalAberto === "TERMOS" && (
        <ModalDocumento
          titulo="Termos de Uso do Canal de Denúncias"
          subtitulo={`Versão ${VERSAO_TERMOS}`}
          onClose={() => setModalAberto(null)}
        >
          <TermosUsoConteudo />
        </ModalDocumento>
      )}

      {modalAberto === "PRIVACIDADE" && (
        <ModalDocumento
          titulo="Aviso de Privacidade"
          subtitulo={`Tratamento de dados pessoais — LGPD — versão ${VERSAO_TERMOS}`}
          onClose={() => setModalAberto(null)}
        >
          <AvisoPrivacidadeConteudo />
        </ModalDocumento>
      )}
    </main>
  );
}

function ModalDocumento({
  titulo,
  subtitulo,
  onClose,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-documento"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Canal de denúncias
            </p>

            <h2
              id="titulo-modal-documento"
              className="mt-1 text-xl font-black text-slate-900 sm:text-2xl"
            >
              {titulo}
            </h2>

            {subtitulo && (
              <p className="mt-1 text-xs text-slate-500">{subtitulo}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xl font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Li e compreendi
          </button>
        </footer>
      </div>
    </div>
  );
}

function TermosUsoConteudo() {
  return (
    <div className="space-y-5 text-sm leading-7 text-slate-700">
      <SecaoDocumento titulo="1. Finalidade do canal">
        <p>
          Este Canal de Denúncias é destinado ao relato, de boa-fé, de condutas,
          fatos ou situações que possam violar leis, normas internas, princípios
          éticos, direitos ou comprometer a integridade das pessoas e da
          organização.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="2. Uso responsável">
        <p>
          O usuário deve fornecer informações verdadeiras segundo o seu
          conhecimento e descrever os fatos com clareza, evitando acusações
          deliberadamente falsas, conteúdo ofensivo sem relação com a denúncia
          ou uso do canal para finalidades indevidas.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="3. Denúncia anônima ou identificada">
        <p>
          A denúncia pode ser realizada de forma anônima. Quando o usuário optar
          por se identificar, os dados serão tratados de forma restrita e
          utilizados somente nas atividades necessárias ao recebimento, análise,
          investigação e tratamento da denúncia.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="4. Apuração e encaminhamento">
        <p>
          O envio da denúncia não garante uma conclusão específica. Os fatos
          serão analisados conforme as informações disponíveis, as regras
          internas e a legislação aplicável.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="5. Anexos e evidências">
        <p>
          Documentos e imagens poderão ser disponibilizados à equipe responsável
          e ao comitê autorizado. Áudios e vídeos permanecerão restritos à
          equipe da Mundial.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="6. Protocolo e acompanhamento">
        <p>
          Após o envio, será gerado um protocolo. O usuário é responsável por
          guardá-lo para acompanhar o andamento.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="7. Emergências">
        <p>
          Este canal não substitui serviços públicos de emergência. Em situações
          de risco imediato à vida ou à integridade física, procure os órgãos
          públicos competentes.
        </p>
      </SecaoDocumento>
    </div>
  );
}

function AvisoPrivacidadeConteudo() {
  return (
    <div className="space-y-5 text-sm leading-7 text-slate-700">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
        <p className="font-semibold">
          Este aviso apresenta, de forma resumida, como os dados pessoais
          informados no Canal de Denúncias são tratados em conformidade com a
          Lei nº 13.709/2018 — LGPD.
        </p>
      </div>

      <SecaoDocumento titulo="1. Dados que podem ser tratados">
        <p>
          Quando a denúncia for identificada, poderão ser tratados nome, e-mail,
          telefone e outras informações pessoais fornecidas pelo denunciante. O
          conteúdo da denúncia e os anexos também podem conter dados pessoais de
          terceiros.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="2. Finalidades">
        <p>
          Os dados serão utilizados para receber, registrar, analisar,
          investigar, encaminhar, responder e manter o histórico da denúncia,
          bem como para cumprir obrigações legais e proteger direitos.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="3. Acesso restrito">
        <p>
          O acesso será limitado às pessoas autorizadas e necessárias para a
          gestão e apuração do caso, conforme seus perfis e responsabilidades.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="4. Compartilhamento">
        <p>
          Os dados poderão ser compartilhados com prestadores de serviços
          essenciais, profissionais autorizados, autoridades públicas ou
          terceiros quando houver fundamento legal.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="5. Segurança e confidencialidade">
        <p>
          São adotadas medidas técnicas e administrativas para reduzir riscos de
          acesso não autorizado, perda, alteração, divulgação ou tratamento
          inadequado.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="6. Conservação">
        <p>
          Os dados serão mantidos pelo período necessário para cumprir as
          finalidades do canal, atender obrigações legais, preservar evidências
          e exercer ou defender direitos.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="7. Denúncia anônima">
        <p>
          Quando a denúncia for anônima, não será exigido nome, e-mail ou
          telefone. O usuário deve evitar inserir informações que permitam sua
          identificação caso deseje preservar o anonimato.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="8. Direitos do titular">
        <p>
          Nos casos aplicáveis, o titular pode solicitar confirmação do
          tratamento, acesso, correção e outras medidas previstas na LGPD,
          observadas as limitações necessárias para preservar o sigilo da
          apuração e direitos de terceiros.
        </p>
      </SecaoDocumento>

      <SecaoDocumento titulo="9. Bases legais">
        <p>
          O tratamento poderá ocorrer com fundamento nas bases legais previstas
          na LGPD, incluindo cumprimento de obrigação legal, exercício regular
          de direitos, legítimo interesse e proteção da vida ou da integridade
          física.
        </p>
      </SecaoDocumento>
    </div>
  );
}

function SecaoDocumento({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="font-bold text-slate-900">{titulo}</h3>

      <div className="mt-1">{children}</div>
    </section>
  );
}

function Obrigatorio() {
  return (
    <span
      className="ml-1 text-red-600"
      aria-label="Campo obrigatório"
      title="Campo obrigatório"
    >
      *
    </span>
  );
}

function CampoPerguntaPersonalizada({
  pergunta,
  disabled,
}: {
  pergunta: PerguntaCanalPublica;
  disabled: boolean;
}) {
  const nomeCampo = `pergunta_${pergunta.id}`;

  return (
    <div>
      <label
        htmlFor={nomeCampo}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {pergunta.enunciado}

        {pergunta.obrigatoria && <Obrigatorio />}
      </label>

      {pergunta.descricao && (
        <p className="mb-2 text-xs leading-5 text-slate-500">
          {pergunta.descricao}
        </p>
      )}

      {pergunta.tipo === "TEXTO" && (
        <input
          id={nomeCampo}
          name={nomeCampo}
          required={pergunta.obrigatoria}
          disabled={disabled}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        />
      )}

      {pergunta.tipo === "TEXTO_LONGO" && (
        <textarea
          id={nomeCampo}
          name={nomeCampo}
          required={pergunta.obrigatoria}
          disabled={disabled}
          rows={4}
          className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        />
      )}

      {pergunta.tipo === "SIM_NAO" && (
        <select
          id={nomeCampo}
          name={nomeCampo}
          required={pergunta.obrigatoria}
          disabled={disabled}
          defaultValue=""
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        >
          <option value="">Selecione</option>

          <option value="SIM">Sim</option>

          <option value="NAO">Não</option>
        </select>
      )}

      {pergunta.tipo === "MULTIPLA_ESCOLHA" && (
        <select
          id={nomeCampo}
          name={nomeCampo}
          required={pergunta.obrigatoria}
          disabled={disabled}
          defaultValue=""
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        >
          <option value="">Selecione</option>

          {pergunta.opcoes.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function Card({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>

        {descricao && (
          <p className="mt-1 text-sm text-slate-500">{descricao}</p>
        )}
      </div>

      {children}
    </div>
  );
}

function Campo({
  name,
  label,
  placeholder,
  required,
  type = "text",
  disabled = false,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <Obrigatorio />}
      </label>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
      />
    </div>
  );
}
