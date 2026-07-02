import PesquisasTela from "@/src/app/components/pesquisas/PesquisasTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MinhaPesquisaDetalhePage({ params }: PageProps) {
  const { id } = await params;

  return <PesquisasTela modo="detalhe" pesquisaId={id} contexto="cliente" />;
}