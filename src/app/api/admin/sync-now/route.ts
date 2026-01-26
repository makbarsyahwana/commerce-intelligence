import { NextRequest, NextResponse } from 'next/server';
import { syncAllProviders } from '@/lib/sync/syncProviders';
import { createLogger } from '@/lib/container/logger';
import { auth } from '../../auth/index';

const logger = createLogger({ operation: 'sync-now-api' });

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication using Auth.js
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      logger.warn('Unauthorized sync attempt', {
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userRole: session?.user?.role,
      });
      
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    logger.info('Starting manual sync via API', {
      userId: session.user.id,
      userEmail: session.user.email,
    });

    // Trigger the sync process
    await syncAllProviders();

    logger.info('Manual sync completed successfully', {
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Manual sync failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
