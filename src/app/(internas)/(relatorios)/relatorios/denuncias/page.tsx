import {
  redirect,
} from "next/navigation";

import { auth } from "@/src/auth";
import Backend from "@/src/backend";

import RelatorioDenunciasTela from "@/src/app/components/denuncias/RelatorioDenunciasTela";

type PageProps = {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
  }>;
};

export default async function RelatorioDenunciasPage({
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const filtros =
    await searchParams;

  const dados =
    await Backend.denuncias.obterDadosRelatorio({
      dataInicio:
        filtros.dataInicio,
      dataFim:
        filtros.dataFim,
      clienteId:
        filtros.clienteId,
    });

  return (
    <RelatorioDenunciasTela
      dados={dados}
    />
  );
}