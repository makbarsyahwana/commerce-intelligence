// Sync configuration constants
export const SYNC_CONSTANTS = {
  // Default variation percentages for demo data
  VARIATIONS: {
    PRICE: 0.05,
    DISCOUNT: 0.10,
    RATING: 0.05,
    TOTAL_PRICE: 0.03,
  },
  
  // Default concurrent batch configuration
  DEFAULT_CONCURRENT_CONFIG: {
    CONCURRENT_LIMIT: 3,
    BATCH_SIZE: 50,
    BATCH_TIMEOUT: 30000, // 30 seconds
    PAUSE_BETWEEN_BATCHES: 100, // 100ms
  },
  
  // Decimal precision for financial calculations
  DECIMAL_PRECISION: 2,
} as const;

// Type for concurrent batch configuration
export interface ConcurrentBatchConfig {
  concurrentLimit: number;
  batchSize: number;
  batchTimeout: number;
  pauseBetweenBatches: number;
}

// Create default configuration
export function createDefaultConcurrentConfig(): ConcurrentBatchConfig {
  return {
    concurrentLimit: SYNC_CONSTANTS.DEFAULT_CONCURRENT_CONFIG.CONCURRENT_LIMIT,
    batchSize: SYNC_CONSTANTS.DEFAULT_CONCURRENT_CONFIG.BATCH_SIZE,
    batchTimeout: SYNC_CONSTANTS.DEFAULT_CONCURRENT_CONFIG.BATCH_TIMEOUT,
    pauseBetweenBatches: SYNC_CONSTANTS.DEFAULT_CONCURRENT_CONFIG.PAUSE_BETWEEN_BATCHES,
  };
}
