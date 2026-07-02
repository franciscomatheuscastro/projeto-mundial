import PesquisasTela from "@/src/app/components/pesquisas/PesquisasTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PesquisaRelatorioPage({ params }: PageProps) {
  const { id } = await params;

  return <PesquisasTela modo="relatorio" pesquisaId={id} contexto="mundial" />;
}