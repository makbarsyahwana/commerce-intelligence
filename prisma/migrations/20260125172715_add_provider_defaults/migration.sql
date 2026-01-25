-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "provider" SET DEFAULT 'fake-store';

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "provider" SET DEFAULT 'fake-store';
