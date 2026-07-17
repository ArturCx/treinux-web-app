"use client";

import { useActionState, useState } from "react";
import { MiniStamp, Tape } from "@/components/zine";
import {
  DURATIONS,
  EQUIPMENT_OPTIONS,
  LETTERS,
  MAX_FICHAS,
  distributeGroups,
  exercisesPerFicha,
  groupsFor,
  type Modalidade,
} from "@/lib/generator";
import { generateFichas } from "./actions";

/**
 * Pedido de gráfica (30-gerar): passos numerados com numeral fantasma e a
 * prova de impressão ao vivo — folha papel-2 com fita, carimbo PROVA e a
 * divisão dos treinos como sumário da edição.
 */
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

  const equipLabel =
    modalidade === "calistenia"
      ? "peso do corpo"
      : equip.size === 0
        ? "academia completa"
        : `${equip.size} ${equip.size === 1 ? "equipamento" : "equipamentos"}`;

  // passos na ordem do pedido; equipamento só existe na musculação
  const steps: { title: string; body: React.ReactNode }[] = [
    {
      title: "Modalidade",
      body: (
        <div className="flex flex-wrap gap-2.5">
          <Opt active={modalidade === "musculacao"} onClick={() => pickModalidade("musculacao")}>
            Musculação
          </Opt>
          <Opt active={modalidade === "calistenia"} onClick={() => pickModalidade("calistenia")}>
            Calistenia
          </Opt>
        </div>
      ),
    },
    {
      title: modalidade === "calistenia" ? "Categorias" : "Grupos musculares",
      body: (
        <>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <ChipBtn key={g.key} active={selected.has(g.key)} onClick={() => toggleGroup(g.key)}>
                {g.label}
              </ChipBtn>
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
    ...(modalidade === "musculacao"
      ? [
          {
            title: "Equipamentos",
            body: (
              <>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((o) => (
                    <ChipBtn key={o.key} active={equip.has(o.key)} onClick={() => toggleEquip(o.key)}>
                      {o.label}
                    </ChipBtn>
                  ))}
                </div>
                <div className="mt-3 inline-block border border-dashed border-clay bg-paper-deep px-3 py-2 text-[12.5px] text-muted">
                  Nada marcado = <b className="font-bold text-ink">academia completa</b> — a
                  gráfica usa o catálogo inteiro.
                </div>
              </>
            ),
          },
        ]
      : []),
    {
      title: "Duração por treino",
      body: (
        <div className="flex flex-wrap gap-2.5 tabular-nums">
          {DURATIONS.map((d) => (
            <Opt key={d} active={minutes === d} onClick={() => setMinutes(d)}>
              {d} <span className="ml-0.5 text-[12px] font-medium opacity-65">min</span>
            </Opt>
          ))}
        </div>
      ),
    },
    {
      title: "Quantidade de fichas",
      body: (
        <div className="flex w-max border-2 border-ink bg-paper tabular-nums">
          <StepBtn
            label="Uma ficha a menos"
            disabled={count <= 1}
            onClick={() => setCount((c) => Math.max(1, c - 1))}
          >
            −
          </StepBtn>
          <span className="flex w-16 items-center justify-center border-x-2 border-ink text-[22px] font-bold">
            {count}
          </span>
          <StepBtn
            label="Uma ficha a mais"
            disabled={count >= maxCount}
            onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
          >
            +
          </StepBtn>
        </div>
      ),
    },
  ];

  return (
    <form
      action={action}
      className="mt-6 lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-x-14"
    >
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

      <div>
        {state?.error && (
          <p
            role="alert"
            className="mb-4 border border-error-edge bg-error-bg px-4 py-3 text-[13.5px] font-medium text-error-ink"
          >
            {state.error}
          </p>
        )}

        {steps.map((step, i) => (
          <section
            key={step.title}
            aria-label={step.title}
            className={`pt-[22px] pb-6 ${
              i === steps.length - 1 ? "border-b-2 border-ink" : "border-b border-paper-edge"
            }`}
          >
            <div className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
              Passo {String(i + 1).padStart(2, "0")} —{" "}
              <b className="text-ink">{step.title}</b>
            </div>
            <div className="relative z-[1] mt-3">{step.body}</div>
          </section>
        ))}
      </div>

      {/* prova de impressão — sticky no desktop */}
      <div className="mt-[34px] lg:sticky lg:top-7 lg:mt-6">
        <section
          aria-label="Prova da edição"
          className="relative border border-paper-edge bg-paper-deep px-[18px] pt-[22px] pb-5"
        >
          <Tape className="-top-[13px] left-[26px] w-[104px] -rotate-2" />
          <MiniStamp className="absolute top-3.5 right-3.5 rotate-[7deg] border-[2.5px] px-3 text-[16px] tracking-[0.22em] opacity-80">
            Prova
          </MiniStamp>
          <h2 className="text-[14px] font-bold tracking-[0.14em] text-muted uppercase">
            Prova da edição — divisão
          </h2>
          <div className="mt-3.5 border-t-2 border-ink">
            {chosen.length === 0 ? (
              <p className="py-4 text-[13px] text-muted">
                A prova sai em branco até você escolher os grupos do passo 02.
              </p>
            ) : (
              dist.map((gs, i) => (
                <div
                  key={LETTERS[i]}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-paper-edge py-3.5"
                >
                  <span className="shout text-[18px] tracking-[0.02em] tabular-nums">
                    Treino {LETTERS[i]} <i className="text-ember not-italic">—</i>{" "}
                    {gs.map((g) => g.label).join(" · ")}
                  </span>
                  <span className="ml-auto text-[12.5px] font-medium whitespace-nowrap text-muted tabular-nums">
                    ~{perFicha} exercícios · {minutes} min
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 text-[12px] tracking-[0.1em] text-clay uppercase tabular-nums">
            {count} {count === 1 ? "ficha" : "fichas"} ·{" "}
            {modalidade === "calistenia" ? "calistenia" : "musculação"} · {equipLabel}
          </div>
          <span className="absolute right-[18px] -bottom-2.5 -rotate-2 bg-fluo px-2 py-[3px] text-[10.5px] font-bold tracking-[0.14em] text-ink uppercase">
            prova nº 1
          </span>
        </section>

        <button
          type="submit"
          disabled={pending || selected.size === 0}
          className="shout mt-[26px] flex min-h-16 w-full cursor-pointer items-center justify-between gap-3.5 border-2 border-ink bg-ember px-5 text-[20px] tracking-[0.06em] text-paper shadow-[7px_7px_0_var(--color-ink)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] disabled:cursor-default disabled:border-clay disabled:bg-clay disabled:shadow-none lg:mt-[22px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <span className="flex items-center gap-3">
            {pending && (
              <span
                aria-hidden="true"
                className="inline-block size-4 animate-spin rounded-full border-2 border-paper/35 border-t-paper"
              />
            )}
            {pending
              ? "Imprimindo…"
              : count === 1
                ? "Gerar ficha"
                : `Gerar ${count} fichas`}
          </span>
          <span aria-hidden="true" className="text-[24px]">
            →
          </span>
        </button>
        <p className="mt-3 text-[12.5px] text-muted">
          A prova acima se refaz a cada mudança no pedido. Nada é salvo até você
          aprovar.
        </p>
      </div>
    </form>
  );
}

/** Opção-quadrado (modalidade/duração): borda 2px, ativo = tinta + sombra ember. */
function Opt({
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
      className={`flex min-h-[52px] cursor-pointer items-baseline border-2 border-ink px-[18px] pt-3.5 text-[15px] font-bold transition-[background-color,box-shadow,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        active
          ? "bg-ink text-paper shadow-[4px_4px_0_var(--color-ember)]"
          : "bg-paper text-ink hover:shadow-[4px_4px_0_var(--color-riso)]"
      }`}
    >
      {children}
    </button>
  );
}

function ChipBtn({
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
      className={`flex min-h-12 cursor-pointer items-center border border-ink px-[15px] text-[14px] font-medium transition-[background-color,box-shadow,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        active
          ? "bg-ink text-paper shadow-[3px_3px_0_var(--color-ember)]"
          : "bg-paper text-ink hover:shadow-[3px_3px_0_var(--color-riso)]"
      }`}
    >
      {children}
    </button>
  );
}

function StepBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="size-[52px] cursor-pointer text-[22px] leading-none font-bold transition-colors hover:bg-ink hover:text-paper disabled:cursor-default disabled:text-clay disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
    >
      {children}
    </button>
  );
}
