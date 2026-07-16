import { auth } from "@/src/auth";
import { redirect } from "next/navigation";

export default async function MinhaNovaDenunciaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect("/minhas-denuncias");
}