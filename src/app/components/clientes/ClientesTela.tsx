"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClientes } from "@/src/app/data/hooks/useClientes";

type ClientesTelaProps = {
  modo: "lista" | "novo" | "editar";
  clienteId?: string;
};

export default function ClientesTela({ modo, clienteId }: ClientesTelaProps) {
  const router = useRouter();

  const {
    clientes,
    clienteSelecionado,
    carregando,
    processando,
    erro,
    carregarClientePorId,
    salvarCliente,
  } = useClientes();

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (modo === "editar" && clienteId) {
      carregarClientePorId(clienteId);
    }
  }, [modo, clienteId]);

  useEffect(() => {
    if (modo === "editar" && clienteSelecionado) {
      setNome(clienteSelecionado.nome);
      setEmpresa(clienteSelecionado.empresa ?? "");
      setEmail(clienteSelecionado.email ?? "");
      setTelefone(clienteSelecionado.telefone ?? "");
      setDocumento(clienteSelecionado.documento ?? "");
      setObservacoes(clienteSelecionado.observacoes ?? "");
      setAtivo(clienteSelecionado.ativo);
    }
  }, [modo, clienteSelecionado]);

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resultado = await salvarCliente({
      id: modo === "editar" ? clienteId : undefined,
      nome,
      empresa,
      email,
      telefone,
      documento,
      observacoes,
      ativo,
    });

    router.push(`/clientes/${resultado.id}`);
    router.refresh();
  }

  if (modo === "lista") {
    const totalClientes = clientes.length;
    const totalAtivos = clientes.filter((cliente) => cliente.ativo).length;
    const totalPesquisas = clientes.reduce(
      (total, cliente) => total + cliente.totalPesquisas,
      0
    );

    return (
      <main className="min-h-screen bg-slate-100">
        <header className="flex items-center justify-between border-b bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
            <p className="text-sm text-slate-500">
              Gerencie os clientes que receberão pesquisas.
            </p>
          </div>

          <Link
            href="/clientes/novo"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo cliente
          </Link>
        </header>

        <section className="px-8 py-6">
          {erro && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro}
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <CardResumo titulo="Clientes" valor={totalClientes} />
            <CardResumo titulo="Ativos" valor={totalAtivos} />
            <CardResumo titulo="Pesquisas vinculadas" valor={totalPesquisas} />
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Cliente</Th>
                  <Th>Contato</Th>
                  <Th>Pesquisas</Th>
                  <Th>Status</Th>
                  <Th direita>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Carregando clientes...
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Nenhum cliente cadastrado.
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-t">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {cliente.nome}
                        </div>
                        <div className="text-sm text-slate-500">
                          {cliente.empresa || "Sem empresa informada"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{cliente.email || "Sem e-mail"}</div>
                        <div className="text-slate-500">
                          {cliente.telefone || "Sem telefone"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {cliente.totalPesquisas}
                      </td>

                      <td className="px-4 py-4">
                        {cliente.ativo ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            Ativo
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                            Inativo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/clientes/${cliente.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Editar
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

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {modo === "novo" ? "Novo Cliente" : "Editar Cliente"}
          </h1>
          <p className="text-sm text-slate-500">
            {modo === "novo"
              ? "Cadastre uma empresa ou responsável para receber pesquisas."
              : "Atualize os dados cadastrais e acompanhe pesquisas vinculadas."}
          </p>
        </div>

        <Link
          href="/clientes"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>
      </header>

      <section className={
                    modo === "novo"
                    ? "mx-auto max-w-3xl px-8 py-8"
                    : "grid gap-6 px-8 py-8 lg:grid-cols-[520px_1fr]"
                }>
        <form
          onSubmit={enviarFormulario}
          className="h-fit rounded-xl bg-white p-6 shadow-sm"
        >
          {erro && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro}
            </div>
          )}

          <Campo
            label="Nome do cliente"
            value={nome}
            onChange={setNome}
            required
            placeholder="Ex: Transordi"
          />

          <Campo
            label="Empresa"
            value={empresa}
            onChange={setEmpresa}
            placeholder="Ex: Transordi Transportes"
          />

          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <Campo
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="contato@empresa.com"
            />

            <Campo
              label="Telefone"
              value={telefone}
              onChange={setTelefone}
              placeholder="(00) 00000-0000"
            />
          </div>

          <Campo
            label="Documento"
            value={documento}
            onChange={setDocumento}
            placeholder="CNPJ ou CPF"
          />

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Observações
            </label>
            <textarea
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {modo === "editar" && (
            <label className="mb-6 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              Cliente ativo
            </label>
          )}

          <button
            disabled={processando}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processando ? "Salvando..." : "Salvar cliente"}
          </button>
        </form>

        {modo === "editar" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Pesquisas do cliente
                </h2>
                <p className="text-sm text-slate-500">
                  Histórico de pesquisas geradas para este cliente.
                </p>
              </div>

              <Link
                href="/pesquisas/nova"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                + Nova pesquisa
              </Link>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Pesquisa</Th>
                    <Th>Modelo</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>

                <tbody>
                  {!clienteSelecionado || carregando ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        Carregando pesquisas...
                      </td>
                    </tr>
                  ) : clienteSelecionado.pesquisas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        Nenhuma pesquisa gerada para este cliente.
                      </td>
                    </tr>
                  ) : (
                    clienteSelecionado.pesquisas.map((pesquisa) => (
                      <tr key={pesquisa.id} className="border-t">
                        <td className="px-4 py-4 text-sm text-slate-900">
                          {pesquisa.titulo}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {pesquisa.modelo.titulo}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {pesquisa.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function CardResumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="text-3xl text-slate-900">{valor}</strong>
    </div>
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

function Campo({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}