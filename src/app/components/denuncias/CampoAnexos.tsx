"use client";

type Props = {
  arquivos: File[];
  onChange: (arquivos: File[]) => void;
  disabled?: boolean;
};

const TAMANHO_MAXIMO = 10 * 1024 * 1024;
const LIMITE_ARQUIVOS = 5;

export default function CampoAnexos({
  arquivos,
  onChange,
  disabled = false,
}: Props) {
  function selecionar(event: React.ChangeEvent<HTMLInputElement>) {
    const selecionados = Array.from(event.target.files || []);

    const resultado = [...arquivos, ...selecionados].slice(
      0,
      LIMITE_ARQUIVOS
    );

    const arquivoGrande = resultado.find(
      (arquivo) => arquivo.size > TAMANHO_MAXIMO
    );

    if (arquivoGrande) {
      alert(`O arquivo ${arquivoGrande.name} ultrapassa 10 MB.`);
      event.target.value = "";
      return;
    }

    onChange(resultado);
    event.target.value = "";
  }

  function remover(indice: number) {
    onChange(arquivos.filter((_, index) => index !== indice));
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Anexos
      </label>

      <input
        type="file"
        multiple
        disabled={disabled || arquivos.length >= LIMITE_ARQUIVOS}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        onChange={selecionar}
        className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700"
      />

      <p className="mt-2 text-xs text-slate-500">
        Até 5 arquivos. Máximo de 10 MB por arquivo. Formatos: PDF, JPG, PNG,
        WEBP, DOC e DOCX.
      </p>

      {arquivos.length > 0 && (
        <div className="mt-3 space-y-2">
          {arquivos.map((arquivo, indice) => (
            <div
              key={`${arquivo.name}-${arquivo.size}-${indice}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {arquivo.name}
                </p>

                <p className="text-xs text-slate-500">
                  {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => remover(indice)}
                className="text-sm font-semibold text-red-600 hover:text-red-800"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}