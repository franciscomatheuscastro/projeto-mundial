import AgendamentoDetalheTela from "@/src/app/components/agendamentos/AgendamentoDetalheTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AgendamentoDetalhePage({ params }: PageProps) {
  const { id } = await params;

  return <AgendamentoDetalheTela id={id} />;
}