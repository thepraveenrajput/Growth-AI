import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { detectOpportunities } from '@/lib/detector';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const triggerDetection = searchParams.get('detect') !== 'false';

    if (triggerDetection) {
      // Run detection to ensure opportunities are fresh
      await detectOpportunities();
    }

    const opportunities = await db.opportunity.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        recommendations: true,
      },
    });

    return NextResponse.json({ opportunities });
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
