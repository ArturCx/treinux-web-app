"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { addExercise } from "@/app/(app)/fichas/actions";
import { SetsStepper } from "./sets-stepper";

/**
 * Card do catálogo no contexto de uma ficha: tocar no card expande o painel
 * de prescrição (séries via stepper) — a ação não fica poluindo o grid, e o
 * alvo de toque é o card inteiro, generoso no mobile.
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
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState(3);
  const panelId = useId();

  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="group flex cursor-pointer flex-col gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <span className="flex items-baseline justify-between">
          <span className="text-[10.5px] font-medium tracking-[0.1em] text-clay tabular-nums">
            {number}
          </span>
          {/* affordance: + vira × ao abrir — o card é expansível, não um link */}
          <span
            aria-hidden="true"
            className={`text-[18px] leading-none font-bold text-ember transition-transform duration-200 ease-out ${open ? "rotate-45" : "group-hover:scale-110"}`}
          >
            +
          </span>
        </span>
        <Image
          src={imageUrl}
          alt=""
          width={200}
          height={200}
          className="aspect-square w-full bg-paper-edge object-cover"
        />
        <span className="text-[15px] leading-[1.2] font-bold tracking-[-0.01em] group-hover:underline group-hover:decoration-ember group-hover:underline-offset-2">
          {name}
        </span>
        <span className="text-[12px] text-muted">{taxonomy}</span>
      </button>

      {open && (
        <form
          id={panelId}
          action={addExercise}
          className="animate-rise -mx-3.5 -mb-3.5 mt-3 flex flex-col gap-3 border-t border-dashed border-paper-edge bg-paper-deep p-3.5"
        >
          <input type="hidden" name="fichaId" value={fichaId} />
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="sets" value={sets} />

          <div className="flex flex-col gap-1">
            <span className="text-[10.5px] font-medium tracking-[0.1em] text-muted">
              SÉRIES
            </span>
            <SetsStepper value={sets} onChange={setSets} />
          </div>

          <SubmitButton />

          <Link
            href={`/exercicios/${exerciseId}`}
            className="group/ver flex h-11 w-full items-center justify-between border border-ink px-3 text-[13px] font-bold transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            <span>Ver exercício</span>
            <span
              aria-hidden="true"
              className="text-[16px] leading-none text-ember transition-transform duration-200 group-hover/ver:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </form>
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 bg-ink text-[14px] font-bold text-paper transition-colors hover:bg-ink-soft active:bg-ink-soft disabled:cursor-default disabled:bg-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
    >
      {pending && (
        <span
          aria-hidden="true"
          className="inline-block size-3.5 animate-spin rounded-full border-2 border-paper/35 border-t-paper"
        />
      )}
      {pending ? "Adicionando…" : "Adicionar à ficha"}
    </button>
  );
}
