"use client";

import { createContext, useContext, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { addExercise } from "@/app/(app)/fichas/actions";

const OpenCardContext = createContext<{
  openId: string | null;
  setOpenId: (id: string | null) => void;
} | null>(null);

/**
 * Coordena os espécimes do grid em modo adicionar: guarda o id do único
 * card expandido, então abrir um fecha o anterior.
 */
export function AddExerciseGroup({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <OpenCardContext value={{ openId, setOpenId }}>{children}</OpenCardContext>
  );
}

/**
 * Espécime do catálogo em modo adicionar (20-catalogo): "Adicionar" expande
 * o painel de prescrição (stepper de séries) no próprio card, que ganha
 * contorno + sombra dura azul.
 */
export function AddExerciseCard({
  fichaId,
  exerciseId,
  number,
  name,
  taxonomy,
  imageUrl,
}: {
  fichaId: string;
  exerciseId: string;
  number: string;
  name: string;
  taxonomy: string;
  imageUrl: string;
}) {
  const group = useContext(OpenCardContext);
  const [soloOpen, setSoloOpen] = useState(false);
  const open = group ? group.openId === exerciseId : soloOpen;
  const toggle = () =>
    group ? group.setOpenId(open ? null : exerciseId) : setSoloOpen(!open);
  const [sets, setSets] = useState(4);
  const panelId = useId();

  return (
    <div
      className={`flex h-full flex-col bg-paper ${
        open
          ? "relative z-[1] -outline-offset-1 bg-paper-deep outline-2 outline-ink shadow-[7px_7px_0_var(--color-riso)]"
          : ""
      }`}
    >
      <div className="px-3 pt-2.5 pb-2 text-[10px] font-bold tracking-[0.14em] text-clay uppercase tabular-nums">
        {number}
      </div>
      <DuotonePhoto imageUrl={imageUrl} />
      <h3 className="px-3 pt-2.5 text-[15px] leading-[1.2] font-bold tracking-[-0.01em] lg:text-[16px]">
        {name}
      </h3>
      <div className="px-3 pt-0.5 text-[11.5px] text-muted">{taxonomy}</div>

      {open ? (
        <div
          id={panelId}
          className="animate-rise mx-3 mt-2.5 mb-3 border-t-2 border-ink pt-3"
        >
          <form action={addExercise}>
            <input type="hidden" name="fichaId" value={fichaId} />
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input type="hidden" name="sets" value={sets} />

            <div className="mb-1.5 text-[10.5px] font-bold tracking-[0.14em] text-muted uppercase">
              Séries
            </div>
            <div className="flex w-max border border-ink bg-paper tabular-nums">
              <button
                type="button"
                onClick={() => setSets((s) => Math.max(1, s - 1))}
                aria-label="Menos uma série"
                className="size-12 cursor-pointer text-[20px] font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
              >
                −
              </button>
              <span className="flex w-14 items-center justify-center border-x border-ink text-[19px] font-bold">
                {sets}
              </span>
              <button
                type="button"
                onClick={() => setSets((s) => Math.min(20, s + 1))}
                aria-label="Mais uma série"
                className="size-12 cursor-pointer text-[20px] font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
              >
                +
              </button>
            </div>

            <SubmitButton />
          </form>
          <Link
            href={`/exercicios/${exerciseId}`}
            className="mt-2.5 block py-2 text-center text-[13px] font-medium text-muted underline underline-offset-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Ver exercício
          </Link>
        </div>
      ) : (
        <div className="mt-auto p-3">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="min-h-12 w-full cursor-pointer border border-ink bg-paper text-[14px] font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}

/** Foto do espécime em cor original, sobre um fundo neutro. */
export function DuotonePhoto({
  imageUrl,
  className = "",
}: {
  imageUrl: string;
  className?: string;
}) {
  return (
    <div className={`relative mx-3 aspect-[4/3] overflow-hidden bg-paper-edge ${className}`}>
      <Image
        src={imageUrl}
        alt=""
        width={300}
        height={225}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 flex min-h-[50px] w-full cursor-pointer items-center justify-between gap-2.5 bg-ink px-3.5 text-[14.5px] font-bold text-paper transition-colors hover:bg-ink-soft disabled:cursor-default disabled:bg-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
    >
      <span className="flex items-center gap-2.5">
        {pending && (
          <span
            aria-hidden="true"
            className="inline-block size-[15px] animate-spin rounded-full border-2 border-paper/35 border-t-paper"
          />
        )}
        {pending ? "Adicionando…" : "Adicionar à ficha"}
      </span>
      {!pending && (
        <i aria-hidden="true" className="text-ember not-italic">
          →
        </i>
      )}
    </button>
  );
}
