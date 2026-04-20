-- AlterTable
ALTER TABLE "employment_records" DROP COLUMN "isActive",
ADD COLUMN     "hasNr316Certificate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasNr317Certificate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSignedExperienceContract" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSignedServiceOrder" BOOLEAN NOT NULL DEFAULT false;
