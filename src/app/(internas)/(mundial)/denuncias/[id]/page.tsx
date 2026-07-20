import { auth } from "@/src/auth";

import {
  notFound,
  redirect,
} from "next/navigation";

import Backend from "@/src/backend";

import DenunciaDetalheTela from "@/src/app/components/denuncias/DenunciaDetalheTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const PERFIS_PERMITIDOS = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];

export default async function DenunciaDetalhePage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: string;
  };

  if (
    !usuario.perfil ||
    !PERFIS_PERMITIDOS.includes(
      usuario.perfil
    )
  ) {
    redirect("/painel-controle");
  }

  const { id } = await params;

  if (!id?.trim()) {
    notFound();
  }

  const denuncia =
    await Backend.denuncias.obterPorId(id);

  if (!denuncia) {
    notFound();
  }

  let colaboradoresDisponiveis: Array<{
    id: string;
    nome: string;
    email?: string | null;
    cargo?: string | null;
    setor?: string | null;
  }> = [];

  try {
    const colaboradores =
      await Backend.colaboradoresCliente.obterPorCliente(
        denuncia.clienteId
      );

    colaboradoresDisponiveis =
      colaboradores
        .filter(
          (colaborador) =>
            colaborador.ativo === true &&
            colaborador.podeTratarDenuncias ===
              true
        )
        .map((colaborador) => ({
          id: colaborador.id,
          nome: colaborador.nome,
          email:
            colaborador.email ?? null,
          cargo:
            colaborador.cargo ?? null,
          setor:
            colaborador.setor ?? null,
        }));
  } catch (error) {
    console.error(
      "Erro ao carregar colaboradores da denúncia:",
      error
    );

    /*
     * A denúncia continua sendo exibida.
     * Somente a lista de colaboradores fica vazia.
     */
  }

  return (
    <DenunciaDetalheTela
      id={id}
      contexto="mundial"
      podeGerenciar
      podeLiberarTratativa
      podeTratar
      podeVerTratativas
      podeEditarTratativas
      colaboradoresDisponiveis={
        colaboradoresDisponiveis
      }
    />
  );
}