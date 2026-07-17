import Link from "next/link";
import { Overprint } from "@/components/zine";
import { GeneratorForm } from "./form";

export default function GerarFichaPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-[18px] pt-6 pb-20 lg:px-10 lg:pt-8 lg:pb-[100px]">
      <Link
        href="/fichas"
        className="w-fit text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        ← Fichas
      </Link>
      <h1 className="shout mt-3 text-[36px] lg:text-[48px]">
        <Overprint text="Montar a edição" />
      </h1>
      <p className="mt-2 max-w-[440px] text-[14px] text-muted">
        Preencha o pedido e a gráfica monta suas fichas — você revisa a prova
        antes de imprimir.
      </p>

      <GeneratorForm />
    </div>
  );
}
