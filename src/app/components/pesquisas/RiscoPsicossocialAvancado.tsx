"use client";
import type { ReactNode } from "react";
export type TamanhoMatrizRisco = 3 | 4 | 5;
export type SeveridadesPsicossociais = Record<string, number>;
export type FatorMatrizPsicossocial = {
    id: string;
    nome: string;
    fatorRisco: string | null;
    score: number | null;
    classificacao: string | null;
    totalRespostas: number;
};
type CorSemaforo = "VERDE" | "AMARELO" | "VERMELHO" | "CINZA";
type NivelRiscoMatriz = "BAIXO" | "MODERADO" | "ALTO" | "CRITICO";
export function normalizarTamanhoMatriz(valor: unknown): TamanhoMatrizRisco {
    const numero = Number(valor);
    if (numero === 3 || numero === 4 || numero === 5) {
        return numero;
    }
    return 5;
}
export function serializarSeveridades(severidades: SeveridadesPsicossociais) {
    return Object.entries(severidades)
        .filter(([, valor]) => Number.isInteger(valor) && valor > 0)
        .map(([id, valor]) => `${encodeURIComponent(id)}:${valor}`)
        .join(",");
}
export function desserializarSeveridades(valor: string | null | undefined, tamanho: TamanhoMatrizRisco): SeveridadesPsicossociais {
    if (!valor) {
        return {};
    }
    const resultado: SeveridadesPsicossociais = {};
    for (const item of valor.split(",")) {
        const separador = item.lastIndexOf(":");
        if (separador <= 0) {
            continue;
        }
        const idCodificado = item.slice(0, separador);
        const severidade = Number(item.slice(separador + 1));
        if (!Number.isInteger(severidade) ||
            severidade < 1 ||
            severidade > tamanho) {
            continue;
        }
        try {
            resultado[decodeURIComponent(idCodificado)] = severidade;
        }
        catch {
            continue;
        }
    }
    return resultado;
}
export function SemaforoPsicossocial({ dimensoes, compacto = false, }: {
    dimensoes: FatorMatrizPsicossocial[];
    compacto?: boolean;
}) {
    const itens = dimensoes.filter(item => item.score !== null);
    if (itens.length === 0) {
        return (<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        Ainda não existem dimensões com score calculado para compor o semáforo.
      </div>);
    }
    const contagem = {
        verde: 0,
        amarelo: 0,
        vermelho: 0,
        cinza: 0,
    };
    for (const item of itens) {
        const cor = obterCorSemaforo(item.classificacao);
        if (cor === "VERDE")
            contagem.verde += 1;
        else if (cor === "AMARELO")
            contagem.amarelo += 1;
        else if (cor === "VERMELHO")
            contagem.vermelho += 1;
        else
            contagem.cinza += 1;
    }
    return (<div>
      <div className={`grid gap-3 ${compacto ? "grid-cols-4" : "sm:grid-cols-4"}`}>
        <ResumoSemaforo titulo="Favorável" valor={contagem.verde} classe="border-emerald-200 bg-emerald-50 text-emerald-800"/>
        <ResumoSemaforo titulo="Atenção" valor={contagem.amarelo} classe="border-amber-200 bg-amber-50 text-amber-800"/>
        <ResumoSemaforo titulo="Risco" valor={contagem.vermelho} classe="border-red-200 bg-red-50 text-red-800"/>
        <ResumoSemaforo titulo="Sem faixa" valor={contagem.cinza} classe="border-slate-200 bg-slate-50 text-slate-700"/>
      </div>
      <div className={compacto ? "mt-4 space-y-2" : "mt-5 space-y-3"}>
        {itens.map((item, index) => {
            const cor = obterCorSemaforo(item.classificacao);
            return (<div key={`${item.id}-semaforo-${index}`} className={`grid items-center gap-3 rounded-xl border border-slate-200 ${compacto
                    ? "grid-cols-[1fr_110px_65px] px-3 py-2 text-[9px]"
                    : "p-4 md:grid-cols-[minmax(220px,1fr)_220px_95px]"}`}>
              <div className="min-w-0">
                <strong className="block truncate text-slate-900">
                  {item.fatorRisco || item.nome}
                </strong>
                {item.fatorRisco && item.fatorRisco !== item.nome && (<span className="block truncate text-slate-500">
                    Dimensão: {item.nome}
                  </span>)}
              </div>
              <div className="grid grid-cols-3 gap-1">
                <SegmentoSemaforo cor="VERDE" ativo={cor === "VERDE"}/>
                <SegmentoSemaforo cor="AMARELO" ativo={cor === "AMARELO"}/>
                <SegmentoSemaforo cor="VERMELHO" ativo={cor === "VERMELHO"}/>
              </div>
              <div className="text-right">
                <strong className="block text-slate-900">
                  {formatarScore(item.score)}
                </strong>
                <span className={classeTextoSemaforo(cor)}>
                  {rotuloSemaforo(cor)}
                </span>
              </div>
            </div>);
        })}
      </div>
      <p className={`mt-3 leading-5 text-slate-500 ${compacto ? "text-[8px]" : "text-xs"}`}>
        O semáforo utiliza a classificação já produzida pelas faixas do
        instrumento. Ele não substitui os critérios próprios do HSE-IT, COPSOQ
        ou de outro modelo configurado.
      </p>
    </div>);
}
export function SeletorTamanhoMatriz({ value, onChange, }: {
    value: TamanhoMatrizRisco;
    onChange: (valor: TamanhoMatrizRisco) => void;
}) {
    return (<label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        Tamanho da matriz
      </span>
      <select value={value} onChange={event => onChange(normalizarTamanhoMatriz(event.target.value))} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100">
        <option value={5}>5 × 5</option>
        <option value={4}>4 × 4</option>
        <option value={3}>3 × 3</option>
      </select>
    </label>);
}
export function InventarioRiscosPsicossociais({ dimensoes, tamanho, severidades, onAlterarSeveridade, compacto = false, }: {
    dimensoes: FatorMatrizPsicossocial[];
    tamanho: TamanhoMatrizRisco;
    severidades: SeveridadesPsicossociais;
    onAlterarSeveridade?: (id: string, severidade: number) => void;
    compacto?: boolean;
}) {
    if (dimensoes.length === 0) {
        return (<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        Nenhuma dimensão disponível para o inventário de riscos.
      </div>);
    }
    return (<div className="overflow-x-auto">
      <table className={`w-full border-collapse ${compacto ? "min-w-[920px] text-[8.5px]" : "min-w-[1050px] text-sm"}`}>
        <thead className="bg-slate-50">
          <tr>
            <ThInventario compacto={compacto}>Dimensão / fator</ThInventario>
            <ThInventario compacto={compacto} centro>
              Score
            </ThInventario>
            <ThInventario compacto={compacto} centro>
              Semáforo
            </ThInventario>
            <ThInventario compacto={compacto} centro>
              Probabilidade / exposição
            </ThInventario>
            <ThInventario compacto={compacto} centro>
              Severidade
            </ThInventario>
            <ThInventario compacto={compacto} centro>
              P × S
            </ThInventario>
            <ThInventario compacto={compacto} centro>
              Nível de risco
            </ThInventario>
          </tr>
        </thead>
        <tbody>
          {dimensoes.map((item, index) => {
            const probabilidade = obterNivelExposicao(item.score, tamanho);
            const severidade = normalizarSeveridade(severidades[item.id], tamanho);
            const risco = probabilidade && severidade
                ? calcularNivelRisco(probabilidade, severidade, tamanho)
                : null;
            const semaforo = obterCorSemaforo(item.classificacao);
            return (<tr key={`${item.id}-inventario-${index}`} className="border-t border-slate-200">
                <TdInventario compacto={compacto}>
                  <strong className="block text-slate-900">
                    {item.fatorRisco || item.nome}
                  </strong>
                  {item.fatorRisco && item.fatorRisco !== item.nome && (<span className="block text-slate-500">
                      Dimensão: {item.nome}
                    </span>)}
                </TdInventario>
                <TdInventario compacto={compacto} centro>
                  {formatarScore(item.score)}
                </TdInventario>
                <TdInventario compacto={compacto} centro>
                  <BadgeSemaforo cor={semaforo} compacto={compacto}/>
                </TdInventario>
                <TdInventario compacto={compacto} centro>
                  {probabilidade
                    ? `${probabilidade}/${tamanho} · ${rotuloExposicao(tamanho, probabilidade)}`
                    : "—"}
                </TdInventario>
                <TdInventario compacto={compacto} centro>
                  {onAlterarSeveridade ? (<select value={severidade || ""} onChange={event => onAlterarSeveridade(item.id, Number(event.target.value) || 0)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-amber-500">
                      <option value="">Não definida</option>
                      {Array.from({ length: tamanho }, (_, i) => i + 1).map(nivel => (<option key={nivel} value={nivel}>
                            {nivel} · {rotuloSeveridade(tamanho, nivel)}
                          </option>))}
                    </select>) : severidade ? (`${severidade}/${tamanho} · ${rotuloSeveridade(tamanho, severidade)}`) : ("Não definida")}
                </TdInventario>
                <TdInventario compacto={compacto} centro>
                  {risco ? risco.produto : "—"}
                </TdInventario>
                <TdInventario compacto={compacto} centro>
                  {risco ? (<BadgeRisco nivel={risco.nivel} compacto={compacto}/>) : (<span className="font-semibold text-slate-400">
                      Pendente
                    </span>)}
                </TdInventario>
              </tr>);
        })}
        </tbody>
      </table>
    </div>);
}
export function MatrizRiscoPsicossocial({ dimensoes, tamanho, severidades, compacto = false, }: {
    dimensoes: FatorMatrizPsicossocial[];
    tamanho: TamanhoMatrizRisco;
    severidades: SeveridadesPsicossociais;
    compacto?: boolean;
}) {
    const itens = dimensoes
        .map(item => {
        const probabilidade = obterNivelExposicao(item.score, tamanho);
        const severidade = normalizarSeveridade(severidades[item.id], tamanho);
        if (!probabilidade || !severidade) {
            return null;
        }
        return {
            item,
            probabilidade,
            severidade,
            risco: calcularNivelRisco(probabilidade, severidade, tamanho),
        };
    })
        .filter((item): item is {
        item: FatorMatrizPsicossocial;
        probabilidade: number;
        severidade: number;
        risco: {
            produto: number;
            nivel: NivelRiscoMatriz;
        };
    } => Boolean(item));
    const pendentes = dimensoes.filter(item => item.score !== null &&
        !normalizarSeveridade(severidades[item.id], tamanho)).length;
    return (<div>
      <div className="overflow-x-auto">
        <table className={`w-full border-separate border-spacing-1 ${compacto ? "min-w-[680px] text-[7.5px]" : "min-w-[820px] text-xs"}`}>
          <thead>
            <tr>
              <th className={`rounded-lg bg-slate-900 font-black text-white ${compacto ? "p-2" : "p-3"}`}>
                Severidade ↓ / Probabilidade-exposição →
              </th>
              {Array.from({ length: tamanho }, (_, i) => i + 1).map(nivel => (<th key={`probabilidade-${nivel}`} className={`rounded-lg bg-slate-100 text-center font-black text-slate-700 ${compacto ? "p-2" : "p-3"}`}>
                  <span className="block">{nivel}</span>
                  <span className="block font-medium text-slate-500">
                    {rotuloExposicao(tamanho, nivel)}
                  </span>
                </th>))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: tamanho }, (_, i) => tamanho - i).map(severidade => (<tr key={`severidade-${severidade}`}>
                  <th className={`rounded-lg bg-slate-100 text-left font-black text-slate-700 ${compacto ? "p-2" : "p-3"}`}>
                    <span className="block">{severidade}</span>
                    <span className="block font-medium text-slate-500">
                      {rotuloSeveridade(tamanho, severidade)}
                    </span>
                  </th>
                  {Array.from({ length: tamanho }, (_, i) => i + 1).map(probabilidade => {
                const risco = calcularNivelRisco(probabilidade, severidade, tamanho);
                const dimensoesCelula = itens.filter(item => item.probabilidade === probabilidade &&
                    item.severidade === severidade);
                return (<td key={`${severidade}-${probabilidade}`} className={`align-top rounded-lg border ${compacto ? "min-w-[95px] p-2" : "min-w-[125px] p-3"} ${classeCelulaRisco(risco.nivel)}`}>
                          <div className="flex items-center justify-between gap-2">
                            <strong>{risco.produto}</strong>
                            <span className="font-black">
                              {rotuloNivelRisco(risco.nivel)}
                            </span>
                          </div>
                          {dimensoesCelula.length > 0 && (<div className={compacto ? "mt-1" : "mt-2"}>
                              {dimensoesCelula.slice(0, compacto ? 2 : 3).map(({ item }) => (<div key={`${item.id}-matriz`} className="truncate font-semibold" title={item.fatorRisco || item.nome}>
                                    • {item.fatorRisco || item.nome}
                                  </div>))}
                              {dimensoesCelula.length > (compacto ? 2 : 3) && (<div className="font-black">
                                  +{" "}
                                  {dimensoesCelula.length -
                                (compacto ? 2 : 3)}{" "}
                                  dimensão(ões)
                                </div>)}
                            </div>)}
                        </td>);
            })}
                </tr>))}
          </tbody>
        </table>
      </div>
      <div className={`mt-3 flex flex-wrap gap-2 ${compacto ? "text-[7.5px]" : "text-xs"}`}>
        <LegendaRisco texto="Baixo" classe="border-emerald-200 bg-emerald-50 text-emerald-800"/>
        <LegendaRisco texto="Moderado" classe="border-amber-200 bg-amber-50 text-amber-800"/>
        <LegendaRisco texto="Alto" classe="border-orange-200 bg-orange-50 text-orange-800"/>
        <LegendaRisco texto="Crítico" classe="border-red-200 bg-red-50 text-red-800"/>
      </div>
      {pendentes > 0 && (<p className={`mt-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 ${compacto ? "p-2 text-[8px]" : "p-3 text-xs leading-5"}`}>
          {pendentes} dimensão(ões) com score ainda não entram na matriz porque
          a severidade não foi definida.
        </p>)}
      <p className={`mt-3 leading-5 text-slate-500 ${compacto ? "text-[8px]" : "text-xs"}`}>
        A probabilidade/exposição é uma conversão operacional do score de 0 a
        100 para {tamanho} faixas iguais. A severidade é um julgamento técnico
        independente e deve ser definida pelo responsável pela avaliação. O
        nível da matriz resulta de P × S e não altera o score original do
        questionário.
      </p>
    </div>);
}
function ResumoSemaforo({ titulo, valor, classe, }: {
    titulo: string;
    valor: number;
    classe: string;
}) {
    return (<div className={`rounded-xl border p-3 ${classe}`}>
      <span className="block text-[10px] font-black uppercase tracking-wide">
        {titulo}
      </span>
      <strong className="mt-1 block text-xl">{valor}</strong>
    </div>);
}
function SegmentoSemaforo({ cor, ativo, }: {
    cor: Exclude<CorSemaforo, "CINZA">;
    ativo: boolean;
}) {
    const classe = cor === "VERDE"
        ? "bg-emerald-500"
        : cor === "AMARELO"
            ? "bg-amber-400"
            : "bg-red-500";
    return (<span className={`h-3 rounded-full ${classe} ${ativo ? "opacity-100 ring-2 ring-slate-900/10" : "opacity-20"}`} aria-hidden="true"/>);
}
function BadgeSemaforo({ cor, compacto, }: {
    cor: CorSemaforo;
    compacto: boolean;
}) {
    const classe = cor === "VERDE"
        ? "bg-emerald-100 text-emerald-800"
        : cor === "AMARELO"
            ? "bg-amber-100 text-amber-800"
            : cor === "VERMELHO"
                ? "bg-red-100 text-red-800"
                : "bg-slate-100 text-slate-600";
    return (<span className={`inline-flex rounded-full font-black ${classe} ${compacto ? "px-2 py-0.5 text-[7.5px]" : "px-2.5 py-1 text-[10px]"}`}>
      {rotuloSemaforo(cor)}
    </span>);
}
function BadgeRisco({ nivel, compacto, }: {
    nivel: NivelRiscoMatriz;
    compacto: boolean;
}) {
    const classe = nivel === "BAIXO"
        ? "bg-emerald-100 text-emerald-800"
        : nivel === "MODERADO"
            ? "bg-amber-100 text-amber-800"
            : nivel === "ALTO"
                ? "bg-orange-100 text-orange-800"
                : "bg-red-100 text-red-800";
    return (<span className={`inline-flex rounded-full font-black ${classe} ${compacto ? "px-2 py-0.5 text-[7.5px]" : "px-2.5 py-1 text-[10px]"}`}>
      {rotuloNivelRisco(nivel)}
    </span>);
}
function ThInventario({ children, centro = false, compacto, }: {
    children: ReactNode;
    centro?: boolean;
    compacto: boolean;
}) {
    return (<th className={`border border-slate-200 font-black text-slate-600 ${centro ? "text-center" : "text-left"} ${compacto ? "px-2 py-2" : "px-3 py-3"}`}>
      {children}
    </th>);
}
function TdInventario({ children, centro = false, compacto, }: {
    children: ReactNode;
    centro?: boolean;
    compacto: boolean;
}) {
    return (<td className={`border border-slate-200 align-middle text-slate-700 ${centro ? "text-center" : "text-left"} ${compacto ? "px-2 py-2" : "px-3 py-3"}`}>
      {children}
    </td>);
}
function LegendaRisco({ texto, classe, }: {
    texto: string;
    classe: string;
}) {
    return (<span className={`rounded-full border px-3 py-1 font-black ${classe}`}>
      {texto}
    </span>);
}
function obterCorSemaforo(classificacao?: string | null): CorSemaforo {
    const classe = normalizarTexto(classificacao);
    if ([
        "TRIVIAL",
        "TOLERAVEL",
        "BAIXO",
        "FAVORAVEL",
        "VERDE",
        "SITUACAO FAVORAVEL",
    ].includes(classe)) {
        return "VERDE";
    }
    if ([
        "MODERADO",
        "INTERMEDIARIO",
        "INTERMEDIARIA",
        "NEUTRO",
        "AMARELO",
        "ATENCAO",
    ].includes(classe)) {
        return "AMARELO";
    }
    if ([
        "SUBSTANCIAL",
        "INTOLERAVEL",
        "ALTO",
        "CRITICO",
        "DESFAVORAVEL",
        "VERMELHO",
        "RISCO",
        "RISCO PARA A SAUDE",
    ].includes(classe)) {
        return "VERMELHO";
    }
    return "CINZA";
}
function classeTextoSemaforo(cor: CorSemaforo) {
    if (cor === "VERDE")
        return "text-emerald-700";
    if (cor === "AMARELO")
        return "text-amber-700";
    if (cor === "VERMELHO")
        return "text-red-700";
    return "text-slate-500";
}
function rotuloSemaforo(cor: CorSemaforo) {
    if (cor === "VERDE")
        return "Favorável";
    if (cor === "AMARELO")
        return "Atenção";
    if (cor === "VERMELHO")
        return "Risco";
    return "Sem faixa";
}
function obterNivelExposicao(score: number | null, tamanho: TamanhoMatrizRisco) {
    if (score === null || !Number.isFinite(score)) {
        return null;
    }
    const normalizado = Math.min(100, Math.max(0, score));
    if (normalizado === 0) {
        return 1;
    }
    return Math.min(tamanho, Math.max(1, Math.ceil((normalizado / 100) * tamanho)));
}
function normalizarSeveridade(valor: number | undefined, tamanho: TamanhoMatrizRisco) {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1 || numero > tamanho) {
        return 0;
    }
    return numero;
}
function calcularNivelRisco(probabilidade: number, severidade: number, tamanho: TamanhoMatrizRisco) {
    const produto = probabilidade * severidade;
    const proporcao = produto / (tamanho * tamanho);
    const nivel: NivelRiscoMatriz = proporcao <= 0.25
        ? "BAIXO"
        : proporcao <= 0.5
            ? "MODERADO"
            : proporcao <= 0.75
                ? "ALTO"
                : "CRITICO";
    return {
        produto,
        nivel,
    };
}
function rotuloNivelRisco(nivel: NivelRiscoMatriz) {
    if (nivel === "BAIXO")
        return "Baixo";
    if (nivel === "MODERADO")
        return "Moderado";
    if (nivel === "ALTO")
        return "Alto";
    return "Crítico";
}
function classeCelulaRisco(nivel: NivelRiscoMatriz) {
    if (nivel === "BAIXO") {
        return "border-emerald-200 bg-emerald-50 text-emerald-900";
    }
    if (nivel === "MODERADO") {
        return "border-amber-200 bg-amber-50 text-amber-900";
    }
    if (nivel === "ALTO") {
        return "border-orange-200 bg-orange-50 text-orange-900";
    }
    return "border-red-200 bg-red-50 text-red-900";
}
function rotuloExposicao(tamanho: TamanhoMatrizRisco, nivel: number) {
    const rotulos: Record<TamanhoMatrizRisco, string[]> = {
        3: ["Baixa", "Moderada", "Alta"],
        4: ["Baixa", "Moderada", "Alta", "Muito alta"],
        5: ["Muito baixa", "Baixa", "Moderada", "Alta", "Muito alta"],
    };
    return rotulos[tamanho][nivel - 1] || `Nível ${nivel}`;
}
function rotuloSeveridade(tamanho: TamanhoMatrizRisco, nivel: number) {
    const rotulos: Record<TamanhoMatrizRisco, string[]> = {
        3: ["Leve", "Moderada", "Grave"],
        4: ["Leve", "Moderada", "Grave", "Muito grave"],
        5: [
            "Insignificante",
            "Leve",
            "Moderada",
            "Grave",
            "Catastrófica",
        ],
    };
    return rotulos[tamanho][nivel - 1] || `Nível ${nivel}`;
}
function formatarScore(score: number | null) {
    if (score === null || !Number.isFinite(score)) {
        return "—";
    }
    return `${score.toFixed(1).replace(".", ",")}/100`;
}
function normalizarTexto(valor?: string | null) {
    return String(valor || "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
