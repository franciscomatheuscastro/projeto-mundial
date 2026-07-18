"use client";

import type {
  FormEvent,
  ReactNode,
} from "react";

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
  const {
    criarDenunciaPublica,
    enviarAnexos,
    processando,
    erro,
  } = useDenuncias(false);

  const [leuOrientacoes, setLeuOrientacoes] =
    useState(false);

  const [
    orientacoesConfirmadas,
    setOrientacoesConfirmadas,
  ] = useState(false);

  const [aceitouTermos, setAceitouTermos] =
    useState(false);

  const [anonima, setAnonima] =
    useState(true);

  const [categoriaId, setCategoriaId] =
    useState("");

  const [protocolo, setProtocolo] =
    useState<string | null>(null);

  const [arquivos, setArquivos] =
    useState<File[]>([]);

  const [
    enviandoArquivos,
    setEnviandoArquivos,
  ] = useState(false);

  const [erroLocal, setErroLocal] =
    useState<string | null>(null);

  const enviando =
    processando || enviandoArquivos;

  function montarRespostasPersonalizadas(
    formData: FormData
  ): RespostaPerguntaCanalInput[] {
    return perguntasPersonalizadas.map(
      (pergunta) => {
        const valor = formData.get(
          `pergunta_${pergunta.id}`
        );

        if (pergunta.tipo === "SIM_NAO") {
          return {
            perguntaId: pergunta.id,
            resposta:
              valor === "SIM"
                ? true
                : valor === "NAO"
                  ? false
                  : null,
          };
        }

        return {
          perguntaId: pergunta.id,
          resposta:
            typeof valor === "string"
              ? valor.trim() || null
              : null,
        };
      }
    );
  }

  function validarRespostasPersonalizadas(
    respostas: RespostaPerguntaCanalInput[]
  ) {
    const mapaRespostas = new Map(
      respostas.map((item) => [
        item.perguntaId,
        item.resposta,
      ])
    );

    for (const pergunta of perguntasPersonalizadas) {
      if (!pergunta.obrigatoria) {
        continue;
      }

      const resposta =
        mapaRespostas.get(pergunta.id);

      const respostaVazia =
        resposta === null ||
        resposta === undefined ||
        (typeof resposta === "string" &&
          !resposta.trim());

      if (respostaVazia) {
        throw new Error(
          `Responda à pergunta obrigatória: ${pergunta.enunciado}`
        );
      }
    }
  }

  async function enviar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (enviando) {
      return;
    }

    if (!categoriaId) {
      setErroLocal(
        "Selecione a categoria da denúncia."
      );

      return;
    }

    if (!aceitouTermos) {
      setErroLocal(
        "É necessário aceitar os Termos de Uso e o Aviso de Privacidade."
      );

      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    setErroLocal(null);

    try {
      const respostasPersonalizadas =
        montarRespostasPersonalizadas(
          formData
        );

      validarRespostasPersonalizadas(
        respostasPersonalizadas
      );

      const resultado =
        await criarDenunciaPublica({
          clienteId,

          titulo: String(
            formData.get("titulo") || ""
          ).trim(),

          descricao: String(
            formData.get("descricao") || ""
          ).trim(),

          categoriaId,

          localOcorrido:
            String(
              formData.get(
                "localOcorrido"
              ) || ""
            ).trim() || null,

          dataOcorrido:
            String(
              formData.get(
                "dataOcorrido"
              ) || ""
            ).trim() || null,

          anonima,

          nomeDenunciante: anonima
            ? null
            : String(
                formData.get(
                  "nomeDenunciante"
                ) || ""
              ).trim() || null,

          emailDenunciante: anonima
            ? null
            : String(
                formData.get(
                  "emailDenunciante"
                ) || ""
              ).trim() || null,

          telefoneDenunciante: anonima
            ? null
            : String(
                formData.get(
                  "telefoneDenunciante"
                ) || ""
              ).trim() || null,

          respostasPersonalizadas,

          aceitouTermos,

          versaoTermosAceitos:
            VERSAO_TERMOS,
        });

      if (arquivos.length > 0) {
        setEnviandoArquivos(true);

        try {
          await enviarAnexos(
            {
              id: resultado.id,
              protocolo:
                resultado.protocolo,
            },
            arquivos
          );
        } catch (error) {
          setErroLocal(
            error instanceof Error
              ? `A denúncia foi registrada com o protocolo ${resultado.protocolo}, mas houve erro no envio dos anexos: ${error.message}`
              : `A denúncia foi registrada com o protocolo ${resultado.protocolo}, mas houve erro no envio dos anexos.`
          );

          setProtocolo(
            resultado.protocolo
          );

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

      setAnonima(true);
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a denúncia."
      );
    }
  }

  function reiniciarFormulario() {
    setProtocolo(null);
    setErroLocal(null);
    setOrientacoesConfirmadas(false);
    setLeuOrientacoes(false);
    setAceitouTermos(false);
    setCategoriaId("");
    setArquivos([]);
    setAnonima(true);
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
              O Canal de Denúncias é um ambiente
              seguro destinado ao relato de
              comportamentos, práticas ou
              situações que possam violar
              normas internas, princípios
              éticos, direitos, legislações ou
              comprometer a integridade das
              pessoas e da organização.
            </p>

            <p>
              Utilize este canal com
              responsabilidade, fornecendo
              informações verdadeiras e,
              sempre que possível, detalhes
              que permitam a análise adequada
              do ocorrido.
            </p>

            <p>
              A denúncia poderá ser realizada
              de forma anônima. Quando houver
              identificação, os dados pessoais
              serão tratados de maneira
              restrita e conforme a legislação
              aplicável.
            </p>

            <p>
              Os documentos e imagens poderão
              ser disponibilizados ao comitê
              responsável pela apuração.
              Áudios e vídeos permanecerão
              restritos à equipe da Mundial.
            </p>

            <p>
              Não utilize este canal para
              solicitações administrativas,
              dúvidas operacionais,
              reclamações comerciais ou
              emergências. Em caso de risco
              imediato à integridade física
              de alguém, procure os serviços
              públicos de emergência.
            </p>

            <p>
              O uso consciente deste canal
              contribui para uma apuração
              responsável, imparcial e
              protegida contra retaliações.
            </p>
          </div>

          <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={leuOrientacoes}
              onChange={(event) =>
                setLeuOrientacoes(
                  event.target.checked
                )
              }
              className="mt-1"
            />

            <span>
              Declaro que li e compreendi as
              orientações para utilização do
              Canal de Denúncias.
            </span>
          </label>

          <button
            type="button"
            disabled={!leuOrientacoes}
            onClick={() =>
              setOrientacoesConfirmadas(true)
            }
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
            Guarde este protocolo para
            acompanhar o andamento.
          </p>

          <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-2xl font-bold text-blue-700">
            {protocolo}
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
            Registre sua denúncia com o máximo
            de informações relevantes. Você
            pode se identificar ou permanecer
            anônimo.
          </p>
        </div>

        {(erro || erroLocal) && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {erroLocal || erro}
          </div>
        )}

        <form
          onSubmit={enviar}
          className="space-y-5"
        >
          <Card titulo="Dados da denúncia">
            <div className="grid gap-4 md:grid-cols-2">
              <Campo
                name="titulo"
                label="Título"
                required
                disabled={enviando}
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Categoria
                </label>

                <select
                  value={categoriaId}
                  required
                  disabled={enviando}
                  onChange={(event) =>
                    setCategoriaId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    Selecione a categoria
                  </option>

                  {categorias.map(
                    (categoria) => (
                      <option
                        key={categoria.id}
                        value={categoria.id}
                      >
                        {categoria.nome}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Campo
                name="localOcorrido"
                label="Local do ocorrido"
                placeholder="Opcional"
                disabled={enviando}
              />

              <Campo
                name="dataOcorrido"
                label="Data do ocorrido"
                type="date"
                disabled={enviando}
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Descrição
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
                {perguntasPersonalizadas.map(
                  (pergunta) => (
                    <CampoPerguntaPersonalizada
                      key={pergunta.id}
                      pergunta={pergunta}
                      disabled={enviando}
                    />
                  )
                )}
              </div>
            </Card>
          )}

          <Card
            titulo="Identificação"
            descricao="Você pode optar por não informar seus dados pessoais."
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={anonima}
                disabled={enviando}
                onChange={(event) =>
                  setAnonima(
                    event.target.checked
                  )
                }
              />

              Quero realizar a denúncia de
              forma anônima
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

                <Campo
                  name="telefoneDenunciante"
                  label="Telefone"
                  disabled={enviando}
                />
              </div>
            )}
          </Card>

          <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <input
              type="checkbox"
              checked={aceitouTermos}
              disabled={enviando}
              onChange={(event) =>
                setAceitouTermos(
                  event.target.checked
                )
              }
              className="mt-1"
            />

            <span className="text-sm leading-6 text-slate-700">
              Declaro que li e aceito os
              Termos de Uso e o Aviso de
              Privacidade, e confirmo que as
              informações fornecidas são
              verdadeiras segundo o meu
              conhecimento.
            </span>
          </label>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <button
              type="submit"
              disabled={
                enviando || !aceitouTermos
              }
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
    </main>
  );
}

function CampoPerguntaPersonalizada({
  pergunta,
  disabled,
}: {
  pergunta: PerguntaCanalPublica;
  disabled: boolean;
}) {
  const nomeCampo =
    `pergunta_${pergunta.id}`;

  return (
    <div>
      <label
        htmlFor={nomeCampo}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {pergunta.enunciado}

        {pergunta.obrigatoria && (
          <span
            className="ml-1 text-red-600"
            aria-label="Campo obrigatório"
          >
            *
          </span>
        )}
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
          <option value="">
            Selecione
          </option>

          <option value="SIM">
            Sim
          </option>

          <option value="NAO">
            Não
          </option>
        </select>
      )}

      {pergunta.tipo ===
        "MULTIPLA_ESCOLHA" && (
        <select
          id={nomeCampo}
          name={nomeCampo}
          required={pergunta.obrigatoria}
          disabled={disabled}
          defaultValue=""
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        >
          <option value="">
            Selecione
          </option>

          {pergunta.opcoes.map((opcao) => (
            <option
              key={opcao}
              value={opcao}
            >
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
        <h2 className="text-lg font-bold text-slate-900">
          {titulo}
        </h2>

        {descricao && (
          <p className="mt-1 text-sm text-slate-500">
            {descricao}
          </p>
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
