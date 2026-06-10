-- AlterTable
ALTER TABLE "Sector" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "animationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "callsign" TEXT,
ADD COLUMN     "password" TEXT;
