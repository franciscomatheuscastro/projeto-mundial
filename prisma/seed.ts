import { PrismaClient, PerfilUsuario } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash("123456", 10);

  await prisma.usuario.upsert({
    where: {
      email: "admin@mundial.com",
    },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@mundial.com",
      senha,
      perfil: PerfilUsuario.ADMIN,
      ativo: true,
    },
  });

  console.log("Administrador criado com sucesso!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });