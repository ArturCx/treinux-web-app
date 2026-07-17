import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { MiniStamp, SectionLabel } from "@/components/zine";
import { SessionPrint, loadSessionPrint } from "./session-print";

/**
 * Treino (40-historico): a sessão mais recente sai da máquina como folha
 * impressa; as demais viram o arquivo de sessões, com carimbo em miniatura.
 */
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
      ficha: {
        select: { name: true, exercises: { select: { sets: true } } },
      },
      _count: { select: { entries: true } },
    },
  });

  const fresh = logs.find((l) => l.finishedAt);
  const freshPrint = fresh ? await loadSessionPrint(fresh.id, session.user.id) : null;
  const archive = logs.filter((l) => l.id !== fresh?.id);

  return (
    <div className="mx-auto max-w-[1240px] px-[18px] pt-6 pb-20 lg:px-10 lg:pt-8 lg:pb-[100px]">
      <h1 className="shout text-[36px] lg:text-[48px]">Treino</h1>

      {logs.length === 0 ? (
        <div className="mt-8 max-w-xl border-2 border-dashed border-clay px-4 py-5 text-[13.5px] text-muted">
          Nenhuma sessão impressa ainda — o treino{" "}
          <b className="font-bold text-ink">sai da máquina para cá</b>. Abra uma{" "}
          <Link
            href="/fichas"
            className="inline-block py-2.5 font-bold underline underline-offset-3 hover:text-ink"
          >
            ficha
          </Link>{" "}
          e aperte ● Iniciar treino.
        </div>
      ) : (
        <div className="mt-7 lg:grid lg:grid-cols-[560px_minmax(0,1fr)] lg:items-start lg:gap-x-14">
          {freshPrint && (
            <div className="lg:sticky lg:top-7">
              <SectionLabel title="Saiu da máquina" className="mb-[18px]" />
              <SessionPrint data={freshPrint} kicker={freshKicker(freshPrint.finishedAt)} />
            </div>
          )}

          {archive.length > 0 && (
            <section className={freshPrint ? "mt-10 lg:mt-0" : "lg:col-span-2"}>
              <SectionLabel title="Arquivo de sessões" dim className="mb-1.5" />
              {archive.map((log) => {
                const active = !log.finishedAt;
                const prescribed = log.ficha?.exercises.reduce((s, e) => s + e.sets, 0) ?? 0;
                const complete = prescribed > 0 && log._count.entries >= prescribed;

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3.5 border-b border-paper-edge py-4"
                  >
                    <div
                      aria-hidden="true"
                      className="w-[58px] flex-none border border-ink bg-paper py-1.5 text-center"
                    >
                      <div className="shout text-[22px] tabular-nums">
                        {log.startedAt.getDate()}
                      </div>
                      <div className="mt-0.5 text-[9px] font-bold tracking-[0.14em] text-muted uppercase">
                        {formatDateBlock(log.startedAt)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16.5px] leading-[1.2] font-bold tracking-[-0.015em]">
                        {log.ficha?.name ?? "Treino"}
                      </h3>
                      <div className="mt-1 font-mono text-[12px] text-muted tabular-nums">
                        {log.finishedAt && `${duration(log.startedAt, log.finishedAt)} · `}
                        <b className="font-bold text-ink">{log._count.entries}</b>
                        {prescribed > 0 && `/${prescribed}`} séries
                      </div>
                    </div>
                    {active ? (
                      <span className="flex flex-none items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-ember uppercase">
                        <span
                          aria-hidden="true"
                          className="inline-block size-2 animate-livepulse rounded-full bg-ember"
                        />
                        Em andamento
                      </span>
                    ) : complete ? (
                      <MiniStamp className="-rotate-[7deg] flex-none">Concluído</MiniStamp>
                    ) : (
                      <span className="flex-none border-[1.5px] border-dashed border-clay px-[7px] py-[3px] text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                        Parcial
                      </span>
                    )}
                    <Link
                      href={`/treino/${log.id}`}
                      aria-label={`Abrir sessão de ${log.ficha?.name ?? "treino"}`}
                      className="flex size-12 flex-none items-center justify-center border border-ink bg-paper text-[17px] font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                    >
                      →
                    </Link>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}

    </div>
  );
}

function freshKicker(finishedAt: Date | null) {
  if (!finishedAt) return "Sessão";
  const today = new Date();
  const sameDay =
    finishedAt.getDate() === today.getDate() &&
    finishedAt.getMonth() === today.getMonth() &&
    finishedAt.getFullYear() === today.getFullYear();
  return sameDay ? "Sessão · hoje" : "Sessão mais recente";
}

function formatDateBlock(date: Date) {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "")
    .replace("-feira", "");
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(date)
    .replace(".", "");
  return `${weekday} · ${month}`;
}

/** Duração derivada de startedAt→finishedAt — não há coluna própria. */
function duration(start: Date, end: Date) {
  const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
