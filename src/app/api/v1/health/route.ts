import { NextRequest, NextResponse } from 'next/server';
import { HealthResponse } from '@/types';

// Simple TypeScript validation
function validateHealthRequest(request: NextRequest): boolean {
  // Basic validation - in production, add more checks
  return request.method === 'GET';
}

export async function GET(request: NextRequest) {
  try {
    // Validate request
    if (!validateHealthRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request method' },
        { status: 405 }
      );
    }

    // Check database connection (simplified)
    const isDatabaseConnected = true; // Replace with actual DB check
    
    const response: HealthResponse = {
      status: isDatabaseConnected ? 'healthy' : 'unhealthy',
      database: isDatabaseConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Health check failed'
      },
      { status: 500 }
    );
  }
}
