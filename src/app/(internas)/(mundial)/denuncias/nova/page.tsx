import { auth } from "@/src/auth";
import { redirect } from "next/navigation";

import Backend from "@/src/backend";

import DenunciaFormularioTela from "@/src/app/components/denuncias/DenunciaFormularioTela";

export default async function NovaDenunciaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: string;
  };

  const perfisPermitidos = [
    "ADMIN",
    "GESTOR",
    "PSICOLOGO",
    "ASSISTENTE_SOCIAL",
  ];

  if (
    !usuario.perfil ||
    !perfisPermitidos.includes(usuario.perfil)
  ) {
    redirect("/painel-controle");
  }

  const categoriasBanco =
    await Backend.categoriasDenuncia.obterAtivas();

  const categorias = categoriasBanco
    .filter(
      (
        categoria
      ): categoria is typeof categoria & {
        id: string;
      } => Boolean(categoria.id)
    )
    .map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      descricao: categoria.descricao ?? null,
    }));

  return (
    <DenunciaFormularioTela
      contexto="mundial"
      categorias={categorias}
    />
  );
}