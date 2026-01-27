import { NextResponse } from 'next/server';
import { getLatestSyncRun } from '@/lib/services/dashboardQueries';

export async function GET() {
  try {
    // Get latest sync run using dashboard queries
    const latestSyncRun = await getLatestSyncRun();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      syncRun: latestSyncRun,
    });
  } catch (err) {
    console.error('Sync status check failed:', err);
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 503 });
  }
}
