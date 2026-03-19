/*
  Warnings:

  - The values [NAO_TRABALHADO] on the enum `AttendanceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceType_new" AS ENUM ('PRESENCA', 'FALTA', 'FALTA_JUSTIFICADA', 'ATESTADO', 'DECLARACAO', 'AFASTAMENTO', 'FOLGA');
ALTER TABLE "public"."daily_wages" ALTER COLUMN "presence" DROP DEFAULT;
ALTER TABLE "public"."planting_productions" ALTER COLUMN "presence" DROP DEFAULT;
ALTER TABLE "attendance_records" ALTER COLUMN "type" TYPE "AttendanceType_new" USING (CASE WHEN "type"::text = 'NAO_TRABALHADO' THEN 'FOLGA' ELSE "type"::text END)::"AttendanceType_new";
ALTER TABLE "planting_productions" ALTER COLUMN "presence" TYPE "AttendanceType_new" USING (CASE WHEN "presence"::text = 'NAO_TRABALHADO' THEN 'FOLGA' ELSE "presence"::text END)::"AttendanceType_new";
ALTER TABLE "daily_wages" ALTER COLUMN "presence" TYPE "AttendanceType_new" USING (CASE WHEN "presence"::text = 'NAO_TRABALHADO' THEN 'FOLGA' ELSE "presence"::text END)::"AttendanceType_new";
ALTER TYPE "AttendanceType" RENAME TO "AttendanceType_old";
ALTER TYPE "AttendanceType_new" RENAME TO "AttendanceType";
DROP TYPE "public"."AttendanceType_old";
ALTER TABLE "daily_wages" ALTER COLUMN "presence" SET DEFAULT 'PRESENCA';
ALTER TABLE "planting_productions" ALTER COLUMN "presence" SET DEFAULT 'PRESENCA';
COMMIT;
