"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import Backend from "@/src/backend";

import type {
  AnexoDenuncia,
  ConsultaDenunciaPublica,
  CriarDenunciaPublica,
  Denuncia,
  DenunciaDetalhada,
  DenunciaResumo,
  EditarTratativaInput,
  NovaTratativa,
} from "@/src/core/model/Denuncia";

type ContextoDenuncias =
  | "mundial"
  | "cliente";

const LIMITE_ANEXOS = 5;

function identificarMime(
  arquivo: File
) {
  if (arquivo.type?.trim()) {
    return arquivo.type.trim().toLowerCase();
  }

  const extensao =
    arquivo.name
      .split(".")
      .pop()
      ?.toLowerCase() || "";

  const tiposPorExtensao: Record<
    string,
    string
  > = {
    pdf: "application/pdf",

    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",

    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    aac: "audio/aac",

    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
  };

  return tiposPorExtensao[extensao] || "";
}

function validarArquivos(
  arquivos: File[]
) {
  if (arquivos.length > LIMITE_ANEXOS) {
    throw new Error(
      `É permitido enviar no máximo ${LIMITE_ANEXOS} anexos.`
    );
  }

  const identificadores =
    new Set<string>();

  for (const arquivo of arquivos) {
    const identificador = [
      arquivo.name,
      arquivo.size,
      arquivo.lastModified,
    ].join("-");

    if (
      identificadores.has(identificador)
    ) {
      throw new Error(
        `O arquivo ${arquivo.name} foi selecionado mais de uma vez.`
      );
    }

    identificadores.add(identificador);
  }

  const quantidadeVideos =
    arquivos.filter((arquivo) =>
      identificarMime(
        arquivo
      ).startsWith("video/")
    ).length;

  if (quantidadeVideos > 1) {
    throw new Error(
      "É permitido enviar no máximo um vídeo por denúncia."
    );
  }
}

export function useDenuncias(
  carregarInicial = true,
  contexto: ContextoDenuncias = "mundial"
) {
  const [denuncias, setDenuncias] =
    useState<DenunciaResumo[]>([]);

  const [
    denunciaSelecionada,
    setDenunciaSelecionada,
  ] = useState<DenunciaDetalhada | null>(
    null
  );

  const [erro, setErro] =
    useState<string | null>(null);

  const [carregando, setCarregando] =
    useState(carregarInicial);

  const [processando, startTransition] =
    useTransition();

  const registrarErro = useCallback(
    (
      error: unknown,
      mensagemPadrao: string
    ) => {
      const mensagem =
        error instanceof Error
          ? error.message
          : mensagemPadrao;

      setErro(mensagem);

      return mensagem;
    },
    []
  );

  const carregarDenuncias =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro(null);

        const dados =
          contexto === "cliente"
            ? await Backend.denuncias.obterMinhas()
            : await Backend.denuncias.obterTodos();

        setDenuncias(dados);

        return dados;
      } catch (error) {
        registrarErro(
          error,
          "Erro ao carregar denúncias."
        );

        throw error;
      } finally {
        setCarregando(false);
      }
    }, [contexto, registrarErro]);

  const carregarDenunciaPorId =
    useCallback(
      async (id: string) => {
        if (!id?.trim()) {
          throw new Error(
            "Identificador da denúncia não informado."
          );
        }

        try {
          setCarregando(true);
          setErro(null);

          const denuncia =
            contexto === "cliente"
              ? await Backend.denuncias.obterMinhaPorId(
                  id
                )
              : await Backend.denuncias.obterPorId(
                  id
                );

          setDenunciaSelecionada(denuncia);

          return denuncia;
        } catch (error) {
          registrarErro(
            error,
            "Erro ao carregar denúncia."
          );

          setDenunciaSelecionada(null);

          throw error;
        } finally {
          setCarregando(false);
        }
      },
      [contexto, registrarErro]
    );

  const criarDenunciaPublica =
    useCallback(
      async (
        denuncia: CriarDenunciaPublica
      ) => {
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
              registrarErro(
                error,
                "Erro ao criar denúncia."
              );

              reject(error);
            }
          });
        });
      },
      [registrarErro]
    );

  const criarDenunciaManual =
    useCallback(
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

                setDenunciaSelecionada(
                  resultado
                );

                if (carregarInicial) {
                  await carregarDenuncias();
                }

                resolve(resultado);
              } catch (error) {
                registrarErro(
                  error,
                  "Erro ao criar denúncia."
                );

                reject(error);
              }
            });
          }
        );
      },
      [
        carregarDenuncias,
        carregarInicial,
        registrarErro,
      ]
    );

  const criarMinhaDenunciaManual =
    useCallback(
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

                setDenunciaSelecionada(
                  resultado
                );

                if (carregarInicial) {
                  await carregarDenuncias();
                }

                resolve(resultado);
              } catch (error) {
                registrarErro(
                  error,
                  "Erro ao criar denúncia."
                );

                reject(error);
              }
            });
          }
        );
      },
      [
        carregarDenuncias,
        carregarInicial,
        registrarErro,
      ]
    );

  const enviarAnexos = useCallback(
    async (
      denuncia: {
        id: string;
        protocolo: string;
      },
      arquivos: File[]
    ): Promise<AnexoDenuncia[]> => {
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

      validarArquivos(arquivos);

      setErro(null);

      const anexosEnviados:
        AnexoDenuncia[] = [];

      for (const arquivo of arquivos) {
        const tipoMime =
          identificarMime(arquivo);

        if (!tipoMime) {
          throw new Error(
            `Não foi possível identificar o formato do arquivo ${arquivo.name}.`
          );
        }

        const preparado =
          await Backend.denuncias.prepararUpload(
            {
              denunciaId: denuncia.id,
              protocolo:
                denuncia.protocolo,
              nomeArquivo: arquivo.name,
              tipoMime,
              tamanho: arquivo.size,
            }
          );

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
            "Falha ao enviar arquivo para o armazenamento:",
            {
              arquivo: arquivo.name,
              tipoMime,
              tamanho: arquivo.size,
              error,
            }
          );

          throw new Error(
            `Não foi possível conectar ao armazenamento para enviar ${arquivo.name}. Verifique o CORS do Bucket.`
          );
        }

        if (!respostaUpload.ok) {
          const corpo =
            await respostaUpload
              .text()
              .catch(() => "");

          console.error(
            "Erro retornado pelo armazenamento:",
            {
              arquivo: arquivo.name,
              status:
                respostaUpload.status,
              statusText:
                respostaUpload.statusText,
              corpo,
            }
          );

          throw new Error(
            `Não foi possível enviar ${arquivo.name}. O armazenamento retornou HTTP ${respostaUpload.status}.`
          );
        }

        const anexo =
          await Backend.denuncias.confirmarUpload(
            {
              denunciaId: denuncia.id,
              protocolo:
                denuncia.protocolo,
              chave: preparado.chave,
              nomeOriginal:
                preparado.nomeOriginal,
              tipoMime,
              tamanho: arquivo.size,
            }
          );

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

        setDenunciaSelecionada(
          denunciaAtualizada
        );
      } catch (error) {
        console.error(
          "Os anexos foram enviados, mas a denúncia não pôde ser recarregada:",
          error
        );
      }

      return anexosEnviados;
    },
    [contexto]
  );

  const consultarDenunciaPublica =
    useCallback(
      async (
        clienteId: string,
        protocolo: string
      ): Promise<ConsultaDenunciaPublica> => {
        if (!clienteId?.trim()) {
          throw new Error(
            "Cliente não informado."
          );
        }

        if (!protocolo?.trim()) {
          throw new Error(
            "Informe o protocolo da denúncia."
          );
        }

        try {
          setCarregando(true);
          setErro(null);

          return await Backend.denuncias.consultarPublica(
            {
              clienteId,
              protocolo:
                protocolo.trim().toUpperCase(),
            }
          );
        } catch (error) {
          registrarErro(
            error,
            "Erro ao consultar denúncia."
          );

          throw error;
        } finally {
          setCarregando(false);
        }
      },
      [registrarErro]
    );

  const salvarDenuncia =
    useCallback(
      async (
        denuncia: DenunciaDetalhada
      ) => {
        return new Promise<DenunciaDetalhada>(
          (resolve, reject) => {
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

                setDenunciaSelecionada(
                  resultado
                );

                if (carregarInicial) {
                  await carregarDenuncias();
                }

                resolve(resultado);
              } catch (error) {
                registrarErro(
                  error,
                  "Erro ao salvar denúncia."
                );

                reject(error);
              }
            });
          }
        );
      },
      [
        contexto,
        carregarDenuncias,
        carregarInicial,
        registrarErro,
      ]
    );

  const adicionarTratativa =
    useCallback(
      async (
        denunciaId: string,
        tratativa: NovaTratativa
      ) => {
        return new Promise<DenunciaDetalhada>(
          (resolve, reject) => {
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

                setDenunciaSelecionada(
                  resultado
                );

                if (carregarInicial) {
                  await carregarDenuncias();
                }

                resolve(resultado);
              } catch (error) {
                registrarErro(
                  error,
                  "Erro ao adicionar tratativa."
                );

                reject(error);
              }
            });
          }
        );
      },
      [
        contexto,
        carregarDenuncias,
        carregarInicial,
        registrarErro,
      ]
    );

  const editarTratativa =
    useCallback(
      async (
        dados: EditarTratativaInput
      ) => {
        return new Promise<DenunciaDetalhada>(
          (resolve, reject) => {
            startTransition(async () => {
              try {
                setErro(null);

                const resultado =
                  contexto === "cliente"
                    ? await Backend.denuncias.editarMinhaTratativa(
                        dados
                      )
                    : await Backend.denuncias.editarTratativa(
                        dados
                      );

                setDenunciaSelecionada(
                  resultado
                );

                if (carregarInicial) {
                  await carregarDenuncias();
                }

                resolve(resultado);
              } catch (error) {
                registrarErro(
                  error,
                  "Erro ao editar tratativa."
                );

                reject(error);
              }
            });
          }
        );
      },
      [
        contexto,
        carregarDenuncias,
        carregarInicial,
        registrarErro,
      ]
    );

  const limparErro = useCallback(() => {
    setErro(null);
  }, []);

  useEffect(() => {
    if (carregarInicial) {
      carregarDenuncias().catch(() => {
        // O erro já foi registrado pelo hook.
      });
    }
  }, [
    carregarInicial,
    carregarDenuncias,
  ]);

  return {
    denuncias,
    denunciaSelecionada,
    setDenunciaSelecionada,

    carregando,
    processando,
    erro,

    limparErro,

    carregarDenuncias,
    carregarDenunciaPorId,

    criarDenunciaPublica,
    consultarDenunciaPublica,

    salvarDenuncia,

    adicionarTratativa,
    editarTratativa,

    criarDenunciaManual,
    criarMinhaDenunciaManual,

    enviarAnexos,
  };
}