import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
}

async function checkSupabase(): Promise<{ status: 'up' | 'down'; responseTime?: number; error?: string }> {
  const start = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('portfolios').select('id').limit(1);
    
    if (error) throw error;
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET() {
  const startTime = process.uptime();
  
  // Check various services
  const [supabaseStatus] = await Promise.all([
    checkSupabase(),
  ]);
  
  // Determine overall health status
  const allServicesUp = supabaseStatus.status === 'up';
  const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = allServicesUp ? 'healthy' : 'degraded';
  
  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(startTime),
    services: {
      database: supabaseStatus,
      application: {
        status: 'up',
        responseTime: 1,
      },
    },
  };
  
  // Return appropriate status code based on health
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
  
  return NextResponse.json(healthStatus, { status: statusCode });
}