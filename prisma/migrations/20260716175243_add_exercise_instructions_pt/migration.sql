-- AlterTable
ALTER TABLE "exercise" ADD COLUMN     "instructionsPt" TEXT[] DEFAULT ARRAY[]::TEXT[];
