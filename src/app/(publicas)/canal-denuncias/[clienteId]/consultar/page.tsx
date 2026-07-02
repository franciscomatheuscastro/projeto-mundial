import ConsultaDenunciaTela from "@/src/app/components/denuncias-publico/ConsultaDenunciaTela";

type PageProps = {
  params: Promise<{
    clienteId: string;
  }>;
};

export default async function ConsultaDenunciaPage({ params }: PageProps) {
  const { clienteId } = await params;

  return <ConsultaDenunciaTela clienteId={clienteId} />;
}