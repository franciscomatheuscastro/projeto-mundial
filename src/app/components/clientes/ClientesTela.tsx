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

  const linkConsultaDenuncias = `${baseUrl}/canal-denuncias/consultar`;

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
  }, [criarUsuarioMaster]);

  async function copiarTexto(texto: string, tipo: string) {
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
        <header className="flex items-center justify-between border-b bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
            <p className="text-sm text-slate-500">
              Gerencie clientes, pesquisas e acessos ao painel da empresa.
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
          {(erro || erroLocal) && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro || erroLocal}
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
                  <LinhaVazia colunas={5} texto="Carregando clientes..." />
                ) : clientes.length === 0 ? (
                  <LinhaVazia colunas={5} texto="Nenhum cliente cadastrado." />
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

                        <button
                          type="button"
                          onClick={() => excluirClienteAtual(cliente.id)}
                          disabled={processando}
                          className="ml-4 text-sm font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
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
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {modo === "novo" ? "Novo Cliente" : "Editar Cliente"}
          </h1>
          <p className="text-sm text-slate-500">
            Cadastre a empresa e libere o acesso ao painel do cliente.
          </p>
        </div>

        <Link
          href="/clientes"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>
      </header>

      <section
        className={
          modo === "novo"
            ? "mx-auto max-w-3xl px-8 py-8"
            : "grid gap-6 px-8 py-8 lg:grid-cols-[520px_1fr]"
        }
      >
        <form
          onSubmit={enviarFormulario}
          className="h-fit rounded-xl bg-white p-6 shadow-sm"
        >
          {(erro || erroLocal) && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro || erroLocal}
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
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
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

          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <label className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-900">
              <input
                type="checkbox"
                checked={criarUsuarioMaster}
                onChange={(e) => setCriarUsuarioMaster(e.target.checked)}
              />
              Criar usuário master para o painel do cliente
            </label>

            {criarUsuarioMaster && (
              <div className="space-y-4">
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
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processando ? "Salvando..." : "Salvar cliente"}
          </button>

          {modo === "editar" && clienteId && (
            <button
              type="button"
              onClick={() => excluirClienteAtual(clienteId)}
              disabled={processando}
              className="mt-3 w-full rounded-lg border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Excluir cliente
            </button>
          )}
        </form>

        {modo === "editar" && (
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Canal de denúncias
                  </h2>
                  <p className="text-sm text-slate-500">
                    Link público exclusivo para colaboradores registrarem
                    denúncias.
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
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
            </div>

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
                      <LinhaVazia colunas={3} texto="Carregando pesquisas..." />
                    ) : clienteSelecionado.pesquisas.length === 0 ? (
                      <LinhaVazia
                        colunas={3}
                        texto="Nenhuma pesquisa gerada para este cliente."
                      />
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
          </div>
        )}
      </section>
    </main>
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
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
      />
    </div>
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
      <p className="mb-2 text-sm font-medium text-slate-700">{titulo}</p>

      <div className="flex gap-2">
        <input
          readOnly
          value={valor}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
        />

        <button
          type="button"
          onClick={onCopiar}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
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