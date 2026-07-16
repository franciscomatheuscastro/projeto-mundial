"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";

type Props = {
  contexto?: "mundial" | "cliente";
  podeCriar?: boolean;
};

function formatarData(data?: Date | string) {
  if (!data) return "-";

  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase()
    );
}

export default function DenunciasTela({
  contexto = "mundial",
  podeCriar,
}: Props) {
  const {
    denuncias,
    carregando,
    erro,
  } = useDenuncias(true, contexto);

  const usuarioMundial = contexto === "mundial";

  const exibirBotaoNovaDenuncia =
    podeCriar ?? usuarioMundial;

  const baseHref = usuarioMundial
    ? "/denuncias"
    : "/minhas-denuncias";

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Canal de Denúncias
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Denúncias
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              {usuarioMundial
                ? "Gestão das denúncias recebidas pelos canais das empresas."
                : "Acompanhe as denúncias, tratativas e respostas da sua empresa."}
            </p>
          </div>

          {exibirBotaoNovaDenuncia && (
            <Link
              href={`${baseHref}/nova`}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              Nova denúncia
            </Link>
          )}
        </div>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card
            titulo="Denúncias"
            valor={denuncias.length}
          />

          <Card
            titulo="Em análise"
            valor={
              denuncias.filter(
                (denuncia) =>
                  denuncia.status === "EM_ANALISE"
              ).length
            }
          />

          <Card
            titulo="Em tratativa"
            valor={
              denuncias.filter(
                (denuncia) =>
                  denuncia.status === "EM_TRATATIVA"
              ).length
            }
          />

          <Card
            titulo="Concluídas"
            valor={
              denuncias.filter(
                (denuncia) =>
                  denuncia.status === "CONCLUIDA"
              ).length
            }
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Data</Th>
                  <Th>Protocolo</Th>

                  {usuarioMundial && (
                    <Th>Empresa</Th>
                  )}

                  <Th>Título</Th>
                  <Th>Gravidade</Th>
                  <Th>Status</Th>
                  <Th direita>Opções</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia
                    colunas={usuarioMundial ? 7 : 6}
                    texto="Carregando denúncias..."
                  />
                ) : denuncias.length === 0 ? (
                  <LinhaVazia
                    colunas={usuarioMundial ? 7 : 6}
                    texto="Nenhuma denúncia recebida."
                  />
                ) : (
                  denuncias.map((denuncia) => (
                    <tr
                      key={
                        denuncia.id ??
                        denuncia.protocolo
                      }
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatarData(
                          denuncia.criadoEm
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {denuncia.protocolo}
                      </td>

                      {usuarioMundial && (
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {denuncia.cliente
                            .empresa ||
                            denuncia.cliente.nome}
                        </td>
                      )}

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="max-w-xs truncate">
                          {denuncia.titulo}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          tipo="gravidade"
                          texto={
                            denuncia.gravidade
                          }
                        />
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          tipo="status"
                          texto={denuncia.status}
                        />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`${baseHref}/${denuncia.id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
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
        </div>
      </section>
    </main>
  );
}

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number | string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {titulo}
      </p>

      <strong className="mt-2 block text-3xl font-bold text-slate-900">
        {valor}
      </strong>
    </div>
  );
}

function Badge({
  texto,
  tipo,
}: {
  texto: string;
  tipo: "status" | "gravidade";
}) {
  const classe =
    tipo === "gravidade"
      ? texto === "CRITICA"
        ? "bg-red-100 text-red-700"
        : texto === "ALTA"
          ? "bg-orange-100 text-orange-700"
          : texto === "MEDIA"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"
      : texto === "CONCLUIDA"
        ? "bg-green-100 text-green-700"
        : texto === "EM_TRATATIVA"
          ? "bg-blue-100 text-blue-700"
          : texto === "EM_ANALISE"
            ? "bg-yellow-100 text-yellow-700"
            : texto === "ARQUIVADA"
              ? "bg-slate-200 text-slate-700"
              : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${classe}`}
    >
      {formatarTexto(texto)}
    </span>
  );
}

function Th({
  children,
  direita = false,
}: {
  children: ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${
        direita ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function LinhaVazia({
  colunas,
  texto,
}: {
  colunas: number;
  texto: string;
}) {
  return (
    <tr>
      <td
        colSpan={colunas}
        className="px-4 py-12 text-center text-sm text-slate-500"
      >
        {texto}
      </td>
    </tr>
  );
}