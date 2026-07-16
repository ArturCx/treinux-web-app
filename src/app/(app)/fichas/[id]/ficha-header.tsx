"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { splitFichaName } from "@/lib/ficha-stats";
import { deleteFicha, toggleArchive, updateFicha } from "../actions";

type Ficha = {
  id: string;
  name: string;
  notes: string | null;
  archived: boolean;
  updatedAt: Date;
};

type Stats = { exercises: number; sets: number; minutes: number };

export function FichaHeader({ ficha, stats }: { ficha: Ficha; stats: Stats }) {
  const [editing, setEditing] = useState(false);
  const [head, tail] = splitFichaName(ficha.name);

  return (
    <header className="bg-ink px-5 pt-5 pb-6 text-paper lg:flex lg:flex-col lg:px-10 lg:py-11">
      <div className="flex items-center justify-between">
        <Link
          href="/fichas"
          className="text-[13px] font-medium text-clay transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          ← Fichas
        </Link>
        <span className="text-[11px] font-medium tracking-[0.14em] text-clay">
          {ficha.archived ? "ARQUIVADA" : formatUpdated(ficha.updatedAt)}
        </span>
      </div>

      {editing ? (
        <EditForm ficha={ficha} onDone={() => setEditing(false)} />
      ) : (
        <>
          <h1 className="mt-5 text-[42px] leading-[0.95] font-bold tracking-[-0.04em] lg:mt-10 lg:text-[64px] lg:leading-[0.92] lg:tracking-[-0.045em]">
            {head}
            {tail && (
              <>
                <br />
                <span className="text-ember">{tail}</span>
              </>
            )}
          </h1>

          {ficha.notes && (
            <p className="mt-4 max-w-[280px] text-[15px] leading-relaxed text-clay">
              {ficha.notes}
            </p>
          )}

          <div className="mt-6 flex items-center gap-0 border-t border-[#3A3833] pt-3.5 lg:mt-auto lg:gap-7 lg:pt-5">
            <Stat value={stats.exercises} label="EXERCÍCIOS" />
            <Stat value={stats.sets} label="SÉRIES" />
            <Stat
              value={stats.minutes > 0 ? `~${stats.minutes}` : "—"}
              label="MIN"
            />
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="ml-auto h-11 shrink-0 cursor-pointer self-center bg-ember px-4 text-[13px] font-bold text-paper transition-colors hover:bg-ember-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper lg:hidden"
            >
              Editar
            </button>
          </div>

          <div className="mt-6 hidden gap-3 lg:flex">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-12 flex-1 cursor-pointer bg-ember text-[14px] font-bold text-paper transition-colors hover:bg-ember-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
            >
              Editar
            </button>
            <form action={toggleArchive} className="flex-1">
              <input type="hidden" name="id" value={ficha.id} />
              <button
                type="submit"
                className="h-12 w-full cursor-pointer border border-[#3A3833] text-[14px] font-medium text-paper transition-colors hover:border-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
              >
                {ficha.archived ? "Desarquivar" : "Arquivar"}
              </button>
            </form>
          </div>

          <div className="mt-3 flex items-center gap-4 lg:mt-4">
            <form action={toggleArchive} className="lg:hidden">
              <input type="hidden" name="id" value={ficha.id} />
              <button
                type="submit"
                className="cursor-pointer text-[13px] font-medium text-clay underline-offset-3 transition-colors hover:text-paper hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
              >
                {ficha.archived ? "Desarquivar" : "Arquivar"}
              </button>
            </form>
            <DeleteFicha id={ficha.id} name={ficha.name} />
          </div>
        </>
      )}
    </header>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex-1 lg:flex-none">
      <div className="text-[22px] font-bold tabular-nums lg:text-[30px]">
        {value}
      </div>
      <div className="text-[10.5px] font-medium tracking-[0.1em] text-clay lg:text-[11px]">
        {label}
      </div>
    </div>
  );
}

function EditForm({ ficha, onDone }: { ficha: Ficha; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const result = await updateFicha(prev as null, fd);
    if (!result?.error) onDone();
    return result;
  }, null);

  return (
    <form action={action} className="mt-6 flex flex-col gap-5 lg:mt-10">
      <input type="hidden" name="id" value={ficha.id} />

      {state?.error && (
        <p className="border border-[#6E3830] bg-[#241A18] px-3 py-2 text-[13px] text-[#F0B9B2]">
          {state.error}
        </p>
      )}

      <InkField
        id="name"
        name="name"
        label="NOME DA FICHA"
        defaultValue={ficha.name}
        required
        maxLength={80}
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="notes"
          className="text-[11px] font-medium tracking-[0.1em] text-clay"
        >
          OBSERVAÇÕES
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={ficha.notes ?? ""}
          maxLength={500}
          className="min-h-[80px] w-full resize-y border-b-2 border-[#3A3833] bg-transparent px-0.5 py-2 text-[15px] font-medium text-paper outline-none transition-colors placeholder:text-clay focus:border-ember"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2.5 bg-ember text-[14px] font-bold text-paper transition-colors hover:bg-ember-deep disabled:cursor-default disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
        >
          {pending && (
            <span
              aria-hidden="true"
              className="inline-block size-3.5 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
            />
          )}
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="cursor-pointer text-[14px] font-medium text-clay transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function InkField({
  id,
  label,
  ...props
}: { id: string; label: string } & React.ComponentProps<"input">) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-medium tracking-[0.1em] text-clay"
      >
        {label}
      </label>
      <input
        id={id}
        className="h-12 w-full border-b-2 border-[#3A3833] bg-transparent px-0.5 text-[17px] font-medium text-paper outline-none transition-colors placeholder:text-clay focus:border-ember"
        {...props}
      />
    </div>
  );
}

function DeleteFicha({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer text-[13px] font-medium text-clay underline-offset-3 transition-colors hover:text-ember hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        Excluir
      </button>
    );
  }

  return (
    <div className="animate-rise flex flex-wrap items-center gap-3 border border-[#6E3830] bg-[#241A18] px-3 py-2">
      <span className="text-[12.5px] text-[#F0B9B2]">
        Excluir &ldquo;{name}&rdquo; e todo o histórico?
      </span>
      <form action={deleteFicha}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="cursor-pointer text-[12.5px] font-bold text-[#E0655A] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
        >
          Excluir
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="cursor-pointer text-[12.5px] text-clay underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        Cancelar
      </button>
    </div>
  );
}

function formatUpdated(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .toUpperCase()
    .replace(".", "");
}
