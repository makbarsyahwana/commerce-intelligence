import { ConcurrentBatchConfig } from "../../../types/sync";
import { createDefaultConcurrentConfig } from "./constants";

export interface SyncConfig {
  concurrentConfig: ConcurrentBatchConfig;
  providerConcurrencyLimit: number;
}

export const SYNC_CONFIG: SyncConfig = {
  concurrentConfig: createDefaultConcurrentConfig(),
  providerConcurrencyLimit: Number(process.env.SYNC_PROVIDER_CONCURRENCY_LIMIT ?? 5),
};

export function getSyncConfig(): SyncConfig {
  return SYNC_CONFIG;
}
