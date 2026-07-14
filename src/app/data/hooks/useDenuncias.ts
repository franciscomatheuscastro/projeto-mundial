"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import Backend from "@/src/backend";

import {
  CriarDenunciaPublica,
  Denuncia,
  DenunciaDetalhada,
  DenunciaResumo,
  NovaTratativa,
} from "@/src/core/model/Denuncia";

type ContextoDenuncias = "mundial" | "cliente";

function identificarMime(arquivo: File) {
  if (arquivo.type) {
    return arquivo.type;
  }

  const extensao =
    arquivo.name.split(".").pop()?.toLowerCase() || "";

  const tiposPorExtensao: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return tiposPorExtensao[extensao] || "";
}

export function useDenuncias(
  carregarInicial = true,
  contexto: ContextoDenuncias = "mundial"
) {
  const [denuncias, setDenuncias] = useState<
    DenunciaResumo[]
  >([]);

  const [
    denunciaSelecionada,
    setDenunciaSelecionada,
  ] = useState<DenunciaDetalhada | null>(null);

  const [erro, setErro] = useState<string | null>(null);

  const [carregando, setCarregando] =
    useState(carregarInicial);

  const [processando, startTransition] =
    useTransition();

  const carregarDenuncias = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados =
        contexto === "cliente"
          ? await Backend.denuncias.obterMinhas()
          : await Backend.denuncias.obterTodos();

      setDenuncias(dados);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar denúncias."
      );
    } finally {
      setCarregando(false);
    }
  }, [contexto]);

  const carregarDenunciaPorId = useCallback(
    async (id: string) => {
      try {
        setCarregando(true);
        setErro(null);

        const denuncia =
          contexto === "cliente"
            ? await Backend.denuncias.obterMinhaPorId(id)
            : await Backend.denuncias.obterPorId(id);

        setDenunciaSelecionada(denuncia);

        return denuncia;
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Erro ao carregar denúncia.";

        setErro(mensagem);
        setDenunciaSelecionada(null);

        throw error;
      } finally {
        setCarregando(false);
      }
    },
    [contexto]
  );

  const criarDenunciaPublica = useCallback(
    async (denuncia: CriarDenunciaPublica) => {
      return new Promise<{
        id: string;
        protocolo: string;
      }>((resolve, reject) => {
        startTransition(async () => {
          try {
            setErro(null);

            const resultado =
              await Backend.denuncias.criarPublica(
                denuncia
              );

            resolve(resultado);
          } catch (error) {
            const mensagem =
              error instanceof Error
                ? error.message
                : "Erro ao criar denúncia.";

            setErro(mensagem);
            reject(error);
          }
        });
      });
    },
    []
  );

  const criarDenunciaManual = useCallback(
    async (denuncia: Denuncia) => {
      return new Promise<DenunciaDetalhada>(
        (resolve, reject) => {
          startTransition(async () => {
            try {
              setErro(null);

              const resultado =
                await Backend.denuncias.criarManual(
                  denuncia
                );

              if (carregarInicial) {
                await carregarDenuncias();
              }

              setDenunciaSelecionada(resultado);
              resolve(resultado);
            } catch (error) {
              const mensagem =
                error instanceof Error
                  ? error.message
                  : "Erro ao criar denúncia.";

              setErro(mensagem);
              reject(error);
            }
          });
        }
      );
    },
    [carregarDenuncias, carregarInicial]
  );

  const criarMinhaDenunciaManual = useCallback(
    async (denuncia: Denuncia) => {
      return new Promise<DenunciaDetalhada>(
        (resolve, reject) => {
          startTransition(async () => {
            try {
              setErro(null);

              const resultado =
                await Backend.denuncias.criarMinhaManual(
                  denuncia
                );

              if (carregarInicial) {
                await carregarDenuncias();
              }

              setDenunciaSelecionada(resultado);
              resolve(resultado);
            } catch (error) {
              const mensagem =
                error instanceof Error
                  ? error.message
                  : "Erro ao criar denúncia.";

              setErro(mensagem);
              reject(error);
            }
          });
        }
      );
    },
    [carregarDenuncias, carregarInicial]
  );

  const enviarAnexos = useCallback(
    async (
      denuncia: {
        id: string;
        protocolo: string;
      },
      arquivos: File[]
    ) => {
      if (!denuncia.id?.trim()) {
        throw new Error(
          "Identificador da denúncia não informado."
        );
      }

      if (!denuncia.protocolo?.trim()) {
        throw new Error(
          "Protocolo da denúncia não informado."
        );
      }

      if (arquivos.length === 0) {
        return [];
      }

      const anexosEnviados = [];

      for (const arquivo of arquivos) {
        const tipoMime = identificarMime(arquivo);

        if (!tipoMime) {
          throw new Error(
            `Não foi possível identificar o formato do arquivo ${arquivo.name}.`
          );
        }

        const preparado =
          await Backend.denuncias.prepararUpload({
            denunciaId: denuncia.id,
            protocolo: denuncia.protocolo,
            nomeArquivo: arquivo.name,
            tipoMime,
            tamanho: arquivo.size,
          });

        let respostaUpload: Response;

        try {
          respostaUpload = await fetch(
            preparado.uploadUrl,
            {
              method: "PUT",
              headers: {
                "Content-Type": tipoMime,
              },
              body: arquivo,
            }
          );
        } catch (error) {
          console.error(
            "Falha na requisição direta ao Bucket:",
            {
              arquivo: arquivo.name,
              tipoMime,
              tamanho: arquivo.size,
              url: preparado.uploadUrl,
              error,
            }
          );

          throw new Error(
            `Não foi possível conectar ao armazenamento para enviar ${arquivo.name}. Verifique o CORS do Bucket.`
          );
        }

        if (!respostaUpload.ok) {
          const corpo = await respostaUpload
            .text()
            .catch(() => "");

          console.error("Resposta de erro do Bucket:", {
            arquivo: arquivo.name,
            status: respostaUpload.status,
            statusText: respostaUpload.statusText,
            corpo,
          });

          throw new Error(
            `Não foi possível enviar ${arquivo.name}. O armazenamento retornou HTTP ${respostaUpload.status}.`
          );
        }

        const anexo =
          await Backend.denuncias.confirmarUpload({
            denunciaId: denuncia.id,
            protocolo: denuncia.protocolo,
            chave: preparado.chave,
            nomeOriginal: preparado.nomeOriginal,
            tipoMime,
            tamanho: arquivo.size,
          });

        anexosEnviados.push(anexo);
      }

      try {
        const denunciaAtualizada =
          contexto === "cliente"
            ? await Backend.denuncias.obterMinhaPorId(
                denuncia.id
              )
            : await Backend.denuncias.obterPorId(
                denuncia.id
              );

        setDenunciaSelecionada(denunciaAtualizada);
      } catch {
        // O upload já foi concluído.
        // Falha ao atualizar a tela não deve invalidar o envio.
      }

      return anexosEnviados;
    },
    [contexto]
  );

  const consultarDenunciaPublica = useCallback(
    async (clienteId: string, protocolo: string) => {
      try {
        setCarregando(true);
        setErro(null);

        return await Backend.denuncias.consultarPublica({
          clienteId,
          protocolo,
        });
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Erro ao consultar denúncia.";

        setErro(mensagem);

        throw error;
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  const salvarDenuncia = useCallback(
    async (denuncia: DenunciaDetalhada) => {
      return new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            setErro(null);

            const resultado =
              contexto === "cliente"
                ? await Backend.denuncias.salvarMinha(
                    denuncia
                  )
                : await Backend.denuncias.salvar(
                    denuncia
                  );

            setDenunciaSelecionada(resultado);

            if (carregarInicial) {
              await carregarDenuncias();
            }

            resolve();
          } catch (error) {
            const mensagem =
              error instanceof Error
                ? error.message
                : "Erro ao salvar denúncia.";

            setErro(mensagem);
            reject(error);
          }
        });
      });
    },
    [
      contexto,
      carregarDenuncias,
      carregarInicial,
    ]
  );

  const adicionarTratativa = useCallback(
    async (
      denunciaId: string,
      tratativa: NovaTratativa
    ) => {
      return new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            setErro(null);

            const resultado =
              contexto === "cliente"
                ? await Backend.denuncias.adicionarMinhaTratativa(
                    denunciaId,
                    tratativa
                  )
                : await Backend.denuncias.adicionarTratativa(
                    denunciaId,
                    tratativa
                  );

            setDenunciaSelecionada(resultado);

            if (carregarInicial) {
              await carregarDenuncias();
            }

            resolve();
          } catch (error) {
            const mensagem =
              error instanceof Error
                ? error.message
                : "Erro ao adicionar tratativa.";

            setErro(mensagem);
            reject(error);
          }
        });
      });
    },
    [
      contexto,
      carregarDenuncias,
      carregarInicial,
    ]
  );

  useEffect(() => {
    if (carregarInicial) {
      carregarDenuncias();
    }
  }, [carregarInicial, carregarDenuncias]);

  return {
    denuncias,
    denunciaSelecionada,
    setDenunciaSelecionada,

    carregando,
    processando,
    erro,

    carregarDenuncias,
    carregarDenunciaPorId,
    criarDenunciaPublica,
    consultarDenunciaPublica,
    salvarDenuncia,
    adicionarTratativa,

    criarDenunciaManual,
    criarMinhaDenunciaManual,

    enviarAnexos,
  };
}