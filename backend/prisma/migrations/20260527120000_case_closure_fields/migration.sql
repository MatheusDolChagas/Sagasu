-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "closureDetails" TEXT,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3);
