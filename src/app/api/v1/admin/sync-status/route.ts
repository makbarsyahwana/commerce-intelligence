import { NextRequest, NextResponse } from 'next/server';
import { getLatestSyncRun } from '@/lib/dashboardQueries';
import { ApiResponse, SyncStatusResponse } from '@/types';

// TypeScript validation
function validateSyncStatusRequest(request: NextRequest): boolean {
  // Check for API key in production
  const apiKey = request.headers.get('x-api-key');
  
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // In production, validate API key
  return apiKey === process.env.ADMIN_API_KEY;
}

export async function GET(request: NextRequest) {
  try {
    // Validate request
    if (!validateSyncStatusRequest(request)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Unauthorized',
        message: 'Valid API key required'
      };
      
      return NextResponse.json(response, { status: 401 });
    }

    // Fetch latest sync run
    const latestSyncRun = await getLatestSyncRun();
    
    const syncStatusData: SyncStatusResponse = {
      lastSync: latestSyncRun,
      isRunning: latestSyncRun?.status === 'RUNNING' || false
    };

    const response: ApiResponse<SyncStatusResponse> = {
      success: true,
      data: syncStatusData
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Sync status error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch sync status'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
