"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { discardWorkout, finishWorkout, setEntry } from "../actions";

type ExerciseInput = {
  exerciseId: string;
  name: string;
  imageUrl: string | null;
  sets: number;
  reps: string;
  weightKg: number | null;
};

type EntryInput = {
  exerciseId: string;
  setNumber: number;
  weightKg: string;
  reps: string;
};

type SetState = { done: boolean; weight: string; reps: string };

const key = (exerciseId: string, setNumber: number) => `${exerciseId}-${setNumber}`;

export function WorkoutSession({
  logId,
  fichaName,
  exercises,
  initialEntries,
}: {
  logId: string;
  fichaName: string;
  exercises: ExerciseInput[];
  initialEntries: EntryInput[];
}) {
  const [state, setState] = useState<Record<string, SetState>>(() => {
    const entryByKey = new Map(
      initialEntries.map((e) => [key(e.exerciseId, e.setNumber), e]),
    );
    const init: Record<string, SetState> = {};
    for (const ex of exercises) {
      for (let n = 1; n <= ex.sets; n++) {
        const existing = entryByKey.get(key(ex.exerciseId, n));
        init[key(ex.exerciseId, n)] = existing
          ? { done: true, weight: existing.weightKg, reps: existing.reps }
          : {
              done: false,
              weight: ex.weightKg !== null ? String(ex.weightKg) : "",
              reps: "",
            };
      }
    }
    return init;
  });

  const [, startTransition] = useTransition();

  const totals = useMemo(() => {
    const total = exercises.reduce((s, e) => s + e.sets, 0);
    const done = Object.values(state).filter((s) => s.done).length;
    return { total, done };
  }, [state, exercises]);

  function persist(exerciseId: string, setNumber: number, s: SetState) {
    const fd = new FormData();
    fd.set("logId", logId);
    fd.set("exerciseId", exerciseId);
    fd.set("setNumber", String(setNumber));
    fd.set("done", s.done ? "1" : "0");
    fd.set("weightKg", s.weight);
    fd.set("reps", s.reps);
    startTransition(() => setEntry(fd));
  }

  function toggle(exerciseId: string, setNumber: number) {
    const k = key(exerciseId, setNumber);
    const next = { ...state[k], done: !state[k].done };
    setState((prev) => ({ ...prev, [k]: next }));
    persist(exerciseId, setNumber, next);
  }

  function edit(
    exerciseId: string,
    setNumber: number,
    field: "weight" | "reps",
    value: string,
  ) {
    setState((prev) => {
      const k = key(exerciseId, setNumber);
      return { ...prev, [k]: { ...prev[k], [field]: value } };
    });
  }

  function commit(exerciseId: string, setNumber: number) {
    const s = state[key(exerciseId, setNumber)];
    if (s.done) persist(exerciseId, setNumber, s);
  }

  const pct = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;
  const allDone = totals.total > 0 && totals.done === totals.total;

  return (
    <div className="mx-auto w-full max-w-2xl pb-28">
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-ember">
        EM TREINO
      </div>
      <h1 className="mt-1 text-[32px] leading-[1.02] font-bold tracking-[-0.03em] lg:text-[42px]">
        {fichaName}
        <span className="text-ember">.</span>
      </h1>

      {/* progresso */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-muted">
            {totals.done} de {totals.total} séries
          </span>
          <span className="text-[13px] font-bold text-ember tabular-nums">
            {pct}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full bg-paper-edge">
          <div
            className="h-full bg-ember transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {exercises.length === 0 && (
        <p className="mt-8 text-[15px] text-muted">
          Esta ficha não tem exercícios. Adicione exercícios antes de treinar.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-6">
        {exercises.map((ex) => {
          const doneCount = Array.from({ length: ex.sets }).filter(
            (_, i) => state[key(ex.exerciseId, i + 1)]?.done,
          ).length;
          return (
            <li key={ex.exerciseId}>
              <div className="flex items-center gap-3">
                {ex.imageUrl && (
                  <Image
                    src={ex.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 shrink-0 bg-paper-edge object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] leading-tight font-bold tracking-[-0.01em]">
                    {ex.name}
                  </h2>
                  <p className="text-[12.5px] text-muted">
                    {ex.sets} × {ex.reps}
                    {ex.weightKg !== null && ` · ${ex.weightKg} kg alvo`}
                  </p>
                </div>
                <span className="shrink-0 text-[13px] font-bold text-muted tabular-nums">
                  {doneCount}/{ex.sets}
                </span>
              </div>

              <div className="mt-2 flex flex-col">
                {Array.from({ length: ex.sets }).map((_, i) => {
                  const n = i + 1;
                  const s = state[key(ex.exerciseId, n)];
                  return (
                    <div
                      key={n}
                      className={`flex items-center gap-2 border-b border-paper-edge py-2 transition-colors ${s.done ? "bg-ember/6" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(ex.exerciseId, n)}
                        aria-pressed={s.done}
                        aria-label={`Série ${n} ${s.done ? "concluída" : "pendente"}`}
                        className={`flex size-9 shrink-0 cursor-pointer items-center justify-center border-2 text-[15px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
                          s.done
                            ? "animate-pop border-ember bg-ember text-paper"
                            : "border-ink text-transparent hover:border-ember active:border-ember"
                        }`}
                      >
                        ✓
                      </button>
                      <span className="w-10 shrink-0 text-[12px] font-medium tracking-[0.06em] text-muted">
                        SÉR {n}
                      </span>
                      <label className="flex flex-1 items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={s.weight}
                          onChange={(e) =>
                            edit(ex.exerciseId, n, "weight", e.target.value)
                          }
                          onBlur={() => commit(ex.exerciseId, n)}
                          placeholder={ex.weightKg !== null ? String(ex.weightKg) : "kg"}
                          className="h-10 w-full min-w-0 border-b-2 border-paper-edge bg-transparent px-1 text-center text-[15px] font-medium tabular-nums outline-none transition-colors focus:border-ember"
                        />
                        <span className="text-[12px] text-muted">kg</span>
                      </label>
                      <label className="flex flex-1 items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={s.reps}
                          onChange={(e) =>
                            edit(ex.exerciseId, n, "reps", e.target.value)
                          }
                          onBlur={() => commit(ex.exerciseId, n)}
                          placeholder={ex.reps}
                          className="h-10 w-full min-w-0 border-b-2 border-paper-edge bg-transparent px-1 text-center text-[15px] font-medium tabular-nums outline-none transition-colors focus:border-ember"
                        />
                        <span className="text-[12px] text-muted">reps</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {/* barra fixa de ações — pb respeita a home bar do iOS */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-0">
          <form action={finishWorkout} className="flex-1">
            <input type="hidden" name="logId" value={logId} />
            <button
              type="submit"
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 bg-ember text-[15px] font-bold text-paper transition-colors hover:bg-ember-deep active:bg-ember-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {allDone ? "Concluir treino" : `Concluir (${totals.done}/${totals.total})`}
            </button>
          </form>
          <DiscardButton logId={logId} />
        </div>
      </div>
    </div>
  );
}

/** Descartar apaga o treino inteiro — confirmação em dois toques, como as demais exclusões. */
function DiscardButton({ logId }: { logId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="h-12 shrink-0 cursor-pointer px-4 text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        Descartar
      </button>
    );
  }

  return (
    <span className="animate-rise flex shrink-0 items-center gap-2.5 text-[13px]">
      <span className="font-medium text-error-ink">Apagar treino?</span>
      <form action={discardWorkout} className="contents">
        <input type="hidden" name="logId" value={logId} />
        <button
          type="submit"
          className="h-12 cursor-pointer font-bold text-error-ink underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Sim
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="h-12 cursor-pointer text-muted underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        Não
      </button>
    </span>
  );
}
