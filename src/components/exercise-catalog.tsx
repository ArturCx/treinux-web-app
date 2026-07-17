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
  sentenceCase,
} from "@/lib/catalog";
import { CatalogSearch } from "./catalog-search";
import { AddExerciseCard, AddExerciseGroup } from "./add-exercise-card";

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
  if (q)
    where.OR = [
      { namePt: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  if (grupo) where.bodyPart = grupo;
  if (equip) where.equipment = equip;

  const [total, exercises, facets] = await Promise.all([
    prisma.exercise.count({ where }),
    prisma.exercise.findMany({
      where,
      orderBy: [{ namePt: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        namePt: true,
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
          Catálogo<span className="text-ember">.</span>
        </h1>
        <div className="text-right">
          <div className="text-[44px] leading-[0.9] font-bold tracking-[-0.04em] text-ember tabular-nums lg:text-[56px]">
            {hasFilters ? total : `+${Math.floor(total / 100) * 100}`}
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
      <div className="scrollbar-none -mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
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
      <div className="scrollbar-none -mx-6 mt-1.5 flex gap-4 overflow-x-auto border-b-2 border-ink px-6 pt-1.5 lg:mx-0 lg:px-0">
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
            Tente outro termo — &ldquo;supino&rdquo;,
            &ldquo;agachamento&rdquo;, &ldquo;rosca&rdquo; — ou limpe os
            filtros.
          </p>
        </div>
      ) : (
        <AddExerciseGroup>
          <ul className="mt-6 grid grid-cols-2 border-l border-paper-edge lg:grid-cols-4">
            {exercises.map((exercise, i) => {
              const number = `Nº ${String(offset + i + 1).padStart(3, "0")}`;
              const displayName = sentenceCase(exercise.namePt ?? exercise.name);
              const taxonomy = `${label(BODY_PART_LABELS, exercise.bodyPart)} · ${label(TARGET_LABELS, exercise.target)}`;
              const addable = fichaId && !inFicha.has(exercise.id);

              return (
                <li
                  key={exercise.id}
                  className="border-r border-b border-paper-edge"
                >
                  {addable ? (
                    <div className="h-full p-3.5">
                      <AddExerciseCard
                        fichaId={fichaId}
                        exerciseId={exercise.id}
                        number={number}
                        name={displayName}
                        taxonomy={taxonomy}
                        imageUrl={exercise.imageUrl}
                      />
                    </div>
                  ) : (
                    /* card inteiro é o link — o selecionado se destaca com
                       fundo, zoom da foto e a seta deslizando */
                    <Link
                      href={`/exercicios/${exercise.id}`}
                      className="group flex h-full flex-col gap-2 p-3.5 transition-colors duration-200 hover:bg-paper-deep active:bg-paper-deep focus-visible:bg-paper-deep focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
                    >
                      <span className="flex items-baseline justify-between">
                        <span className="text-[10.5px] font-medium tracking-[0.1em] text-clay tabular-nums">
                          {number}
                        </span>
                        {fichaId ? (
                          <span
                            aria-hidden="true"
                            className="text-[13px] leading-none font-bold text-ember"
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="-translate-x-1 text-[18px] leading-none font-bold text-ember opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                          >
                            →
                          </span>
                        )}
                      </span>

                      <span className="overflow-hidden">
                        <Image
                          src={exercise.imageUrl}
                          alt=""
                          width={200}
                          height={200}
                          className="aspect-square w-full bg-paper-edge object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05] group-focus-visible:scale-[1.05]"
                        />
                      </span>
                      <h3 className="text-[15px] leading-[1.2] font-bold tracking-[-0.01em] group-hover:underline group-hover:decoration-ember group-hover:underline-offset-2">
                        {displayName}
                      </h3>
                      <p className="text-[12px] text-muted">{taxonomy}</p>

                      {fichaId && (
                        <span className="mt-auto pt-1 text-[12.5px] font-bold text-ember">
                          Já na ficha
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </AddExerciseGroup>
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
          : "border-ink text-ink hover:bg-ink/5 active:bg-ink/10"
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
      <span className="flex h-11 items-center text-[13px] font-medium text-clay opacity-40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      className="flex h-11 items-center text-[13px] font-medium transition-colors hover:text-ember active:text-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
    >
      {children}
    </Link>
  );
}
