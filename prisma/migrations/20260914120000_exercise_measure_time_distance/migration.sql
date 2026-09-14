-- CreateEnum
CREATE TYPE "ExerciseMeasure" AS ENUM ('WEIGHT_REPS', 'TIME_DISTANCE');

-- AlterTable
ALTER TABLE "exercise" ADD COLUMN     "measure" "ExerciseMeasure" NOT NULL DEFAULT 'WEIGHT_REPS';

-- AlterTable
ALTER TABLE "ficha_exercise" ADD COLUMN     "distanceM" INTEGER,
ADD COLUMN     "durationS" INTEGER;

-- AlterTable
ALTER TABLE "workout_log_entry" ADD COLUMN     "distanceM" INTEGER;

-- Cardio de locomoção e máquinas é medido em tempo × distância. Lista caso a
-- caso (espelho de src/lib/measure.ts): burpee, polichinelo, escalador etc.
-- continuam em peso × repetições mesmo estando na categoria "cardio".
UPDATE "exercise" SET "measure" = 'TIME_DISTANCE' WHERE "id" IN (
  '0685', '0684', '3656', '3637', '3666', '2311',   -- corrida / caminhada
  '0798', '2138', '2331', '2141',                   -- bike / elíptico
  '2139', '2142',                                   -- ergômetros
  '2612', '0128', '3360'                            -- corda / deslocamento
);

-- Itens de ficha já existentes com esses exercícios ganham um tempo alvo
-- inicial (10 min por série) e perdem o peso, que não se aplica.
UPDATE "ficha_exercise" fe
SET "durationS" = 600, "weightKg" = NULL
FROM "exercise" e
WHERE e."id" = fe."exerciseId"
  AND e."measure" = 'TIME_DISTANCE'
  AND fe."durationS" IS NULL;
