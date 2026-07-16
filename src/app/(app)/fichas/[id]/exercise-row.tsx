"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BODY_PART_LABELS,
  EQUIPMENT_LABELS,
  TARGET_LABELS,
  label,
} from "@/lib/catalog";
import { initials } from "@/lib/ficha-stats";
import { moveExercise, removeExercise, updatePrescription } from "../actions";

export type RowItem = {
  id: string;
  order: number;
  sets: number;
  reps: string;
  restSeconds: number | null;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    imageUrl: string | null;
    bodyPart: string;
    equipment: string;
    target: string;
  };
};

export function ExerciseRow({
  item,
  index,
  total,
  last,
}: {
  item: RowItem;
  index: number;
  total: number;
  last: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updatePrescription, null);

  const taxonomy = [
    label(BODY_PART_LABELS, item.exercise.bodyPart),
    label(TARGET_LABELS, item.exercise.target),
    label(EQUIPMENT_LABELS, item.exercise.equipment),
  ].join(" · ");

  return (
    <li
      className={`relative overflow-hidden ${last && !open ? "" : "border-b border-paper-edge"}`}
    >
      {/* numeral de impresso: sangra atrás do conteúdo, decorativo */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-3.5 right-3.5 z-0 text-[96px] leading-none font-bold tracking-[-0.05em] text-[#ECE8DE] select-none tabular-nums lg:right-6"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative z-1 px-5 py-5 lg:px-8">
        <div className="flex items-start gap-3">
          {item.exercise.imageUrl ? (
            <Image
              src={item.exercise.imageUrl}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 bg-paper-edge object-cover"
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center bg-paper-edge text-[15px] font-bold text-muted">
              {initials(item.exercise.name)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] leading-[1.15] font-bold tracking-[-0.02em]">
              <Link
                href={`/exercicios/${item.exercise.id}`}
                className="hover:underline hover:decoration-ember hover:underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              >
                {item.exercise.name}
              </Link>
            </h3>
            <p className="mt-1 text-[12.5px] text-muted">{taxonomy}</p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <form action={moveExercise}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="direction" value="up" />
              <IconButton label="Mover para cima" disabled={index === 0}>
                ↑
              </IconButton>
            </form>
            <form action={moveExercise}>
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="direction" value="down" />
              <IconButton label="Mover para baixo" disabled={index === total - 1}>
                ↓
              </IconButton>
            </form>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="text-[30px] leading-none font-bold tracking-[-0.03em] tabular-nums">
            {item.sets} <span className="text-ember">×</span> {item.reps}
          </span>
          {item.restSeconds !== null && (
            <span className="text-[12.5px] font-medium text-muted">
              {formatRest(item.restSeconds)} descanso
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="ml-auto h-11 cursor-pointer px-1 text-[13px] font-medium text-muted underline-offset-3 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            {open ? "Fechar" : "Editar"}
          </button>
        </div>

        {item.notes && !open && (
          <p className="mt-2 border-l-2 border-ember pl-2.5 text-[13px] leading-relaxed text-muted italic">
            {item.notes}
          </p>
        )}
      </div>

      {open && (
        <form
          action={action}
          className="animate-rise relative z-1 flex flex-col gap-4 border-t border-dashed border-paper-edge bg-[#ECE8DE] px-5 py-5 lg:px-8"
        >
          <input type="hidden" name="itemId" value={item.id} />

          {state?.error && (
            <p
              role="alert"
              className="border border-error-edge bg-error-bg px-3 py-2 text-[13px] text-error-ink"
            >
              {state.error}
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <CompactField
              id={`sets-${item.id}`}
              name="sets"
              label="SÉRIES"
              type="number"
              min={1}
              max={20}
              required
              defaultValue={item.sets}
              className="w-20"
            />
            <CompactField
              id={`reps-${item.id}`}
              name="reps"
              label="REPETIÇÕES"
              type="text"
              required
              maxLength={20}
              defaultValue={item.reps}
              placeholder="8-12"
              className="w-32"
            />
            <CompactField
              id={`rest-${item.id}`}
              name="restSeconds"
              label="DESCANSO (S)"
              type="number"
              min={0}
              max={900}
              defaultValue={item.restSeconds ?? ""}
              placeholder="60"
              className="w-28"
            />
          </div>

          <CompactField
            id={`notes-${item.id}`}
            name="notes"
            label="OBSERVAÇÃO"
            type="text"
            maxLength={200}
            defaultValue={item.notes ?? ""}
            placeholder="Cadência 3-1-1, pegada aberta…"
          />

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="flex h-11 cursor-pointer items-center gap-2.5 bg-ink px-5 text-[13.5px] font-bold text-paper transition-colors hover:bg-ink-soft disabled:cursor-default disabled:bg-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              {pending && (
                <span
                  aria-hidden="true"
                  className="inline-block size-3.5 animate-spin rounded-full border-2 border-paper/35 border-t-paper"
                />
              )}
              {pending ? "Salvando…" : "Salvar"}
            </button>
            <RemoveButton itemId={item.id} name={item.exercise.name} />
          </div>
        </form>
      )}
    </li>
  );
}

function IconButton({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-11 cursor-pointer items-center justify-center text-[15px] text-muted transition-colors hover:text-ink disabled:cursor-default disabled:opacity-20 disabled:hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
    >
      {children}
    </button>
  );
}

function RemoveButton({ itemId, name }: { itemId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="h-11 cursor-pointer text-[13px] font-medium text-muted underline-offset-3 transition-colors hover:text-ember-deep hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        Remover
      </button>
    );
  }

  return (
    <span className="animate-rise flex flex-wrap items-center gap-2 text-[13px]">
      <span className="text-ember-deep">Remover {name}?</span>
      <form action={removeExercise} className="contents">
        <input type="hidden" name="itemId" value={itemId} />
        <button
          type="submit"
          className="h-11 cursor-pointer font-bold text-ember-deep underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Sim
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="h-11 cursor-pointer text-muted underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        Não
      </button>
    </span>
  );
}

function CompactField({
  id,
  label,
  className = "",
  ...props
}: { id: string; label: string } & React.ComponentProps<"input">) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={id}
        className="text-[11px] font-medium tracking-[0.08em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        className="h-11 w-full border-b-2 border-ink bg-transparent px-0.5 text-[15px] font-medium outline-none transition-colors placeholder:text-clay focus:border-ember"
        {...props}
      />
    </div>
  );
}

function formatRest(seconds: number) {
  if (seconds === 0) return "sem";
  return seconds >= 60 && seconds % 60 === 0
    ? `${seconds / 60}min`
    : `${seconds}s`;
}
