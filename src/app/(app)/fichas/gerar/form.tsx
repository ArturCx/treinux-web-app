"use client";

import { useActionState, useState } from "react";
import { SetsStepper } from "@/components/sets-stepper";
import {
  DURATIONS,
  EQUIPMENT_OPTIONS,
  LETTERS,
  MAX_FICHAS,
  PRESCRIPTION,
  distributeGroups,
  exercisesPerFicha,
  groupsFor,
  type Modalidade,
} from "@/lib/generator";
import { generateFichas } from "./actions";

export function GeneratorForm() {
  const [state, action, pending] = useActionState(generateFichas, null);

  const [modalidade, setModalidade] = useState<Modalidade>("musculacao");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [equip, setEquip] = useState<Set<string>>(new Set());
  const [minutes, setMinutes] = useState<number>(45);
  const [count, setCount] = useState(1);

  const groups = groupsFor(modalidade);
  const chosen = groups.filter((g) => selected.has(g.key));
  const maxCount = Math.max(1, Math.min(MAX_FICHAS, chosen.length));
  const perFicha = exercisesPerFicha(minutes, modalidade);
  const p = PRESCRIPTION[modalidade];
  const dist = distributeGroups(chosen, count);

  function pickModalidade(m: Modalidade) {
    if (m === modalidade) return;
    setModalidade(m);
    setSelected(new Set()); // as categorias mudam junto
    setEquip(new Set());
    setCount(1);
  }

  function toggleGroup(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setCount((c) => Math.max(1, Math.min(c, Math.min(MAX_FICHAS, next.size || 1))));
      return next;
    });
  }

  function toggleEquip(key: string) {
    setEquip((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // passos na ordem em que precisam ser decididos; o de equipamento só
  // existe na musculação — a numeração acompanha
  const steps: { title: string; hint?: string; body: React.ReactNode }[] = [
    {
      title: "MODALIDADE",
      body: (
        <div className="grid grid-cols-2 gap-2">
          <ModalidadeOption
            active={modalidade === "musculacao"}
            title="Musculação"
            hint="Pesos e máquinas"
            onClick={() => pickModalidade("musculacao")}
          />
          <ModalidadeOption
            active={modalidade === "calistenia"}
            title="Calistenia"
            hint="Só o peso do corpo"
            onClick={() => pickModalidade("calistenia")}
          />
        </div>
      ),
    },
    ...(modalidade === "musculacao"
      ? [
          {
            title: "EQUIPAMENTO",
            hint:
              equip.size === 0
                ? "academia completa"
                : "só o que você marcou",
            body: (
              <div className="flex flex-wrap gap-2">
                <Choice active={equip.size === 0} onClick={() => setEquip(new Set())}>
                  Academia completa
                </Choice>
                {EQUIPMENT_OPTIONS.map((o) => (
                  <Choice
                    key={o.key}
                    active={equip.has(o.key)}
                    onClick={() => toggleEquip(o.key)}
                  >
                    {o.label}
                  </Choice>
                ))}
              </div>
            ),
          },
        ]
      : []),
    {
      title: modalidade === "calistenia" ? "CATEGORIAS" : "MEMBROS",
      hint:
        selected.size === 0
          ? undefined
          : `${selected.size} de ${groups.length}`,
      body: (
        <>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <Choice
                key={g.key}
                active={selected.has(g.key)}
                onClick={() => toggleGroup(g.key)}
              >
                {g.label}
              </Choice>
            ))}
          </div>
          {selected.size === 0 && (
            <p className="mt-2.5 text-[12.5px] text-muted">
              Escolha o que quer treinar — a ordem define a divisão.
            </p>
          )}
        </>
      ),
    },
    {
      title: "DURAÇÃO MÉDIA",
      body: (
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <Choice key={d} active={minutes === d} onClick={() => setMinutes(d)}>
              <span className="tabular-nums">{d} min</span>
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: "DIVISÃO",
      body: (
        <>
          <div className="flex items-center gap-4">
            <div className="w-36">
              <SetsStepper value={count} onChange={setCount} min={1} max={maxCount} />
            </div>
            <span className="text-[13px] text-muted">
              {count === 1 ? "ficha única" : `${count} fichas`}
            </span>
          </div>

          {/* preview ao vivo: exatamente as fichas que serão criadas */}
          {chosen.length > 0 && (
            <ul className="mt-4">
              {dist.map((gs, i) => (
                <li
                  key={LETTERS[i]}
                  className="flex items-center gap-3 border-b border-paper-edge py-2.5 last:border-b-0"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center border-2 border-ink text-[14px] font-bold"
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="text-[14.5px] leading-tight">
                    <span className="font-bold">Treino {LETTERS[i]}</span>{" "}
                    <span className="text-ember">
                      — {gs.map((g) => g.label).join(" · ")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ),
    },
  ];

  return (
    <form action={action} className="flex flex-col gap-7">
      <input type="hidden" name="modalidade" value={modalidade} />
      <input type="hidden" name="minutes" value={minutes} />
      <input type="hidden" name="count" value={count} />
      {chosen.map((g) => (
        <input key={g.key} type="hidden" name="grupos" value={g.key} />
      ))}
      {modalidade === "musculacao" &&
        EQUIPMENT_OPTIONS.filter((o) => equip.has(o.key)).map((o) => (
          <input key={o.key} type="hidden" name="equipamentos" value={o.key} />
        ))}

      {state?.error && (
        <p
          role="alert"
          className="border border-error-edge bg-error-bg px-3 py-2 text-[13px] text-error-ink"
        >
          {state.error}
        </p>
      )}

      {steps.map((step, i) => (
        <section key={step.title} aria-label={step.title}>
          <div className="flex items-baseline gap-2.5">
            <span
              aria-hidden="true"
              className="text-[24px] leading-none font-bold tracking-[-0.03em] text-ember tabular-nums"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted">
              {step.title}
            </h2>
            {step.hint && (
              <span className="ml-auto text-[12px] text-muted">{step.hint}</span>
            )}
          </div>
          <div className="mt-3.5">{step.body}</div>
        </section>
      ))}

      {/* ficha técnica do que sai — mesmo vocabulário do detalhe de exercício */}
      <dl className="grid grid-cols-3 bg-paper-deep">
        <Spec label="EXERCÍCIOS / FICHA" value={`≈${perFicha}`} accent />
        <Spec label="PRESCRIÇÃO" value={`${p.sets}×${p.reps}`} />
        <Spec label="DESCANSO" value={`${p.restSeconds}s`} />
      </dl>

      <button
        type="submit"
        disabled={pending || selected.size === 0}
        className="group flex h-14 w-full cursor-pointer items-center justify-between bg-ember px-5 text-[15px] font-bold text-paper transition-colors hover:bg-ember-deep active:bg-ember-deep disabled:cursor-default disabled:bg-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span className="flex items-center gap-2.5">
          {pending && (
            <span
              aria-hidden="true"
              className="inline-block size-3.5 animate-spin rounded-full border-2 border-paper/35 border-t-paper"
            />
          )}
          {pending
            ? "Gerando…"
            : count === 1
              ? "Gerar ficha"
              : `Gerar ${count} fichas`}
        </span>
        <span
          aria-hidden="true"
          className="text-[20px] transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </button>
    </form>
  );
}

/** Chip de escolha — mesmo vocabulário dos filtros do catálogo. */
function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-11 cursor-pointer items-center border px-4 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        active
          ? "border-ink bg-ink text-paper"
          : "border-ink text-ink hover:bg-ink/5 active:bg-ink/10"
      }`}
    >
      {children}
    </button>
  );
}

function ModalidadeOption({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex cursor-pointer flex-col gap-1 border-2 border-ink px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        active ? "bg-ink text-paper" : "hover:bg-ink/5"
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-2.5 right-2.5 size-2.5 bg-ember"
        />
      )}
      <span className="text-[18px] leading-tight font-bold tracking-[-0.02em]">
        {title}
      </span>
      <span className={`text-[12px] ${active ? "text-clay" : "text-muted"}`}>
        {hint}
      </span>
    </button>
  );
}

function Spec({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border-r border-paper-edge px-3.5 py-3 last:border-r-0">
      <dt className="text-[10.5px] font-medium tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-[18px] leading-tight font-bold tracking-[-0.01em] tabular-nums ${accent ? "text-ember" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
