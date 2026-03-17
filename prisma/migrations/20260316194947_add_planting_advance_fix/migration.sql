-- CreateTable
CREATE TABLE "planting_advances" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "employeeId" TEXT NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "valueInCents" INTEGER NOT NULL,
    "notes" TEXT,
    "discountInCurrentFortnight" BOOLEAN NOT NULL DEFAULT true,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_advances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planting_advances_date_idx" ON "planting_advances"("date");

-- CreateIndex
CREATE INDEX "planting_advances_employeeId_idx" ON "planting_advances"("employeeId");

-- CreateIndex
CREATE INDEX "planting_advances_frontId_idx" ON "planting_advances"("frontId");

-- AddForeignKey
ALTER TABLE "planting_advances" ADD CONSTRAINT "planting_advances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_advances" ADD CONSTRAINT "planting_advances_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_advances" ADD CONSTRAINT "planting_advances_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
