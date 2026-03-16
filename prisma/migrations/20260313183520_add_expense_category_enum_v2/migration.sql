/*
  Warnings:

  - Changed the type of `category` on the `financial_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `planting_expenses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ALIMENTACAO', 'COMBUSTIVEL', 'EQUIPAMENTOS', 'MANUTENCAO', 'PECAS', 'SALARIO', 'SERVICOS', 'OUTROS');

-- Map accented and variations before casting
UPDATE "financial_transactions" SET "category" = 'COMBUSTIVEL' WHERE "category" IN ('Combustível', 'combustivel', 'Combustivel');
UPDATE "financial_transactions" SET "category" = 'ALIMENTACAO' WHERE "category" IN ('Alimentação', 'alimentação', 'Alimentacao');
UPDATE "financial_transactions" SET "category" = 'MANUTENCAO' WHERE "category" IN ('Manutenção', 'manutenção', 'Manutencao');
UPDATE "financial_transactions" SET "category" = 'PECAS' WHERE "category" IN ('Peças', 'peças', 'Pecas');
UPDATE "financial_transactions" SET "category" = 'SERVICOS' WHERE "category" IN ('Serviços', 'serviços', 'Servicos');
UPDATE "financial_transactions" SET "category" = 'SALARIO' WHERE "category" IN ('Salário', 'salário', 'Salario');

-- Final cleanup for anything still not in enum
UPDATE "financial_transactions" SET "category" = 'OUTROS' WHERE "category" NOT IN ('ALIMENTACAO', 'COMBUSTIVEL', 'EQUIPAMENTOS', 'MANUTENCAO', 'PECAS', 'SALARIO', 'SERVICOS', 'OUTROS');
ALTER TABLE "financial_transactions" ALTER COLUMN "category" TYPE "ExpenseCategory" USING "category"::"ExpenseCategory";

-- Same for planting_expenses
UPDATE "planting_expenses" SET "category" = 'COMBUSTIVEL' WHERE "category" IN ('Combustível', 'combustivel', 'Combustivel');
UPDATE "planting_expenses" SET "category" = 'ALIMENTACAO' WHERE "category" IN ('Alimentação', 'alimentação', 'Alimentacao');
UPDATE "planting_expenses" SET "category" = 'MANUTENCAO' WHERE "category" IN ('Manutenção', 'manutenção', 'Manutencao');
UPDATE "planting_expenses" SET "category" = 'PECAS' WHERE "category" IN ('Peças', 'peças', 'Pecas');
UPDATE "planting_expenses" SET "category" = 'SERVICOS' WHERE "category" IN ('Serviços', 'serviços', 'Servicos');
UPDATE "planting_expenses" SET "category" = 'SALARIO' WHERE "category" IN ('Salário', 'salário', 'Salario');

UPDATE "planting_expenses" SET "category" = 'OUTROS' WHERE "category" NOT IN ('ALIMENTACAO', 'COMBUSTIVEL', 'EQUIPAMENTOS', 'MANUTENCAO', 'PECAS', 'SALARIO', 'SERVICOS', 'OUTROS');
ALTER TABLE "planting_expenses" ALTER COLUMN "category" TYPE "ExpenseCategory" USING "category"::"ExpenseCategory";
