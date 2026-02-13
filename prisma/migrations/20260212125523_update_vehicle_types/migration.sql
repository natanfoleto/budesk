-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VehicleType" ADD VALUE 'CARRO';
ALTER TYPE "VehicleType" ADD VALUE 'UTILITARIO';
ALTER TYPE "VehicleType" ADD VALUE 'CAMINHONETE';
ALTER TYPE "VehicleType" ADD VALUE 'VAN';
ALTER TYPE "VehicleType" ADD VALUE 'SUV';
ALTER TYPE "VehicleType" ADD VALUE 'MOTO';
ALTER TYPE "VehicleType" ADD VALUE 'MICRO_ONIBUS';
ALTER TYPE "VehicleType" ADD VALUE 'CAMINHAO_3_4';
ALTER TYPE "VehicleType" ADD VALUE 'CAMINHAO_TOCO';
ALTER TYPE "VehicleType" ADD VALUE 'CAMINHAO_TRUCK';
ALTER TYPE "VehicleType" ADD VALUE 'CARRETA';
ALTER TYPE "VehicleType" ADD VALUE 'BITREM';
ALTER TYPE "VehicleType" ADD VALUE 'RODOTREM';
ALTER TYPE "VehicleType" ADD VALUE 'TRATOR';
ALTER TYPE "VehicleType" ADD VALUE 'RETROESCAVADEIRA';
ALTER TYPE "VehicleType" ADD VALUE 'PA_CARREGADEIRA';
ALTER TYPE "VehicleType" ADD VALUE 'ESCAVADEIRA';
ALTER TYPE "VehicleType" ADD VALUE 'MOTONIVELADORA';
ALTER TYPE "VehicleType" ADD VALUE 'ROLO_COMPACTADOR';
ALTER TYPE "VehicleType" ADD VALUE 'REBOQUE';
ALTER TYPE "VehicleType" ADD VALUE 'SEMIRREBOQUE';
ALTER TYPE "VehicleType" ADD VALUE 'PRANCHA';
ALTER TYPE "VehicleType" ADD VALUE 'TANQUE';
ALTER TYPE "VehicleType" ADD VALUE 'COLHEITADEIRA';
ALTER TYPE "VehicleType" ADD VALUE 'PULVERIZADOR';
ALTER TYPE "VehicleType" ADD VALUE 'EMPILHADEIRA';
