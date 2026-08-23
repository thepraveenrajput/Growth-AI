import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { searchKnowledgeBase } from '@/lib/rag';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recommendation = await db.recommendation.findUnique({
      where: { id },
      include: {
        opportunity: true,
        merchantActions: {
          orderBy: { timestamp: 'desc' }
        }
      },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // Dynamic RAG search: look up relevant payment optimization guides using opportunity details
    const searchTerms = `${recommendation.opportunity.title} ${recommendation.opportunity.type}`;
    const relevantArticles = await searchKnowledgeBase(searchTerms);

    return NextResponse.json({
      recommendation,
      relevantArticles
    });
  } catch (error: any) {
    console.error('Error fetching recommendation detail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
