-- CreateTable
CREATE TABLE "planting_payments" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "employee_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "fortnight" INTEGER,
    "system_bruto_in_cents" INTEGER NOT NULL,
    "system_net_in_cents" INTEGER NOT NULL,
    "holerite_net_in_cents" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planting_payments_employee_id_idx" ON "planting_payments"("employee_id");

-- CreateIndex
CREATE INDEX "planting_payments_season_id_idx" ON "planting_payments"("season_id");

-- AddForeignKey
ALTER TABLE "planting_payments" ADD CONSTRAINT "planting_payments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_payments" ADD CONSTRAINT "planting_payments_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
