"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { splitFichaName } from "@/lib/ficha-stats";
import { discardWorkout, finishWorkout, setEntry } from "../actions";

/*
 * O instrumento (04-telemetria-v2): takeover escuro de tela inteira, SÓ
 * durante o treino ao vivo. Cronômetro (controlado à mão) em 7 segmentos +
 * timer de descanso que aparece ao registrar uma série e some quando zera.
 */

type ExerciseInput = {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  weightKg: number | null;
  restSeconds: number | null;
  bodyweight: boolean;
  target: string;
  equipment: string;
  imageUrl: string;
  gifUrl: string | null;
};

type EntryInput = {
  exerciseId: string;
  setNumber: number;
  weightKg: string;
  reps: string;
};

type SetState = {
  done: boolean;
  weight: string;
  reps: string;
  na: boolean;
  justLit?: boolean;
};

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
          ? {
              done: true,
              weight: existing.weightKg,
              reps: existing.reps,
              // peso corporal é sempre N/A (fixo, não editável)
              na: ex.bodyweight,
            }
          : {
              done: false,
              // peso corporal já entra N/A; senão, o alvo da prescrição
              weight: ex.bodyweight || ex.weightKg === null ? "" : String(ex.weightKg),
              // reps já vêm preenchidas quando a prescrição é um número exato
              reps: exactReps(ex.reps),
              na: ex.bodyweight,
            };
      }
    }
    return init;
  });

  // bloco "em execução" = o que o usuário selecionou (ordem livre)
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

  // cronômetro (stopwatch) manual: acumulado em ms + instante em que ligou
  const [swBaseMs, setSwBaseMs] = useState(0);
  const [swStartedAt, setSwStartedAt] = useState<number | null>(null);

  // descanso: aparece ao registrar série, conta pra baixo e some ao zerar
  const [restStart, setRestStart] = useState<number | null>(null);
  const [restTarget, setRestTarget] = useState<number>(DEFAULT_REST);

  const [now, setNow] = useState(0);
  const [infoId, setInfoId] = useState<string | null>(null);
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
    fd.set("weightKg", s.na ? "" : s.weight);
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
      // concluir a série faz aparecer o timer de descanso com o alvo do exercício
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

  function toggleNa(ex: ExerciseInput, setNumber: number) {
    if (ex.bodyweight) return; // peso corporal: N/A é fixo
    const k = key(ex.exerciseId, setNumber);
    const cur = state[k];
    const next = { ...cur, na: !cur.na, weight: !cur.na ? "" : cur.weight };
    setState((prev) => ({ ...prev, [k]: next }));
    if (cur.done) persist(ex.exerciseId, setNumber, next);
  }

  // ── cronômetro (stopwatch) ──────────────────────────────────────
  const swRunning = swStartedAt !== null;
  const swSeconds = Math.floor(
    (swBaseMs + (swStartedAt !== null ? now - swStartedAt : 0)) / 1000,
  );
  function swToggle() {
    if (swStartedAt === null) {
      setSwStartedAt(Date.now());
    } else {
      setSwBaseMs((b) => b + (Date.now() - swStartedAt));
      setSwStartedAt(null);
    }
  }
  function swReset() {
    setSwBaseMs(0);
    setSwStartedAt(null);
  }

  // ── descanso ────────────────────────────────────────────────────
  const restElapsed = restStart === null ? 0 : Math.max(0, Math.floor((now - restStart) / 1000));
  const restLeft = Math.max(0, restTarget - restElapsed);
  const showRest = restStart !== null && restLeft > 0;

  const sessionSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const [head, tail] = splitFichaName(fichaName);
  const nextSet = Math.min(totals.done + 1, totals.total);
  const infoExercise = exercises.find((e) => e.exerciseId === infoId) ?? null;

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

          {/* ── cronômetro (stopwatch) ───────────────────────────── */}
          <section
            aria-label="Cronômetro"
            className="relative mx-[18px] mt-[18px] border border-dedge bg-panel px-4 pt-[18px] pb-5 lg:sticky lg:top-[26px] lg:mx-0 lg:mt-[26px]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(255,106,61,0.06),transparent_55%)]"
            />
            <div className="relative flex items-baseline justify-between">
              <span className="text-[11px] font-bold tracking-[0.24em] text-amber uppercase">
                Cronômetro
              </span>
              <span className="font-mono text-[12px] text-dmut tabular-nums">
                {swRunning ? "rodando" : swSeconds > 0 ? "pausado" : "parado"}
              </span>
            </div>

            <SegClock
              seconds={swSeconds}
              dim={swSeconds === 0 && !swRunning}
              blink={swRunning}
            />

            <div className="relative mt-[18px] flex gap-2.5">
              <button
                type="button"
                onClick={swToggle}
                className="min-h-12 flex-1 cursor-pointer border border-amber bg-transparent font-mono text-[14px] font-bold tracking-[0.05em] text-amber transition-colors hover:bg-amber hover:text-coal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
              >
                {swRunning ? "Pausar ❚❚" : "Iniciar ▶"}
              </button>
              <button
                type="button"
                onClick={swReset}
                disabled={swSeconds === 0 && !swRunning}
                className="min-h-12 flex-1 cursor-pointer border border-dgray bg-transparent font-mono text-[14px] font-medium tracking-[0.06em] text-dtext transition-colors hover:border-amber hover:text-amber disabled:cursor-default disabled:opacity-40 disabled:hover:border-dgray disabled:hover:text-dtext focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
              >
                Zerar ↺
              </button>
            </div>

            {/* timer de descanso: aparece ao concluir uma série, some ao zerar */}
            {showRest && (
              <div className="animate-rise relative mt-4 border border-amber/60 bg-coal px-3.5 pt-3 pb-3.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10.5px] font-bold tracking-[0.24em] text-amber uppercase">
                    Descanso
                  </span>
                  <span className="font-mono text-[12px] text-dmut tabular-nums">
                    alvo {formatClock(restTarget)}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="mt-1.5 text-center font-mono text-[40px] leading-none font-bold text-amber tabular-nums drop-shadow-[0_0_10px_rgba(255,106,61,0.45)]"
                >
                  {formatClock(restLeft)}
                </div>
                <div aria-hidden="true" className="mt-2.5 flex gap-1">
                  {Array.from({ length: 18 }).map((_, i) => {
                    const lit = i < Math.round((restLeft / restTarget) * 18);
                    return (
                      <i
                        key={i}
                        className={`h-2 flex-1 ${
                          lit ? "bg-amber shadow-[0_0_5px_rgba(255,106,61,0.5)]" : "bg-led-off"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRestTarget((t) => t + 30)}
                    className="min-h-11 flex-1 cursor-pointer border border-dgray bg-transparent font-mono text-[13px] font-medium text-dtext transition-colors hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                  >
                    +30s
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestStart(null)}
                    className="min-h-11 flex-1 cursor-pointer border border-dgray bg-transparent font-mono text-[13px] font-medium text-dtext transition-colors hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                  >
                    Pular →
                  </button>
                </div>
              </div>
            )}
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
                  <div className="flex min-w-0 items-baseline gap-2">
                    <h2 className="truncate text-[17px] font-bold tracking-[-0.01em]">{ex.name}</h2>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoId(ex.exerciseId);
                      }}
                      aria-label={`Como fazer ${ex.name}`}
                      title="Como fazer"
                      className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-dgray font-mono text-[12px] font-bold text-dmut transition-colors hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                    >
                      ?
                    </button>
                  </div>
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

                        {/* peso: input, ou N/A. Em peso corporal o N/A é fixo (não editável). */}
                        <div className="flex flex-1 items-center gap-1">
                          {ex.bodyweight ? (
                            <span
                              aria-label="Sem peso"
                              className="flex h-11 w-full min-w-0 items-center justify-center border-b border-dedge bg-dedge/50 px-1 font-mono text-[13px] font-bold text-dgray"
                            >
                              N/A
                            </span>
                          ) : s.na ? (
                            <button
                              type="button"
                              onClick={() => toggleNa(ex, n)}
                              title="Marcar peso (usar carga)"
                              className="h-11 w-full min-w-0 cursor-pointer border-b border-dgray bg-dedge/50 px-1 text-center font-mono text-[13px] font-bold text-dgray transition-colors hover:text-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                            >
                              N/A
                            </button>
                          ) : (
                            <>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={s.weight}
                                onChange={(e) => edit(ex.exerciseId, n, "weight", e.target.value)}
                                onBlur={() => commit(ex.exerciseId, n)}
                                placeholder={ex.weightKg !== null ? String(ex.weightKg) : "—"}
                                className="h-11 w-full min-w-0 border-b border-dgray bg-transparent px-1 text-center font-mono text-[14px] text-dtext tabular-nums outline-none transition-colors placeholder:text-dgray focus:border-amber"
                              />
                              <button
                                type="button"
                                onClick={() => toggleNa(ex, n)}
                                title="Sem peso (N/A)"
                                aria-label={`Marcar série ${n} como sem peso`}
                                className="min-h-11 shrink-0 cursor-pointer px-0.5 font-mono text-[10px] text-dgray transition-colors hover:text-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                              >
                                n/a
                              </button>
                            </>
                          )}
                          <span className="font-mono text-[11px] text-dmut">kg</span>
                        </div>

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

      {infoExercise && (
        <ExerciseInfo exercise={infoExercise} onClose={() => setInfoId(null)} />
      )}

      <Dock logId={logId} sessionSeconds={sessionSeconds} />
    </div>
  );
}

/** Overlay "como fazer" — instruções do exercício sem sair do treino. */
function ExerciseInfo({
  exercise,
  onClose,
}: {
  exercise: ExerciseInput;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Como fazer ${exercise.name}`}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-coal/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-rise max-h-[85dvh] w-full max-w-[560px] overflow-y-auto border border-dedge bg-panel px-[18px] pt-5 pb-8 sm:px-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold tracking-[0.2em] text-amber uppercase">
              Como fazer
            </div>
            <h2 className="mt-1 text-[20px] leading-tight font-bold tracking-[-0.01em]">
              {exercise.name}
            </h2>
            <div className="mt-1 font-mono text-[12px] text-dmut">
              {exercise.target} · {exercise.equipment}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center border border-dgray text-[18px] text-dmut transition-colors hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            ×
          </button>
        </div>

        {/* O movimento vale mais que os passos no meio da série: GIF primeiro. */}
        <div className="mt-5 border border-dedge bg-coal">
          <div className="relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden">
            {exercise.gifUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- GIF animado: next/image congela a animação */}
                <img
                  src={exercise.gifUrl}
                  alt={`Animação do exercício ${exercise.name}`}
                  width={360}
                  height={360}
                  onLoad={() => setLoaded(true)}
                  className="size-full object-cover"
                />
                {!loaded && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span
                      aria-hidden="true"
                      className="inline-block size-6 animate-spin rounded-full border-2 border-dgray border-t-amber"
                    />
                  </span>
                )}
              </>
            ) : (
              <Image
                src={exercise.imageUrl}
                alt={`Posição do exercício ${exercise.name}`}
                width={360}
                height={360}
                className="size-full object-cover"
              />
            )}
          </div>
        </div>

        <Link
          href={`/exercicios/${exercise.exerciseId}`}
          className="mt-5 flex min-h-12 items-center justify-between border border-dgray px-4 font-mono text-[13px] font-bold text-dtext transition-colors hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
        >
          Ver passo a passo
          <span aria-hidden="true" className="text-amber">
            →
          </span>
        </Link>
      </div>
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

function SegDigit({ value, dim }: { value: number; dim: boolean }) {
  const on = MAP[value] ?? "";
  return (
    <svg viewBox="0 0 56 100" className="h-auto w-[min(17vw,74px)] lg:w-[92px]">
      {Object.entries(SEG).map(([seg, points]) => {
        const lit = !dim && on.includes(seg);
        return (
          <polygon
            key={seg}
            points={points}
            className={
              lit
                ? "fill-amber drop-shadow-[0_0_6px_rgba(255,106,61,0.55)]"
                : "fill-led-off"
            }
          />
        );
      })}
    </svg>
  );
}

function SegClock({ seconds, dim, blink }: { seconds: number; dim: boolean; blink: boolean }) {
  const m = Math.min(9, Math.floor(seconds / 60));
  const s1 = Math.floor((seconds % 60) / 10);
  const s2 = seconds % 10;
  const dotClass = dim
    ? "bg-led-off"
    : blink
      ? "animate-blink bg-amber shadow-[0_0_6px_rgba(255,106,61,0.55)]"
      : "bg-amber shadow-[0_0_6px_rgba(255,106,61,0.55)]";

  return (
    <div aria-hidden="true" className="relative mt-3.5 flex items-center justify-center gap-2.5">
      <SegDigit value={m} dim={dim} />
      <span className="flex flex-col gap-4">
        <i className={`size-2.5 rounded-[2px] ${dotClass}`} />
        <i className={`size-2.5 rounded-[2px] ${dotClass}`} />
      </span>
      <SegDigit value={s1} dim={dim} />
      <SegDigit value={s2} dim={dim} />
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
