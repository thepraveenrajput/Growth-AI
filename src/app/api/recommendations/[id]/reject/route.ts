import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { feedback = 'Rejected by merchant.' } = body;

    const recommendation = await db.recommendation.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // Execute atomic transaction: update recommendation status, reset opportunity status, and insert action log
    const result = await db.$transaction(async (tx) => {
      const updatedRec = await tx.recommendation.update({
        where: { id },
        data: {
          status: 'REJECTED',
          feedbackMessage: feedback,
        },
      });

      await tx.opportunity.update({
        where: { id: recommendation.opportunityId },
        data: {
          status: 'DETECTED', // Reset opportunity to detected so it can be evaluated/investigated again
        },
      });

      const action = await tx.merchantAction.create({
        data: {
          recommendationId: id,
          actionType: 'REJECTED',
          feedback: feedback,
        },
      });

      return { updatedRec, action };
    });

    return NextResponse.json({
      success: true,
      recommendation: result.updatedRec,
      action: result.action,
    });
  } catch (error: any) {
    console.error('Error rejecting recommendation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
