"use client";

import { useState } from "react";
import Link from "next/link";
import { addExerciseToFicha } from "../../fichas/actions";
import { Tape } from "@/components/zine";

type FichaOption = { id: string; name: string; hasExercise: boolean };

/**
 * Seletor de ficha (50-exercicio): lista das fichas do usuário com ação por
 * linha — "escolha onde este espécime entra na rotação". Sem select nativo.
 */
export function AddToFicha({
  exerciseId,
  fichas,
}: {
  exerciseId: string;
  fichas: FichaOption[];
}) {
  const [sets, setSets] = useState(3);

  return (
    <section
      aria-label="Adicionar a uma ficha"
      className="relative border-2 border-ink bg-paper-deep"
    >
      <Tape className="-top-[13px] left-6 w-24 -rotate-2" />
      <div className="px-4 pt-4">
        <h2 className="text-[16px] font-bold tracking-[0.1em] uppercase">
          Adicionar a uma ficha
        </h2>
        <div className="mt-0.5 text-[12.5px] text-muted">
          Escolha onde este espécime entra na rotação.
        </div>
      </div>

      {fichas.length === 0 ? (
        <div className="m-4 mt-3.5">
          <Link
            href="/fichas/nova"
            className="flex min-h-[52px] items-center justify-between bg-ink px-4 text-[14.5px] font-bold text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Criar ficha para adicionar
            <i aria-hidden="true" className="text-ember not-italic">
              →
            </i>
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-paper-edge px-4 py-2.5">
            <span className="text-[10.5px] font-bold tracking-[0.14em] text-muted uppercase">
              Séries
            </span>
            <div className="flex border border-ink bg-paper tabular-nums">
              <button
                type="button"
                onClick={() => setSets((s) => Math.max(1, s - 1))}
                aria-label="Menos uma série"
                className="size-11 cursor-pointer text-[18px] font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
              >
                −
              </button>
              <span className="flex w-12 items-center justify-center border-x border-ink text-[17px] font-bold">
                {sets}
              </span>
              <button
                type="button"
                onClick={() => setSets((s) => Math.min(20, s + 1))}
                aria-label="Mais uma série"
                className="size-11 cursor-pointer text-[18px] font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
              >
                +
              </button>
            </div>
          </div>

          <ul>
            {fichas.map((ficha) => (
              <li
                key={ficha.id}
                className="flex items-center gap-3 border-t border-paper-edge px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15.5px] leading-tight font-bold tracking-[-0.015em]">
                    {ficha.name}
                  </h3>
                </div>
                {ficha.hasExercise ? (
                  <Link
                    href={`/fichas/${ficha.id}`}
                    className="flex min-h-12 flex-none items-center bg-ember px-3.5 text-[12.5px] font-bold tracking-[0.04em] text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                  >
                    ✓ Já na ficha
                  </Link>
                ) : (
                  <form action={addExerciseToFicha}>
                    <input type="hidden" name="exerciseId" value={exerciseId} />
                    <input type="hidden" name="fichaId" value={ficha.id} />
                    <input type="hidden" name="sets" value={sets} />
                    <button
                      type="submit"
                      className="min-h-12 flex-none cursor-pointer border border-ink bg-paper px-4 text-[13.5px] font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                    >
                      Adicionar
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
