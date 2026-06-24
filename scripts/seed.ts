import { PrismaClient, TipoPergunta } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existente = await prisma.modeloPesquisa.findFirst({
    where: {
      modeloPadrao: true,
      titulo: "Pesquisa de Clima Organizacional",
    },
  });

  if (existente) {
    console.log("Modelo padrão já existe.");
    return;
  }

  await prisma.modeloPesquisa.create({
    data: {
      titulo: "Pesquisa de Clima Organizacional",
      descricao:
        "Modelo padrão para avaliação de clima organizacional, liderança, comunicação, ambiente e satisfação geral.",
      modeloPadrao: true,
      perguntas: {
        create: [
          {
            titulo: "Como você avalia o ambiente de trabalho?",
            tipo: TipoPergunta.NOTA,
            ordem: 1,
          },
          {
            titulo: "Você se sente respeitado no ambiente de trabalho?",
            tipo: TipoPergunta.SIM_NAO,
            ordem: 2,
          },
          {
            titulo: "Como você avalia a comunicação interna?",
            tipo: TipoPergunta.NOTA,
            ordem: 3,
          },
          {
            titulo: "Como você avalia a liderança direta?",
            tipo: TipoPergunta.NOTA,
            ordem: 4,
          },
          {
            titulo: "Você sente que seu trabalho é reconhecido?",
            tipo: TipoPergunta.SIM_NAO,
            ordem: 5,
          },
          {
            titulo: "Como está seu nível de satisfação geral?",
            tipo: TipoPergunta.NOTA,
            ordem: 6,
          },
          {
            titulo: "O que poderia melhorar na empresa?",
            tipo: TipoPergunta.TEXTO_LONGO,
            ordem: 7,
            obrigatoria: false,
          },
        ],
      },
    },
  });

  console.log("Modelo padrão criado com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
