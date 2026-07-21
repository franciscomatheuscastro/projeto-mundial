import { auth, signIn } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import LoginPainel from "@/src/app/components/login/LoginPainel";

type LoginPageProps = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

function obterRotaInicial(
  perfil?: PerfilUsuario | null
): string {
  if (
    perfil === PerfilUsuario.CLIENTE ||
    perfil === PerfilUsuario.COMITE_CLIENTE
  ) {
    return "/painel-controle";
  }

  return "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    const perfil = (
      session.user as {
        perfil?: PerfilUsuario;
      }
    ).perfil;

    redirect(obterRotaInicial(perfil));
  }

  const params = await searchParams;
  const temErro = params?.erro === "1";

  async function entrar(
    formData: FormData
  ) {
    "use server";

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const senha = String(
      formData.get("senha") ?? ""
    );

    if (!email || !senha) {
      redirect("/login?erro=1");
    }

    try {
      await signIn("credentials", {
        email,
        senha,
        redirectTo: "/",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?erro=1");
      }

      throw error;
    }
  }

  return (
    <LoginPainel
      temErro={temErro}
      entrar={entrar}
    />
  );
}
