/*
 * Vocabulário do zine (língua "papel" do sistema híbrido).
 * Receitas canônicas: design-lab/design_handoff_treinux_hybrid/01-zine-v2.html.
 */

/** Grão de copiadora sobre a tela inteira. Uma ocorrência por página. */
export function Grain() {
  return <div aria-hidden="true" className="grain-overlay" />;
}

/**
 * Desregistro de riso — só no ÚNICO título grande da tela.
 * plate: sobre chapas de tinta (texto vira papel); senão, direto no papel.
 */
export function Overprint({
  text,
  plate = false,
  className = "",
}: {
  text: string;
  plate?: boolean;
  className?: string;
}) {
  return (
    <span
      data-text={text}
      className={`${plate ? "overprint-plate text-paper" : "overprint-paper"} ${className}`}
    >
      {text}
    </span>
  );
}

/** Chapas de tinta chapada atrás do título de capa (multiply, ~1° de giro). */
export function Plates({ className = "" }: { className?: string }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute top-[66px] -left-10 h-[170px] w-[82%] rotate-[-1.2deg] bg-ember mix-blend-multiply lg:top-20 lg:h-[230px] lg:w-[60%] ${className}`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[118px] left-[30%] h-[132px] w-[60%] rotate-[0.8deg] bg-riso mix-blend-multiply lg:top-[140px] lg:left-[44%] lg:h-[180px] lg:w-[38%]"
      />
    </>
  );
}

/** Selo giratório de riso (textPath circular, tinta azul). */
export function Stamp({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <svg viewBox="0 0 120 120" className="size-full animate-spin-slow">
        <defs>
          <path
            id="zine-stamp-ring"
            d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
          />
        </defs>
        <circle cx="60" cy="60" r="57" fill="none" stroke="var(--color-riso)" strokeWidth="2" />
        <circle
          cx="60"
          cy="60"
          r="30"
          fill="none"
          stroke="var(--color-riso)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
        <text className="fill-riso text-[12.4px] font-bold tracking-[0.24em]">
          {/* textLength = circunferência (2π·44 ≈ 276): o texto preenche
              exatamente uma volta, sem sobrepor o início */}
          <textPath
            href="#zine-stamp-ring"
            textLength="276"
            lengthAdjust="spacingAndGlyphs"
          >
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

/** Fita adesiva: posicionar/rotacionar pelo className do chamador. */
export function Tape({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-[26px] w-[110px] border-x border-dashed border-ink/25 bg-[rgba(214,204,172,0.65)] mix-blend-multiply ${className}`}
    />
  );
}

/** Carimbo de riso (borda ember + Anton, rotacionado, multiply). */
export function MiniStamp({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`shout pointer-events-none border-2 border-ember px-[7px] py-px text-[11px] tracking-[0.16em] text-ember opacity-70 mix-blend-multiply ${className}`}
    >
      {children}
    </span>
  );
}

/** Rótulo de seção: grito Anton + contagem em tinta azul + régua. */
export function SectionLabel({
  title,
  count,
  dim = false,
  className = "",
}: {
  title: string;
  count?: number;
  dim?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <h2 className={`shout text-[26px] ${dim ? "text-clay" : ""}`}>{title}</h2>
      {count !== undefined && (
        <span className="bg-riso px-[9px] py-[3px] text-[13px] font-bold text-paper tabular-nums">
          {count}
        </span>
      )}
      <span
        aria-hidden="true"
        className={`h-0.5 flex-1 ${dim ? "h-px bg-paper-edge" : "bg-ink"}`}
      />
    </div>
  );
}

/**
 * Barra de anilhas — sumário de carga da ficha. 1 anilha = 4 séries,
 * alternando as duas tintas (multiply). Cap em 6 anilhas (comprimento da barra).
 */
export function BarbellViz({ sets, className = "" }: { sets: number; className?: string }) {
  const plates = Math.min(6, Math.max(1, Math.round(sets / 4)));
  const left = Math.ceil(plates / 2);
  const right = plates - left;
  const inks = ["var(--color-ember)", "var(--color-riso)"];

  const rects: { x: number; small: boolean; fill: string }[] = [];
  for (let i = 0; i < left; i++)
    rects.push({ x: 18 + i * 13, small: right < left && i === left - 1, fill: inks[i % 2] });
  for (let i = 0; i < right; i++)
    rects.push({ x: 123 - i * 13, small: false, fill: inks[i % 2] });

  return (
    <svg viewBox="0 0 150 30" aria-hidden="true" className={className}>
      <rect x="0" y="13" width="150" height="4" fill="var(--color-ink)" />
      <rect x="8" y="10" width="5" height="10" fill="var(--color-ink)" />
      <rect x="137" y="10" width="5" height="10" fill="var(--color-ink)" />
      {rects.map((r, i) =>
        r.small ? (
          <rect key={i} className="mix-blend-multiply" x={r.x + 1} y="6" width="7" height="18" fill={r.fill} />
        ) : (
          <rect key={i} className="mix-blend-multiply" x={r.x} y="1" width="9" height="28" fill={r.fill} />
        ),
      )}
    </svg>
  );
}

/** "Ed. Nº 03 — Jul 2026": nº de fichas ativas + mês corrente. */
export function issueLabel(activeFichas: number, date = new Date()) {
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(date)
    .replace(".", "");
  const cap = month.charAt(0).toUpperCase() + month.slice(1);
  return `Ed. Nº ${String(Math.max(1, activeFichas)).padStart(2, "0")} — ${cap} ${date.getFullYear()}`;
}
