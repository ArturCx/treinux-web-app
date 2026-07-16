import { requireSession } from "@/lib/session";
import { ExerciseCatalog, type CatalogParams } from "@/components/exercise-catalog";

export default async function ExerciciosPage({
  searchParams,
}: {
  searchParams: Promise<CatalogParams>;
}) {
  await requireSession();
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ExerciseCatalog params={params} basePath="/exercicios" />
    </div>
  );
}
