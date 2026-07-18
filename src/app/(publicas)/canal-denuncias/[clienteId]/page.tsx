import { notFound } from "next/navigation";

import Backend from "@/src/backend";

import CanalDenunciasPublicoTela from "@/src/app/components/denuncias-publico/CanalDenunciasPublicoTela";

type PageProps = {
  params: Promise<{
    clienteId: string;
  }>;
};

export default async function CanalDenunciasPublicoPage({
  params,
}: PageProps) {
  const { clienteId } = await params;

  if (!clienteId?.trim()) {
    notFound();
  }

  try {
    const [cliente, categoriasBanco] =
      await Promise.all([
        Backend.clientes.obterPorId(clienteId),
        Backend.categoriasDenuncia.obterAtivas(),
      ]);

    if (!cliente || !cliente.ativo) {
      notFound();
    }

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
        descricao:
          categoria.descricao ?? null,
      }));

    return (
      <CanalDenunciasPublicoTela
        clienteId={clienteId}
        categorias={categorias}
      />
    );
  } catch (error) {
    console.error(
      "Erro ao carregar o canal público de denúncias:",
      error
    );

    notFound();
  }
}