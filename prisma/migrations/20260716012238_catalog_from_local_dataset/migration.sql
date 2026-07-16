/*
  Warnings:

  - You are about to drop the column `bodyParts` on the `exercise` table. All the data in the column will be lost.
  - You are about to drop the column `equipments` on the `exercise` table. All the data in the column will be lost.
  - You are about to drop the column `exerciseTips` on the `exercise` table. All the data in the column will be lost.
  - You are about to drop the column `exerciseType` on the `exercise` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `exercise` table. All the data in the column will be lost.
  - You are about to drop the column `overview` on the `exercise` table. All the data in the column will be lost.
  - You are about to drop the column `targetMuscles` on the `exercise` table. All the data in the column will be lost.
  - You are about to drop the column `variations` on the `exercise` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `exercise` table. All the data in the column will be lost.
  - Added the required column `attribution` to the `exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bodyPart` to the `exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipment` to the `exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target` to the `exercise` table without a default value. This is not possible if the table is not empty.
  - Made the column `imageUrl` on table `exercise` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "exercise" DROP COLUMN "bodyParts",
DROP COLUMN "equipments",
DROP COLUMN "exerciseTips",
DROP COLUMN "exerciseType",
DROP COLUMN "keywords",
DROP COLUMN "overview",
DROP COLUMN "targetMuscles",
DROP COLUMN "variations",
DROP COLUMN "videoUrl",
ADD COLUMN     "attribution" TEXT NOT NULL,
ADD COLUMN     "bodyPart" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "equipment" TEXT NOT NULL,
ADD COLUMN     "gifUrl" TEXT,
ADD COLUMN     "muscleGroup" TEXT,
ADD COLUMN     "target" TEXT NOT NULL,
ALTER COLUMN "imageUrl" SET NOT NULL;

-- CreateIndex
CREATE INDEX "exercise_bodyPart_idx" ON "exercise"("bodyPart");

-- CreateIndex
CREATE INDEX "exercise_equipment_idx" ON "exercise"("equipment");
