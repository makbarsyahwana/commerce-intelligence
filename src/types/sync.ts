// Sync Domain Types

export type SyncStatus = "RUNNING" | "SUCCESS" | "FAILED";

export interface SyncResult {
  success: boolean;
  productsProcessed: number;
  ordersProcessed: number;
  error?: string;
  duration: number;
}

export interface SyncRunData {
  startedAt: Date;
  syncedAt: Date;
  status: SyncStatus;
  provider?: string;
  errorMessage?: string;
  productsFetched?: number;
  ordersFetched?: number;
}

export interface SyncRunUpdateData {
  status: SyncStatus;
  finishedAt: Date;
  errorMessage?: string;
  productsFetched?: number;
  ordersFetched?: number;
}

export type SyncExecutionMode = "local" | "trigger-batch";

export interface SyncStrategy {
  name: string;
  useConcurrent: boolean;
  concurrentConfig?: ConcurrentBatchConfig;
  executionMode?: SyncExecutionMode;
}

export interface ConcurrentBatchConfig {
  concurrentLimit: number;
  batchSize: number;
  batchTimeout: number;
  pauseBetweenBatches: number;
}

// Data Variation Types
export interface ProductVariations {
  price?: number;
  discount?: number;
  rating?: number;
}

export interface OrderVariations {
  totalPrice?: number;
}

// Prisma Transaction Type
export type PrismaTransaction = Parameters<Parameters<typeof import('../lib/container/prisma').prisma.$transaction>[0]>[0];
