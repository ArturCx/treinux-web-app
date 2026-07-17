"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { BarbellViz, Overprint, Plates, Tape } from "@/components/zine";
import { startWorkout } from "@/app/(app)/treino/actions";
import { deleteFicha, toggleArchive, updateFicha } from "../actions";

type Ficha = {
  id: string;
  name: string;
  notes: string | null;
  archived: boolean;
  updatedAt: Date;
};

type Stats = { exercises: number; sets: number; minutes: number };

/**
 * Capa da edição (10-ficha): chapas + título em desregistro, strap de stats,
 * carga em anilhas, nota com fita e a FRONTEIRA do sistema — o CTA escuro
 * "● Iniciar treino", único objeto carvão do mundo de papel.
 */
export function FichaCover({
  ficha,
  stats,
  activeLogId,
  restLabel,
}: {
  ficha: Ficha;
  stats: Stats;
  activeLogId: string | null;
  restLabel: string | null;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="relative overflow-hidden border-b-2 border-ink px-[18px] pt-4 pb-[26px] lg:px-10 lg:pt-[22px] lg:pb-10">
      <div className="relative mx-auto max-w-[1240px]">
        <Plates />
        <Link
          href="/fichas"
          className="relative z-[2] text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          ← Fichas
        </Link>

        {editing ? (
          <EditForm ficha={ficha} onDone={() => setEditing(false)} />
        ) : (
          <>
            <div className="relative z-[2] mt-3.5 text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
              {ficha.archived ? "Ficha arquivada" : `Ficha de treino · atual. ${formatShortDate(ficha.updatedAt)}`}
            </div>
            <h1
              className={`shout relative z-[2] mt-1.5 text-balance ${titleSize(ficha.name)}`}
            >
              <Overprint plate text={ficha.name} />
            </h1>
            <div className="relative z-[2] mt-3.5 flex flex-wrap items-center gap-2.5 text-[12.5px] font-medium tracking-[0.1em] uppercase tabular-nums">
              <span className="border border-ink bg-paper px-2 py-[3px]">
                <b className="text-ember">{stats.exercises}</b>{" "}
                {stats.exercises === 1 ? "exercício" : "exercícios"}
              </span>
              <span className="border border-ink bg-paper px-2 py-[3px]">
                <b className="text-ember">{stats.sets}</b> séries
              </span>
              {stats.minutes > 0 && (
                <span className="border border-ink bg-paper px-2 py-[3px]">
                  ~<b className="text-ember">{stats.minutes}</b> min
                </span>
              )}
            </div>

            {stats.sets > 0 && (
              <div className="relative z-[2] mt-4 inline-flex items-center gap-2.5 border border-ink bg-paper px-3 py-2">
                <BarbellViz sets={stats.sets} className="h-7 w-auto" />
                <span className="text-[10px] font-medium tracking-[0.12em] text-clay uppercase tabular-nums">
                  carga da edição · 1 anilha = 4 séries
                </span>
              </div>
            )}

            {/* card de nota sempre presente — vazio mostra placeholder, e o
                botão sempre cai abaixo dele (fora da chapa laranja) */}
            <div className="relative z-[2] mt-5 max-w-[520px] border border-paper-edge bg-paper-deep px-4 pt-4 pb-3.5 text-[13.5px] leading-[1.55]">
              <Tape className="-top-3 left-[22px] w-24 -rotate-2" />
              {ficha.notes ? (
                <span className="text-ink-soft">
                  <b className="font-bold">Notas da ficha —</b> {ficha.notes}
                </span>
              ) : (
                <span className="text-muted italic">
                  Sem notas nesta ficha ainda.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="relative z-[2] mt-3 min-h-11 cursor-pointer text-[13px] font-medium text-muted underline underline-offset-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              ✎ Editar nome e notas
            </button>

            {stats.exercises > 0 &&
              (activeLogId ? (
                <Link
                  href={`/treino/${activeLogId}`}
                  className="shout relative z-[2] mt-5 flex w-full max-w-[520px] min-h-16 items-center justify-between gap-3.5 bg-coal px-4 text-[18px] tracking-[0.06em] sm:px-5 sm:text-[20px] text-dtext shadow-[7px_7px_0_var(--color-ink)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[5px_5px_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                >
                  <span>
                    <span className="text-amber">●</span> Retomar treino
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.08em] text-dmut normal-case">
                    em andamento
                  </span>
                </Link>
              ) : (
                <form action={startWorkout} className="relative z-[2]">
                  <input type="hidden" name="fichaId" value={ficha.id} />
                  <button
                    type="submit"
                    className="shout mt-5 flex w-full max-w-[520px] min-h-16 cursor-pointer items-center justify-between gap-3.5 bg-coal px-4 text-[18px] tracking-[0.06em] sm:px-5 sm:text-[20px] text-dtext shadow-[7px_7px_0_var(--color-ink)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[5px_5px_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                  >
                    <span>
                      <span className="text-amber">●</span> Iniciar treino
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.08em] text-dmut normal-case tabular-nums">
                      {stats.sets} séries{restLabel ? ` · alvo ${restLabel}` : ""}
                    </span>
                  </button>
                </form>
              ))}
          </>
        )}
      </div>
    </section>
  );
}

/** Editor inline de nome/notas — campos sublinhados sobre a própria capa. */
function EditForm({ ficha, onDone }: { ficha: Ficha; onDone: () => void }) {
  const [state, action, pending] = useActionState(
    async (prev: unknown, fd: FormData) => {
      const result = await updateFicha(prev as null, fd);
      if (!result?.error) onDone();
      return result;
    },
    null,
  );

  return (
    <form
      action={action}
      className="relative z-[2] mt-7 flex max-w-[560px] flex-col gap-5 border-2 border-ink bg-paper p-5 shadow-[7px_7px_0_var(--color-riso)]"
    >
      <Tape className="-top-[13px] left-6 w-24 -rotate-2" />
      <input type="hidden" name="id" value={ficha.id} />

      <div className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
        ✎ Editar a edição
      </div>

      {state?.error && (
        <div className="flex items-center justify-between gap-3 border border-error-edge bg-error-bg px-4 py-3">
          <p className="text-[13.5px] font-medium text-error-ink">{state.error}</p>
        </div>
      )}

      <div className="flex flex-col gap-[5px]">
        <label
          htmlFor="ficha-name"
          className="text-[10.5px] font-bold tracking-[0.14em] text-muted uppercase"
        >
          Nome da ficha
        </label>
        <input
          id="ficha-name"
          name="name"
          defaultValue={ficha.name}
          required
          maxLength={80}
          autoFocus
          className="h-[46px] w-full border-b-2 border-ink bg-transparent px-0.5 text-[19px] font-bold outline-none transition-colors placeholder:text-clay focus:border-riso"
        />
      </div>

      <div className="flex flex-col gap-[5px]">
        <label
          htmlFor="ficha-notes"
          className="text-[10.5px] font-bold tracking-[0.14em] text-muted uppercase"
        >
          Notas da ficha
        </label>
        <textarea
          id="ficha-notes"
          name="notes"
          defaultValue={ficha.notes ?? ""}
          maxLength={500}
          className="min-h-24 w-full resize-none border-b-2 border-ink bg-transparent px-0.5 py-2 text-[15px] leading-relaxed field-sizing-content outline-none transition-colors placeholder:text-clay focus:border-riso"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-[50px] cursor-pointer items-center gap-2.5 bg-ink px-6 text-[14.5px] font-bold text-paper shadow-[5px_5px_0_var(--color-riso)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-riso)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[3px_3px_0_var(--color-riso)] disabled:cursor-default disabled:bg-clay disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          {pending && (
            <span
              aria-hidden="true"
              className="inline-block size-[15px] animate-spin rounded-full border-2 border-paper/35 border-t-paper"
            />
          )}
          {pending ? "Salvando…" : "Salvar"}
          {!pending && <i className="text-ember not-italic">→</i>}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="min-h-[50px] cursor-pointer px-3 text-[14px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Rodapé da ficha: arquivar + excluir (Z-01, inline em 2 passos). */
export function Housekeeping({ id, name, archived }: { id: string; name: string; archived: boolean }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="animate-rise mt-11 border-t-2 border-ember-deep pt-4">
        <p className="text-[14px] font-medium">
          Excluir <b className="font-bold">{name}</b> e todo o histórico de sessões? Não dá para
          desfazer.
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
            onClick={() => setConfirming(false)}
            className="min-h-12 cursor-pointer px-3 text-[14px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Não, manter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-11 flex gap-[22px] border-t border-paper-edge pt-4">
      <form action={toggleArchive}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="min-h-11 cursor-pointer text-[13.5px] font-medium text-muted underline underline-offset-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          {archived ? "Reabrir ficha" : "Arquivar ficha"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-11 cursor-pointer text-[13.5px] font-medium text-ember-deep underline underline-offset-3 transition-colors hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        Excluir ficha
      </button>
    </div>
  );
}

/** Escala o título da capa pelo comprimento do nome — nomes longos encolhem
 *  em vez de quebrar em muitas linhas grandes. */
function titleSize(name: string) {
  const len = name.length;
  if (len <= 18) return "text-[clamp(44px,11vw,96px)]";
  if (len <= 30) return "text-[clamp(34px,7.5vw,60px)]";
  return "text-[clamp(26px,6vw,44px)]";
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(date)
    .replace(".", "");
}
