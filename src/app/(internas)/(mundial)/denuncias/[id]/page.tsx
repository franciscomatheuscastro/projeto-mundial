import DenunciaDetalheTela from "@/src/app/components/denuncias/DenunciaDetalheTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DenunciaDetalhePage({ params }: PageProps) {
  const { id } = await params;

  return <DenunciaDetalheTela id={id} contexto="mundial" />;
}