/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provider,providerProductId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Order_providerOrderId_key";

-- DropIndex
DROP INDEX "Product_providerProductId_key";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "provider" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "provider" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SyncRun" ADD COLUMN     "provider" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_provider_providerOrderId_key" ON "Order"("provider", "providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_provider_providerProductId_key" ON "Product"("provider", "providerProductId");
