"use client";

import { createContext, useActionState, useContext, useState } from "react";
import Link from "next/link";
import { sentenceCase } from "@/lib/catalog";
import { Tape } from "@/components/zine";
import {
  moveExercise,
  removeExercise,
  replaceExercise,
  updatePrescription,
} from "../actions";

const OpenEditorContext = createContext<{
  openId: string | null;
  setOpenId: (id: string | null) => void;
} | null>(null);

/**
 * Coordena os editores de prescrição da sequência: guarda o id do único
 * card em edição — abrir um fecha o anterior.
 */
export function ExerciseRowGroup({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <OpenEditorContext value={{ openId, setOpenId }}>{children}</OpenEditorContext>
  );
}

export type RowItem = {
  id: string;
  order: number;
  sets: number;
  reps: string;
  weightKg: number | null;
  restSeconds: number | null;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    namePt: string | null;
  };
};

/**
 * Card da sequência: índice impresso à esquerda, mover ↑/↓ como par vertical
 * na borda direita (mapeamento espacial) e as demais ações como botões de
 * texto rotulados — o destrutivo afastado, à direita.
 */
export function ExerciseRow({
  item,
  index,
  last,
  first,
}: {
  item: RowItem;
  index: number;
  last: boolean;
  first: boolean;
}) {
  const group = useContext(OpenEditorContext);
  const [soloEditing, setSoloEditing] = useState(false);
  const editing = group ? group.openId === item.id : soloEditing;
  const setEditing = (open: boolean) =>
    group ? group.setOpenId(open ? item.id : null) : setSoloEditing(open);

  const [confirmingRemove, setConfirmingRemove] = useState(false);

  // troca de exercício: guarda o que foi trocado para oferecer "desfazer"
  const [swapState, swapAction] = useActionState(replaceExercise, null);
  const swapped = swapState?.swapped;

  // salvar com sucesso fecha o editor — o ajuste "assentou" na folha
  const [state, action, pending] = useActionState(
    async (prev: unknown, fd: FormData) => {
      const result = await updatePrescription(prev as null, fd);
      if (!result?.error) setEditing(false);
      return result;
    },
    null,
  );

  const displayName = sentenceCase(item.exercise.namePt ?? item.exercise.name);
  const blue = index % 2 === 0;

  return (
    <article
      className={
        editing
          ? "-mx-[18px] border-b border-l-2 border-paper-edge border-l-ember bg-paper-deep px-[18px] pt-5 pb-[22px] lg:-mx-6 lg:px-6"
          : `relative pt-5 pb-4 ${last ? "border-b-2 border-ink" : "border-b border-paper-edge"}`
      }
    >
      {/* numeral fantasma no canto superior direito — alterna as duas tintas */}
      {!editing && (
        <div
          aria-hidden="true"
          className={`shout pointer-events-none absolute top-1 right-1 text-[64px] leading-none tracking-[-0.02em] mix-blend-multiply select-none tabular-nums ${
            blue ? "text-riso opacity-[0.16]" : "text-ember opacity-[0.18]"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
      )}

      <div className="relative flex items-start gap-3.5">
        {/* mover: setas soltas à esquerda — ↑ em cima, ↓ embaixo */}
        {!editing && (
          <div className="flex flex-none flex-col">
            <form action={moveExercise} className="contents">
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="direction" value="up" />
              <MoveButton label="Mover para cima" disabled={first}>
                ↑
              </MoveButton>
            </form>
            <form action={moveExercise} className="contents">
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="direction" value="down" />
              <MoveButton label="Mover para baixo" disabled={last}>
                ↓
              </MoveButton>
            </form>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-[19px] leading-[1.15] font-bold tracking-[-0.02em] lg:text-[21px]">
            <Link
              href={`/exercicios/${item.exercise.id}`}
              className="hover:underline hover:decoration-ember hover:underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              {displayName}
            </Link>
          </h3>

          {editing ? (
            <div className="relative mt-4 max-w-[560px]">
              <Tape className="-top-6 right-2 h-[22px] w-[88px] rotate-[1.8deg]" />
              <form action={action}>
                <input type="hidden" name="itemId" value={item.id} />

                {state?.error && (
                  <p
                    role="alert"
                    className="mb-4 border border-error-edge bg-error-bg px-3 py-2 text-[13px] text-error-ink"
                  >
                    {state.error}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <EditorField
                    id={`sets-${item.id}`}
                    name="sets"
                    label="Séries"
                    type="number"
                    min={1}
                    max={20}
                    required
                    defaultValue={item.sets}
                  />
                  <EditorField
                    id={`reps-${item.id}`}
                    name="reps"
                    label="Repetições"
                    type="text"
                    required
                    maxLength={20}
                    defaultValue={item.reps}
                    placeholder="8-12"
                  />
                  <EditorField
                    id={`weight-${item.id}`}
                    name="weightKg"
                    label="Peso (kg)"
                    type="text"
                    inputMode="decimal"
                    maxLength={8}
                    defaultValue={item.weightKg ?? ""}
                    placeholder="—"
                  />
                  <EditorField
                    id={`rest-${item.id}`}
                    name="restSeconds"
                    label="Descanso (s)"
                    type="number"
                    min={0}
                    max={900}
                    defaultValue={item.restSeconds ?? ""}
                    placeholder="90"
                  />
                  <EditorField
                    id={`notes-${item.id}`}
                    name="notes"
                    label="Observação"
                    type="text"
                    maxLength={200}
                    defaultValue={item.notes ?? ""}
                    placeholder="Cadência 3-1-1, pegada aberta…"
                    wide
                  />
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex min-h-[50px] cursor-pointer items-center gap-2.5 bg-ink px-6 text-[14.5px] font-bold text-paper shadow-[5px_5px_0_var(--color-riso)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-riso)] disabled:cursor-default disabled:bg-clay disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
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
                    onClick={() => setEditing(false)}
                    className="min-h-[50px] cursor-pointer px-3 text-[14px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 tabular-nums">
                <span className="text-[27px] leading-none font-bold tracking-[-0.03em] lg:text-[30px]">
                  {item.sets} <i className="text-ember not-italic">×</i> {item.reps}
                </span>
                {item.weightKg !== null && (
                  <span className="text-[15px] font-bold text-ember">
                    {formatWeight(item.weightKg)}
                  </span>
                )}
                {item.restSeconds !== null && (
                  <span className="text-[12.5px] font-medium text-muted">
                    {item.restSeconds}s descanso
                  </span>
                )}
              </div>

              {item.notes && (
                <p className="mt-2 max-w-[460px] border-l-2 border-ember pl-2.5 text-[13px] leading-[1.5] text-muted italic">
                  {item.notes}
                </p>
              )}
            </>
          )}
        </div>

      </div>

      {/* linha de ações rotuladas — remover afastado, à direita */}
      {!editing &&
        (confirmingRemove ? (
          <div className="animate-rise mt-3.5 border-t border-ember-deep pt-3 pl-[58px]">
            <p className="text-[14px] font-medium">
              Remover <b className="font-bold">{displayName}</b> da ficha?
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <form action={removeExercise}>
                <input type="hidden" name="itemId" value={item.id} />
                <button
                  type="submit"
                  className="min-h-12 cursor-pointer bg-ember-deep px-[18px] text-[14px] font-bold text-paper transition-colors hover:bg-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                >
                  Sim
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmingRemove(false)}
                className="min-h-12 cursor-pointer px-3 text-[14px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              >
                Não
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2.5 flex items-center gap-5 border-t border-dashed border-paper-edge pt-0.5 pl-[58px]">
            <ActionButton
              glyph="✎"
              onClick={() => {
                setConfirmingRemove(false);
                setEditing(true);
              }}
            >
              Editar
            </ActionButton>
            <form action={swapAction} className="contents">
              <input type="hidden" name="itemId" value={item.id} />
              <ActionButton
                glyph="↻"
                submit
                title={`Trocar ${displayName} por outro exercício do mesmo membro`}
              >
                Trocar
              </ActionButton>
            </form>
            <ActionButton
              glyph="×"
              danger
              onClick={() => setConfirmingRemove(true)}
              className="ml-auto"
            >
              Remover
            </ActionButton>
          </div>
        ))}

      {/* feedback da troca (Z-03): confirma o novo exercício e oferece desfazer */}
      {!editing && !confirmingRemove && swapped && (
        <div className="animate-rise mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 border border-paper-edge bg-paper-deep px-3 py-2 text-[13px] ml-[58px]">
          <span>
            <i aria-hidden="true" className="font-bold text-riso not-italic">
              ↻
            </i>{" "}
            Trocado por <b className="font-bold">{swapped.newName}</b>
          </span>
          <form action={swapAction} className="contents">
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="restoreTo" value={swapped.prevExerciseId} />
            <input type="hidden" name="restoreNotes" value={swapped.prevNotes} />
            <button
              type="submit"
              className="min-h-9 cursor-pointer font-bold text-ember-deep underline underline-offset-2 transition-colors hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              desfazer
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function MoveButton({
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
      className="size-11 cursor-pointer text-[17px] font-bold text-muted transition-colors hover:text-ink disabled:cursor-default disabled:opacity-25 disabled:hover:text-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
    >
      {children}
    </button>
  );
}

function ActionButton({
  glyph,
  danger = false,
  submit = false,
  title,
  onClick,
  className = "",
  children,
}: {
  glyph: string;
  danger?: boolean;
  submit?: boolean;
  title?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type={submit ? "submit" : "button"}
      onClick={onClick}
      title={title}
      className={`flex min-h-11 cursor-pointer items-center gap-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        danger
          ? "text-ember-deep hover:text-ember"
          : "text-muted hover:text-ink hover:underline hover:underline-offset-3"
      } ${className}`}
    >
      <i aria-hidden="true" className={`not-italic ${danger ? "" : "text-ember"}`}>
        {glyph}
      </i>
      {children}
    </button>
  );
}

function EditorField({
  id,
  label,
  wide = false,
  ...props
}: { id: string; label: string; wide?: boolean } & React.ComponentProps<"input">) {
  return (
    <div className={`flex flex-col gap-[5px] ${wide ? "col-span-2" : ""}`}>
      <label
        htmlFor={id}
        className="text-[10.5px] font-bold tracking-[0.14em] text-muted uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        className={`h-[46px] w-full border-b-2 border-ink bg-transparent px-0.5 outline-none transition-colors placeholder:text-clay focus:border-riso ${
          wide ? "text-[15px]" : "text-[19px] font-bold tabular-nums"
        }`}
        {...props}
      />
    </div>
  );
}

function formatWeight(kg: number) {
  // vírgula decimal (pt-BR), sem casas desnecessárias: 22,5 kg · 10 kg
  return `${kg.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
}
