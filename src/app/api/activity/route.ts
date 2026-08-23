import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [merchantActions, agentRuns] = await Promise.all([
      db.merchantAction.findMany({
        orderBy: { timestamp: 'desc' },
        include: {
          recommendation: {
            select: {
              finding: true,
              opportunityId: true,
              opportunity: {
                select: {
                  title: true,
                  type: true
                }
              }
            }
          }
        }
      }),
      db.agentRun.findMany({
        orderBy: { timestamp: 'desc' },
        include: {
          toolCalls: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })
    ]);

    // Format activities into a unified chronological log
    const activities: any[] = [];

    merchantActions.forEach((action) => {
      activities.push({
        id: action.id,
        type: 'MERCHANT_ACTION',
        title: `Recommendation ${action.actionType}`,
        description: action.recommendation.finding,
        meta: {
          actionType: action.actionType,
          feedback: action.feedback,
          opportunityTitle: action.recommendation.opportunity.title
        },
        timestamp: action.timestamp
      });
    });

    agentRuns.forEach((run) => {
      activities.push({
        id: run.id,
        type: 'AGENT_RUN',
        title: `AI Agent Investigation`,
        description: run.prompt.length > 80 ? `${run.prompt.slice(0, 80)}...` : run.prompt,
        meta: {
          prompt: run.prompt,
          toolCallsCount: run.toolCalls.length,
          toolCalls: run.toolCalls.map(tc => ({
            toolName: tc.toolName,
            params: tc.inputParams
          }))
        },
        timestamp: run.timestamp
      });
    });

    // Sort combined activities by timestamp desc
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
