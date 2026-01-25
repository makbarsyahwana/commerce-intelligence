import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get recent sync runs with provider breakdown
    const syncRuns = await prisma.syncRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        provider: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        errorMessage: true,
        productsFetched: true,
        ordersFetched: true,
      }
    });

    // Get overall stats
    const stats = await prisma.syncRun.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        }
      }
    });

    // Get provider stats
    const providerStats = await prisma.syncRun.groupBy({
      by: ['provider', 'status'],
      _count: {
        id: true,
      },
      where: {
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        }
      }
    });

    return NextResponse.json({
      recentRuns: syncRuns,
      last24Hours: stats,
      providerStats: providerStats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Sync status check failed:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 });
  }
}
