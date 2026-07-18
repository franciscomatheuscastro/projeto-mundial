import { auth } from "@/src/auth";

import {
  notFound,
  redirect,
} from "next/navigation";

import Backend from "@/src/backend";

import PerguntaCanalDenunciaFormulario from "@/src/app/components/denuncias/PerguntaCanalDenunciaFormulario";

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

export default async function EditarPerguntaCanalPage({
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

  try {
    const pergunta =
      await Backend.perguntasCanalDenuncia.obterPorId(
        id
      );

    return (
      <PerguntaCanalDenunciaFormulario
        perguntaInicial={pergunta}
      />
    );
  } catch (error) {
    console.error(
      "Erro ao carregar pergunta do canal:",
      error
    );

    notFound();
  }
}