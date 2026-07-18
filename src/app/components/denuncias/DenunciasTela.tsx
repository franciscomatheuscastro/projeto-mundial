"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";
import { useClientes } from "@/src/app/data/hooks/useClientes";

type Props = {
  contexto?: "mundial" | "cliente";
  podeCriar?: boolean;
};

export default function DenunciasTela({
  contexto = "mundial",
  podeCriar,
}: Props) {
  const {
    denuncias,
    carregando,
    erro,
  } = useDenuncias(true, contexto);

  const {
    clientes,
    carregarClientes,
  } = useClientes();

  const [dataInicio, setDataInicio] =
    useState("");

  const [dataFim, setDataFim] =
    useState("");

  const [clienteId, setClienteId] =
    useState("");

  const [filtrosAplicados, setFiltrosAplicados] =
    useState({
      dataInicio: "",
      dataFim: "",
      clienteId: "",
    });

  const [erroFiltro, setErroFiltro] =
    useState<string | null>(null);

  const usuarioMundial =
    contexto === "mundial";

  const exibirBotaoNovaDenuncia =
    podeCriar ?? usuarioMundial;

  const baseHref = usuarioMundial
    ? "/denuncias"
    : "/minhas-denuncias";

  useEffect(() => {
    if (usuarioMundial) {
      carregarClientes();
    }
  }, [
    usuarioMundial,
    carregarClientes,
  ]);

  const denunciasFiltradas = useMemo(() => {
    return denuncias.filter((denuncia) => {
      const dataDenuncia = new Date(
        denuncia.criadoEm
      );

      if (
        Number.isNaN(dataDenuncia.getTime())
      ) {
        return false;
      }

      if (filtrosAplicados.dataInicio) {
        const inicio = new Date(
          `${filtrosAplicados.dataInicio}T00:00:00`
        );

        if (dataDenuncia < inicio) {
          return false;
        }
      }

      if (filtrosAplicados.dataFim) {
        const fim = new Date(
          `${filtrosAplicados.dataFim}T23:59:59.999`
        );

        if (dataDenuncia > fim) {
          return false;
        }
      }

      if (
        usuarioMundial &&
        filtrosAplicados.clienteId &&
        denuncia.clienteId !==
          filtrosAplicados.clienteId
      ) {
        return false;
      }

      return true;
    });
  }, [
    denuncias,
    filtrosAplicados,
    usuarioMundial,
  ]);

  const recebidas =
    denunciasFiltradas.filter(
      (denuncia) =>
        denuncia.status === "RECEBIDA"
    ).length;

  const emAnalise =
    denunciasFiltradas.filter(
      (denuncia) =>
        denuncia.status === "EM_ANALISE"
    ).length;

  const emTratativa =
    denunciasFiltradas.filter(
      (denuncia) =>
        denuncia.status === "EM_TRATATIVA"
    ).length;

  const concluidas =
    denunciasFiltradas.filter(
      (denuncia) =>
        denuncia.status === "CONCLUIDA"
    ).length;

  function validarPeriodo() {
    if (
      dataInicio &&
      dataFim &&
      dataInicio > dataFim
    ) {
      setErroFiltro(
        "A data inicial não pode ser posterior à data final."
      );

      return false;
    }

    setErroFiltro(null);

    return true;
  }

  function aplicarFiltros() {
    if (!validarPeriodo()) {
      return;
    }

    setFiltrosAplicados({
      dataInicio,
      dataFim,
      clienteId:
        usuarioMundial
          ? clienteId
          : "",
    });
  }

  function limparFiltros() {
    setDataInicio("");
    setDataFim("");
    setClienteId("");
    setErroFiltro(null);

    setFiltrosAplicados({
      dataInicio: "",
      dataFim: "",
      clienteId: "",
    });
  }

  function gerarRelatorio() {
    if (!validarPeriodo()) {
      return;
    }

    const parametros =
      new URLSearchParams();

    if (dataInicio) {
      parametros.set(
        "dataInicio",
        dataInicio
      );
    }

    if (dataFim) {
      parametros.set(
        "dataFim",
        dataFim
      );
    }

    if (
      usuarioMundial &&
      clienteId
    ) {
      parametros.set(
        "clienteId",
        clienteId
      );
    }

    const query =
      parametros.toString();

    const url = query
      ? `/relatorios/denuncias?${query}`
      : "/relatorios/denuncias";

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

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

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              {usuarioMundial
                ? "Gestão, direcionamento e acompanhamento das denúncias recebidas pelos canais das empresas."
                : "Acompanhe as denúncias da sua empresa conforme as permissões do seu perfil."}
            </p>
          </div>

          {exibirBotaoNovaDenuncia && (
            <Link
              href={`${baseHref}/nova`}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
            >
              Nova denúncia
            </Link>
          )}
        </div>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {(erro || erroFiltro) && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erroFiltro || erro}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Filtros e relatório
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Selecione o período
              {usuarioMundial
                ? " e o cliente"
                : ""}
              {" "}para consultar ou gerar o relatório.
            </p>
          </div>

          <div
            className={`mt-5 grid gap-4 ${
              usuarioMundial
                ? "md:grid-cols-2 xl:grid-cols-3"
                : "md:grid-cols-2"
            }`}
          >
            <CampoData
              label="Data inicial"
              value={dataInicio}
              onChange={setDataInicio}
            />

            <CampoData
              label="Data final"
              value={dataFim}
              onChange={setDataFim}
            />

            {usuarioMundial && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Cliente
                </label>

                <select
                  value={clienteId}
                  onChange={(event) =>
                    setClienteId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    Todos os clientes
                  </option>

                  {clientes.map((cliente) => (
                    <option
                      key={cliente.id}
                      value={cliente.id}
                    >
                      {cliente.empresa ||
                        cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={aplicarFiltros}
              className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Aplicar filtros
            </button>

            <button
              type="button"
              onClick={gerarRelatorio}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Gerar relatório
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card
            titulo="Total"
            valor={denunciasFiltradas.length}
          />

          <Card
            titulo="Recebidas"
            valor={recebidas}
          />

          <Card
            titulo="Em análise"
            valor={emAnalise}
          />

          <Card
            titulo="Em tratativa"
            valor={emTratativa}
          />

          <Card
            titulo="Concluídas"
            valor={concluidas}
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Registros
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {denunciasFiltradas.length} denúncia(s)
              encontrada(s) nos filtros aplicados.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Data</Th>
                  <Th>Protocolo</Th>

                  {usuarioMundial && (
                    <Th>Empresa</Th>
                  )}

                  <Th>Categoria</Th>
                  <Th>Título</Th>
                  <Th>Gravidade</Th>
                  <Th>Status</Th>
                  <Th direita>Opções</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia
                    colunas={
                      usuarioMundial ? 8 : 7
                    }
                    texto="Carregando denúncias..."
                  />
                ) : denunciasFiltradas.length ===
                  0 ? (
                  <LinhaVazia
                    colunas={
                      usuarioMundial ? 8 : 7
                    }
                    texto="Nenhuma denúncia encontrada para os filtros selecionados."
                  />
                ) : (
                  denunciasFiltradas.map(
                    (denuncia) => (
                      <tr
                        key={denuncia.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          {formatarData(
                            denuncia.criadoEm
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">
                          {denuncia.protocolo}
                        </td>

                        {usuarioMundial && (
                          <td className="px-4 py-4 text-sm text-slate-700">
                            <div className="max-w-[220px] truncate">
                              {denuncia.cliente
                                .empresa ||
                                denuncia.cliente
                                  .nome}
                            </div>
                          </td>
                        )}

                        <td className="px-4 py-4 text-sm text-slate-700">
                          <div className="max-w-[200px] truncate">
                            {denuncia.categoria
                              ?.nome ||
                              "Sem categoria"}
                          </div>
                        </td>

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
                            texto={
                              denuncia.status
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`${baseHref}/${denuncia.id}`}
                            className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                          >
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function CampoData({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
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
              : "bg-purple-100 text-purple-700";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${classe}`}
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
      className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${
        direita
          ? "text-right"
          : "text-left"
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

function formatarData(
  data?: Date | string
) {
  if (!data) {
    return "-";
  }

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "-";
  }

  return valor.toLocaleDateString(
    "pt-BR"
  );
}

function formatarTexto(
  valor: string
) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase()
    );
}