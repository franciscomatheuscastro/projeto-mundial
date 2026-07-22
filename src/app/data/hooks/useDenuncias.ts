"use client";

import {
  useCallback,
  useEffect,
  useState,
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
  LiberarTratativaInput,
  NovaTratativa,
} from "@/src/core/model/Denuncia";

type ContextoDenuncias =
  | "mundial"
  | "cliente";

type ResultadoCriacaoDenunciaPublica = {
  id: string;
  protocolo: string;
};

const LIMITE_ANEXOS = 5;

function identificarMime(
  arquivo: File
): string {
  if (arquivo.type?.trim()) {
    return arquivo.type
      .trim()
      .toLowerCase();
  }

  const extensao =
    arquivo.name
      .split(".")
      .pop()
      ?.toLowerCase() ?? "";

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

  return tiposPorExtensao[extensao] ?? "";
}

function validarArquivos(
  arquivos: File[]
): void {
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
      identificadores.has(
        identificador
      )
    ) {
      throw new Error(
        `O arquivo ${arquivo.name} foi selecionado mais de uma vez.`
      );
    }

    identificadores.add(
      identificador
    );
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

  const [processando, setProcessando] =
    useState(false);

  const registrarErro = useCallback(
    (
      error: unknown,
      mensagemPadrao: string
    ): string => {
      const mensagem =
        error instanceof Error
          ? error.message
          : mensagemPadrao;

      setErro(mensagem);

      return mensagem;
    },
    []
  );

  const executarProcessamento =
    useCallback(
      async <T>(
        operacao: () => Promise<T>,
        mensagemPadrao: string
      ): Promise<T> => {
        try {
          setProcessando(true);
          setErro(null);

          return await operacao();
        } catch (error) {
          registrarErro(
            error,
            mensagemPadrao
          );

          throw error;
        } finally {
          setProcessando(false);
        }
      },
      [registrarErro]
    );

  const carregarDenuncias =
    useCallback(async (): Promise<
      DenunciaResumo[]
    > => {
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
    }, [
      contexto,
      registrarErro,
    ]);

  const carregarDenunciaPorId =
    useCallback(
      async (
        id: string
      ): Promise<DenunciaDetalhada> => {
        const denunciaId = id?.trim();

        if (!denunciaId) {
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
                  denunciaId
                )
              : await Backend.denuncias.obterPorId(
                  denunciaId
                );

          setDenunciaSelecionada(
            denuncia
          );

          return denuncia;
        } catch (error) {
          registrarErro(
            error,
            "Erro ao carregar denúncia."
          );

          setDenunciaSelecionada(
            null
          );

          throw error;
        } finally {
          setCarregando(false);
        }
      },
      [
        contexto,
        registrarErro,
      ]
    );

  const criarDenunciaPublica =
    useCallback(
      async (
        denuncia: CriarDenunciaPublica
      ): Promise<ResultadoCriacaoDenunciaPublica> => {
        return executarProcessamento(
          async () => {
            /*
             * A gravidade não deve ser definida aqui.
             *
             * O backend deve buscar a categoria por
             * categoriaId e aplicar:
             *
             * gravidade: categoria.gravidade
             */
            return Backend.denuncias.criarPublica(
              denuncia
            );
          },
          "Erro ao criar denúncia."
        );
      },
      [executarProcessamento]
    );

  const criarDenunciaManual =
    useCallback(
      async (
        denuncia: Denuncia
      ): Promise<DenunciaDetalhada> => {
        return executarProcessamento(
          async () => {
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

            return resultado;
          },
          "Erro ao criar denúncia."
        );
      },
      [
        carregarDenuncias,
        carregarInicial,
        executarProcessamento,
      ]
    );

  const criarMinhaDenunciaManual =
    useCallback(
      async (
        denuncia: Denuncia
      ): Promise<DenunciaDetalhada> => {
        return executarProcessamento(
          async () => {
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

            return resultado;
          },
          "Erro ao criar denúncia."
        );
      },
      [
        carregarDenuncias,
        carregarInicial,
        executarProcessamento,
      ]
    );

  const enviarAnexos =
    useCallback(
      async (
        denuncia: {
          id: string;
          protocolo: string;
        },
        arquivos: File[]
      ): Promise<AnexoDenuncia[]> => {
        const denunciaId =
          denuncia.id?.trim();

        const protocolo =
          denuncia.protocolo
            ?.trim()
            .toUpperCase();

        if (!denunciaId) {
          throw new Error(
            "Identificador da denúncia não informado."
          );
        }

        if (!protocolo) {
          throw new Error(
            "Protocolo da denúncia não informado."
          );
        }

        if (
          arquivos.length === 0
        ) {
          return [];
        }

        validarArquivos(
          arquivos
        );

        return executarProcessamento(
          async () => {
            const anexosEnviados:
              AnexoDenuncia[] = [];

            for (
              const arquivo of arquivos
            ) {
              const tipoMime =
                identificarMime(
                  arquivo
                );

              if (!tipoMime) {
                throw new Error(
                  `Não foi possível identificar o formato do arquivo ${arquivo.name}.`
                );
              }

              const preparado =
                await Backend.denuncias.prepararUpload(
                  {
                    denunciaId,
                    protocolo,
                    nomeArquivo:
                      arquivo.name,
                    tipoMime,
                    tamanho:
                      arquivo.size,
                  }
                );

              let respostaUpload:
                Response;

              try {
                respostaUpload =
                  await fetch(
                    preparado.uploadUrl,
                    {
                      method: "PUT",

                      headers: {
                        "Content-Type":
                          tipoMime,
                      },

                      body: arquivo,
                    }
                  );
              } catch (error) {
                console.error(
                  "Falha ao enviar arquivo para o armazenamento:",
                  {
                    arquivo:
                      arquivo.name,
                    tipoMime,
                    tamanho:
                      arquivo.size,
                    error,
                  }
                );

                throw new Error(
                  `Não foi possível conectar ao armazenamento para enviar ${arquivo.name}. Verifique o CORS do Bucket.`
                );
              }

              if (
                !respostaUpload.ok
              ) {
                const corpo =
                  await respostaUpload
                    .text()
                    .catch(
                      () => ""
                    );

                console.error(
                  "Erro retornado pelo armazenamento:",
                  {
                    arquivo:
                      arquivo.name,

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
                    denunciaId,
                    protocolo,

                    chave:
                      preparado.chave,

                    nomeOriginal:
                      preparado.nomeOriginal,

                    tipoMime,

                    tamanho:
                      arquivo.size,
                  }
                );

              anexosEnviados.push(
                anexo
              );
            }

            try {
              const denunciaAtualizada =
                contexto === "cliente"
                  ? await Backend.denuncias.obterMinhaPorId(
                      denunciaId
                    )
                  : await Backend.denuncias.obterPorId(
                      denunciaId
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
          "Erro ao enviar anexos."
        );
      },
      [
        contexto,
        executarProcessamento,
      ]
    );

  const consultarDenunciaPublica =
    useCallback(
      async (
        protocolo: string
      ): Promise<ConsultaDenunciaPublica> => {
        const protocoloNormalizado =
          protocolo
            ?.trim()
            .toUpperCase();

        if (
          !protocoloNormalizado
        ) {
          throw new Error(
            "Informe o protocolo da denúncia."
          );
        }

        try {
          setCarregando(true);
          setErro(null);

          return await Backend.denuncias.consultarPublica(
            {
              protocolo:
                protocoloNormalizado,
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
      ): Promise<DenunciaDetalhada> => {
        return executarProcessamento(
          async () => {
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

            return resultado;
          },
          "Erro ao salvar denúncia."
        );
      },
      [
        contexto,
        carregarDenuncias,
        carregarInicial,
        executarProcessamento,
      ]
    );

  const liberarTratativa =
    useCallback(
      async (
        dados: LiberarTratativaInput
      ): Promise<DenunciaDetalhada> => {
        return executarProcessamento(
          async () => {
            if (
              contexto !== "mundial"
            ) {
              throw new Error(
                "Somente a Mundial pode liberar tratativas."
              );
            }

            const resultado =
              await Backend.denuncias.liberarTratativa(
                dados
              );

            setDenunciaSelecionada(
              resultado
            );

            if (carregarInicial) {
              await carregarDenuncias();
            }

            return resultado;
          },
          "Erro ao liberar tratativa."
        );
      },
      [
        contexto,
        carregarDenuncias,
        carregarInicial,
        executarProcessamento,
      ]
    );

  const adicionarTratativa =
    useCallback(
      async (
        denunciaId: string,
        tratativa: NovaTratativa
      ): Promise<DenunciaDetalhada> => {
        const id =
          denunciaId?.trim();

        if (!id) {
          throw new Error(
            "Identificador da denúncia não informado."
          );
        }

        return executarProcessamento(
          async () => {
            const resultado =
              contexto === "cliente"
                ? await Backend.denuncias.adicionarMinhaTratativa(
                    id,
                    tratativa
                  )
                : await Backend.denuncias.adicionarTratativa(
                    id,
                    tratativa
                  );

            setDenunciaSelecionada(
              resultado
            );

            if (carregarInicial) {
              await carregarDenuncias();
            }

            return resultado;
          },
          "Erro ao adicionar tratativa."
        );
      },
      [
        contexto,
        carregarDenuncias,
        carregarInicial,
        executarProcessamento,
      ]
    );

  const editarTratativa =
    useCallback(
      async (
        dados: EditarTratativaInput
      ): Promise<DenunciaDetalhada> => {
        return executarProcessamento(
          async () => {
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

            return resultado;
          },
          "Erro ao editar tratativa."
        );
      },
      [
        contexto,
        carregarDenuncias,
        carregarInicial,
        executarProcessamento,
      ]
    );

  const limparErro =
    useCallback(() => {
      setErro(null);
    }, []);

  const limparDenunciaSelecionada =
    useCallback(() => {
      setDenunciaSelecionada(
        null
      );
    }, []);

  useEffect(() => {
    if (!carregarInicial) {
      return;
    }

    void carregarDenuncias().catch(
      () => {
        /*
         * O erro já foi registrado
         * em carregarDenuncias.
         */
      }
    );
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
    limparDenunciaSelecionada,

    carregarDenuncias,
    carregarDenunciaPorId,

    criarDenunciaPublica,
    consultarDenunciaPublica,

    criarDenunciaManual,
    criarMinhaDenunciaManual,

    salvarDenuncia,
    liberarTratativa,

    adicionarTratativa,
    editarTratativa,

    enviarAnexos,
  };
}