import Link from "next/link";


const FONTES_OFICIAIS = [
  {
    titulo:
      "NR-1 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
    descricao:
      "Página oficial do Ministério do Trabalho e Emprego com o texto vigente da NR-1 e materiais complementares.",
    href:
      "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1",
  },
  {
    titulo:
      "Manual de Interpretação e Aplicação do Capítulo 1.5 da NR-1",
    descricao:
      "Manual oficial do MTE para apoio à interpretação e aplicação do GRO/PGR.",
    href:
      "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/manuais-e-publicacoes/2026/manual_gro_pgr_da_nr_1.pdf/view",
  },
  {
    titulo:
      "Perguntas e Respostas sobre o Capítulo 1.5 da NR-1",
    descricao:
      "Material oficial e dinâmico com esclarecimentos práticos sobre GRO, PGR e fatores psicossociais.",
    href:
      "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/canpat-2/canpat-2025/perguntas-e-respostas-gro-pgr-1a-rodada.pdf",
  },
  {
    titulo:
      "Programa de Gerenciamento de Riscos — PGR",
    descricao:
      "Página oficial do MTE com orientações gerais sobre composição, obrigatoriedade e revisão do PGR.",
    href:
      "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr/principal",
  },
];


const ETAPAS_GRO = [
  {
    numero:
      "01",
    titulo:
      "Identificar os perigos",
    texto:
      "Reconhecer as fontes, situações, condições de trabalho e fatores organizacionais capazes de causar lesões ou agravos à saúde.",
  },
  {
    numero:
      "02",
    titulo:
      "Avaliar os riscos",
    texto:
      "Estimar e classificar os riscos considerando a severidade dos possíveis agravos e a probabilidade de ocorrência, conforme critérios compatíveis com cada tipo de risco.",
  },
  {
    numero:
      "03",
    titulo:
      "Definir prioridades",
    texto:
      "Classificar os riscos para determinar quais exigem medidas de prevenção, correção, melhoria ou manutenção de controles existentes.",
  },
  {
    numero:
      "04",
    titulo:
      "Implementar medidas",
    texto:
      "Planejar e executar medidas de prevenção respeitando a hierarquia prevista nas Normas Regulamentadoras.",
  },
  {
    numero:
      "05",
    titulo:
      "Registrar e acompanhar",
    texto:
      "Documentar os riscos no inventário, registrar o plano de ação, acompanhar responsáveis, prazos e resultados.",
  },
  {
    numero:
      "06",
    titulo:
      "Reavaliar continuamente",
    texto:
      "O gerenciamento não termina com a emissão do PGR. Mudanças, novos riscos, acidentes, doenças e medidas implementadas podem exigir nova avaliação.",
  },
];


const EXEMPLOS_PSICOSSOCIAIS = [
  "Excesso de demandas e sobrecarga de trabalho",
  "Falta de suporte ou apoio no trabalho",
  "Assédio de qualquer natureza no ambiente de trabalho",
  "Baixa autonomia ou controle sobre o trabalho",
  "Conflitos de papel e responsabilidades pouco claras",
  "Problemas de comunicação e relacionamento",
  "Organização inadequada do trabalho",
  "Pressão excessiva, ritmo intenso e exigências incompatíveis",
];


export default function ManualNR1Page() {
  return (
    <main className="min-h-screen bg-slate-100">
      {/* =====================================================
       * CABEÇALHO
       * =================================================== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
                Manual interno · Mundial Connect
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Manual NR-1
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Guia interno para compreensão do Gerenciamento de Riscos
                Ocupacionais (GRO), do Programa de Gerenciamento de Riscos (PGR)
                e da inclusão dos fatores de riscos psicossociais relacionados ao
                trabalho.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Vigência
              </p>

              <p className="mt-1 text-sm font-black text-blue-950">
                Capítulo 1.5 vigente desde 26/05/2026
              </p>
            </div>
          </div>
        </div>
      </header>


      <section className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* =====================================================
         * ALERTA JURÍDICO
         * =================================================== */}
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 font-black text-amber-800">
              !
            </div>

            <div>
              <h2 className="font-black text-amber-950">
                Importante
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-900">
                Esta página é um material interno de apoio e interpretação. Ela
                não substitui o texto oficial da NR-1, outras Normas
                Regulamentadoras aplicáveis, atos publicados no Diário Oficial
                da União ou a avaliação do responsável técnico da organização.
              </p>
            </div>
          </div>
        </section>


        {/* =====================================================
         * VISÃO RÁPIDA
         * =================================================== */}
        <section>
          <CabecalhoSecao
            numero="01"
            titulo="Visão rápida"
            descricao="Os quatro conceitos que a equipe da Mundial precisa dominar."
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CardConceito
              titulo="NR-1"
              texto="Norma geral que estabelece disposições e diretrizes de Segurança e Saúde no Trabalho, incluindo o Gerenciamento de Riscos Ocupacionais."
            />

            <CardConceito
              titulo="GRO"
              texto="É o processo contínuo de identificar perigos, avaliar, classificar, controlar e acompanhar os riscos ocupacionais."
            />

            <CardConceito
              titulo="PGR"
              texto="É o programa que materializa o GRO. Deve conter, no mínimo, o Inventário de Riscos Ocupacionais e o Plano de Ação."
            />

            <CardConceito
              titulo="Riscos psicossociais"
              texto="São fatores relacionados ao trabalho e à sua organização que podem contribuir para lesões ou agravos à saúde e devem integrar o gerenciamento de riscos."
            />
          </div>
        </section>


        {/* =====================================================
         * O QUE MUDOU
         * =================================================== */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <CabecalhoSecao
            numero="02"
            titulo="O que mudou na NR-1"
            descricao="A nova redação tornou expressa a inclusão dos fatores de riscos psicossociais relacionados ao trabalho no GRO."
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4 text-sm leading-7 text-slate-700">
              <p>
                O Gerenciamento de Riscos Ocupacionais deve abranger riscos
                decorrentes de agentes físicos, químicos, biológicos, riscos de
                acidentes e fatores ergonômicos, incluindo expressamente os
                <strong className="text-slate-950">
                  {" "}fatores de riscos psicossociais relacionados ao trabalho
                </strong>.
              </p>

              <p>
                A organização também deve considerar as condições de trabalho nos
                termos da NR-17. Isso aproxima diretamente o GRO da análise da
                organização do trabalho, das exigências das atividades e dos
                fatores psicossociais.
              </p>

              <p>
                O ponto central não é apenas aplicar um questionário. O resultado
                precisa alimentar um processo de identificação, avaliação,
                classificação, prevenção e acompanhamento dos riscos.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                Regra prática
              </p>

              <p className="mt-3 text-lg font-black leading-7">
                Avaliação psicossocial ≠ PGR completo
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                A avaliação pode ser uma fonte de evidências para o gerenciamento,
                mas o PGR exige inventário de riscos e plano de ação, além dos
                demais requisitos aplicáveis.
              </p>
            </div>
          </div>
        </section>


        {/* =====================================================
         * FLUXO GRO
         * =================================================== */}
        <section>
          <CabecalhoSecao
            numero="03"
            titulo="Como funciona o GRO na prática"
            descricao="O gerenciamento deve funcionar como um ciclo contínuo, e não como um documento produzido uma única vez."
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ETAPAS_GRO.map(
              etapa => (
                <article
                  key={
                    etapa.numero
                  }
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                >
                  <span className="text-xs font-black tracking-[0.2em] text-blue-600">
                    {
                      etapa.numero
                    }
                  </span>

                  <h3 className="mt-2 text-lg font-black text-slate-950">
                    {
                      etapa.titulo
                    }
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {
                      etapa.texto
                    }
                  </p>
                </article>
              )
            )}
          </div>
        </section>


        {/* =====================================================
         * PGR
         * =================================================== */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <CabecalhoSecao
            numero="04"
            titulo="O que o PGR precisa conter"
            descricao="A NR-1 determina uma estrutura documental mínima."
          />

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <DocumentoCard
              numero="1"
              titulo="Inventário de Riscos Ocupacionais"
              itens={[
                "Caracterização dos processos e ambientes de trabalho",
                "Caracterização das atividades",
                "Identificação dos perigos e possíveis lesões ou agravos",
                "Grupos de trabalhadores expostos",
                "Medidas de prevenção existentes",
                "Dados da avaliação e classificação dos riscos",
              ]}
            />

            <DocumentoCard
              numero="2"
              titulo="Plano de Ação"
              itens={[
                "Medidas de prevenção a introduzir, aprimorar ou manter",
                "Prioridades de atuação",
                "Cronograma",
                "Responsáveis",
                "Formas de acompanhamento",
                "Critérios para aferição dos resultados",
              ]}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-700">
              Os documentos integrantes do PGR são de responsabilidade da
              organização, devem observar as demais Normas Regulamentadoras
              aplicáveis, ser datados e assinados e permanecer disponíveis nos
              termos previstos na legislação.
            </p>
          </div>
        </section>


        {/* =====================================================
         * PSICOSSOCIAL
         * =================================================== */}
        <section>
          <CabecalhoSecao
            numero="05"
            titulo="Fatores de riscos psicossociais"
            descricao="O foco deve estar nos fatores relacionados ao trabalho e à organização do trabalho."
          />

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-lg font-black text-slate-950">
                Exemplos de fatores a investigar
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {EXEMPLOS_PSICOSSOCIAIS.map(
                  item => (
                    <div
                      key={
                        item
                      }
                      className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold leading-5 text-slate-700"
                    >
                      {
                        item
                      }
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                Atenção
              </p>

              <h3 className="mt-2 text-lg font-black text-blue-950">
                O risco está no trabalho, não na pessoa
              </h3>

              <p className="mt-3 text-sm leading-6 text-blue-900">
                A análise psicossocial ocupacional deve observar fatores do
                trabalho e da organização do trabalho. Questionários e
                entrevistas podem apoiar a identificação, mas não substituem a
                análise das condições reais de trabalho.
              </p>
            </div>
          </div>
        </section>


        {/* =====================================================
         * PARTICIPAÇÃO DOS TRABALHADORES
         * =================================================== */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <CabecalhoSecao
            numero="06"
            titulo="Participação dos trabalhadores"
            descricao="A NR-1 prevê participação, consulta e comunicação."
          />

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <InfoOperacional
              titulo="Participação"
              texto="A organização deve adotar mecanismos que permitam a participação dos trabalhadores no processo de gerenciamento."
            />

            <InfoOperacional
              titulo="Consulta"
              texto="A percepção dos trabalhadores sobre riscos ocupacionais deve ser considerada no processo."
            />

            <InfoOperacional
              titulo="Comunicação"
              texto="Os riscos consolidados no inventário e as medidas previstas no plano de ação precisam ser comunicados nos termos da NR-1."
            />
          </div>
        </section>


        {/* =====================================================
         * REVISÃO
         * =================================================== */}
        <section>
          <CabecalhoSecao
            numero="07"
            titulo="Quando revisar a avaliação de riscos"
            descricao="A avaliação de riscos é um processo contínuo."
          />

          <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-2">
              <ChecklistItem>
                Periodicamente, observando o prazo previsto na NR-1.
              </ChecklistItem>

              <ChecklistItem>
                Após implementação de medidas, para avaliação dos riscos
                residuais.
              </ChecklistItem>

              <ChecklistItem>
                Quando houver mudanças em tecnologias, ambientes, processos,
                condições ou organização do trabalho.
              </ChecklistItem>

              <ChecklistItem>
                Quando forem identificadas medidas insuficientes ou ineficazes.
              </ChecklistItem>

              <ChecklistItem>
                Na ocorrência de acidentes ou doenças relacionadas ao trabalho.
              </ChecklistItem>

              <ChecklistItem>
                Quando houver alteração de requisitos legais aplicáveis.
              </ChecklistItem>
            </div>

            <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Como regra geral, a avaliação de riscos deve ser revista no máximo
              a cada dois anos. Para organizações com certificação em sistema de
              gestão de SST, o prazo pode chegar a três anos, observadas as
              hipóteses de revisão antecipada previstas na NR-1.
            </div>
          </div>
        </section>


        {/* =====================================================
         * QUEM PRECISA
         * =================================================== */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <CabecalhoSecao
            numero="08"
            titulo="Quem precisa elaborar o PGR"
            descricao="Existem regras gerais e hipóteses específicas de dispensa."
          />

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <h3 className="font-black text-green-950">
                Regra geral
              </h3>

              <p className="mt-2 text-sm leading-6 text-green-900">
                O MTE orienta que empregadores que mantenham trabalhadores como
                empregados devem providenciar o PGR, observadas as disposições e
                exceções previstas na própria NR-1.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-black text-amber-950">
                Dispensas específicas
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-900">
                A NR-1 prevê hipóteses de dispensa para MEI e, sob condições
                específicas, para determinadas microempresas e empresas de
                pequeno porte. Dispensa documental não deve ser interpretada
                como ausência de obrigações de prevenção.
              </p>
            </div>
          </div>
        </section>


        {/* =====================================================
         * SISTEMA MUNDIAL
         * =================================================== */}
        <section className="rounded-3xl bg-slate-950 p-6 text-white">
          <CabecalhoSecaoEscuro
            numero="09"
            titulo="Como o sistema Mundial pode apoiar a jornada"
            descricao="O software organiza evidências e processos, mas não substitui a responsabilidade técnica."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CardSistema
              numero="1"
              titulo="Avaliação"
              texto="Aplicação de questionários, convites, respostas e recortes organizacionais."
            />

            <CardSistema
              numero="2"
              titulo="Análise"
              texto="Scores, dimensões, fatores, mapa de calor, informações adicionais e relatórios."
            />

            <CardSistema
              numero="3"
              titulo="Plano de ação"
              texto="Registro de medidas, responsáveis, prazos, acompanhamento e evidências."
            />

            <CardSistema
              numero="4"
              titulo="Monitoramento"
              texto="Nova coleta, comparação histórica, acompanhamento das ações e melhoria contínua."
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
            O sistema pode apoiar a gestão e a rastreabilidade. A decisão sobre
            enquadramento de perigos, avaliação de riscos, classificação,
            inventário, medidas de prevenção e responsabilidade técnica deve
            respeitar a legislação e os profissionais legalmente competentes.
          </div>
        </section>


        {/* =====================================================
         * FAQ
         * =================================================== */}
        <section>
          <CabecalhoSecao
            numero="10"
            titulo="Perguntas frequentes"
            descricao="Respostas rápidas para uso da equipe da Mundial."
          />

          <div className="mt-5 space-y-3">
            <Pergunta
              pergunta="Aplicar uma avaliação psicossocial já deixa a empresa em conformidade com a NR-1?"
              resposta="Não. A avaliação é uma etapa ou fonte de informação. A conformidade depende do gerenciamento efetivo dos riscos, da integração ao GRO/PGR e do atendimento aos demais requisitos aplicáveis."
            />

            <Pergunta
              pergunta="A NR-1 obriga o uso de um questionário específico?"
              resposta="Não existe um único questionário obrigatório definido pela NR-1. A metodologia e os instrumentos devem ser tecnicamente adequados ao contexto e atender aos requisitos aplicáveis da NR-1 e da NR-17."
            />

            <Pergunta
              pergunta="O PGR é somente um PDF?"
              resposta="Não. O PGR representa um programa de gerenciamento contínuo. Inventário e plano de ação são documentos mínimos, mas o processo precisa ser implementado e acompanhado."
            />

            <Pergunta
              pergunta="Riscos psicossociais significam diagnosticar saúde mental dos empregados?"
              resposta="Não. No contexto do GRO, o foco é identificar e gerenciar fatores de riscos psicossociais relacionados ao trabalho e à organização do trabalho. Diagnóstico clínico individual é outra finalidade e possui requisitos próprios."
            />

            <Pergunta
              pergunta="Trabalho remoto e híbrido também entram na análise?"
              resposta="Sim. As orientações do MTE indicam que a avaliação deve considerar as diferentes formas de organização e execução do trabalho, inclusive remoto, híbrido e teletrabalho, quando aplicáveis."
            />
          </div>
        </section>


        {/* =====================================================
         * FONTES
         * =================================================== */}
        <section>
          <CabecalhoSecao
            numero="11"
            titulo="Fontes oficiais"
            descricao="Use sempre estes materiais como referência primária."
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {FONTES_OFICIAIS.map(
              fonte => (
                <a
                  key={
                    fonte.href
                  }
                  href={
                    fonte.href
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-black text-slate-950 group-hover:text-blue-700">
                        {
                          fonte.titulo
                        }
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {
                          fonte.descricao
                        }
                      </p>
                    </div>

                    <span className="shrink-0 text-lg font-black text-blue-600">
                      ↗
                    </span>
                  </div>
                </a>
              )
            )}
          </div>
        </section>


        <footer className="border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
          Manual interno Mundial Connect · Conteúdo estruturado a partir da NR-1
          e dos materiais de orientação disponibilizados pelo Ministério do
          Trabalho e Emprego. Recomenda-se revisão periódica desta página sempre
          que houver alteração normativa ou nova orientação oficial.
        </footer>
      </section>
    </main>
  );
}


/* =========================================================
 * COMPONENTES VISUAIS
 * ======================================================= */

function CabecalhoSecao({
  numero,
  titulo,
  descricao,
}: {
  numero: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
        {
          numero
        }
      </p>

      <h2 className="mt-1 text-2xl font-black text-slate-950">
        {
          titulo
        }
      </h2>

      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
        {
          descricao
        }
      </p>
    </div>
  );
}


function CabecalhoSecaoEscuro({
  numero,
  titulo,
  descricao,
}: {
  numero: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
        {
          numero
        }
      </p>

      <h2 className="mt-1 text-2xl font-black text-white">
        {
          titulo
        }
      </h2>

      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
        {
          descricao
        }
      </p>
    </div>
  );
}


function CardConceito({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-lg font-black text-slate-950">
        {
          titulo
        }
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {
          texto
        }
      </p>
    </article>
  );
}


function DocumentoCard({
  numero,
  titulo,
  itens,
}: {
  numero: string;
  titulo: string;
  itens: string[];
}) {
  return (
    <article className="rounded-3xl border border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
          {
            numero
          }
        </span>

        <h3 className="font-black text-slate-950">
          {
            titulo
          }
        </h3>
      </div>

      <ul className="mt-4 space-y-2">
        {itens.map(
          item => (
            <li
              key={
                item
              }
              className="flex gap-2 text-sm leading-6 text-slate-600"
            >
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

              <span>
                {
                  item
                }
              </span>
            </li>
          )
        )}
      </ul>
    </article>
  );
}


function InfoOperacional({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <article className="rounded-2xl bg-slate-50 p-4">
      <h3 className="font-black text-slate-950">
        {
          titulo
        }
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {
          texto
        }
      </p>
    </article>
  );
}


function ChecklistItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-black text-green-700">
        ✓
      </span>

      <p className="text-sm leading-6 text-slate-700">
        {
          children
        }
      </p>
    </div>
  );
}


function CardSistema({
  numero,
  titulo,
  texto,
}: {
  numero: string;
  titulo: string;
  texto: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-black text-blue-300">
        {
          numero
        }
      </p>

      <h3 className="mt-2 font-black text-white">
        {
          titulo
        }
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {
          texto
        }
      </p>
    </article>
  );
}


function Pergunta({
  pergunta,
  resposta,
}: {
  pergunta: string;
  resposta: string;
}) {
  return (
    <details className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-slate-950">
        <span>
          {
            pergunta
          }
        </span>

        <span className="text-xl text-blue-600 transition group-open:rotate-45">
          +
        </span>
      </summary>

      <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">
        {
          resposta
        }
      </p>
    </details>
  );
}
