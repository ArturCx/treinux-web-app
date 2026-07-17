-- AlterTable
ALTER TABLE "exercise" ADD COLUMN     "namePt" TEXT;

-- CreateIndex
CREATE INDEX "exercise_namePt_idx" ON "exercise"("namePt");
