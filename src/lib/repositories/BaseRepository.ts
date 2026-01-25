import { prisma } from "../prisma";
import { createLogger, Logger } from "../logger";

export abstract class BaseRepository {
  protected prisma = prisma;
  protected logger: Logger;

  constructor(entityName: string) {
    this.logger = createLogger({ operation: `${entityName}Repository` });
  }

  protected handleError(error: unknown, operation: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`${operation} failed`, { error: errorMessage });
    throw new Error(`${operation} failed: ${errorMessage}`);
  }

  protected logSuccess(operation: string, details?: Record<string, unknown>): void {
    this.logger.info(`${operation} completed`, details);
  }
}
