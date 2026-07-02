import PesquisasTela from "@/src/app/components/pesquisas/PesquisasTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MinhaPesquisaRelatorioPage({
  params,
}: PageProps) {
  const { id } = await params;

  return <PesquisasTela modo="relatorio" pesquisaId={id} contexto="cliente" />;
}