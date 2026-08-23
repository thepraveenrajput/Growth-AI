import { NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/analytics';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Fetch last 30 days metrics as baseline
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const baseline = await getAnalyticsSummary({ startDate: thirtyDaysAgo });

    // Inputs: allow overriding defaults with slider values
    const transactionCount = body.transactionCount !== undefined ? Number(body.transactionCount) : baseline.transactionCount;
    const targetSuccessRate = body.targetSuccessRate !== undefined ? Number(body.targetSuccessRate) : baseline.successRate;
    const averageTransactionValue = body.averageTransactionValue !== undefined ? Number(body.averageTransactionValue) : baseline.averageTransactionValue;

    const currentSuccessRate = baseline.successRate;
    const currentSuccessfulCount = Math.round(transactionCount * (currentSuccessRate / 100));
    
    // Deterministic simulation
    const targetSuccessfulCount = Math.round(transactionCount * (targetSuccessRate / 100));
    const additionalSuccessfulTransactions = Math.max(0, targetSuccessfulCount - currentSuccessfulCount);
    
    const currentVolume = currentSuccessfulCount * averageTransactionValue;
    const targetVolume = targetSuccessfulCount * averageTransactionValue;
    const estimatedAdditionalVolume = Math.max(0, targetVolume - currentVolume);

    return NextResponse.json({
      baseline: {
        transactionCount: baseline.transactionCount,
        successRate: baseline.successRate,
        averageTransactionValue: baseline.averageTransactionValue,
        successfulVolume: baseline.successfulVolume
      },
      simulation: {
        inputTransactionCount: transactionCount,
        inputAverageTransactionValue: averageTransactionValue,
        targetSuccessRate: Math.round(targetSuccessRate * 10) / 10,
        additionalSuccessfulTransactions,
        estimatedAdditionalVolume: Math.round(estimatedAdditionalVolume * 100) / 100,
        disclaimer: 'This is an analytical simulation based on historic payment method distributions. Realized results depend on checkout friction, network conditions, and card networks.'
      }
    });
  } catch (error: any) {
    console.error('Error running simulator:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
