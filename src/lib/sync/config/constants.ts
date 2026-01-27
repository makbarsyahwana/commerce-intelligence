import { ConcurrentBatchConfig } from "../../../types/sync";

export const SYNC_CONSTANTS = {
  VARIATIONS: {
    PRICE: 0.05,
    DISCOUNT: 0.10,
    RATING: 0.05,
    TOTAL_PRICE: 0.03,
  },
  
  DEFAULT_CONCURRENT_CONFIG: {
    CONCURRENT_LIMIT: 3,
    BATCH_SIZE: 50,
    BATCH_TIMEOUT: 30000,
    PAUSE_BETWEEN_BATCHES: 100,
  },
  
  DECIMAL_PRECISION: 2,
} as const;

export function createDefaultConcurrentConfig(): ConcurrentBatchConfig {
  return {
    concurrentLimit: SYNC_CONSTANTS.DEFAULT_CONCURRENT_CONFIG.CONCURRENT_LIMIT,
    batchSize: SYNC_CONSTANTS.DEFAULT_CONCURRENT_CONFIG.BATCH_SIZE,
    batchTimeout: SYNC_CONSTANTS.DEFAULT_CONCURRENT_CONFIG.BATCH_TIMEOUT,
    pauseBetweenBatches: SYNC_CONSTANTS.DEFAULT_CONCURRENT_CONFIG.PAUSE_BETWEEN_BATCHES,
  };
}
