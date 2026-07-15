import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const FICHA_ROWS = [
  { num: "01", name: "SUPINO RETO", rx: "4 × 8-12", done: true },
  { num: "02", name: "AGACHAMENTO LIVRE", rx: "5 × 5", done: true },
  { num: "03", name: "REMADA CURVADA", rx: "3 × AMRAP", done: false, active: true },
  { num: "04", name: "DESENV. MILITAR", rx: "4 × 6-10", done: false },
  { num: "05", name: "PRANCHA", rx: "3 × 45s", done: false },
];

const MUSCLE_TICKER = [
  "PEITO",
  "COSTAS",
  "QUADRÍCEPS",
  "POSTERIOR",
  "OMBROS",
  "BÍCEPS",
  "TRÍCEPS",
  "CORE",
  "GLÚTEOS",
  "PANTURRILHA",
];

function Ticker() {
  const strip = (
    <span aria-hidden="true" className="flex shrink-0 items-center">
      {MUSCLE_TICKER.map((m) => (
        <span key={m} className="flex items-center">
          <span className="px-5 text-[12px] font-medium tracking-[0.22em] text-paper/60">
            {m}
          </span>
          <span className="size-[5px] rounded-full bg-ember" />
        </span>
      ))}
    </span>
  );

  return (
    <div className="overflow-hidden border-t border-paper/15 py-3.5">
      <div className="flex w-max animate-marquee">
        {strip}
        {strip}
      </div>
    </div>
  );
}

function Stamp() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-[46%] right-8 hidden size-36 animate-spin-slow xl:block"
    >
      <svg viewBox="0 0 144 144" className="size-full">
        <defs>
          <path
            id="stamp-circle"
            d="M 72,72 m -54,0 a 54,54 0 1,1 108,0 a 54,54 0 1,1 -108,0"
          />
        </defs>
        <circle
          cx="72"
          cy="72"
          r="70"
          fill="none"
          stroke="#d14b24"
          strokeWidth="1.5"
        />
        <circle cx="72" cy="72" r="38" fill="none" stroke="#d14b24" strokeWidth="1" />
        <text className="fill-ember text-[13.5px] font-semibold tracking-[0.28em]">
          <textPath href="#stamp-circle">
            200 EXERCÍCIOS · CATÁLOGO COMPLETO · TREINUX ·
          </textPath>
        </text>
      </svg>
    </div>
  );
}

function Poster() {
  return (
    <aside className="relative flex flex-col justify-between overflow-hidden bg-ink text-paper">
      <div className="flex items-baseline justify-between px-7 pt-8 lg:px-10 lg:pt-10">
        <div className="text-[22px] font-bold tracking-[-0.02em]">
          Treinux<span className="text-ember">.</span>
        </div>
        <div className="text-[11px] font-medium tracking-[0.2em] text-paper/50">
          DIÁRIO DE TREINO — Nº 001
        </div>
      </div>

      <div className="relative px-7 py-10 lg:px-10 lg:py-12">
        <h2 className="text-[15vw] leading-[0.95] font-bold tracking-[-0.04em] sm:text-[64px] lg:text-[72px]">
          Anote<span className="text-ember">.</span>
          <br />
          Levante<span className="text-ember">.</span>
          <br />
          Repita<span className="text-ember">.</span>
        </h2>
        <Stamp />
      </div>

      <div className="hidden px-7 pb-8 lg:block lg:px-10">
        <div className="mb-3 text-[11px] font-medium tracking-[0.2em] text-paper/50">
          SESSÃO DE HOJE
        </div>
        <ul>
          {FICHA_ROWS.map((row) => (
            <li
              key={row.num}
              className={`flex items-center gap-4 border-t border-paper/12 py-3 text-[14px] ${
                row.done ? "text-paper/35" : "text-paper/85"
              }`}
            >
              <span
                className={`flex size-[18px] shrink-0 items-center justify-center border ${
                  row.done
                    ? "border-ember bg-ember text-ink"
                    : row.active
                      ? "border-ember"
                      : "border-paper/30"
                }`}
              >
                {row.done && (
                  <svg viewBox="0 0 10 8" className="w-2.5 fill-none stroke-ink stroke-2">
                    <path d="M1 4l2.5 2.5L9 1" />
                  </svg>
                )}
              </span>
              <span className="w-6 text-[12px] tracking-[0.1em] text-paper/40">
                {row.num}
              </span>
              <span
                className={`flex-1 font-medium tracking-[0.04em] ${
                  row.done ? "line-through decoration-paper/30" : ""
                }`}
              >
                {row.name}
              </span>
              <span
                className={`text-[13px] tracking-[0.06em] ${
                  row.active ? "font-semibold text-ember" : "text-paper/45"
                }`}
              >
                {row.rx}
              </span>
              {row.active && (
                <span className="text-[10px] font-semibold tracking-[0.18em] text-ember">
                  AGORA
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Ticker />
    </aside>
  );
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-[1.08fr_1fr] lg:grid-rows-none">
      <Poster />
      <main className="flex items-start justify-center px-7 py-12 lg:items-center lg:py-16">
        <div className="w-full max-w-[390px] animate-enter">{children}</div>
      </main>
    </div>
  );
}
