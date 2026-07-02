import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import { MenuInterno } from "@/src/app/components/menu-interno/mundial/MenuInterno";

export default async function InternasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <MenuInterno />

      <div className="ml-72 min-h-screen">
        {children}
      </div>
    </div>
  );
}