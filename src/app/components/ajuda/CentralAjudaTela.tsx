"use client";



import {
  useMemo,
  useState,
} from "react";

type TopicoAjuda = {
  id: string;
  categoria: string;
  titulo: string;
  resumo: string;
  conteudo: string[];
  palavrasChave: string[];
  perfis: Array<
    "MUNDIAL" | "CLIENTE" | "COMITE"
  >;
};

type Props = {
  perfil:
    | "MUNDIAL"
    | "CLIENTE"
    | "COMITE";
};

const TOPICOS: TopicoAjuda[] = [
  {
    id: "primeiros-passos",
    categoria: "Primeiros passos",
    titulo: "Como começar a usar a plataforma",
    resumo:
      "Conheça os principais módulos e aprenda a navegar pelo sistema.",
    conteudo: [
      "Utilize o menu lateral para acessar os módulos disponíveis para o seu perfil.",
      "O Dashboard apresenta uma visão consolidada da operação e separa as aplicações entre Pesquisa de Clima, Diagnóstico Organizacional e Avaliação Psicossocial.",
      "Cada perfil possui permissões específicas. Algumas páginas podem não aparecer para todos os usuários.",
      "Ao terminar de utilizar a plataforma, clique em Sair no rodapé do menu.",
    ],
    palavrasChave: [
      "começar",
      "início",
      "menu",
      "dashboard",
      "navegação",
      "modalidades",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
      "COMITE",
    ],
  },

  {
    id: "modalidades-pesquisa",
    categoria: "Pesquisas e avaliações",
    titulo: "Quais são as três modalidades de avaliação",
    resumo:
      "Entenda a finalidade da Pesquisa de Clima, do Diagnóstico Organizacional e da Avaliação Psicossocial.",
    conteudo: [
      "Pesquisa de Clima: avalia a percepção dos colaboradores por meio de favorabilidade, neutralidade e desfavorabilidade.",
      "Diagnóstico Organizacional: consolida dimensões em uma escala de 0 a 100 e organiza a leitura executiva em forças, pontos de atenção e prioridades.",
      "Avaliação Psicossocial: consolida fatores psicossociais relacionados ao trabalho em uma escala de exposição de 0 a 100 e utiliza as faixas de interpretação configuradas no instrumento.",
      "As três modalidades utilizam modelos reutilizáveis, aplicações vinculadas a clientes, convites, respostas e relatórios consolidados.",
      "Perguntas que não são do tipo Nota podem ser apresentadas como informações adicionais e não alteram o score quantitativo.",
    ],
    palavrasChave: [
      "clima",
      "diagnóstico",
      "psicossocial",
      "modalidade",
      "avaliação",
      "score",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
    ],
  },

  {
    id: "construtor-modelos",
    categoria: "Pesquisas e avaliações",
    titulo: "Como funciona o Construtor de Modelos",
    resumo:
      "Configure dados gerais, análise, dimensões e perguntas dos instrumentos.",
    conteudo: [
      "O construtor é organizado em quatro etapas: Dados gerais, Configuração da análise, Dimensões e Perguntas.",
      "Em Dados gerais, defina o título, a descrição, a modalidade e o status do modelo.",
      "Em Configuração da análise, informe a escala mínima, a escala máxima e os critérios específicos da modalidade.",
      "Em Dimensões, cadastre os temas analíticos. O peso pertence à dimensão e não à pergunta.",
      "Na Avaliação Psicossocial, o fator de risco também é configurado na dimensão.",
      "Em Perguntas, selecione o tipo, a dimensão e, quando a pergunta for Nota, o sentido da pontuação.",
      "O campo Opções somente é utilizado em perguntas de Múltipla Escolha.",
    ],
    palavrasChave: [
      "modelo",
      "construtor",
      "dimensão",
      "peso",
      "fator de risco",
      "pergunta",
      "escala",
    ],
    perfis: [
      "MUNDIAL",
    ],
  },

  {
    id: "pesquisa-clima",
    categoria: "Pesquisa de Clima",
    titulo: "Como criar e analisar uma Pesquisa de Clima",
    resumo:
      "Configure o instrumento, aplique a pesquisa e acompanhe a favorabilidade.",
    conteudo: [
      "Crie ou selecione um modelo da modalidade Pesquisa de Clima.",
      "Cadastre as dimensões que serão avaliadas e vincule as perguntas às respectivas dimensões.",
      "Nas perguntas de Nota, defina corretamente o sentido da pontuação.",
      "Na configuração da análise, informe quais notas são favoráveis, neutras e desfavoráveis.",
      "Crie a aplicação vinculada ao cliente e gere os convites para participação.",
      "O relatório consolidado apresenta o Índice Geral de Clima, favorabilidade por dimensão, melhores dimensões, pontos de atenção e histórico quando houver aplicações comparáveis.",
      "Perguntas de Sim/Não, Múltipla Escolha e Texto aparecem em Informações adicionais e não alteram o índice de clima.",
    ],
    palavrasChave: [
      "pesquisa",
      "clima",
      "favorabilidade",
      "neutro",
      "desfavorável",
      "índice geral",
      "relatório",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
    ],
  },

  {
    id: "diagnostico-organizacional",
    categoria: "Diagnóstico Organizacional",
    titulo: "Como funciona o Diagnóstico Organizacional",
    resumo:
      "Entenda o score organizacional e a leitura por dimensões.",
    conteudo: [
      "Crie ou selecione um modelo da modalidade Diagnóstico Organizacional.",
      "Cadastre as dimensões organizacionais e atribua o peso de cada dimensão quando necessário.",
      "Configure as faixas de interpretação que classificam os scores calculados.",
      "As perguntas de Nota são normalizadas para uma escala de 0 a 100 e alimentam o score das dimensões.",
      "O relatório apresenta o Score Organizacional e o resultado de cada dimensão.",
      "A leitura executiva organiza as dimensões em Forças, Pontos de atenção e Prioridades conforme a lógica atualmente adotada pelo sistema.",
      "Perguntas não quantitativas são exibidas em Informações adicionais e não alteram o score.",
    ],
    palavrasChave: [
      "diagnóstico",
      "organizacional",
      "maturidade",
      "score",
      "forças",
      "pontos de atenção",
      "prioridades",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
    ],
  },

  {
    id: "avaliacao-psicossocial",
    categoria: "Avaliação Psicossocial",
    titulo: "Como funciona a Avaliação Psicossocial",
    resumo:
      "Entenda fatores, scores, faixas de interpretação e recortes setoriais.",
    conteudo: [
      "Crie ou selecione um modelo da modalidade Avaliação Psicossocial.",
      "Cadastre as dimensões e informe, quando aplicável, o fator de risco correspondente em cada dimensão.",
      "O peso é definido na dimensão. Perguntas individuais não possuem peso próprio.",
      "As perguntas de Nota alimentam o motor quantitativo e são normalizadas para uma escala de exposição de 0 a 100.",
      "Quanto maior o score psicossocial consolidado, maior a exposição representada pelo indicador.",
      "As faixas de interpretação cadastradas no modelo determinam classificações como Baixo, Moderado, Alto ou Crítico, conforme a metodologia utilizada.",
      "O relatório pode apresentar ranking dos fatores, Radar de exposição e Mapa de Calor por setor quando houver dados suficientes.",
      "O Mapa de Calor utiliza respostas com setor informado. Respostas sem setor continuam no consolidado geral.",
    ],
    palavrasChave: [
      "psicossocial",
      "fator de risco",
      "exposição",
      "radar",
      "heatmap",
      "mapa de calor",
      "setor",
      "crítico",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
    ],
  },

  {
    id: "tipos-pergunta-relatorios",
    categoria: "Pesquisas e avaliações",
    titulo: "Como os tipos de pergunta aparecem nos relatórios",
    resumo:
      "Saiba quais perguntas formam scores e quais aparecem como informações adicionais.",
    conteudo: [
      "Nota: é o tipo quantitativo utilizado pelos motores analíticos das três modalidades.",
      "Sim/Não: aparece em Informações adicionais com quantidade e percentual de cada resposta.",
      "Múltipla Escolha: aparece em Informações adicionais com a distribuição das alternativas.",
      "Texto curto e Texto longo: aparecem como respostas qualitativas em Informações adicionais.",
      "Perguntas não quantitativas não alteram favorabilidade, maturidade, score organizacional ou exposição psicossocial.",
    ],
    palavrasChave: [
      "nota",
      "sim não",
      "múltipla escolha",
      "texto",
      "informações adicionais",
      "relatório",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
    ],
  },

  {
    id: "setores-pesquisa",
    categoria: "Pesquisas e avaliações",
    titulo: "Como utilizar setores nas pesquisas",
    resumo:
      "Padronize os setores para melhorar os recortes analíticos e o mapa de calor.",
    conteudo: [
      "Os setores podem ser cadastrados na estrutura organizacional do cliente.",
      "Quando existem setores cadastrados, o participante seleciona o setor em uma lista em vez de digitá-lo livremente.",
      "A padronização evita registros diferentes para o mesmo setor, como Operacional, operacional ou OP.",
      "Na Avaliação Psicossocial, o setor informado é utilizado para compor o Mapa de Calor por setor.",
      "Se um convite possuir setor previamente definido, esse valor pode ser apresentado bloqueado no formulário.",
    ],
    palavrasChave: [
      "setor",
      "dropdown",
      "lista",
      "estrutura organizacional",
      "mapa de calor",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
    ],
  },

  {
    id: "relatorios-consolidados",
    categoria: "Relatórios",
    titulo: "Como consultar e imprimir os relatórios consolidados",
    resumo:
      "Utilize o dashboard para análise e a versão A4 para apresentação ao cliente.",
    conteudo: [
      "Cada modalidade possui um relatório consolidado com filtros por período e organização.",
      "O relatório exibido no sistema funciona como dashboard de análise operacional.",
      "Ao clicar em Imprimir relatório, a plataforma abre uma rota separada, preparada para impressão ou salvamento em PDF.",
      "A versão para impressão não utiliza o menu lateral nem o layout administrativo da plataforma.",
      "Pesquisa de Clima apresenta favorabilidade, destaques, pontos de atenção, histórico e informações adicionais.",
      "Diagnóstico Organizacional apresenta score, dimensões, forças, pontos de atenção, prioridades e informações adicionais.",
      "Avaliação Psicossocial apresenta resumo executivo, ranking, Radar, Mapa de Calor, fatores e informações adicionais quando houver dados disponíveis.",
    ],
    palavrasChave: [
      "relatório",
      "imprimir",
      "pdf",
      "cliente",
      "clima",
      "diagnóstico",
      "psicossocial",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
    ],
  },

  {
    id: "canal-denuncias",
    categoria: "Canal de denúncias",
    titulo: "Como funciona o Canal de Denúncias",
    resumo:
      "Entenda o registro, análise, direcionamento e conclusão das denúncias.",
    conteudo: [
      "A denúncia pode ser registrada pelo canal público ou internamente por um usuário autorizado.",
      "Cada denúncia recebe um protocolo exclusivo para acompanhamento.",
      "A gravidade pode ser classificada automaticamente conforme as regras de criticidade cadastradas.",
      "Antes do início das tratativas, a Mundial define se a responsabilidade ficará com a própria Mundial ou com um colaborador específico do cliente.",
      "Mundial e colaborador não podem realizar tratativas simultaneamente na mesma denúncia.",
      "A resposta final somente pode ser disponibilizada depois que existir pelo menos uma tratativa registrada.",
    ],
    palavrasChave: [
      "denúncia",
      "protocolo",
      "tratativa",
      "resposta",
      "criticidade",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
      "COMITE",
    ],
  },

  {
    id: "registrar-denuncia",
    categoria: "Canal de denúncias",
    titulo: "Como registrar uma denúncia",
    resumo:
      "Passo a passo para preencher e enviar uma denúncia.",
    conteudo: [
      "Acesse o Canal de Denúncias disponibilizado pela organização.",
      "Leia e confirme as orientações de utilização.",
      "Informe o título, a categoria, o local, a data e a descrição detalhada do ocorrido.",
      "Responda às perguntas complementares configuradas para o canal.",
      "Escolha se a denúncia será anônima ou identificada.",
      "Adicione documentos, imagens, áudios ou vídeos, quando necessário.",
      "Aceite os termos e conclua o registro.",
      "Guarde o protocolo exibido após o envio.",
    ],
    palavrasChave: [
      "registrar",
      "enviar",
      "anônima",
      "anexo",
      "protocolo",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
      "COMITE",
    ],
  },

  {
    id: "anexos-denuncia",
    categoria: "Canal de denúncias",
    titulo: "Anexos, áudios e vídeos",
    resumo:
      "Saiba como os arquivos enviados em uma denúncia são tratados.",
    conteudo: [
      "Imagens e documentos podem ser disponibilizados para a Mundial e para o comitê autorizado.",
      "Áudios e vídeos ficam restritos à equipe da Mundial.",
      "Cada denúncia possui limite de quantidade e tamanho de arquivos.",
      "É permitido apenas um vídeo por denúncia.",
      "O arquivo deve ser enviado completamente antes da confirmação da denúncia.",
    ],
    palavrasChave: [
      "arquivo",
      "imagem",
      "documento",
      "áudio",
      "vídeo",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
      "COMITE",
    ],
  },

  {
    id: "perguntas-canal",
    categoria: "Canal de denúncias",
    titulo: "Como configurar perguntas personalizadas",
    resumo:
      "Crie perguntas adicionais para os canais de denúncia dos clientes.",
    conteudo: [
      "Acesse Canal de Denúncias e depois Perguntas.",
      "Clique em Nova pergunta.",
      "Informe o enunciado e, opcionalmente, um texto de apoio.",
      "Escolha entre texto curto, texto longo, sim ou não e múltipla escolha.",
      "Defina se a resposta será obrigatória.",
      "Informe a ordem de exibição.",
      "Selecione os clientes nos quais a pergunta deverá aparecer.",
      "Ao salvar, a pergunta será exibida apenas nos canais selecionados.",
    ],
    palavrasChave: [
      "pergunta",
      "personalizada",
      "cliente",
      "canal",
      "múltipla escolha",
    ],
    perfis: [
      "MUNDIAL",
    ],
  },

  {
    id: "planos-acao",
    categoria: "Planos de ação",
    titulo: "Como utilizar os planos de ação",
    resumo:
      "Crie ações corretivas a partir de pesquisas ou denúncias.",
    conteudo: [
      "Acesse Planos de ação no menu lateral.",
      "Crie um plano e informe sua origem.",
      "Defina título, descrição, responsável e prazo.",
      "Cadastre as ações necessárias para execução do plano.",
      "Atualize o andamento de cada ação conforme sua evolução.",
      "Ao concluir, registre o resultado final para acompanhamento do cliente.",
    ],
    palavrasChave: [
      "plano",
      "ação",
      "responsável",
      "prazo",
      "conclusão",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
    ],
  },

  {
    id: "agendamentos",
    categoria: "Agendamentos",
    titulo: "Como consultar e organizar agendamentos",
    resumo:
      "Gerencie reuniões, devolutivas e apresentações.",
    conteudo: [
      "Acesse Agendamentos no menu lateral.",
      "Informe o cliente, o tipo do agendamento, a data e o horário.",
      "Adicione uma descrição com os objetivos da reunião.",
      "Inclua o link da reunião quando o encontro for online.",
      "O cliente poderá consultar os agendamentos disponibilizados para ele.",
    ],
    palavrasChave: [
      "agenda",
      "reunião",
      "data",
      "link",
      "devolutiva",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
    ],
  },

  {
    id: "colaboradores",
    categoria: "Usuários e permissões",
    titulo: "Como gerenciar colaboradores do cliente",
    resumo:
      "Controle acessos e permissões do comitê interno.",
    conteudo: [
      "Acesse Colaboradores no painel do cliente.",
      "Cadastre o nome, e-mail, cargo e setor do colaborador.",
      "Defina se o colaborador poderá visualizar denúncias.",
      "Defina separadamente se ele poderá realizar tratativas.",
      "Um colaborador somente poderá atuar em uma denúncia quando ela for direcionada especificamente para ele.",
      "Desative o colaborador quando o acesso não for mais necessário.",
    ],
    palavrasChave: [
      "colaborador",
      "comitê",
      "permissão",
      "acesso",
      "usuário",
    ],
    perfis: [
      "CLIENTE",
      "COMITE",
    ],
  },

  {
    id: "seguranca",
    categoria: "Segurança",
    titulo: "Boas práticas de segurança",
    resumo:
      "Proteja sua conta e os dados acessados na plataforma.",
    conteudo: [
      "Não compartilhe sua senha com outras pessoas.",
      "Utilize uma senha forte e exclusiva para a plataforma.",
      "Não deixe sua conta aberta em computadores compartilhados.",
      "Clique em Sair ao finalizar o uso.",
      "Não envie informações confidenciais por canais externos não autorizados.",
      "Comunique imediatamente qualquer acesso suspeito.",
    ],
    palavrasChave: [
      "segurança",
      "senha",
      "acesso",
      "conta",
      "privacidade",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
      "COMITE",
    ],
  },

  {
    id: "problemas-acesso",
    categoria: "Solução de problemas",
    titulo: "Não consigo acessar uma página",
    resumo:
      "Veja as causas mais comuns de bloqueio de acesso.",
    conteudo: [
      "Confirme se você está autenticado na plataforma.",
      "Verifique se o seu perfil possui permissão para acessar o módulo.",
      "Atualize a página e tente novamente.",
      "Saia da plataforma e entre novamente.",
      "Caso o problema continue, informe ao suporte qual página tentou acessar e qual mensagem foi exibida.",
    ],
    palavrasChave: [
      "erro",
      "acesso",
      "página",
      "bloqueado",
      "permissão",
    ],
    perfis: [
      "MUNDIAL",
      "CLIENTE",
      "COMITE",
    ],
  },
];


export default function CentralAjudaTela({
  perfil,
}: Props) {
  const [busca, setBusca] = useState("");
  const [
    categoriaSelecionada,
    setCategoriaSelecionada,
  ] = useState("Todas");

  const topicosPermitidos = useMemo(
    () =>
      TOPICOS.filter((topico) =>
        topico.perfis.includes(perfil)
      ),
    [perfil]
  );

  const categorias = useMemo(
    () => [
      "Todas",
      ...Array.from(
        new Set(
          topicosPermitidos.map(
            (topico) => topico.categoria
          )
        )
      ),
    ],
    [topicosPermitidos]
  );

  const topicosFiltrados = useMemo(() => {
    const termo = busca
      .trim()
      .toLocaleLowerCase("pt-BR");

    return topicosPermitidos.filter(
      (topico) => {
        const categoriaValida =
          categoriaSelecionada ===
            "Todas" ||
          topico.categoria ===
            categoriaSelecionada;

        if (!categoriaValida) {
          return false;
        }

        if (!termo) {
          return true;
        }

        const textoPesquisa = [
          topico.titulo,
          topico.resumo,
          topico.categoria,
          ...topico.conteudo,
          ...topico.palavrasChave,
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR");

        return textoPesquisa.includes(termo);
      }
    );
  }, [
    busca,
    categoriaSelecionada,
    topicosPermitidos,
  ]);

  function limparFiltros() {
    setBusca("");
    setCategoriaSelecionada("Todas");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Suporte e orientação
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            Central de Ajuda
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Consulte orientações, manuais e
            respostas para as principais dúvidas
            sobre a utilização da plataforma.
          </p>
        </div>
      </header>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-700 to-cyan-600 p-6 text-white shadow-sm sm:p-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                Como podemos ajudar?
              </p>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Encontre rapidamente a orientação
                que precisa
              </h2>

              <p className="mt-3 text-sm leading-6 text-blue-50/90">
                Pesquise por uma funcionalidade,
                erro, módulo ou procedimento da
                plataforma.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={busca}
                  onChange={(event) =>
                    setBusca(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: cadastrar colaborador, criar denúncia, pesquisa..."
                  className="w-full rounded-2xl border border-white/20 bg-white px-5 py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/20"
                />
              </div>

              {(busca ||
                categoriaSelecionada !==
                  "Todas") && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-2xl border border-white/30 bg-white/10 px-5 py-4 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  Limpar busca
                </button>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap gap-2">
              {categorias.map(
                (categoria) => {
                  const selecionada =
                    categoriaSelecionada ===
                    categoria;

                  return (
                    <button
                      key={categoria}
                      type="button"
                      onClick={() =>
                        setCategoriaSelecionada(
                          categoria
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selecionada
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {categoria}
                    </button>
                  );
                }
              )}
            </div>
          </section>

          <div>
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Manuais e orientações
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {topicosFiltrados.length} tópico(s)
                    encontrado(s).
                  </p>
                </div>
              </div>

              {topicosFiltrados.length ===
              0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <h3 className="text-lg font-bold text-slate-900">
                    Nenhum conteúdo encontrado
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Tente pesquisar utilizando
                    outras palavras.
                  </p>

                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    Mostrar todos os tópicos
                  </button>
                </div>
              ) : (
                topicosFiltrados.map(
                  (topico) => (
                    <details
                      key={topico.id}
                      id={topico.id}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm open:border-blue-200"
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 sm:p-6">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                            {topico.categoria}
                          </p>

                          <h3 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                            {topico.titulo}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {topico.resumo}
                          </p>
                        </div>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-600 transition group-open:rotate-45 group-open:bg-blue-100 group-open:text-blue-700">
                          +
                        </span>
                      </summary>

                      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-6">
                        <ol className="space-y-3">
                          {topico.conteudo.map(
                            (
                              orientacao,
                              indice
                            ) => (
                              <li
                                key={`${topico.id}-${indice}`}
                                className="flex gap-3 text-sm leading-6 text-slate-700"
                              >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                  {indice + 1}
                                </span>

                                <span>
                                  {orientacao}
                                </span>
                              </li>
                            )
                          )}
                        </ol>
                      </div>
                    </details>
                  )
                )
              )}
            </section>

            
          </div>
        </div>
      </section>
    </main>
  );
}

