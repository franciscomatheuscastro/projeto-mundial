import { redirect } from "next/navigation";

import { auth } from "@/src/auth";
import Backend from "@/src/backend";

import RelatorioPesquisasClimaTela from "@/src/app/components/pesquisas/RelatorioPesquisasClimaTela";

type PageProps = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
  }>;
};

export default async function RelatorioPesquisasPage({
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const filtros =
    await searchParams;

  const dados =
    await Backend.pesquisasCliente.obterDadosRelatorio({
      dataInicio:
        filtros.dataInicio,

      dataFim:
        filtros.dataFim,

      clienteId:
        filtros.clienteId,
    });

  return (
    <RelatorioPesquisasClimaTela
      dados={dados}
    />
  );
}