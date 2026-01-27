import { NextResponse } from 'next/server';
import { prisma } from '@/lib/container/prisma';
import { SyncRunRepository } from '@/lib/repositories/SyncRunRepository';

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check latest sync run using repository (auto-configured on import)
    const syncRunRepo = new SyncRunRepository();
    const latestSyncRun = await syncRunRepo.findLatest();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      latestSyncRun: latestSyncRun || null,
    });
  } catch (err) {
    console.error('Health check failed:', err);
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 503 });
  }
}
