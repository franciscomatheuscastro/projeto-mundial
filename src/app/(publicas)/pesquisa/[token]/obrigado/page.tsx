// src/app/(publicas)/pesquisa/[token]/obrigado/page.tsx

export default function ObrigadoPesquisaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✓
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Resposta enviada
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Obrigado por participar da pesquisa. Suas respostas foram registradas com sucesso.
        </p>
      </div>
    </main>
  );
}