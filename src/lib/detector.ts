import db from './db';
import { 
  getPaymentMethodMetrics, 
  getHourlyPerformance, 
  getAnalyticsSummary,
  getSegmentPerformance
} from './analytics';

export async function detectOpportunities(): Promise<void> {
  console.log('🔍 Running opportunity detection engine...');

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(now.getDate() - 3);

  // --- RULE 1: UPI Evening Peak Failure ---
  console.log('📊 Evaluating UPI Evening Peak Failure Rule...');
  const upiHourly = await getHourlyPerformance({ startDate: fourteenDaysAgo, paymentMethod: 'UPI' });
  const upiGlobal = await getPaymentMethodMetrics({ startDate: fourteenDaysAgo });
  const upiOverall = upiGlobal.find(m => m.method === 'UPI');

  if (upiOverall && upiOverall.totalCount > 0) {
    const upiBaselineSuccessRate = upiOverall.successRate;
    
    // Calculate success rate during peak evening hours: 7 PM - 10 PM (hours 19, 20, 21)
    const eveningHours = [19, 20, 21];
    const eveningMetrics = upiHourly.filter(h => eveningHours.includes(h.hour));
    const eveningTotal = eveningMetrics.reduce((sum, h) => sum + h.totalCount, 0);
    const eveningSuccess = eveningMetrics.reduce((sum, h) => sum + h.successfulCount, 0);
    const eveningSuccessRate = eveningTotal > 0 ? (eveningSuccess / eveningTotal) * 100 : 0;

    const rateDrop = upiBaselineSuccessRate - eveningSuccessRate;
    
    if (rateDrop > 5.0 && eveningTotal > 50) {
      // We have a degradation!
      // Calculate estimated lost payment volume during these hours in the last 14 days
      // If evening success rate matched baseline, we would have had: eveningTotal * (upiBaselineSuccessRate/100) successful transactions.
      // Difference in successful transactions: (eveningTotal * (upiBaselineSuccessRate/100)) - eveningSuccess
      const targetSuccessfulCount = Math.round(eveningTotal * (upiBaselineSuccessRate / 100));
      const lostTransactionsCount = Math.max(0, targetSuccessfulCount - eveningSuccess);
      
      // Let's get the average UPI transaction value to estimate GMV loss
      const upiTxs = await db.transaction.aggregate({
        where: {
          merchantId: 'demo-merchant',
          paymentMethod: 'UPI',
          status: 'SUCCESS',
          timestamp: { gte: fourteenDaysAgo }
        },
        _avg: { amount: true }
      });
      const avgUpiAmount = upiTxs._avg.amount ?? 300;
      const estimatedValue = lostTransactionsCount * avgUpiAmount;

      const title = 'UPI Evening Success Rate Spike';
      const evidence = {
        baselineSuccessRate: Math.round(upiBaselineSuccessRate * 10) / 10,
        eveningSuccessRate: Math.round(eveningSuccessRate * 10) / 10,
        rateDrop: Math.round(rateDrop * 10) / 10,
        eveningTotalTransactions: eveningTotal,
        lostTransactionsCount,
        timePeriod: '7 PM - 10 PM Daily',
        affectedMethod: 'UPI',
      };

      await upsertOpportunity({
        title,
        type: 'PEAK_HOUR_FAILURE',
        severity: 'HIGH',
        priority: 'HIGH',
        evidence,
        affectedCount: lostTransactionsCount,
        estimatedValue: Math.round(estimatedValue),
        confidence: 85.0,
        finding: `UPI success rate drops by ${Math.round(rateDrop * 10) / 10} percentage points during high-volume evening transactions.`,
        evidenceText: `• UPI Baseline Success Rate: ${Math.round(upiBaselineSuccessRate * 10) / 10}%\n• Evening Peak Success Rate: ${Math.round(eveningSuccessRate * 10) / 10}%\n• Peak Hours: 7 PM - 10 PM (19:00 - 22:00)\n• Estimated affected volume: ₹${Math.round(estimatedValue).toLocaleString('en-IN')}`,
        likelyCause: 'Bank gateway downtime and node timeouts during regional peak payment hours. This is heavily correlated with HDFC and SBI bank node responses returning BANK_DEGRADED status.',
        recommendedAction: 'Implement a multi-acquiring PSP gateway router. Automatically check gateway response codes and temporarily reroute transactions to a healthy fallback network when primary UPI PSP nodes degrade.',
      });
    }
  }

  // --- RULE 2: Payment Method Underperformance (Netbanking) ---
  console.log('📊 Evaluating Payment Method Underperformance Rule...');
  const methodMetrics = await getPaymentMethodMetrics({ startDate: thirtyDaysAgo });
  const totalSummary = await getAnalyticsSummary({ startDate: thirtyDaysAgo });
  const overallSuccessRate = totalSummary.successRate;

  for (const methodMetric of methodMetrics) {
    // Check if the method has success rate > 8% below the merchant average, and represents a meaningful share
    const underperformingMargin = overallSuccessRate - methodMetric.successRate;
    if (underperformingMargin > 8.0 && methodMetric.totalCount > 100) {
      // Calculate estimated lost volume: what if it matched overall average?
      const targetSuccessCount = Math.round(methodMetric.totalCount * (overallSuccessRate / 100));
      const lostTransactionsCount = Math.max(0, targetSuccessCount - methodMetric.successfulCount);
      const avgMethodAmount = methodMetric.totalCount > 0 ? methodMetric.volume / (methodMetric.successfulCount || 1) : 0;
      const estimatedValue = lostTransactionsCount * avgMethodAmount;

      const title = `${methodMetric.method} Success Rate Underperformance`;
      const evidence = {
        method: methodMetric.method,
        methodSuccessRate: methodMetric.successRate,
        overallSuccessRate: Math.round(overallSuccessRate * 10) / 10,
        underperformingMargin: Math.round(underperformingMargin * 10) / 10,
        totalCount: methodMetric.totalCount,
        lostTransactionsCount,
      };

      await upsertOpportunity({
        title,
        type: 'METHOD_UNDERPERFORMANCE',
        severity: 'MEDIUM',
        priority: 'MEDIUM',
        evidence,
        affectedCount: lostTransactionsCount,
        estimatedValue: Math.round(estimatedValue),
        confidence: 78.0,
        finding: `${methodMetric.method} success rate (${methodMetric.successRate}%) is significantly lower than the merchant overall baseline of ${Math.round(overallSuccessRate * 10) / 10}%.`,
        evidenceText: `• ${methodMetric.method} Success Rate: ${methodMetric.successRate}%\n• Merchant Baseline Success Rate: ${Math.round(overallSuccessRate * 10) / 10}%\n• Total ${methodMetric.method} transactions: ${methodMetric.totalCount}\n• Estimated lost successful transactions: ${lostTransactionsCount}`,
        likelyCause: `High user drop-off on legacy login web portals and gateway authentication timeouts. Netbanking transactions undergo average redirections that result in higher USER_ABORTED errors.`,
        recommendedAction: `Promote UPI as an alternative on the checkout layout. Add an alert on the payment sheet: "Netbanking is currently experiencing slower response times. We recommend using UPI for instant confirmation."`,
      });
    }
  }

  // --- RULE 3: High-Value Customer Failure ---
  console.log('📊 Evaluating High-Value Customer Failure Rule...');
  // Find Enterprise/VIP customers who have experienced failures in the last 3 days
  const vipFailures = await db.transaction.findMany({
    where: {
      merchantId: 'demo-merchant',
      customerSegment: 'Enterprise',
      status: 'FAILED',
      timestamp: { gte: threeDaysAgo },
    },
    include: {
      customer: true
    }
  });

  if (vipFailures.length > 3) {
    const totalLostVolume = vipFailures.reduce((sum, tx) => sum + tx.amount, 0);
    const uniqueVipAffected = new Set(vipFailures.map(tx => tx.customerId)).size;

    const title = 'High-Value Customer Payment Failures';
    const evidence = {
      failedCount: vipFailures.length,
      uniqueVipCount: uniqueVipAffected,
      totalLostVolume,
      sampleFailures: vipFailures.slice(0, 3).map(tx => ({
        customerId: tx.customerId,
        customerName: tx.customer.name,
        amount: tx.amount,
        method: tx.paymentMethod,
        reason: tx.failureReason
      }))
    };

    await upsertOpportunity({
      title,
      type: 'HIGH_VALUE_FAILURE',
      severity: 'HIGH',
      priority: 'HIGH',
      evidence,
      affectedCount: vipFailures.length,
      estimatedValue: totalLostVolume,
      confidence: 90.0,
      finding: `${vipFailures.length} payment failures detected from high-value Enterprise customers in the last 72 hours.`,
      evidenceText: `• Failed transactions: ${vipFailures.length}\n• Affected premium customers: ${uniqueVipAffected}\n• Total affected volume: ₹${Math.round(totalLostVolume).toLocaleString('en-IN')}\n• Primary Failure Reasons: INSUFFICIENT_FUNDS, BANK_DEGRADED`,
      likelyCause: 'Authentication time-outs and insufficient customer funds during high-ticket orders. These failures represent a high risk of transaction abandonment.',
      recommendedAction: 'Trigger an automated, secure recovery link to the customer via WhatsApp/Email immediately after a failed enterprise-class order. Offer alternative payment options like netbanking/card with pre-filled fields.',
    });
  }

  // --- RULE 4: Customer Drop-Off (Customer segment performance drop) ---
  console.log('📊 Evaluating Customer Drop-Off Rule...');
  // Let's look at week-over-week segment performance
  const week2Start = new Date(now);
  week2Start.setDate(now.getDate() - 7);
  const week2End = now;

  const week1Start = new Date(now);
  week1Start.setDate(now.getDate() - 14);
  const week1End = week2Start;

  const week2Metrics = await getSegmentPerformance({ startDate: week2Start, endDate: week2End });
  const week1Metrics = await getSegmentPerformance({ startDate: week1Start, endDate: week1End });

  for (const w2 of week2Metrics) {
    const w1 = week1Metrics.find(m => m.segment === w2.segment);
    if (w1 && w1.volume > 0) {
      const volumeDropPercentage = ((w1.volume - w2.volume) / w1.volume) * 100;
      
      if (volumeDropPercentage > 15.0) {
        // Trigger customer drop-off opportunity
        const title = `${w2.segment} Segment Revenue Drop-Off`;
        const evidence = {
          segment: w2.segment,
          previousWeekVolume: w1.volume,
          currentWeekVolume: w2.volume,
          volumeDropPercentage: Math.round(volumeDropPercentage * 10) / 10,
          previousWeekCount: w1.totalCount,
          currentWeekCount: w2.totalCount,
        };

        const estimatedValue = w1.volume - w2.volume;

        await upsertOpportunity({
          title,
          type: 'CUSTOMER_DROPOFF',
          severity: 'MEDIUM',
          priority: 'HIGH',
          evidence,
          affectedCount: Math.max(0, w1.totalCount - w2.totalCount),
          estimatedValue: Math.round(estimatedValue),
          confidence: 72.0,
          finding: `${w2.segment} customer segment realized a ${Math.round(volumeDropPercentage * 10) / 10}% drop in weekly successful payment volume week-over-week.`,
          evidenceText: `• Segment: ${w2.segment}\n• Last Week Volume: ₹${Math.round(w1.volume).toLocaleString('en-IN')}\n• This Week Volume: ₹${Math.round(w2.volume).toLocaleString('en-IN')}\n• Volume Decline: ${Math.round(volumeDropPercentage * 10) / 10}%`,
          likelyCause: 'Accumulated failed checkout checkout sessions and friction during recurring payment runs, causing premium users to pause buying loops.',
          recommendedAction: 'Engage the segment with personalized email notifications containing card-saving incentives (tokenization discount) and offer smooth UPI subscription updates.',
        });
      }
    }
  }

  console.log('✅ Opportunity detection engine run complete.');
}

interface UpsertParams {
  title: string;
  type: string;
  severity: string;
  priority: string;
  evidence: any;
  affectedCount: number;
  estimatedValue: number;
  confidence: number;
  finding: string;
  evidenceText: string;
  likelyCause: string;
  recommendedAction: string;
}

async function upsertOpportunity(params: UpsertParams): Promise<void> {
  // Check if active opportunity of this type exists
  const existing = await db.opportunity.findFirst({
    where: {
      type: params.type,
      status: { in: ['DETECTED', 'INVESTIGATING'] }
    }
  });

  let opportunityId: string;

  if (existing) {
    // Update existing opportunity
    const updated = await db.opportunity.update({
      where: { id: existing.id },
      data: {
        title: params.title,
        severity: params.severity,
        priority: params.priority,
        evidence: params.evidence,
        affectedCount: params.affectedCount,
        estimatedValue: params.estimatedValue,
        confidence: params.confidence,
        timestamp: new Date()
      }
    });
    opportunityId = updated.id;
  } else {
    // Create new
    const created = await db.opportunity.create({
      data: {
        title: params.title,
        type: params.type,
        status: 'DETECTED',
        severity: params.severity,
        priority: params.priority,
        evidence: params.evidence,
        affectedCount: params.affectedCount,
        estimatedValue: params.estimatedValue,
        confidence: params.confidence,
        timestamp: new Date()
      }
    });
    opportunityId = created.id;
  }

  // Upsert corresponding Recommendation
  const existingRecommendation = await db.recommendation.findFirst({
    where: { opportunityId }
  });

  if (existingRecommendation) {
    await db.recommendation.update({
      where: { id: existingRecommendation.id },
      data: {
        finding: params.finding,
        evidence: params.evidenceText,
        likelyCause: params.likelyCause,
        recommendedAction: params.recommendedAction,
        estimatedOpportunity: params.estimatedValue,
        confidence: params.confidence,
        timestamp: new Date()
      }
    });
  } else {
    await db.recommendation.create({
      data: {
        opportunityId,
        finding: params.finding,
        evidence: params.evidenceText,
        likelyCause: params.likelyCause,
        recommendedAction: params.recommendedAction,
        estimatedOpportunity: params.estimatedValue,
        confidence: params.confidence,
        status: 'GENERATED'
      }
    });
  }
}
