import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const firstName = session.user.name.split(" ")[0];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-paper-edge px-7 py-5 lg:px-10">
        <div className="text-[22px] font-bold tracking-[-0.02em]">
          Treinux<span className="text-ember">.</span>
        </div>
        <LogoutButton />
      </header>

      <main className="flex flex-1 flex-col justify-center gap-4 px-7 py-16 lg:px-10">
        <h1 className="text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">
          Bom treino, {firstName}
          <span className="text-ember">.</span>
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-muted">
          Suas fichas de treino vão aparecer aqui. Este é o próximo passo do
          Treinux — em construção.
        </p>
      </main>
    </div>
  );
}
