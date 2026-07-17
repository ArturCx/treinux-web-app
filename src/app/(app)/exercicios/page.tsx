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
    <div className="mx-auto max-w-[1240px] px-[18px] pt-[22px] pb-[70px] lg:px-10 lg:pt-[30px] lg:pb-[90px]">
      <ExerciseCatalog params={params} basePath="/exercicios" />
    </div>
  );
}
