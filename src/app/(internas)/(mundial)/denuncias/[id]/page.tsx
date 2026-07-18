import { auth } from "@/src/auth";
import { notFound, redirect } from "next/navigation";
import Backend from "@/src/backend";
import DenunciaDetalheTela from "@/src/app/components/denuncias/DenunciaDetalheTela";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DenunciaDetalhePage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as any;

  const perfisPermitidos = [
    "ADMIN",
    "GESTOR",
    "PSICOLOGO",
    "ASSISTENTE_SOCIAL",
  ];

  if (!perfisPermitidos.includes(usuario.perfil)) {
    redirect("/painel-controle");
  }

  const { id } = await params;

  if (!id?.trim()) {
    notFound();
  }

  try {
    const denuncia =
      await Backend.denuncias.obterPorId(id);

    const colaboradores =
      await Backend.colaboradoresCliente.obterPorCliente(
        denuncia.clienteId
      );

    const colaboradoresDisponiveis =
      colaboradores
        .filter(
          (colaborador) =>
            colaborador.ativo &&
            colaborador.podeTratarDenuncias
        )
        .map((colaborador) => ({
          id: colaborador.id,
          nome: colaborador.nome,
          email: colaborador.email,
          cargo: colaborador.cargo,
          setor: colaborador.setor,
        }));

    return (
      <DenunciaDetalheTela
        id={id}
        contexto="mundial"
        podeGerenciar
        podeTratar
        podeVerTratativas
        podeEditarTratativas
        podeLiberarTratativa
        colaboradoresDisponiveis={
          colaboradoresDisponiveis
        }
      />
    );
  } catch (error) {
    console.error(
      "Erro ao carregar os dados da denúncia:",
      error
    );
    notFound();
  }
}
