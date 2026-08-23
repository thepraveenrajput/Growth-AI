import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const recommendations = await db.recommendation.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        opportunity: true,
        merchantActions: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
