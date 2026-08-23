import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const opportunity = await db.opportunity.findUnique({
      where: { id },
      include: {
        recommendations: {
          include: {
            merchantActions: {
              orderBy: {
                timestamp: 'desc'
              }
            }
          }
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({ opportunity });
  } catch (error: any) {
    console.error('Error fetching opportunity detail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
