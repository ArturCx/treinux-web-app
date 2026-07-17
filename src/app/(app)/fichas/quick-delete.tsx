"use client";

import { useState } from "react";
import { deleteFicha } from "./actions";

/**
 * Atalho de exclusão na própria lista — dois toques (Excluir → Sim), sem
 * precisar entrar na ficha. Fica sobreposto ao link da linha, por isso é
 * irmão dele no DOM, não filho.
 */
export function QuickDelete({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Excluir ficha ${name}`}
        className="h-11 cursor-pointer px-1 text-[12.5px] font-medium text-muted underline-offset-3 transition-colors hover:text-ember-deep hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        Excluir
      </button>
    );
  }

  return (
    <div className="animate-rise flex flex-wrap items-center justify-end gap-2.5 border border-error-edge bg-error-bg px-3 py-2 text-[12.5px]">
      <span className="text-error-ink">Excluir a ficha e o histórico?</span>
      <form action={deleteFicha} className="contents">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="h-9 cursor-pointer font-bold text-error-ink underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Sim
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="h-9 cursor-pointer text-muted underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        Não
      </button>
    </div>
  );
}
