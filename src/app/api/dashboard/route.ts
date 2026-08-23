import { NextResponse } from 'next/server';
import { 
  getAnalyticsSummary, 
  getPaymentMethodMetrics, 
  getFailureReasons, 
  getHourlyPerformance, 
  getDailyTrend, 
  getSegmentPerformance 
} from '@/lib/analytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const customerSegment = searchParams.get('customerSegment') || undefined;

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const filters = { startDate, endDate, paymentMethod, customerSegment };

    // Fetch all analytics components concurrently
    const [
      summary, 
      paymentMethods, 
      failureReasons, 
      hourlyPerformance, 
      dailyTrend, 
      segmentPerformance
    ] = await Promise.all([
      getAnalyticsSummary(filters),
      getPaymentMethodMetrics({ startDate, endDate }),
      getFailureReasons({ startDate, endDate, paymentMethod }),
      getHourlyPerformance({ startDate, endDate, paymentMethod }),
      getDailyTrend({ startDate, endDate, paymentMethod }),
      getSegmentPerformance({ startDate, endDate })
    ]);

    return NextResponse.json({
      summary,
      paymentMethods,
      failureReasons,
      hourlyPerformance,
      dailyTrend,
      segmentPerformance
    });
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
