"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { splitFichaName } from "@/lib/ficha-stats";
import { discardWorkout, finishWorkout, setEntry } from "../actions";

/*
 * O instrumento (04-telemetria-v2): takeover escuro de tela inteira, SÓ
 * durante o treino ao vivo. Cronômetro de descanso em 7 segmentos, LEDs
 * por série, dados em mono, dock fixo com o relógio da sessão.
 */

type ExerciseInput = {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  weightKg: number | null;
  restSeconds: number | null;
};

type EntryInput = {
  exerciseId: string;
  setNumber: number;
  weightKg: string;
  reps: string;
};

type SetState = { done: boolean; weight: string; reps: string; justLit?: boolean };

const key = (exerciseId: string, setNumber: number) => `${exerciseId}-${setNumber}`;
const DEFAULT_REST = 90;

/** Reps "exata" = número puro (ex.: "10"); faixas/AMRAP/"25 seg" ficam vazias. */
const exactReps = (reps: string) => (/^\d+$/.test(reps.trim()) ? reps.trim() : "");

export function WorkoutSession({
  logId,
  fichaName,
  startedAtMs,
  exercises,
  initialEntries,
}: {
  logId: string;
  fichaName: string;
  startedAtMs: number;
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
              // reps já vêm preenchidas quando a prescrição é um número exato
              reps: exactReps(ex.reps),
            };
      }
    }
    return init;
  });

  // bloco "em execução" = o que o usuário selecionou (ordem livre); começa no
  // primeiro exercício com série pendente, mas pode ser trocado a qualquer hora
  const [selectedId, setSelectedId] = useState<string>(() => {
    const doneKeys = new Set(
      initialEntries.map((e) => key(e.exerciseId, e.setNumber)),
    );
    const firstPending = exercises.find((ex) =>
      Array.from({ length: ex.sets }).some(
        (_, i) => !doneKeys.has(key(ex.exerciseId, i + 1)),
      ),
    );
    return (firstPending ?? exercises[0])?.exerciseId ?? "";
  });

  // cronômetro de descanso: conta a partir do registro da série rumo ao alvo
  const [restStart, setRestStart] = useState<number | null>(null);
  const [restTarget, setRestTarget] = useState<number>(DEFAULT_REST);
  const [now, setNow] = useState(0);
  const [saveError, setSaveError] = useState<{
    exerciseId: string;
    setNumber: number;
  } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0); // primeiro valor sem esperar o intervalo
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

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
    startTransition(async () => {
      try {
        await setEntry(fd);
        setSaveError(null);
      } catch {
        // T-02: rede/servidor falhou — o painel avisa e guarda o retry
        setSaveError({ exerciseId, setNumber });
      }
    });
  }

  function retrySave() {
    if (!saveError) return;
    const { exerciseId, setNumber } = saveError;
    const s = state[key(exerciseId, setNumber)];
    if (s) persist(exerciseId, setNumber, s);
  }

  function toggle(ex: ExerciseInput, setNumber: number) {
    const k = key(ex.exerciseId, setNumber);
    const next = { ...state[k], done: !state[k].done, justLit: !state[k].done };
    setState((prev) => ({ ...prev, [k]: next }));
    setSelectedId(ex.exerciseId); // registrar uma série passa o foco pra ela
    persist(ex.exerciseId, setNumber, next);
    if (next.done) {
      // registrar série liga o cronômetro com o alvo do exercício
      // eslint-disable-next-line react-hooks/purity -- leitura de relógio num event handler: o descanso começa no instante real do toque
      setRestStart(Date.now());
      setRestTarget(ex.restSeconds ?? DEFAULT_REST);
    }
  }

  function edit(exerciseId: string, setNumber: number, field: "weight" | "reps", value: string) {
    setState((prev) => {
      const k = key(exerciseId, setNumber);
      return { ...prev, [k]: { ...prev[k], [field]: value } };
    });
  }

  function commit(exerciseId: string, setNumber: number) {
    const s = state[key(exerciseId, setNumber)];
    if (s.done) persist(exerciseId, setNumber, s);
  }

  const elapsed = restStart === null ? 0 : Math.max(0, Math.floor((now - restStart) / 1000));
  const over = restStart !== null && elapsed >= restTarget;
  const sessionSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const [head, tail] = splitFichaName(fichaName);
  const nextSet = Math.min(totals.done + 1, totals.total);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-coal font-sans text-dtext">
      <header className="flex items-center justify-between border-b border-dedge px-[18px] py-3.5 lg:px-10">
        <Link
          href="/fichas"
          className="text-[19px] font-bold tracking-[-0.01em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber"
        >
          Treinux<span className="text-amber">.</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-amber uppercase">
          <span aria-hidden="true" className="size-2 animate-livepulse rounded-full bg-amber" />
          Treino ao vivo
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1240px] flex-1 lg:grid lg:grid-cols-[460px_1fr] lg:items-start lg:gap-x-11 lg:px-10">
        <div>
          <section className="px-[18px] pt-[18px] lg:px-0 lg:pt-[26px]">
            <div className="text-[11px] font-medium tracking-[0.2em] text-dmut uppercase">
              Sessão
            </div>
            <h1 className="mt-1 text-[22px] leading-tight font-bold tracking-[-0.02em]">
              {head}
              {tail && <span className="text-amber"> {tail}</span>}
            </h1>
            <div className="mt-1.5 font-mono text-[12.5px] text-dmut tabular-nums">
              Série <b className="font-bold text-dtext">{nextSet} de {totals.total}</b> · iniciado
              às{" "}
              <b className="font-bold text-dtext">
                {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
                  startedAtMs,
                )}
              </b>
            </div>
          </section>

          {/* ── o instrumento ─────────────────────────────────── */}
          <section
            aria-label="Cronômetro de descanso"
            className="relative mx-[18px] mt-[18px] border border-dedge bg-panel px-4 pt-[18px] pb-5 lg:sticky lg:top-[26px] lg:mx-0 lg:mt-[26px]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(255,106,61,0.06),transparent_55%)]"
            />
            <div className="relative flex items-baseline justify-between">
              <span
                className={`text-[11px] font-bold tracking-[0.24em] uppercase ${over ? "text-phos" : "text-amber"}`}
              >
                {over ? "Descanso completo" : "Descanso"}
              </span>
              <span className="font-mono text-[12px] text-dmut tabular-nums">
                alvo {formatClock(restTarget)}
              </span>
            </div>

            <SegClock seconds={elapsed} over={over} idle={restStart === null} />

            <div aria-hidden="true" className="mt-[18px] flex gap-1">
              {Array.from({ length: 18 }).map((_, i) => {
                const lit =
                  restStart !== null &&
                  i < (over ? 18 : Math.round((elapsed / restTarget) * 18));
                return (
                  <i
                    key={i}
                    className={`h-2.5 flex-1 ${
                      lit
                        ? over
                          ? "bg-phos shadow-[0_0_5px_rgba(143,227,136,0.5)]"
                          : "bg-amber shadow-[0_0_5px_rgba(255,106,61,0.5)]"
                        : "bg-led-off"
                    }`}
                  />
                );
              })}
            </div>

            <div className="relative mt-[18px] flex gap-2.5">
              <button
                type="button"
                onClick={() => setRestTarget((t) => t + 30)}
                disabled={restStart === null}
                className="min-h-12 flex-1 cursor-pointer border border-dgray bg-transparent font-mono text-[14px] font-medium tracking-[0.06em] text-dtext transition-colors hover:border-amber hover:text-amber disabled:cursor-default disabled:opacity-40 disabled:hover:border-dgray disabled:hover:text-dtext focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={() => restStart !== null && setRestStart(now - restTarget * 1000)}
                disabled={restStart === null || over}
                className="min-h-12 flex-1 cursor-pointer border border-dgray bg-transparent font-mono text-[14px] font-medium tracking-[0.06em] text-dtext transition-colors hover:border-amber hover:text-amber disabled:cursor-default disabled:opacity-40 disabled:hover:border-dgray disabled:hover:text-dtext focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
              >
                Pular descanso →
              </button>
            </div>
          </section>
        </div>

        {/* ── exercícios ──────────────────────────────────────── */}
        <main className="px-[18px] pt-6 pb-8 lg:px-0 lg:pt-[26px]">
          <div className="flex items-baseline justify-between border-b border-dedge pb-3">
            <span className="text-[11px] font-bold tracking-[0.2em] text-dmut uppercase">
              Exercícios
            </span>
            <span className="font-mono text-[12.5px] text-dmut tabular-nums">
              <b className="font-bold text-phos">{totals.done}</b>/{totals.total} séries feitas
            </span>
          </div>

          {/* T-02: falha ao registrar série — banner com retry */}
          {saveError && (
            <div className="animate-rise mt-4 flex items-center justify-between gap-3 border border-derror-edge bg-derror-bg px-3.5 py-3">
              <p className="font-mono text-[12.5px] text-derror-ink">
                Falha ao registrar a série {saveError.setNumber}.
              </p>
              <button
                type="button"
                onClick={retrySave}
                className="min-h-11 flex-none cursor-pointer font-mono text-[12.5px] font-bold text-amber transition-colors hover:text-dtext focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
              >
                Tentar de novo →
              </button>
            </div>
          )}

          {exercises.length === 0 && (
            <p className="mt-6 text-[15px] text-dmut">
              Esta ficha não tem exercícios. Adicione exercícios antes de treinar.
            </p>
          )}

          {exercises.map((ex) => {
            const doneCount = Array.from({ length: ex.sets }).filter(
              (_, i) => state[key(ex.exerciseId, i + 1)]?.done,
            ).length;
            const exDone = doneCount === ex.sets;
            const isActive = ex.exerciseId === selectedId;

            return (
              <article
                key={ex.exerciseId}
                onClick={() => setSelectedId(ex.exerciseId)}
                className={`relative mt-4 border bg-panel px-3.5 pt-4 pb-4 transition-colors ${
                  isActive ? "border-amber" : "border-dedge hover:border-dmut"
                }`}
              >
                <span
                  className={`absolute -top-[9px] left-3 bg-coal px-2 text-[10px] font-bold tracking-[0.18em] uppercase ${
                    isActive ? "text-amber" : exDone ? "text-phos" : "text-dmut"
                  }`}
                >
                  {isActive ? "Em execução" : exDone ? "Concluído" : "Pendente"}
                </span>

                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[17px] font-bold tracking-[-0.01em]">{ex.name}</h2>
                  <div className="font-mono text-[18px] font-bold whitespace-nowrap tabular-nums">
                    {ex.sets} <i className="text-amber not-italic">×</i> {ex.reps}
                  </div>
                </div>

                <div className="mt-3 flex flex-col">
                  {Array.from({ length: ex.sets }).map((_, i) => {
                    const n = i + 1;
                    const s = state[key(ex.exerciseId, n)];
                    return (
                      <div
                        key={n}
                        className="flex items-center gap-2.5 border-b border-dedge py-2 last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() => toggle(ex, n)}
                          aria-pressed={s.done}
                          aria-label={`Série ${n} ${s.done ? "registrada" : "pendente"}`}
                          className={`size-[26px] shrink-0 cursor-pointer rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber ${
                            s.done
                              ? `border-amber bg-amber shadow-[0_0_8px_rgba(255,106,61,0.55)] ${s.justLit ? "animate-ledpop" : ""}`
                              : "border-dedge bg-led-off hover:border-amber"
                          }`}
                        />
                        <span className="w-7 shrink-0 font-mono text-[11px] text-dmut tabular-nums">
                          S{n}
                        </span>
                        <label className="flex flex-1 items-center gap-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={s.weight}
                            onChange={(e) => edit(ex.exerciseId, n, "weight", e.target.value)}
                            onBlur={() => commit(ex.exerciseId, n)}
                            placeholder={ex.weightKg !== null ? String(ex.weightKg) : "—"}
                            className="h-11 w-full min-w-0 border-b border-dgray bg-transparent px-1 text-center font-mono text-[14px] text-dtext tabular-nums outline-none transition-colors placeholder:text-dgray focus:border-amber"
                          />
                          <span className="font-mono text-[11px] text-dmut">kg</span>
                        </label>
                        <label className="flex flex-1 items-center gap-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={s.reps}
                            onChange={(e) => edit(ex.exerciseId, n, "reps", e.target.value)}
                            onBlur={() => commit(ex.exerciseId, n)}
                            placeholder={ex.reps}
                            className="h-11 w-full min-w-0 border-b border-dgray bg-transparent px-1 text-center font-mono text-[14px] text-dtext tabular-nums outline-none transition-colors placeholder:text-dgray focus:border-amber"
                          />
                          <span className="font-mono text-[11px] text-dmut">reps</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </main>
      </div>

      <Dock logId={logId} sessionSeconds={sessionSeconds} />
    </div>
  );
}

/** Dock fixo: relógio da sessão + finalizar + descartar (T-01). */
function Dock({ logId, sessionSeconds }: { logId: string; sessionSeconds: number }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <footer className="sticky bottom-0 z-10 border-t border-dedge bg-coal">
      {confirming && (
        <div className="animate-rise mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-3.5 border border-amber px-[18px] py-3.5 lg:mx-10 lg:w-auto">
          <p className="text-[14.5px]">
            Descartar treino? <b className="font-bold text-amber">O registro será apagado.</b>
          </p>
          <div className="ml-auto flex gap-2.5">
            <form action={discardWorkout}>
              <input type="hidden" name="logId" value={logId} />
              <button
                type="submit"
                className="min-h-12 cursor-pointer border border-amber bg-transparent px-[18px] font-mono text-[13.5px] font-bold text-amber transition-colors hover:bg-amber hover:text-coal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
              >
                Descartar ■
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-12 cursor-pointer bg-amber px-[18px] font-mono text-[13.5px] font-bold text-coal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
            >
              Continuar treino
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-[1240px] items-center gap-3 px-[18px] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-10">
        <div className="font-mono text-[13px] text-dmut tabular-nums">
          sessão <b className="text-[15px] font-bold text-dtext">{formatClock(sessionSeconds)}</b>
        </div>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="ml-auto min-h-12 cursor-pointer px-3 font-mono text-[12.5px] text-dmut transition-colors hover:text-dtext focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            Descartar
          </button>
        )}
        <form action={finishWorkout} className={confirming ? "ml-auto" : ""}>
          <input type="hidden" name="logId" value={logId} />
          <button
            type="submit"
            className="min-h-12 cursor-pointer border border-amber bg-transparent px-4 font-mono text-[14px] font-bold tracking-[0.05em] text-amber transition-colors hover:bg-amber hover:text-coal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber sm:px-[22px]"
          >
            Finalizar<span className="hidden sm:inline"> treino</span> ■
          </button>
        </form>
      </div>
    </footer>
  );
}

/* ── display de 7 segmentos ─────────────────────────────────────
   Polígonos do canon 04-telemetria-v2; dígitos M:SS com glow. */

const SEG: Record<string, string> = {
  a: "8,0 48,0 40,10 16,10",
  b: "50,2 56,8 56,44 50,50 44,44 44,10",
  c: "50,52 56,58 56,94 50,100 44,92 44,58",
  d: "16,92 40,92 48,100 8,100",
  e: "0,58 6,52 12,58 12,92 6,100 0,94",
  f: "0,8 6,2 12,10 12,44 6,50 0,44",
  g: "10,46 46,46 52,51 46,56 10,56 4,51",
};
const MAP: Record<number, string> = {
  0: "abcdef",
  1: "bc",
  2: "abged",
  3: "abgcd",
  4: "fgbc",
  5: "afgcd",
  6: "afgedc",
  7: "abc",
  8: "abcdefg",
  9: "abcfgd",
};

function SegDigit({ value, over, idle }: { value: number; over: boolean; idle: boolean }) {
  const on = MAP[value] ?? "";
  return (
    <svg viewBox="0 0 56 100" className="h-auto w-[min(17vw,74px)] lg:w-[92px]">
      {Object.entries(SEG).map(([seg, points]) => {
        const lit = !idle && on.includes(seg);
        return (
          <polygon
            key={seg}
            points={points}
            className={
              lit
                ? over
                  ? "fill-phos drop-shadow-[0_0_6px_rgba(143,227,136,0.55)]"
                  : "fill-amber drop-shadow-[0_0_6px_rgba(255,106,61,0.55)]"
                : "fill-led-off"
            }
          />
        );
      })}
    </svg>
  );
}

function SegClock({ seconds, over, idle }: { seconds: number; over: boolean; idle: boolean }) {
  const m = Math.min(9, Math.floor(seconds / 60));
  const s1 = Math.floor((seconds % 60) / 10);
  const s2 = seconds % 10;
  const dotClass = idle
    ? "bg-led-off"
    : over
      ? "bg-phos shadow-[0_0_6px_rgba(143,227,136,0.55)]"
      : "animate-blink bg-amber shadow-[0_0_6px_rgba(255,106,61,0.55)]";

  return (
    <div aria-hidden="true" className="relative mt-3.5 flex items-center justify-center gap-2.5">
      <SegDigit value={m} over={over} idle={idle} />
      <span className="flex flex-col gap-4">
        <i className={`size-2.5 rounded-[2px] ${dotClass}`} />
        <i className={`size-2.5 rounded-[2px] ${dotClass}`} />
      </span>
      <SegDigit value={s1} over={over} idle={idle} />
      <SegDigit value={s2} over={over} idle={idle} />
    </div>
  );
}

function formatClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}
