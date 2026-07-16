import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  BODY_PART_LABELS,
  BODY_PART_ORDER,
  EQUIPMENT_LABELS,
  MEDIA_ATTRIBUTION,
  TARGET_LABELS,
  label,
} from "@/lib/catalog";
import { CatalogSearch } from "./catalog-search";
import { addExercise } from "@/app/(app)/fichas/actions";

const PAGE_SIZE = 24;

export type CatalogParams = {
  q?: string;
  grupo?: string;
  equip?: string;
  page?: string;
};

/**
 * Catálogo de exercícios: busca livre + duas dimensões de filtro.
 * Músculo é chip quadrado (escolha exclusiva, visual sólido);
 * equipamento é aba sublinhada — dimensões distintas, sem competir.
 * Com `fichaId`, cada card ganha o botão de adicionar à ficha.
 */
export async function ExerciseCatalog({
  params,
  basePath,
  fichaId,
  inFicha = new Set<string>(),
}: {
  params: CatalogParams;
  basePath: string;
  fichaId?: string;
  inFicha?: Set<string>;
}) {
  const q = params.q?.trim() ?? "";
  const grupo = params.grupo ?? "";
  const equip = params.equip ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.ExerciseWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (grupo) where.bodyPart = grupo;
  if (equip) where.equipment = equip;

  const [total, exercises, facets] = await Promise.all([
    prisma.exercise.count({ where }),
    prisma.exercise.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        imageUrl: true,
        bodyPart: true,
        target: true,
      },
    }),
    prisma.exercise.findMany({ select: { bodyPart: true, equipment: true } }),
  ]);

  const availableGroups = BODY_PART_ORDER.filter((g) =>
    facets.some((e) => e.bodyPart === g),
  );
  const availableEquip = [...new Set(facets.map((e) => e.equipment))].sort(
    (a, b) => label(EQUIPMENT_LABELS, a).localeCompare(label(EQUIPMENT_LABELS, b)),
  );

  const pages = Math.ceil(total / PAGE_SIZE);
  const buildHref = (patch: Partial<CatalogParams>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...patch };
    if (merged.q) next.set("q", merged.q);
    if (merged.grupo) next.set("grupo", merged.grupo);
    if (merged.equip) next.set("equip", merged.equip);
    if (merged.page && merged.page !== "1") next.set("page", merged.page);
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const hasFilters = Boolean(q || grupo || equip);
  const offset = (page - 1) * PAGE_SIZE;

  return (
    <div className="flex flex-col">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-[30px] leading-none font-bold tracking-[-0.03em] lg:text-[38px]">
          Catálogo
        </h1>
        <div className="text-right">
          <div className="text-[44px] leading-[0.9] font-bold tracking-[-0.04em] text-ember tabular-nums lg:text-[56px]">
            {total}
          </div>
          <div className="text-[10.5px] font-medium tracking-[0.1em] text-muted">
            {hasFilters ? "RESULTADOS" : "EXERCÍCIOS"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <CatalogSearch placeholder="Buscar exercício…" />
      </div>

      {/* músculo: chips sólidos, rolagem horizontal no mobile */}
      <div className="-mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        <Chip href={buildHref({ grupo: "", page: "1" })} active={!grupo}>
          Todos
        </Chip>
        {availableGroups.map((g) => (
          <Chip
            key={g}
            href={buildHref({ grupo: g === grupo ? "" : g, page: "1" })}
            active={g === grupo}
          >
            {label(BODY_PART_LABELS, g)}
          </Chip>
        ))}
      </div>

      {/* equipamento: abas sublinhadas — segunda dimensão, peso visual menor */}
      <div className="-mx-6 mt-1.5 flex gap-4 overflow-x-auto border-b-2 border-ink px-6 pt-1.5 lg:mx-0 lg:px-0">
        <Tab href={buildHref({ equip: "", page: "1" })} active={!equip}>
          Todos
        </Tab>
        {availableEquip.map((e) => (
          <Tab
            key={e}
            href={buildHref({ equip: e === equip ? "" : e, page: "1" })}
            active={e === equip}
          >
            {label(EQUIPMENT_LABELS, e)}
          </Tab>
        ))}
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Link
            href={basePath}
            className="text-[13px] font-medium text-muted underline decoration-ember underline-offset-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Limpar filtros
          </Link>
        </div>
      )}

      {exercises.length === 0 ? (
        <div className="mt-8 border-t-2 border-ink pt-8">
          <p className="text-[22px] leading-tight font-bold tracking-[-0.02em]">
            Nada encontrado
            {q && (
              <>
                {" "}
                para <span className="text-ember">“{q}”</span>
              </>
            )}
            .
          </p>
          <p className="mt-2 text-[14px] text-muted">
            O catálogo está em inglês — tente &ldquo;squat&rdquo;,
            &ldquo;press&rdquo;, &ldquo;curl&rdquo;.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 border-l border-paper-edge lg:grid-cols-4">
          {exercises.map((exercise, i) => (
            <li
              key={exercise.id}
              className="flex flex-col gap-2 border-r border-b border-paper-edge p-3.5"
            >
              <span className="text-[10.5px] font-medium tracking-[0.1em] text-clay tabular-nums">
                Nº {String(offset + i + 1).padStart(3, "0")}
              </span>

              <Link
                href={`/exercicios/${exercise.id}`}
                className="group flex flex-col gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              >
                <Image
                  src={exercise.imageUrl}
                  alt=""
                  width={200}
                  height={200}
                  className="aspect-square w-full bg-paper-edge object-cover"
                />
                <h3 className="text-[15px] leading-[1.2] font-bold tracking-[-0.01em] group-hover:underline group-hover:decoration-ember group-hover:underline-offset-2">
                  {exercise.name}
                </h3>
                <p className="text-[12px] text-muted">
                  {label(BODY_PART_LABELS, exercise.bodyPart)} ·{" "}
                  {label(TARGET_LABELS, exercise.target)}
                </p>
              </Link>

              {fichaId &&
                (inFicha.has(exercise.id) ? (
                  <span className="mt-auto flex h-11 items-center text-[14px] font-bold text-ember">
                    ✓ Já na ficha
                  </span>
                ) : (
                  <form action={addExercise} className="mt-auto">
                    <input type="hidden" name="fichaId" value={fichaId} />
                    <input type="hidden" name="exerciseId" value={exercise.id} />
                    <button
                      type="submit"
                      className="h-11 w-full cursor-pointer bg-ink text-[14px] font-bold text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
                    >
                      Adicionar
                    </button>
                  </form>
                ))}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-[11px] text-clay">
        Imagens dos exercícios: {MEDIA_ATTRIBUTION}
      </p>

      {pages > 1 && (
        <nav
          aria-label="Paginação"
          className="mt-6 flex items-center justify-between border-t-2 border-ink pt-4"
        >
          <PageLink
            href={buildHref({ page: String(page - 1) })}
            disabled={page === 1}
          >
            ← Anterior
          </PageLink>
          <span className="text-[13px] font-medium text-muted tabular-nums">
            {page} / {pages}
          </span>
          <PageLink
            href={buildHref({ page: String(page + 1) })}
            disabled={page === pages}
          >
            Próxima →
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`flex h-11 shrink-0 items-center border px-4 text-[14px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        active
          ? "border-ink bg-ink text-paper"
          : "border-ink text-ink hover:bg-ink/5"
      }`}
    >
      {children}
    </Link>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`flex h-10 shrink-0 items-center border-b-2 text-[14px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        active
          ? "border-ember text-ink"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="text-[13px] font-medium text-clay opacity-40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      className="text-[13px] font-medium transition-colors hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
    >
      {children}
    </Link>
  );
}
