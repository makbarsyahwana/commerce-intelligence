import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const POOL_SIZE = Number(process.env.DATABASE_POOL_SIZE ?? 10);
const POOL_TIMEOUT = Number(process.env.DATABASE_POOL_TIMEOUT ?? 10);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'warn', 'error'] 
    : ['warn', 'error'],
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?connection_limit=${POOL_SIZE}&pool_timeout=${POOL_TIMEOUT}`,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection pool monitoring
interface PoolMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  lastChecked: Date;
}

let poolMetrics: PoolMetrics = {
  activeConnections: 0,
  idleConnections: 0,
  waitingRequests: 0,
  lastChecked: new Date(),
};

export async function getPoolMetrics(): Promise<PoolMetrics> {
  try {
    // Query PostgreSQL connection stats
    const result = await prisma.$queryRaw<Array<{
      active: bigint;
      idle: bigint;
      waiting: bigint;
    }>>`
      SELECT 
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle,
        COUNT(*) FILTER (WHERE wait_event IS NOT NULL) as waiting
      FROM pg_stat_activity 
      WHERE datname = current_database()
        AND pid != pg_backend_pid()
    `;

    if (result.length > 0) {
      poolMetrics = {
        activeConnections: Number(result[0].active),
        idleConnections: Number(result[0].idle),
        waitingRequests: Number(result[0].waiting),
        lastChecked: new Date(),
      };
    }
  } catch (error) {
    console.error('Failed to fetch pool metrics:', error);
  }

  return poolMetrics;
}

export function getPoolConfig() {
  return {
    poolSize: POOL_SIZE,
    poolTimeout: POOL_TIMEOUT,
    recommendedConcurrency: Math.floor(POOL_SIZE * 0.8), // Leave 20% headroom
  };
}

export async function checkPoolHealth(): Promise<{
  healthy: boolean;
  utilizationPercent: number;
  warning: string | null;
}> {
  const metrics = await getPoolMetrics();
  const config = getPoolConfig();
  
  const totalUsed = metrics.activeConnections + metrics.waitingRequests;
  const utilizationPercent = Math.round((totalUsed / config.poolSize) * 100);
  
  let warning: string | null = null;
  let healthy = true;

  if (utilizationPercent > 90) {
    warning = `High pool utilization: ${utilizationPercent}%. Consider increasing DATABASE_POOL_SIZE.`;
    healthy = false;
  } else if (metrics.waitingRequests > 0) {
    warning = `${metrics.waitingRequests} requests waiting for connections. Pool may be undersized.`;
  }

  return { healthy, utilizationPercent, warning };
}
