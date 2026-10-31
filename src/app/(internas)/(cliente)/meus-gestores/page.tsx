import {
  PerfilUsuario,
} from "@prisma/client";

import {
  redirect,
} from "next/navigation";

import {
  auth,
} from "@/src/auth";

import {
  listarGestoresCliente,
} from "@/src/backend/usuario/acoesGestoresCliente";

import GestoresClienteTela from "@/src/app/components/clientes/GestoresClienteTela";


export default async function MeusGestoresPage() {
  const session =
    await auth();


  const usuario =
    session?.user as
      | {
          perfil?: PerfilUsuario;
        }
      | undefined;


  if (
    !usuario
  ) {
    redirect(
      "/login"
    );
  }


  if (
    usuario.perfil !==
    PerfilUsuario.CLIENTE
  ) {
    redirect(
      "/painel-controle"
    );
  }


  const resultado =
    await listarGestoresCliente();


  return (
    <GestoresClienteTela
      gestoresIniciais={
        resultado.sucesso
          ? resultado.dados
          : []
      }
    />
  );
}
