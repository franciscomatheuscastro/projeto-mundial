"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PerfilUsuario } from "@prisma/client";
import Backend from "@/src/backend";
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
    excluirCliente,
    salvarCliente,
  } = useClientes();

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [criarUsuarioMaster, setCriarUsuarioMaster] = useState(false);
  const [nomeUsuarioMaster, setNomeUsuarioMaster] = useState("");
  const [emailUsuarioMaster, setEmailUsuarioMaster] = useState("");
  const [senhaUsuarioMaster, setSenhaUsuarioMaster] = useState("");

  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const linkCanalDenuncias =
    modo === "editar" && clienteId
      ? `${baseUrl}/canal-denuncias/${clienteId}`
      : "";

  const linkConsultaDenuncias =
    modo === "editar" && clienteId
      ? `${baseUrl}/canal-denuncias/${clienteId}/consultar`
      : "";

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

  useEffect(() => {
    if (criarUsuarioMaster) {
      setNomeUsuarioMaster(nome || empresa || "");
      setEmailUsuarioMaster(email || "");
    }
  }, [criarUsuarioMaster, nome, empresa, email]);

  async function copiarTexto(texto: string, tipo: string) {
    if (!texto) return;

    await navigator.clipboard.writeText(texto);
    setCopiado(tipo);

    setTimeout(() => {
      setCopiado(null);
    }, 2000);
  }

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setErroLocal(null);

      if (criarUsuarioMaster) {
        if (!nomeUsuarioMaster.trim()) {
          throw new Error("Nome do usuário master é obrigatório.");
        }

        if (!emailUsuarioMaster.trim()) {
          throw new Error("E-mail do usuário master é obrigatório.");
        }

        if (!senhaUsuarioMaster.trim()) {
          throw new Error("Senha provisória do usuário master é obrigatória.");
        }
      }

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

      if (criarUsuarioMaster) {
        await Backend.usuarios.salvar({
          nome: nomeUsuarioMaster,
          email: emailUsuarioMaster,
          senha: senhaUsuarioMaster,
          perfil: PerfilUsuario.CLIENTE,
          ativo: true,
          clienteId: resultado.id,
        });
      }

      router.push(`/clientes/${resultado.id}`);
      router.refresh();
    } catch (error) {
      setErroLocal(
        error instanceof Error ? error.message : "Erro ao salvar cliente."
      );
    }
  }

  async function excluirClienteAtual(id: string) {
    const confirmado = confirm("Tem certeza que deseja excluir este cliente?");
    if (!confirmado) return;

    await excluirCliente(id);

    router.push("/clientes");
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
        <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                Clientes
              </p>

              <h1 className="mt-1 text-2xl font-black text-slate-900">
                Gestão de Clientes
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Gerencie empresas, pesquisas e acessos ao painel do cliente.
              </p>
            </div>

            <Link
              href="/clientes/novo"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              + Novo cliente
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {(erro || erroLocal) && <AlertaErro mensagem={erro || erroLocal} />}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CardResumo titulo="Clientes" valor={totalClientes} />
            <CardResumo titulo="Ativos" valor={totalAtivos} />
            <CardResumo titulo="Pesquisas vinculadas" valor={totalPesquisas} />
          </div>

          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[760px] border-collapse">
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
                  <LinhaVazia colunas={5} texto="Carregando clientes..." />
                ) : clientes.length === 0 ? (
                  <LinhaVazia colunas={5} texto="Nenhum cliente cadastrado." />
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-t border-slate-100">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">
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

                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        {cliente.totalPesquisas}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge ativo={cliente.ativo} />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/clientes/${cliente.id}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() => excluirClienteAtual(cliente.id)}
                          disabled={processando}
                          className="ml-4 text-sm font-bold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Excluir
                        </button>
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
      <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
              Cliente
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              {modo === "novo" ? "Novo Cliente" : "Editar Cliente"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Cadastre a empresa e libere o acesso ao painel do cliente.
            </p>
          </div>

          <Link
            href="/clientes"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section
        className={
          modo === "novo"
            ? "mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8"
            : "mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[520px_1fr] lg:px-8"
        }
      >
        <form
          onSubmit={enviarFormulario}
          className="h-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
        >
          {(erro || erroLocal) && <AlertaErro mensagem={erro || erroLocal} />}

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

          <div className="grid gap-4 md:grid-cols-2">
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
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Observações
            </label>

            <textarea
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações complementares sobre o cliente"
              className={inputClassName}
            />
          </div>

          {modo === "editar" && (
            <label className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="h-4 w-4"
              />
              Cliente ativo
            </label>
          )}

          <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <label className="flex items-start gap-3 text-sm font-bold text-blue-950">
              <input
                type="checkbox"
                checked={criarUsuarioMaster}
                onChange={(e) => setCriarUsuarioMaster(e.target.checked)}
                className="mt-1 h-4 w-4"
              />

              <span>
                Criar usuário master para o painel do cliente
                <small className="mt-1 block font-normal text-blue-800">
                  Use para liberar o acesso do gestor da empresa.
                </small>
              </span>
            </label>

            {criarUsuarioMaster && (
              <div className="mt-5 space-y-1">
                <Campo
                  label="Nome do usuário"
                  value={nomeUsuarioMaster}
                  onChange={setNomeUsuarioMaster}
                  required
                  placeholder="Ex: Gestor Transordi"
                />

                <Campo
                  label="E-mail de acesso"
                  type="email"
                  value={emailUsuarioMaster}
                  onChange={setEmailUsuarioMaster}
                  required
                  placeholder="gestor@empresa.com"
                />

                <Campo
                  label="Senha provisória"
                  type="password"
                  value={senhaUsuarioMaster}
                  onChange={setSenhaUsuarioMaster}
                  required
                  placeholder="Defina uma senha provisória"
                />
              </div>
            )}
          </div>

          <button
            disabled={processando}
            className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processando ? "Salvando..." : "Salvar cliente"}
          </button>

          {modo === "editar" && clienteId && (
            <button
              type="button"
              onClick={() => excluirClienteAtual(clienteId)}
              disabled={processando}
              className="mt-3 min-h-12 w-full rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Excluir cliente
            </button>
          )}
        </form>

        {modo === "editar" && (
          <div className="space-y-6">
            <Painel titulo="Canal de denúncias" subtitulo="Links públicos exclusivos para colaboradores.">
              <div className="mb-5 flex justify-start">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  Ativo
                </span>
              </div>

              <div className="space-y-4">
                <BlocoLink
                  titulo="Link para registrar denúncia"
                  valor={linkCanalDenuncias}
                  copiado={copiado === "canal"}
                  onCopiar={() => copiarTexto(linkCanalDenuncias, "canal")}
                />

                <BlocoLink
                  titulo="Link para consultar protocolo"
                  valor={linkConsultaDenuncias}
                  copiado={copiado === "consulta"}
                  onCopiar={() =>
                    copiarTexto(linkConsultaDenuncias, "consulta")
                  }
                />
              </div>
            </Painel>

            <Painel
              titulo="Pesquisas do cliente"
              subtitulo="Histórico de pesquisas geradas para este cliente."
              acao={
                <Link
                  href="/pesquisas/nova"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                  + Nova pesquisa
                </Link>
              }
            >
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[600px] border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Pesquisa</Th>
                      <Th>Modelo</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {!clienteSelecionado || carregando ? (
                      <LinhaVazia colunas={3} texto="Carregando pesquisas..." />
                    ) : clienteSelecionado.pesquisas.length === 0 ? (
                      <LinhaVazia
                        colunas={3}
                        texto="Nenhuma pesquisa gerada para este cliente."
                      />
                    ) : (
                      clienteSelecionado.pesquisas.map((pesquisa) => (
                        <tr key={pesquisa.id} className="border-t border-slate-100">
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900">
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
            </Painel>
          </div>
        )}
      </section>
    </main>
  );
}

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

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
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
      />
    </div>
  );
}

function CardResumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-3xl font-black text-slate-900">
        {valor}
      </strong>
    </div>
  );
}

function Painel({
  titulo,
  subtitulo,
  children,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">{titulo}</h2>

          {subtitulo && (
            <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
          )}
        </div>

        {acao}
      </div>

      {children}
    </div>
  );
}

function BlocoLink({
  titulo,
  valor,
  copiado,
  onCopiar,
}: {
  titulo: string;
  valor: string;
  copiado: boolean;
  onCopiar: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{titulo}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={valor}
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
        />

        <button
          type="button"
          onClick={onCopiar}
          className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  return ativo ? (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      Ativo
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
      Inativo
    </span>
  );
}

function AlertaErro({
  mensagem,
}: {
  mensagem: string | null;
}) {
  if (!mensagem) return null;

  return (
    <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
      {mensagem}
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
      className={`px-4 py-3 text-sm font-bold text-slate-600 ${
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