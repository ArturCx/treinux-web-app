"use client";

import { useState } from "react";
import Link from "next/link";
import { addExerciseToFicha } from "../../fichas/actions";

type FichaOption = { id: string; name: string; hasExercise: boolean };

/**
 * Adiciona à ficha direto da tela de detalhe. Com uma ficha só, é um botão;
 * com várias, abre a lista — sem select nativo, para manter o sistema visual.
 */
export function AddToFicha({
  exerciseId,
  fichas,
}: {
  exerciseId: string;
  fichas: FichaOption[];
}) {
  const [open, setOpen] = useState(false);

  if (fichas.length === 0) {
    return (
      <Link
        href="/fichas/nova"
        className="group flex h-14 items-center justify-between bg-ink px-5 text-[15px] font-bold text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <span>Criar ficha para adicionar</span>
        <span
          aria-hidden="true"
          className="text-[18px] text-ember transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>
    );
  }

  if (fichas.length === 1 && !open) {
    const ficha = fichas[0];
    if (ficha.hasExercise) {
      return (
        <Link
          href={`/fichas/${ficha.id}`}
          className="flex h-14 items-center justify-between border-2 border-paper-edge px-5 text-[15px] font-medium text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          <span>
            <span className="text-ember">✓</span> Já está em {ficha.name}
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      );
    }
    return (
      <form action={addExerciseToFicha}>
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <input type="hidden" name="fichaId" value={ficha.id} />
        <button
          type="submit"
          className="group flex h-14 w-full cursor-pointer items-center justify-between bg-ink px-5 text-[15px] font-bold text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          <span>Adicionar a {ficha.name}</span>
          <span
            aria-hidden="true"
            className="text-[18px] text-ember transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </button>
      </form>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-14 cursor-pointer items-center justify-between bg-ink px-5 text-[15px] font-bold text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <span>Adicionar a uma ficha</span>
        <span
          aria-hidden="true"
          className="text-[18px] text-ember transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </button>
    );
  }

  return (
    <div className="animate-rise flex flex-col border-2 border-ink">
      <div className="flex items-center justify-between border-b border-paper-edge bg-ink px-4 py-2.5">
        <span className="text-[11px] font-medium tracking-[0.1em] text-clay">
          ESCOLHA A FICHA
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer text-[12px] font-medium text-clay transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
        >
          Fechar
        </button>
      </div>
      <ul>
        {fichas.map((ficha) => (
          <li key={ficha.id} className="border-b border-paper-edge last:border-b-0">
            {ficha.hasExercise ? (
              <Link
                href={`/fichas/${ficha.id}`}
                className="flex h-13 items-center justify-between px-4 text-[14.5px] text-muted transition-colors hover:bg-[#efebe2] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
              >
                <span>{ficha.name}</span>
                <span className="text-[12.5px] font-bold text-ember">
                  ✓ já está
                </span>
              </Link>
            ) : (
              <form action={addExerciseToFicha}>
                <input type="hidden" name="exerciseId" value={exerciseId} />
                <input type="hidden" name="fichaId" value={ficha.id} />
                <button
                  type="submit"
                  className="group flex h-13 w-full cursor-pointer items-center justify-between px-4 text-left text-[14.5px] font-medium transition-colors hover:bg-[#efebe2] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
                >
                  <span>{ficha.name}</span>
                  <span
                    aria-hidden="true"
                    className="text-ember opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                  >
                    →
                  </span>
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
