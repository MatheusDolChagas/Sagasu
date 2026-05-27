-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "lastSeenLatitude" DOUBLE PRECISION,
ADD COLUMN     "lastSeenLongitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "sightings" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "sightings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sightings" ADD CONSTRAINT "sightings_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sightings" ADD CONSTRAINT "sightings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
