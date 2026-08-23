import db from './db';

export interface AnalyticsSummary {
  totalVolume: number;        // Total transaction volume attempted (GMV attempted)
  successfulVolume: number;   // Successful transaction volume (GMV realized)
  failedVolume: number;       // Failed transaction volume (Revenue leak)
  transactionCount: number;
  successfulCount: number;
  failedCount: number;
  successRate: number;
  failureRate: number;
  averageTransactionValue: number;
  medianTransactionValue: number;
  uniqueCustomers: number;
  repeatCustomerRate: number;
  potentialRevenueOpportunity: number; // Opportunity B/C/D optimization estimates
}

export interface PaymentMethodMetric {
  method: string;
  totalCount: number;
  successfulCount: number;
  failedCount: number;
  successRate: number;
  volume: number;
}

export interface HourlyMetric {
  hour: number;
  totalCount: number;
  successfulCount: number;
  successRate: number;
}

export interface DailyMetric {
  date: string;
  volume: number;
  totalCount: number;
  successfulCount: number;
  successRate: number;
}

export interface FailureReasonMetric {
  reason: string;
  count: number;
  percentage: number;
}

export interface SegmentMetric {
  segment: string;
  totalCount: number;
  successfulCount: number;
  successRate: number;
  volume: number;
}

export async function getAnalyticsSummary(filters: {
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
  customerSegment?: string;
}): Promise<AnalyticsSummary> {
  const where: any = {
    merchantId: 'demo-merchant',
  };

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }

  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }

  if (filters.customerSegment) {
    where.customerSegment = filters.customerSegment;
  }

  // 1. Transaction Counts and Volumes
  const aggregates = await db.transaction.aggregate({
    where,
    _count: {
      id: true,
    },
    _sum: {
      amount: true,
    },
  });

  const totalCount = aggregates._count.id;
  const totalVolume = aggregates._sum.amount ?? 0;

  // Successful aggregations
  const successAggregates = await db.transaction.aggregate({
    where: { ...where, status: 'SUCCESS' },
    _count: { id: true },
    _sum: { amount: true },
  });

  const successfulCount = successAggregates._count.id;
  const successfulVolume = successAggregates._sum.amount ?? 0;

  // Failed aggregations
  const failedAggregates = await db.transaction.aggregate({
    where: { ...where, status: 'FAILED' },
    _count: { id: true },
    _sum: { amount: true },
  });

  const failedCount = failedAggregates._count.id;
  const failedVolume = failedAggregates._sum.amount ?? 0;

  const successRate = totalCount > 0 ? (successfulCount / totalCount) * 100 : 0;
  const failureRate = totalCount > 0 ? (failedCount / totalCount) * 100 : 0;

  const averageTransactionValue = successfulCount > 0 ? successfulVolume / successfulCount : 0;

  // 2. Median Transaction Value
  let medianTransactionValue = 0;
  if (successfulCount > 0) {
    const halfIndex = Math.floor(successfulCount / 2);
    const medianTx = await db.transaction.findFirst({
      where: { ...where, status: 'SUCCESS' },
      orderBy: { amount: 'asc' },
      skip: halfIndex,
      select: { amount: true },
    });
    medianTransactionValue = medianTx?.amount ?? 0;
  }

  // 3. Customer metrics
  const customerGroups = await db.transaction.groupBy({
    by: ['customerId'],
    where,
    _count: {
      id: true,
    },
  });

  const uniqueCustomers = customerGroups.length;
  const repeatCustomersCount = customerGroups.filter(c => c._count.id > 1).length;
  const repeatCustomerRate = uniqueCustomers > 0 ? (repeatCustomersCount / uniqueCustomers) * 100 : 0;

  // 4. Estimate potential revenue opportunity (lost volume due to non-user failures)
  // Let's assume bank downtime (BANK_DEGRADED) and connection timeout (NETWORK_TIMEOUT) represent restorable volume
  const restorableAggregates = await db.transaction.aggregate({
    where: {
      ...where,
      status: 'FAILED',
      failureReason: { in: ['BANK_DEGRADED', 'NETWORK_TIMEOUT'] },
    },
    _sum: {
      amount: true,
    },
  });
  const potentialRevenueOpportunity = restorableAggregates._sum.amount ?? 0;

  return {
    totalVolume: Math.round(totalVolume * 100) / 100,
    successfulVolume: Math.round(successfulVolume * 100) / 100,
    failedVolume: Math.round(failedVolume * 100) / 100,
    transactionCount: totalCount,
    successfulCount: successfulCount,
    failedCount: failedCount,
    successRate: Math.round(successRate * 100) / 100,
    failureRate: Math.round(failureRate * 100) / 100,
    averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
    medianTransactionValue: Math.round(medianTransactionValue * 100) / 100,
    uniqueCustomers,
    repeatCustomerRate: Math.round(repeatCustomerRate * 100) / 100,
    potentialRevenueOpportunity: Math.round(potentialRevenueOpportunity * 100) / 100,
  };
}

export async function getPaymentMethodMetrics(filters: {
  startDate?: Date;
  endDate?: Date;
}): Promise<PaymentMethodMetric[]> {
  const where: any = { merchantId: 'demo-merchant' };
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }

  // Get total count and volume per method
  const methodGroups = await db.transaction.groupBy({
    by: ['paymentMethod'],
    where,
    _count: { id: true },
    _sum: { amount: true },
  });

  // Get successful count per method
  const successGroups = await db.transaction.groupBy({
    by: ['paymentMethod'],
    where: { ...where, status: 'SUCCESS' },
    _count: { id: true },
  });

  const successMap = new Map<string, number>();
  successGroups.forEach((g) => {
    successMap.set(g.paymentMethod, g._count.id);
  });

  return methodGroups.map((g) => {
    const totalCount = g._count.id;
    const successfulCount = successMap.get(g.paymentMethod) ?? 0;
    const failedCount = totalCount - successfulCount;
    const successRate = totalCount > 0 ? (successfulCount / totalCount) * 100 : 0;
    const volume = g._sum.amount ?? 0;

    return {
      method: g.paymentMethod,
      totalCount,
      successfulCount,
      failedCount,
      successRate: Math.round(successRate * 100) / 100,
      volume: Math.round(volume * 100) / 100,
    };
  });
}

export async function getHourlyPerformance(filters: {
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
}): Promise<HourlyMetric[]> {
  const where: any = { merchantId: 'demo-merchant' };
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }
  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }

  // To prevent high memory usage, we fetch only the necessary columns.
  const transactions = await db.transaction.findMany({
    where,
    select: {
      timestamp: true,
      status: true,
    },
  });

  // Initialize hour buckets
  const buckets: { [key: number]: { total: number; success: number } } = {};
  for (let i = 0; i < 24; i++) {
    buckets[i] = { total: 0, success: 0 };
  }

  transactions.forEach((tx) => {
    const hr = new Date(tx.timestamp).getHours();
    buckets[hr].total += 1;
    if (tx.status === 'SUCCESS') {
      buckets[hr].success += 1;
    }
  });

  return Object.keys(buckets).map((key) => {
    const hour = parseInt(key, 10);
    const totalCount = buckets[hour].total;
    const successfulCount = buckets[hour].success;
    const successRate = totalCount > 0 ? (successfulCount / totalCount) * 100 : 0;

    return {
      hour,
      totalCount,
      successfulCount,
      successRate: Math.round(successRate * 100) / 100,
    };
  });
}

export async function getDailyTrend(filters: {
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
}): Promise<DailyMetric[]> {
  const where: any = { merchantId: 'demo-merchant' };
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }
  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }

  const transactions = await db.transaction.findMany({
    where,
    select: {
      timestamp: true,
      status: true,
      amount: true,
    },
    orderBy: {
      timestamp: 'asc',
    },
  });

  const dailyMap: { [key: string]: { volume: number; total: number; success: number } } = {};

  transactions.forEach((tx) => {
    const dateStr = new Date(tx.timestamp).toISOString().split('T')[0];
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = { volume: 0, total: 0, success: 0 };
    }
    dailyMap[dateStr].total += 1;
    if (tx.status === 'SUCCESS') {
      dailyMap[dateStr].success += 1;
      dailyMap[dateStr].volume += tx.amount;
    }
  });

  return Object.keys(dailyMap).sort().map((date) => {
    const data = dailyMap[date];
    const successRate = data.total > 0 ? (data.success / data.total) * 100 : 0;

    return {
      date,
      volume: Math.round(data.volume * 100) / 100,
      totalCount: data.total,
      successfulCount: data.success,
      successRate: Math.round(successRate * 100) / 100,
    };
  });
}

export async function getFailureReasons(filters: {
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
}): Promise<FailureReasonMetric[]> {
  const where: any = {
    merchantId: 'demo-merchant',
    status: 'FAILED',
  };

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }

  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }

  const totalFailed = await db.transaction.count({ where });

  if (totalFailed === 0) {
    return [];
  }

  const groups = await db.transaction.groupBy({
    by: ['failureReason'],
    where,
    _count: {
      id: true,
    },
  });

  return groups.map((g) => {
    const reason = g.failureReason ?? 'UNKNOWN_ERROR';
    const count = g._count.id;
    const percentage = (count / totalFailed) * 100;

    return {
      reason,
      count,
      percentage: Math.round(percentage * 100) / 100,
    };
  }).sort((a, b) => b.count - a.count);
}

export async function getSegmentPerformance(filters: {
  startDate?: Date;
  endDate?: Date;
}): Promise<SegmentMetric[]> {
  const where: any = { merchantId: 'demo-merchant' };
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }

  const totalGroups = await db.transaction.groupBy({
    by: ['customerSegment'],
    where,
    _count: { id: true },
  });

  const successGroups = await db.transaction.groupBy({
    by: ['customerSegment'],
    where: { ...where, status: 'SUCCESS' },
    _count: { id: true },
    _sum: { amount: true },
  });

  const successMap = new Map<string, { count: number; volume: number }>();
  successGroups.forEach((g) => {
    successMap.set(g.customerSegment, {
      count: g._count.id,
      volume: g._sum.amount ?? 0,
    });
  });

  return totalGroups.map((g) => {
    const totalCount = g._count.id;
    const successData = successMap.get(g.customerSegment) ?? { count: 0, volume: 0 };
    const successfulCount = successData.count;
    const failedCount = totalCount - successfulCount;
    const successRate = totalCount > 0 ? (successfulCount / totalCount) * 100 : 0;
    const volume = successData.volume;

    return {
      segment: g.customerSegment,
      totalCount,
      successfulCount,
      successRate: Math.round(successRate * 100) / 100,
      volume: Math.round(volume * 100) / 100,
    };
  });
}
