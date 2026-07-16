import Link from "next/link";
import { NewFichaForm } from "./form";

export default function NovaFichaPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/fichas"
          className="w-fit text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          ← Fichas
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">
            Nova ficha
          </h1>
          <p className="text-[14.5px] text-muted">
            Dê um nome ao treino. Os exercícios vêm no próximo passo.
          </p>
        </div>
      </div>
      <NewFichaForm />
    </div>
  );
}
