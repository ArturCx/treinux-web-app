import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function TreinoHistoryPage() {
  const session = await requireSession();

  const logs = await prisma.workoutLog.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      id: true,
      startedAt: true,
      finishedAt: true,
      ficha: { select: { name: true } },
      _count: { select: { entries: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-[30px] leading-none font-bold tracking-[-0.03em] lg:text-[38px]">
        Treinos<span className="text-ember">.</span>
      </h1>
      <p className="mt-2 text-[14px] text-muted">
        Histórico dos seus treinos. Inicie um treino a partir de uma ficha.
      </p>

      {logs.length === 0 ? (
        <div className="mt-10 border-2 border-dashed border-paper-edge px-6 py-12 text-center">
          <p className="text-[15px] text-muted">
            Nenhum treino ainda. Abra uma ficha e toque em{" "}
            <span className="font-bold text-ink">Iniciar treino</span>.
          </p>
          <Link
            href="/fichas"
            className="mt-4 inline-flex h-11 items-center bg-ink px-5 text-[14px] font-bold text-paper transition-colors hover:bg-ink-soft active:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Ver fichas
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col">
          {logs.map((log) => {
            const active = !log.finishedAt;
            return (
              <li key={log.id}>
                <Link
                  href={`/treino/${log.id}`}
                  className="group flex items-center gap-4 border-b border-paper-edge py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[16px] font-bold tracking-[-0.01em] group-hover:underline group-hover:decoration-ember group-hover:underline-offset-2">
                      {log.ficha?.name ?? "Treino"}
                    </h2>
                    <p className="text-[12.5px] text-muted">
                      {formatDate(log.startedAt)} · {log._count.entries} séries
                      {log.finishedAt &&
                        ` · ${formatDuration(log.startedAt, log.finishedAt)}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-bold tracking-[0.1em] ${active ? "text-ember" : "text-muted"}`}
                  >
                    {active ? "EM ANDAMENTO" : "CONCLUÍDO"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden shrink-0 text-[18px] text-ember opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 sm:block"
                  >
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Duração derivada de startedAt→finishedAt — não há coluna própria. */
function formatDuration(start: Date, end: Date) {
  const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(".", "");
}
