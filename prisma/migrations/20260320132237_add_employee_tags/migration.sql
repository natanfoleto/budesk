-- CreateTable
CREATE TABLE "employee_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_tag_on_employee" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "employee_tag_on_employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_tags_name_key" ON "employee_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_tag_on_employee_employee_id_tag_id_key" ON "employee_tag_on_employee"("employee_id", "tag_id");

-- AddForeignKey
ALTER TABLE "employee_tag_on_employee" ADD CONSTRAINT "employee_tag_on_employee_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_tag_on_employee" ADD CONSTRAINT "employee_tag_on_employee_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "employee_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
