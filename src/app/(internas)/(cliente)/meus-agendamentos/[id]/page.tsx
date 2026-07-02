import AgendamentoDetalheTela from "@/src/app/components/agendamentos/AgendamentoDetalheTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MeuAgendamentoDetalhePage({ params }: PageProps) {
  const { id } = await params;

  return <AgendamentoDetalheTela id={id} contexto="cliente" />;
}