import { prisma } from "../container/prisma";
import { createLogger } from "../logger";

const logger = createLogger({ operation: 'base-repository' });

export abstract class BaseRepository {
  protected prisma = prisma;
  protected logger = logger;

  protected handleError(error: unknown, operation: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`${operation} failed`, { error: errorMessage });
    throw new Error(`${operation} failed: ${errorMessage}`);
  }

  protected logSuccess(operation: string, details?: Record<string, unknown>): void {
    this.logger.info(`${operation} completed`, details);
  }
}
