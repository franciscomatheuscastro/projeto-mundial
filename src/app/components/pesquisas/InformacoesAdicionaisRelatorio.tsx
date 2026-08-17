"use client";

export type DistribuicaoInformacaoAdicional = {
  valor: string;
  quantidade: number;
  percentual: number;
};

export type InformacaoAdicionalRelatorio = {
  id: string;
  perguntaId: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  dimensao: { id: string; nome: string } | null;
  totalRespostas: number;
  distribuicao: DistribuicaoInformacaoAdicional[];
  respostasTexto: string[];
};

type Variante = "clima" | "diagnostico" | "psicossocial";

export default function InformacoesAdicionaisRelatorio({
  itens,
  variante,
}: {
  itens: InformacaoAdicionalRelatorio[];
  variante: Variante;
}) {
  if (!itens?.length) return null;

  const classes = obterClasses(variante);

  return (
    <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${classes.textoDestaque}`}>
        Informações adicionais
      </p>
      <h2 className="mt-1 text-lg font-black text-slate-900">
        Indicadores complementares
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Perguntas de Sim/Não, múltipla escolha e respostas abertas. Estes dados
        complementam a análise, mas não alteram os scores quantitativos.
      </p>

      <div className="mt-6 space-y-5">
        {itens.map(item => (
          <InformacaoCard key={item.id} item={item} variante={variante} />
        ))}
      </div>
    </section>
  );
}

function InformacaoCard({
  item,
  variante,
}: {
  item: InformacaoAdicionalRelatorio;
  variante: Variante;
}) {
  const classes = obterClasses(variante);
  const possuiDistribuicao =
    item.tipo === "SIM_NAO" || item.tipo === "MULTIPLA_ESCOLHA";
  const possuiTexto = item.tipo === "TEXTO" || item.tipo === "TEXTO_LONGO";

  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${classes.badge}`}>
              {nomeTipo(item.tipo)}
            </span>
            {item.dimensao && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {item.dimensao.nome}
              </span>
            )}
          </div>

          <h3 className="mt-3 text-base font-black text-slate-900">{item.titulo}</h3>
          {item.descricao && (
            <p className="mt-1 text-sm leading-6 text-slate-500">{item.descricao}</p>
          )}
        </div>

        <span className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
          {item.totalRespostas} resposta(s)
        </span>
      </div>

      {possuiDistribuicao && (
        <div className="mt-5 space-y-3">
          {item.distribuicao.map(opcao => (
            <div key={opcao.valor} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-slate-800">{opcao.valor}</span>
                <span className="text-sm font-black text-slate-700">
                  {opcao.quantidade} · {percentual(opcao.percentual)}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${classes.barra}`}
                  style={{ width: `${limitarPercentual(opcao.percentual)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {possuiTexto && (
        <div className="mt-5 space-y-3">
          {item.respostasTexto.map((resposta, index) => (
            <div
              key={`${item.id}-${index}`}
              className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
            >
              {resposta}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function nomeTipo(tipo: string) {
  if (tipo === "SIM_NAO") return "Sim ou Não";
  if (tipo === "MULTIPLA_ESCOLHA") return "Múltipla escolha";
  if (tipo === "TEXTO_LONGO") return "Texto longo";
  if (tipo === "TEXTO") return "Texto curto";
  return tipo.replaceAll("_", " ");
}

function obterClasses(variante: Variante) {
  if (variante === "diagnostico") {
    return {
      textoDestaque: "text-indigo-600",
      badge: "bg-indigo-50 text-indigo-700",
      barra: "bg-indigo-600",
    };
  }

  if (variante === "psicossocial") {
    return {
      textoDestaque: "text-amber-600",
      badge: "bg-amber-50 text-amber-700",
      barra: "bg-amber-500",
    };
  }

  return {
    textoDestaque: "text-blue-600",
    badge: "bg-blue-50 text-blue-700",
    barra: "bg-blue-600",
  };
}

function percentual(valor: number) {
  return `${valor.toFixed(1).replace(".", ",")}%`;
}

function limitarPercentual(valor: number) {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(100, Math.max(0, valor));
}
