import { ConcurrentBatchConfig, SyncStrategy } from "../../types/sync";
import { createDefaultConcurrentConfig } from "./constants";

// Default configuration - can be overridden by environment
export const SYNC_CONFIG: SyncStrategy = {
  name: process.env.SYNC_STRATEGY || 'safe-concurrent',
  useConcurrent: process.env.SYNC_STRATEGY !== 'sequential',
  concurrentConfig: createDefaultConcurrentConfig(),
};

// Predefined strategies for different use cases
export const SYNC_STRATEGIES = {
  // Fastest but riskiest - for dedicated sync servers
  aggressive: {
    name: 'aggressive-concurrent',
    useConcurrent: true,
    concurrentConfig: {
      concurrentLimit: 10,
      batchSize: 100,
      batchTimeout: 60000,
      pauseBetweenBatches: 0,
    },
  },

  // Balanced - good for most production workloads
  balanced: {
    name: 'balanced-concurrent',
    useConcurrent: true,
    concurrentConfig: {
      concurrentLimit: 5,
      batchSize: 50,
      batchTimeout: 30000,
      pauseBetweenBatches: 50,
    },
  },

  // Safe - minimal risk, good for shared environments
  safe: {
    name: 'safe-concurrent',
    useConcurrent: true,
    concurrentConfig: createDefaultConcurrentConfig(),
  },

  // Sequential - maximum compatibility
  sequential: {
    name: 'sequential',
    useConcurrent: false,
  },
} as const;

export function getSyncStrategy(strategyName?: string): SyncStrategy {
  if (strategyName && SYNC_STRATEGIES[strategyName as keyof typeof SYNC_STRATEGIES]) {
    return SYNC_STRATEGIES[strategyName as keyof typeof SYNC_STRATEGIES];
  }
  
  return SYNC_CONFIG;
}
