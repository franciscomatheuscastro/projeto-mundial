import { auth } from "@/src/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if ((session.user as any).perfil === "CLIENTE") {
    redirect("/painel-controle");
  }

  redirect("/dashboard");
}