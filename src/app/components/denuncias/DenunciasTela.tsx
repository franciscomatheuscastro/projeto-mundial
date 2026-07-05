"use client";

import Link from "next/link";
import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";

type Props = {
  contexto?: "mundial" | "cliente";
};

function formatarData(data?: Date | string) {
  if (!data) return "-";

  return new Date(data).toLocaleDateString("pt-BR");
}

export default function DenunciasTela({ contexto = "mundial" }: Props) {
  const { denuncias, carregando, erro } = useDenuncias(true, contexto);

  const baseHref = contexto === "cliente" ? "/minhas-denuncias" : "/denuncias";

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Denúncias</h1>
          <p className="text-sm text-slate-500">
            {contexto === "cliente"
              ? "Acompanhe as denúncias recebidas pela sua empresa."
              : "Gestão das denúncias recebidas pelos canais das empresas."}
          </p>
        </div>

        <Link
          href={contexto === "cliente" ? "/minhas-denuncias/nova" : "/denuncias/nova"}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova denúncia
        </Link>
      </header>

      <section className="px-8 py-6">
        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card titulo="Denúncias" valor={denuncias.length} />
          <Card
            titulo="Em análise"
            valor={denuncias.filter((d) => d.status === "EM_ANALISE").length}
          />
          <Card
            titulo="Em tratativa"
            valor={denuncias.filter((d) => d.status === "EM_TRATATIVA").length}
          />
          <Card
            titulo="Concluídas"
            valor={denuncias.filter((d) => d.status === "CONCLUIDA").length}
          />
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <Th>Data</Th>
                <Th>Protocolo</Th>
                {contexto === "mundial" && <Th>Empresa</Th>}
                <Th>Título</Th>
                <Th>Gravidade</Th>
                <Th>Status</Th>
                <Th direita>Opções</Th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <LinhaVazia
                  colunas={contexto === "mundial" ? 7 : 6}
                  texto="Carregando denúncias..."
                />
              ) : denuncias.length === 0 ? (
                <LinhaVazia
                  colunas={contexto === "mundial" ? 7 : 6}
                  texto="Nenhuma denúncia recebida."
                />
              ) : (
                denuncias.map((denuncia) => (
                  <tr key={denuncia.id ?? denuncia.protocolo} className="border-t">
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {formatarData(denuncia.criadoEm)}
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-900">
                      {denuncia.protocolo}
                    </td>

                    {contexto === "mundial" && (
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {denuncia.cliente.empresa || denuncia.cliente.nome}
                      </td>
                    )}

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {denuncia.titulo}
                    </td>

                    <td className="px-4 py-4">
                      <Badge texto={denuncia.gravidade} />
                    </td>

                    <td className="px-4 py-4">
                      <Badge texto={denuncia.status} />
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`${baseHref}/${denuncia.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}

function Badge({ texto }: { texto: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
      {texto}
    </span>
  );
}

function Th({
  children,
  direita = false,
}: {
  children: React.ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-sm font-semibold text-slate-600 ${
        direita ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function LinhaVazia({ colunas, texto }: { colunas: number; texto: string }) {
  return (
    <tr>
      <td
        colSpan={colunas}
        className="px-4 py-10 text-center text-sm text-slate-500"
      >
        {texto}
      </td>
    </tr>
  );
}