import Backend from "@/src/backend";
import PesquisaPublicaTela from "@/src/app/components/pesquisa-publica/PesquisaPublicaTela";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PesquisaPublicaPage({ params }: PageProps) {
  const { token } = await params;

  const pesquisa = await Backend.respostasPesquisa.obterPorToken(token);

  if (!pesquisa) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Pesquisa não encontrada
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Verifique se o link está correto.
          </p>
        </div>
      </main>
    );
  }

  if (pesquisa.status !== "ABERTA") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Pesquisa encerrada
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Esta pesquisa não está mais recebendo respostas.
          </p>
        </div>
      </main>
    );
  }

  return <PesquisaPublicaTela pesquisa={pesquisa} />;
}