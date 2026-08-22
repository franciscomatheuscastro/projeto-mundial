"use client";

export type MetodologiaAplicacaoRelatorio = {
  modeloId: string;
  modeloTitulo: string;
  metodo: "FAVORABILIDADE" | "MATURIDADE" | "RISCO_PSICOSSOCIAL";
  escalaMinima: number;
  escalaMaxima: number;
  favoravel: number[];
  neutro: number[];
  desfavoravel: number[];
  faixas: {
    id: string;
    nome: string;
    minimo: number;
    maximo: number;
    classificacao: string;
    ordem: number;
  }[];
  dimensoes: {
    id: string;
    nome: string;
    peso: number;
    fatorRisco: string | null;
  }[];
  perguntasNota: number;
  perguntasInvertidas: number;
};

type TipoRelatorio =
  | "CLIMA"
  | "DIAGNOSTICO_ORGANIZACIONAL"
  | "AVALIACAO_PSICOSSOCIAL";

type Props = {
  tipo: TipoRelatorio;
  metodologias: (MetodologiaAplicacaoRelatorio | null | undefined)[];
  impressao?: boolean;
};

export default function MetodologiaCriteriosRelatorio({
  tipo,
  metodologias,
  impressao = false,
}: Props) {
  const unicas = consolidarMetodologias(metodologias);

  if (unicas.length === 0) {
    return null;
  }

  const conteudo = (
    <div className={impressao ? "mt-4 space-y-4" : "mt-5 space-y-5"}>
      <div className={impressao ? "grid grid-cols-2 gap-3" : "grid gap-4 lg:grid-cols-3"}>
        <BlocoResumo
          titulo="Lógica principal"
          texto={textoLogicaPrincipal(tipo)}
          impressao={impressao}
        />

        <BlocoResumo
          titulo="Normalização"
          texto={textoNormalizacao(tipo)}
          impressao={impressao}
        />

        <BlocoResumo
          titulo="Consolidação"
          texto={textoConsolidacao(tipo)}
          impressao={impressao}
        />
      </div>

      {unicas.length > 1 && (
        <div className={`${impressao ? "text-[9px]" : "text-sm"} rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900`}>
          O consolidado contém {unicas.length} configurações metodológicas distintas. O sistema calcula cada aplicação conforme o snapshot do instrumento utilizado e só aplica faixas consolidadas quando elas são compatíveis entre as aplicações.
        </div>
      )}

      {unicas.map((metodologia, index) => (
        <InstrumentoMetodologia
          key={`${metodologia.modeloId}-${assinaturaMetodologia(metodologia)}-${index}`}
          metodologia={metodologia}
          tipo={tipo}
          impressao={impressao}
          indice={index + 1}
          total={unicas.length}
        />
      ))}

      <div className={`${impressao ? "text-[8.5px] leading-4" : "text-xs leading-5"} text-slate-500`}>
        Perguntas de Sim/Não, Múltipla Escolha, Texto e Texto Longo são tratadas como informações adicionais e não interferem nos indicadores quantitativos. Os cálculos usam a configuração salva no snapshot de cada aplicação, preservando a metodologia vigente no momento da coleta.
      </div>
    </div>
  );

  if (impressao) {
    return (
      <section className="evitar-quebra mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
          Transparência metodológica
        </p>
        <h2 className="mt-1 text-[16px] font-black text-slate-950">
          Metodologia e critérios de cálculo
        </h2>
        <p className="mt-1 text-[9.5px] text-slate-500">
          Regras efetivamente utilizadas pelo motor analítico para produzir os resultados deste relatório.
        </p>
        {conteudo}
      </section>
    );
  }

  return (
    <details className="group mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Transparência metodológica
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-900">
            Metodologia e critérios de cálculo
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Veja como os indicadores deste relatório foram calculados.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition group-open:rotate-180">
          ▼
        </span>
      </summary>
      <div className="border-t border-slate-100 px-6 pb-6">
        {conteudo}
      </div>
    </details>
  );
}

function InstrumentoMetodologia({
  metodologia,
  tipo,
  impressao,
  indice,
  total,
}: {
  metodologia: MetodologiaAplicacaoRelatorio;
  tipo: TipoRelatorio;
  impressao: boolean;
  indice: number;
  total: number;
}) {
  const pesosDiferentes = metodologia.dimensoes.some(item => item.peso !== 1);

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white ${impressao ? "p-4" : "p-5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`${impressao ? "text-[8px]" : "text-[10px]"} font-black uppercase tracking-wide text-slate-400`}>
            {total > 1 ? `Configuração ${indice}` : "Instrumento aplicado"}
          </p>
          <h3 className={`${impressao ? "text-[11px]" : "text-sm"} mt-1 font-black text-slate-900`}>
            {metodologia.modeloTitulo}
          </h3>
        </div>
        <span className={`${impressao ? "text-[8px]" : "text-xs"} rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600`}>
          Escala {formatarNumero(metodologia.escalaMinima)} a {formatarNumero(metodologia.escalaMaxima)}
        </span>
      </div>

      <div className={`${impressao ? "mt-3 grid grid-cols-2 gap-2 text-[9px]" : "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs"}`}>
        <Info titulo="Método" valor={nomeMetodo(metodologia.metodo)} />
        <Info titulo="Perguntas quantitativas" valor={String(metodologia.perguntasNota)} />
        <Info titulo="Perguntas com inversão" valor={String(metodologia.perguntasInvertidas)} />
        <Info titulo="Pesos das dimensões" valor={pesosDiferentes ? "Ponderados" : "Equivalentes"} />
      </div>

      {tipo === "CLIMA" && (
        <div className={`${impressao ? "mt-3 text-[9px]" : "mt-4 text-xs"} rounded-xl bg-blue-50 p-3 text-blue-950`}>
          <strong>Favorabilidade:</strong>{" "}
          Favorável = {listaNumeros(metodologia.favoravel)} · Neutro = {listaNumeros(metodologia.neutro)} · Desfavorável = {listaNumeros(metodologia.desfavoravel)}.
          O índice geral é a média ponderada da favorabilidade das dimensões pelos respectivos pesos.
        </div>
      )}

      {tipo !== "CLIMA" && metodologia.faixas.length > 0 && (
        <div className="mt-4">
          <p className={`${impressao ? "text-[8px]" : "text-[10px]"} font-black uppercase tracking-wide text-slate-400`}>
            Faixas de interpretação configuradas
          </p>
          <div className={`${impressao ? "mt-2 grid grid-cols-2 gap-2" : "mt-2 flex flex-wrap gap-2"}`}>
            {metodologia.faixas
              .slice()
              .sort((a, b) => a.ordem - b.ordem)
              .map(faixa => (
                <span
                  key={faixa.id}
                  className={`${impressao ? "text-[8.5px]" : "text-xs"} rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700`}
                >
                  {faixa.nome || faixa.classificacao}: {formatarNumero(faixa.minimo)}–{formatarNumero(faixa.maximo)}
                </span>
              ))}
          </div>
        </div>
      )}

      {tipo !== "CLIMA" && metodologia.faixas.length === 0 && (
        <p className={`${impressao ? "mt-3 text-[8.5px]" : "mt-4 text-xs"} rounded-xl bg-amber-50 p-3 text-amber-900`}>
          Não há faixas de interpretação cadastradas nesta configuração. O score pode ser calculado, mas não recebe classificação metodológica por faixa.
        </p>
      )}

      {metodologia.dimensoes.length > 0 && (
        <div className="mt-4">
          <p className={`${impressao ? "text-[8px]" : "text-[10px]"} font-black uppercase tracking-wide text-slate-400`}>
            Estrutura analítica e pesos
          </p>
          <div className={`${impressao ? "mt-2 grid grid-cols-2 gap-2" : "mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {metodologia.dimensoes.map(dimensao => (
              <div key={dimensao.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <div className={`${impressao ? "text-[8.5px]" : "text-xs"} font-bold text-slate-700`}>
                  {dimensao.nome}
                </div>
                <div className={`${impressao ? "text-[8px]" : "text-[10px]"} mt-0.5 text-slate-500`}>
                  Peso {formatarNumero(dimensao.peso)}
                  {tipo === "AVALIACAO_PSICOSSOCIAL" && dimensao.fatorRisco
                    ? ` · Fator: ${dimensao.fatorRisco}`
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BlocoResumo({ titulo, texto, impressao }: { titulo: string; texto: string; impressao: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className={`${impressao ? "text-[9px]" : "text-xs"} font-black text-slate-900`}>{titulo}</h3>
      <p className={`${impressao ? "mt-1 text-[8.5px] leading-4" : "mt-2 text-xs leading-5"} text-slate-600`}>{texto}</p>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="font-semibold text-slate-500">{titulo}</div>
      <div className="mt-0.5 font-black text-slate-800">{valor}</div>
    </div>
  );
}

function consolidarMetodologias(
  metodologias: (MetodologiaAplicacaoRelatorio | null | undefined)[]
) {
  const mapa = new Map<string, MetodologiaAplicacaoRelatorio>();
  for (const metodologia of metodologias) {
    if (!metodologia) continue;
    const assinatura = assinaturaMetodologia(metodologia);
    if (!mapa.has(assinatura)) mapa.set(assinatura, metodologia);
  }
  return Array.from(mapa.values());
}

function assinaturaMetodologia(item: MetodologiaAplicacaoRelatorio) {
  return JSON.stringify({
    modeloId: item.modeloId,
    metodo: item.metodo,
    escalaMinima: item.escalaMinima,
    escalaMaxima: item.escalaMaxima,
    favoravel: item.favoravel,
    neutro: item.neutro,
    desfavoravel: item.desfavoravel,
    faixas: item.faixas.map(f => [f.minimo, f.maximo, f.classificacao]),
    dimensoes: item.dimensoes.map(d => [d.nome, d.peso, d.fatorRisco]),
    perguntasNota: item.perguntasNota,
    perguntasInvertidas: item.perguntasInvertidas,
  });
}

function textoLogicaPrincipal(tipo: TipoRelatorio) {
  if (tipo === "CLIMA") {
    return "Cada resposta de Nota é orientada para que notas maiores representem melhor percepção. Depois, ela é classificada como favorável, neutra ou desfavorável conforme o instrumento.";
  }
  if (tipo === "DIAGNOSTICO_ORGANIZACIONAL") {
    return "Cada Nota é orientada para que valores maiores representem maior maturidade e é convertida proporcionalmente para 0–100. O score da dimensão é a média das respostas válidas.";
  }
  return "Cada Nota é orientada para risco: valores maiores representam maior exposição. Perguntas positivas são invertidas antes da conversão proporcional para 0–100.";
}

function textoNormalizacao(tipo: TipoRelatorio) {
  if (tipo === "CLIMA") {
    return "No Clima, a escala original é preservada para a classificação de favorabilidade. Perguntas negativas são invertidas dentro da própria escala antes da classificação.";
  }
  return "Score = ((nota orientada − escala mínima) ÷ (escala máxima − escala mínima)) × 100. Assim, a escala original é transformada proporcionalmente para 0–100.";
}

function textoConsolidacao(tipo: TipoRelatorio) {
  if (tipo === "CLIMA") {
    return "Favorabilidade da dimensão = respostas favoráveis ÷ respostas válidas × 100. Índice geral = soma(favorabilidade × peso) ÷ soma dos pesos.";
  }
  if (tipo === "DIAGNOSTICO_ORGANIZACIONAL") {
    return "Score organizacional = soma(score da dimensão × peso) ÷ soma dos pesos. Forças, pontos de atenção e prioridades são definidos pela posição relativa das dimensões no ranking consolidado.";
  }
  return "O score de cada fator consolida as dimensões relacionadas usando seus pesos. Score do fator = soma(score da dimensão × peso) ÷ soma dos pesos. Quanto maior o score, maior a exposição.";
}

function nomeMetodo(valor: MetodologiaAplicacaoRelatorio["metodo"]) {
  if (valor === "FAVORABILIDADE") return "Favorabilidade";
  if (valor === "MATURIDADE") return "Maturidade";
  return "Risco psicossocial";
}

function listaNumeros(valores: number[]) {
  return valores.length > 0 ? valores.join(", ") : "não configurado";
}

function formatarNumero(valor: number) {
  return Number.isInteger(valor)
    ? String(valor)
    : valor.toFixed(2).replace(".", ",").replace(/0+$/, "").replace(/,$/, "");
}
