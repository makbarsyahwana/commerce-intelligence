import { PrismaClient } from "@prisma/client";
import { prisma } from "../container/prisma";
import { createLogger } from "../container/logger";

const logger = createLogger({ operation: 'base-repository' });

// Transaction client type for Prisma interactive transactions
export type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export abstract class BaseRepository {
  protected prisma: PrismaClient | TransactionClient;
  protected logger = logger;

  constructor(tx?: TransactionClient) {
    this.prisma = tx ?? prisma;
  }

  /**
   * Create a new repository instance bound to a transaction
   */
  withTransaction(tx: TransactionClient): this {
    const Constructor = this.constructor as new (tx?: TransactionClient) => this;
    return new Constructor(tx);
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
