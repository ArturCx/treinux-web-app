import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sentenceCase } from "@/lib/catalog";
import { SessionPrint, loadSessionPrint } from "../session-print";
import { WorkoutSession } from "./workout-session";

export default async function TreinoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const log = await prisma.workoutLog.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      startedAt: true,
      finishedAt: true,
      ficha: {
        select: {
          id: true,
          name: true,
          exercises: {
            orderBy: { order: "asc" },
            select: {
              exerciseId: true,
              sets: true,
              reps: true,
              weightKg: true,
              restSeconds: true,
              exercise: { select: { name: true, namePt: true } },
            },
          },
        },
      },
      entries: {
        select: { exerciseId: true, setNumber: true, weightKg: true, reps: true },
      },
    },
  });

  if (!log) notFound();

  // Sessão concluída = a folha impressa (língua zine, 40-historico).
  if (log.finishedAt) {
    const data = await loadSessionPrint(log.id, session.user.id);
    if (!data) notFound();
    return (
      <div className="mx-auto max-w-[720px] px-[18px] pt-6 pb-20 lg:px-6 lg:pt-8">
        <Link
          href="/treino"
          className="text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          ← Histórico
        </Link>
        <div className="mt-4">
          <SessionPrint data={data} kicker="Sessão impressa" />
        </div>
      </div>
    );
  }

  // Sessão ao vivo = o instrumento (língua telemetria, 04-telemetria-v2).
  const exercises = (log.ficha?.exercises ?? []).map((fe) => ({
    exerciseId: fe.exerciseId,
    name: sentenceCase(fe.exercise.namePt ?? fe.exercise.name),
    sets: fe.sets,
    reps: fe.reps,
    weightKg: fe.weightKg === null ? null : Number(fe.weightKg),
    restSeconds: fe.restSeconds,
  }));

  const initialEntries = log.entries.map((e) => ({
    exerciseId: e.exerciseId,
    setNumber: e.setNumber,
    weightKg: e.weightKg === null ? "" : String(Number(e.weightKg)),
    reps: e.reps === null ? "" : String(e.reps),
  }));

  return (
    <WorkoutSession
      logId={log.id}
      fichaName={log.ficha?.name ?? "Treino"}
      startedAtMs={log.startedAt.getTime()}
      exercises={exercises}
      initialEntries={initialEntries}
    />
  );
}
