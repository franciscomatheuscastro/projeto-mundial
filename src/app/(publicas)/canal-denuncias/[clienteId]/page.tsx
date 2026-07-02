import CanalDenunciasPublicoTela from "@/src/app/components/denuncias-publico/CanalDenunciasPublicoTela";

type PageProps = {
  params: Promise<{
    clienteId: string;
  }>;
};

export default async function CanalDenunciasPublicoPage({ params }: PageProps) {
  const { clienteId } = await params;

  return <CanalDenunciasPublicoTela clienteId={clienteId} />;
}