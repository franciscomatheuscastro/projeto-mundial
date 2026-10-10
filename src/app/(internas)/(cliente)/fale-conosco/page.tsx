import {
  redirect,
} from "next/navigation";

import {
  auth,
} from "@/src/auth";


const CONTATO = {
  telefoneExibicao:
    "(51) 3470-2476",

  telefoneLink:
    "tel:+555134702476",

  emailEmpresas:
    "comercial@mundialrh.com.br",

  emailCurriculos:
    "recrutamento@mundialrh.com.br",

  site:
    "https://mundialrh.com",

  paginaContato:
    "https://mundialrh.com/contato/",

  unidades: [
    {
      cidade:
        "Porto Alegre",

      endereco:
        "Rua Dom Pedro II, 349, sala 302 — São João",
    },

    {
      cidade:
        "Cachoeirinha",

      endereco:
        "Av. Flores da Cunha, 935 — Cj. 401/404 — Centro",
    },

    {
      cidade:
        "Gravataí",

      endereco:
        "Rua Prefeito José Linck, 701 — Centro",
    },
  ],
} as const;


export default async function FaleConoscoPage() {
  const session =
    await auth();


  if (
    !session?.user
  ) {
    redirect(
      "/login"
    );
  }


  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Suporte
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Fale conosco
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Precisa falar com a equipe da Mundial RH?
            Utilize um dos canais abaixo para entrar em contato.
          </p>
        </div>
      </header>


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-sm sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
                Mundial RH
              </p>

              <h2 className="mt-3 text-2xl font-black">
                Como podemos ajudar?
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                Para dúvidas sobre a plataforma, serviços contratados,
                avaliações, pesquisas ou suporte à sua empresa,
                entre em contato com nossa equipe.
              </p>


              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={
                    CONTATO.telefoneLink
                  }
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-800 transition hover:bg-blue-50"
                >
                  Ligar para{" "}
                  {
                    CONTATO.telefoneExibicao
                  }
                </a>

                <a
                  href={`mailto:${CONTATO.emailEmpresas}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
                >
                  Enviar e-mail
                </a>

                <a
                  href={
                    CONTATO.paginaContato
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
                >
                  Abrir site da Mundial RH
                </a>
              </div>
            </section>


            <section className="grid gap-4 sm:grid-cols-2">
              <ContatoCard
                titulo="Atendimento para empresas"
                valor={
                  CONTATO.emailEmpresas
                }
                descricao="Canal indicado para clientes, empresas e assuntos comerciais."
                href={`mailto:${CONTATO.emailEmpresas}`}
                acao="Enviar e-mail"
              />

              <ContatoCard
                titulo="Telefone"
                valor={
                  CONTATO.telefoneExibicao
                }
                descricao="Entre em contato diretamente com a equipe da Mundial RH."
                href={
                  CONTATO.telefoneLink
                }
                acao="Ligar"
              />

              <ContatoCard
                titulo="Currículos e recrutamento"
                valor={
                  CONTATO.emailCurriculos
                }
                descricao="Canal destinado a assuntos de recrutamento e envio de currículos."
                href={`mailto:${CONTATO.emailCurriculos}`}
                acao="Enviar e-mail"
              />

              <ContatoCard
                titulo="Site"
                valor="mundialrh.com"
                descricao="Conheça os serviços e demais canais oficiais da Mundial RH."
                href={
                  CONTATO.site
                }
                acao="Acessar site"
                externo
              />
            </section>
          </div>


          <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Unidades
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Onde encontrar a Mundial RH
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Confira os endereços informados nos canais oficiais da empresa.
            </p>


            <div className="mt-6 space-y-4">
              {CONTATO.unidades.map(
                unidade => (
                  <div
                    key={
                      unidade.cidade
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-black text-slate-900">
                      {
                        unidade.cidade
                      }
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {
                        unidade.endereco
                      }
                    </p>
                  </div>
                )
              )}
            </div>


            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-black text-blue-900">
                Precisa de ajuda com a plataforma?
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Ao entrar em contato, informe o nome da sua empresa
                e descreva brevemente a dúvida ou dificuldade encontrada.
                Isso ajuda a equipe a direcionar o atendimento.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}


function ContatoCard({
  titulo,
  valor,
  descricao,
  href,
  acao,
  externo = false,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  href: string;
  acao: string;
  externo?: boolean;
}) {
  return (
    <article className="flex min-h-[220px] flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {
          titulo
        }
      </p>

      <h3 className="mt-3 break-words text-lg font-black text-slate-950">
        {
          valor
        }
      </h3>

      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
        {
          descricao
        }
      </p>

      <a
        href={
          href
        }
        target={
          externo
            ? "_blank"
            : undefined
        }
        rel={
          externo
            ? "noreferrer"
            : undefined
        }
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
      >
        {
          acao
        }
      </a>
    </article>
  );
}
