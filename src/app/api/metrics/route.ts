import { type NextRequest, NextResponse } from 'next/server';

import { register } from '@/lib/monitoring/metrics';

export async function GET(request: NextRequest) {
  // Check if the request is coming from Prometheus
  const authHeader = request.headers.get('authorization');
  const prometheusToken = process.env.PROMETHEUS_BEARER_TOKEN;
  
  // If a token is configured, verify it
  if (prometheusToken && authHeader !== `Bearer ${prometheusToken}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    // Get metrics in Prometheus format
    const metrics = await register.metrics();
    
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}