"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteFicha, toggleArchive } from "./actions";

/*
 * Ações dos cards da lista (01-zine-v2) com a confirmação destrutiva Z-01:
 * sempre inline, em 2 passos — nada de modal no zine.
 */

function ConfirmDelete({
  id,
  name,
  onCancel,
}: {
  id: string;
  name: string;
  onCancel: () => void;
}) {
  return (
    <div className="animate-rise border-t-2 border-ember-deep pt-3 pb-4">
      <p className="text-[14px] font-medium">
        Excluir <b className="font-bold">{name}</b> e todo o histórico de
        sessões? Não dá para desfazer.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <form action={deleteFicha}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="min-h-12 cursor-pointer bg-ember-deep px-[18px] text-[14px] font-bold text-paper transition-colors hover:bg-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Sim, excluir tudo
          </button>
        </form>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 cursor-pointer px-3 text-[14px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Não, manter
        </button>
      </div>
    </div>
  );
}

/** Rodapé do card ativo: "Abrir ficha →" + × (vira confirmação Z-01). */
export function CardActions({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="-mx-4 px-4">
        <ConfirmDelete id={id} name={name} onCancel={() => setConfirming(false)} />
      </div>
    );
  }

  return (
    <div className="-mx-4 flex border-t-2 border-ink">
      <Link
        href={`/fichas/${id}`}
        className="group flex min-h-[52px] flex-1 items-center justify-between gap-2.5 bg-ink px-4 text-[15px] font-bold text-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
      >
        Abrir ficha
        <span
          aria-hidden="true"
          className="text-[19px] text-ember transition-transform duration-150 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Excluir ficha ${name}`}
        className="min-h-[52px] w-14 cursor-pointer border-l-2 border-ink bg-paper text-[21px] font-bold text-ink transition-colors hover:bg-ember hover:text-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
      >
        ×
      </button>
    </div>
  );
}

/** Linha arquivada ("Fora de catálogo"): reabrir ↻ + excluir ×. */
export function ArchivedActions({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-end gap-0">
        <form action={toggleArchive}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            aria-label={`Reabrir ficha ${name}`}
            title="Reabrir ficha"
            className="size-12 cursor-pointer border-2 border-clay text-[17px] font-bold text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            ↻
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Excluir ficha ${name}`}
          className="size-12 cursor-pointer border-2 border-l-0 border-clay text-[17px] font-bold text-muted transition-colors hover:border-ember hover:text-ember-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          ×
        </button>
      </div>
      {confirming && (
        <ConfirmDelete id={id} name={name} onCancel={() => setConfirming(false)} />
      )}
    </div>
  );
}
