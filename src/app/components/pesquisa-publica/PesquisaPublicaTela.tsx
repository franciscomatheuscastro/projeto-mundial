"use client";

import {
  FormEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  PesquisaPublica,
} from "@/src/core/model/RespostaPesquisa";

import {
  useRespostaPesquisaPublica,
} from "@/src/app/data/hooks/useRespostaPesquisaPublica";


type Props = {
  pesquisa: PesquisaPublica;
};


type OpcaoEscala = {
  valor: number;
  rotulo: string;
};


export default function PesquisaPublicaTela({
  pesquisa,
}: Props) {
  const router =
    useRouter();


  const {
    erro,
    processando,
    salvarResposta,
  } =
    useRespostaPesquisaPublica();


  const pesquisaJaRespondida =
    pesquisa.convite?.respondido ===
    true;


  async function enviarResposta(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (
      pesquisaJaRespondida
    ) {
      return;
    }


    const formData =
      new FormData(
        event.currentTarget
      );


    const respostas =
      pesquisa.perguntas.map(
        (
          pergunta,
          index
        ) => ({
          id: `${pergunta.id}-${index}`,

          perguntaId:
            pergunta.id,

          valor:
            String(
              formData.get(
                `pergunta_${pergunta.id}`
              ) ??
                ""
            ).trim(),
        })
      );


    await salvarResposta({
      pesquisaId:
        pesquisa.id,

      token:
        pesquisa.token,

      conviteToken:
        pesquisa.convite?.token ??
        null,

      nome:
        String(
          formData.get(
            "nome"
          ) ??
            ""
        ).trim() ||
        null,

      email:
        String(
          formData.get(
            "email"
          ) ??
            ""
        ).trim() ||
        null,

      setor:
        String(
          formData.get(
            "setor"
          ) ??
            ""
        ).trim() ||
        null,

      cargo:
        String(
          formData.get(
            "cargo"
          ) ??
            ""
        ).trim() ||
        null,

      respostas,
    });


    router.push(
      "/pesquisa/obrigado"
    );
  }


  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            {obterNomeModulo(
              pesquisa.tipo
            )}
          </p>


          <p className="mt-2 text-sm font-semibold text-slate-600">
            {pesquisa.cliente.empresa ||
              pesquisa.cliente.nome}
          </p>


          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {
              pesquisa.titulo
            }
          </h1>


          <p className="mt-3 text-sm leading-6 text-slate-500">
            {pesquisa.descricao ||
              pesquisa.modelo.descricao ||
              "Responda com sinceridade. Suas respostas ajudarão na construção de melhorias."}
          </p>
        </div>


        {pesquisaJaRespondida ? (
          <div className="rounded-3xl border border-yellow-100 bg-yellow-50 p-6 text-sm font-semibold leading-6 text-yellow-800 shadow-sm">
            Esta pesquisa já foi respondida por este link. Caso acredite que
            isso seja um erro, entre em contato com a empresa responsável.
          </div>
        ) : (
          <form
            onSubmit={
              enviarResposta
            }
            className="space-y-5"
          >
            {erro && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {
                  erro
                }
              </div>
            )}


            <Card
              titulo="Identificação"
              descricao="Essas informações são opcionais."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Campo
                  name="nome"
                  label="Nome"
                  placeholder="Opcional"
                />

                <Campo
                  name="email"
                  label="E-mail"
                  placeholder="Opcional"
                  type="email"
                />

                <CampoSetor
                  setores={pesquisa.cliente.setores ?? []}
                  valorPredefinido={pesquisa.convite?.setor ?? null}
                />

                <Campo
                  name="cargo"
                  label="Cargo"
                  placeholder="Ex: Motorista"
                />
              </div>
            </Card>


            {pesquisa.perguntas.map(
              pergunta => (
                <Card
                  key={
                    pergunta.id
                  }
                >
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Pergunta{" "}
                      {
                        pergunta.ordem
                      }
                    </p>


                    <h3 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                      {
                        pergunta.titulo
                      }

                      {pergunta.obrigatoria && (
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      )}
                    </h3>


                    {pergunta.descricao && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {
                          pergunta.descricao
                        }
                      </p>
                    )}
                  </div>


                  <CampoResposta
                    pergunta={
                      pergunta
                    }
                    tipoModulo={
                      pesquisa.tipo
                    }
                  />
                </Card>
              )
            )}


            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <button
                type="submit"
                disabled={
                  processando
                }
                className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processando
                  ? "Enviando..."
                  : "Enviar resposta"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}


function Card({
  titulo,
  descricao,
  children,
}: {
  titulo?: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {titulo && (
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
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
      )}


      {
        children
      }
    </div>
  );
}


function Campo({
  name,
  label,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {
          label
        }
      </label>


      <input
        name={
          name
        }
        type={
          type
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}


function CampoSetor({
  setores,
  valorPredefinido,
}: {
  setores: string[];
  valorPredefinido?: string | null;
}) {
  if (valorPredefinido) {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Setor</label>
        <input
          name="setor"
          value={valorPredefinido}
          readOnly
          className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
        />
      </div>
    );
  }

  if (setores.length > 0) {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Setor</label>
        <select
          name="setor"
          defaultValue=""
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Selecione o setor</option>
          {setores.map((setor) => (
            <option key={setor} value={setor}>{setor}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <Campo name="setor" label="Setor" placeholder="Ex: Operacional" />
  );
}


function CampoResposta({
  pergunta,
  tipoModulo,
}: {
  pergunta: any;
  tipoModulo: TipoModuloPesquisa;
}) {
  const name =
    `pergunta_${pergunta.id}`;


  if (
    pergunta.tipo ===
    "NOTA"
  ) {
    const escala =
      obterEscala(
        tipoModulo
      );


    return (
      <div className="grid gap-2 sm:grid-cols-5">
        {escala.map(
          opcao => (
            <label
              key={
                opcao.valor
              }
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50"
            >
              <input
                type="radio"
                name={
                  name
                }
                value={String(
                  opcao.valor
                )}
                required={
                  pergunta.obrigatoria
                }
                className="mb-2"
              />


              <span className="text-xs font-bold text-blue-600">
                {
                  opcao.valor
                }
              </span>


              <span className="mt-1 text-xs font-semibold leading-4 text-slate-700">
                {
                  opcao.rotulo
                }
              </span>
            </label>
          )
        )}
      </div>
    );
  }


  if (
    pergunta.tipo ===
    "SIM_NAO"
  ) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[
          "Sim",
          "Não",
        ].map(
          opcao => (
            <label
              key={
                opcao
              }
              className="flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 p-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <input
                type="radio"
                name={
                  name
                }
                value={
                  opcao
                }
                required={
                  pergunta.obrigatoria
                }
                className="mr-2"
              />

              {
                opcao
              }
            </label>
          )
        )}
      </div>
    );
  }


  if (
    pergunta.tipo ===
    "MULTIPLA_ESCOLHA"
  ) {
    return (
      <div className="space-y-2">
        {(pergunta.opcoes ||
          []).map(
          (
            opcao: string
          ) => (
            <label
              key={
                opcao
              }
              className="flex cursor-pointer items-center rounded-2xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <input
                type="radio"
                name={
                  name
                }
                value={
                  opcao
                }
                required={
                  pergunta.obrigatoria
                }
                className="mr-2"
              />

              {
                opcao
              }
            </label>
          )
        )}
      </div>
    );
  }


  if (
    pergunta.tipo ===
    "TEXTO_LONGO"
  ) {
    return (
      <textarea
        name={
          name
        }
        required={
          pergunta.obrigatoria
        }
        rows={
          5
        }
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    );
  }


  return (
    <input
      name={
        name
      }
      required={
        pergunta.obrigatoria
      }
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  );
}


function obterEscala(
  tipo: TipoModuloPesquisa
): OpcaoEscala[] {
  if (
    tipo ===
    TipoModuloPesquisa.CLIMA
  ) {
    return [
      {
        valor: 1,
        rotulo:
          "Discordo totalmente",
      },
      {
        valor: 2,
        rotulo:
          "Discordo",
      },
      {
        valor: 3,
        rotulo:
          "Neutro",
      },
      {
        valor: 4,
        rotulo:
          "Concordo",
      },
      {
        valor: 5,
        rotulo:
          "Concordo totalmente",
      },
    ];
  }


  if (
    tipo ===
    TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
  ) {
    return [
      {
        valor: 1,
        rotulo:
          "Nunca",
      },
      {
        valor: 2,
        rotulo:
          "Raramente",
      },
      {
        valor: 3,
        rotulo:
          "Às vezes",
      },
      {
        valor: 4,
        rotulo:
          "Frequentemente",
      },
      {
        valor: 5,
        rotulo:
          "Sempre",
      },
    ];
  }


  return [
    {
      valor: 1,
      rotulo:
        "Muito baixo",
    },
    {
      valor: 2,
      rotulo:
        "Baixo",
    },
    {
      valor: 3,
      rotulo:
        "Moderado",
    },
    {
      valor: 4,
      rotulo:
        "Alto",
    },
    {
      valor: 5,
      rotulo:
        "Muito alto",
    },
  ];
}


function obterNomeModulo(
  tipo: TipoModuloPesquisa
) {
  if (
    tipo ===
    TipoModuloPesquisa.CLIMA
  ) {
    return "Pesquisa de Clima";
  }


  if (
    tipo ===
    TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    return "Diagnóstico Organizacional";
  }


  return "Avaliação Psicossocial";
}