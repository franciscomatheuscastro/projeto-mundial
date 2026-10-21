/*
  Warnings:

  - The values [COMITE_ETICA_MUNDIAL] on the enum `PerfilUsuario` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PerfilUsuario_new" AS ENUM ('ADMIN', 'GESTOR', 'PSICOLOGO', 'ASSISTENTE_SOCIAL', 'RECEPCAO', 'CLIENTE', 'COMITE_CLIENTE');
ALTER TABLE "Usuario" ALTER COLUMN "perfil" DROP DEFAULT;
ALTER TABLE "Usuario" ALTER COLUMN "perfil" TYPE "PerfilUsuario_new" USING ("perfil"::text::"PerfilUsuario_new");
ALTER TABLE "TratativaDenuncia" ALTER COLUMN "criadoPorPerfil" TYPE "PerfilUsuario_new" USING ("criadoPorPerfil"::text::"PerfilUsuario_new");
ALTER TYPE "PerfilUsuario" RENAME TO "PerfilUsuario_old";
ALTER TYPE "PerfilUsuario_new" RENAME TO "PerfilUsuario";
DROP TYPE "PerfilUsuario_old";
ALTER TABLE "Usuario" ALTER COLUMN "perfil" SET DEFAULT 'RECEPCAO';
COMMIT;