import PlanoAcaoDetalheTela from "@/src/app/components/planos-acao/PlanoAcaoDetalheTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MeuPlanoAcaoDetalhePage({ params }: PageProps) {
  const { id } = await params;

  return <PlanoAcaoDetalheTela id={id} contexto="cliente" />;
}