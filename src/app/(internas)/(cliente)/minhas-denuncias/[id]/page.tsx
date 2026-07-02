import DenunciaDetalheTela from "@/src/app/components/denuncias/DenunciaDetalheTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClienteDenunciaDetalhePage({ params }: PageProps) {
  const { id } = await params;

  return <DenunciaDetalheTela id={id} contexto="cliente" />;
}