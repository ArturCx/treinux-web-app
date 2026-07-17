import Link from "next/link";
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
import { AddExerciseCard, AddExerciseGroup, DuotonePhoto } from "./add-exercise-card";

const PAGE_SIZE = 24;

export type CatalogParams = {
  q?: string;
  grupo?: string;
  equip?: string;
  page?: string;
};

/**
 * Catálogo de espécimes (20-catalogo): busca sublinhada, chips de músculo
 * com sombra dura no ativo, abas de equipamento, grade de hairlines com
 * fotos em duotone de riso. Com `fichaId`, cada espécime ganha o painel
 * de adicionar à ficha.
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

  return (
    <div className="flex flex-col">
      <div className="flex items-end justify-between gap-4">
        <h1 className="shout text-[32px] lg:text-[44px]">Catálogo</h1>
        <div className="text-right tabular-nums">
          <div className="shout text-[46px] leading-[0.9] tracking-[-0.02em] text-ember lg:text-[60px]">
            {hasFilters ? total : `+${Math.floor(total / 100) * 100}`}
          </div>
          <div className="text-[10.5px] font-medium tracking-[0.12em] text-muted uppercase">
            {hasFilters ? "Resultados" : "Exercícios"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <CatalogSearch placeholder="Buscar exercício…" />
      </div>

      {/* músculo: chips com sombra dura no ativo */}
      <div className="mt-[18px] mb-2 text-[10.5px] font-bold tracking-[0.14em] text-muted uppercase">
        Grupo muscular
      </div>
      <div className="scrollbar-none -mx-[18px] flex gap-2 overflow-x-auto px-[18px] pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
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

      {/* equipamento: abas sublinhadas — segunda dimensão, peso menor */}
      <div className="mt-3 mb-0.5 text-[10.5px] font-bold tracking-[0.14em] text-muted uppercase">
        Equipamento
      </div>
      <div className="scrollbar-none -mx-[18px] flex gap-[18px] overflow-x-auto border-b-2 border-ink px-[18px] lg:mx-0 lg:px-0">
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
        <div className="mt-8 border-2 border-dashed border-clay px-4 py-5 text-[13.5px] text-muted">
          Nada encontrado
          {q && (
            <>
              {" "}
              para <b className="font-bold text-ink">&ldquo;{q}&rdquo;</b>
            </>
          )}
          . Tente outro nome — &ldquo;supino&rdquo;, &ldquo;agachamento&rdquo;,
          &ldquo;rosca&rdquo; — ou{" "}
          <Link
            href={basePath}
            className="inline-block py-2.5 font-bold underline underline-offset-3 hover:text-ink"
          >
            limpe a busca
          </Link>
          .
        </div>
      ) : (
        <AddExerciseGroup>
          <ul className="mt-[22px] grid grid-cols-2 border-t border-l border-paper-edge lg:grid-cols-4">
            {exercises.map((exercise) => {
              const number = `Nº ${exercise.id}`;
              const displayName = sentenceCase(exercise.namePt ?? exercise.name);
              const taxonomy = `${label(BODY_PART_LABELS, exercise.bodyPart)} · ${label(TARGET_LABELS, exercise.target)}`;
              const inThisFicha = Boolean(fichaId) && inFicha.has(exercise.id);

              return (
                <li key={exercise.id} className="border-r border-b border-paper-edge">
                  {fichaId && !inThisFicha ? (
                    <AddExerciseCard
                      fichaId={fichaId}
                      exerciseId={exercise.id}
                      number={number}
                      name={displayName}
                      taxonomy={taxonomy}
                      imageUrl={exercise.imageUrl}
                    />
                  ) : (
                    <article className="flex h-full flex-col bg-paper">
                      <div className="px-3 pt-2.5 pb-2 text-[10px] font-bold tracking-[0.14em] text-clay uppercase tabular-nums">
                        {number}
                      </div>
                      <DuotonePhoto imageUrl={exercise.imageUrl} />
                      <h3 className="px-3 pt-2.5 text-[15px] leading-[1.2] font-bold tracking-[-0.01em] lg:text-[16px]">
                        {displayName}
                      </h3>
                      <div className="px-3 pt-0.5 text-[11.5px] text-muted">{taxonomy}</div>
                      <div className="mt-auto p-3">
                        {inThisFicha ? (
                          /* única ocorrência do rosa fluo desta tela */
                          <div className="flex min-h-12 items-center justify-center bg-ember text-[13px] font-bold tracking-[0.04em] text-paper">
                            ✓ Já na ficha
                          </div>
                        ) : (
                          <Link
                            href={`/exercicios/${exercise.id}`}
                            className="flex min-h-12 w-full items-center justify-between border border-ink bg-paper px-3 text-[14px] font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                          >
                            Ver exercício
                            <i aria-hidden="true" className="text-ember not-italic">
                              →
                            </i>
                          </Link>
                        )}
                      </div>
                    </article>
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
          className="mt-6 flex items-center justify-between border-t-2 border-ink pt-3"
        >
          <PageLink href={buildHref({ page: String(page - 1) })} disabled={page === 1}>
            ← Anterior
          </PageLink>
          <span className="text-[13px] font-medium text-muted tabular-nums">
            pág. <b className="font-bold text-ink">{page}</b> / {pages} da edição
          </span>
          <PageLink href={buildHref({ page: String(page + 1) })} disabled={page === pages}>
            Próxima <i className="text-ember not-italic">→</i>
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
      className={`flex h-12 shrink-0 items-center border border-ink px-[15px] text-[14px] font-medium whitespace-nowrap transition-[background-color,box-shadow,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        active
          ? "bg-ink text-paper shadow-[3px_3px_0_var(--color-ember)]"
          : "bg-paper text-ink hover:shadow-[3px_3px_0_var(--color-riso)]"
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
      className={`flex h-12 shrink-0 items-center border-b-[3px] text-[14px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
        active
          ? "border-ember font-bold text-ink"
          : "border-transparent font-medium text-muted hover:text-ink"
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
      <span className="flex h-12 items-center px-1 text-[14px] font-medium text-clay">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      className="flex h-12 items-center px-1 text-[14px] font-bold transition-colors hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
    >
      {children}
    </Link>
  );
}
