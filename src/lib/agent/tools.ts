import db from '../db';
import { 
  getAnalyticsSummary, 
  getPaymentMethodMetrics, 
  getFailureReasons, 
  getHourlyPerformance, 
  getSegmentPerformance 
} from '../analytics';
import { detectOpportunities } from '../detector';
import { searchKnowledgeBase } from '../rag'; // RAG search implemented in lib/rag

export const tools = {
  get_merchant_summary: async (args: { startDate?: string; endDate?: string }) => {
    const filters = {
      startDate: args.startDate ? new Date(args.startDate) : undefined,
      endDate: args.endDate ? new Date(args.endDate) : undefined,
    };
    return await getAnalyticsSummary(filters);
  },

  get_transaction_metrics: async (args: { 
    startDate?: string; 
    endDate?: string; 
    paymentMethod?: string; 
    customerSegment?: string; 
  }) => {
    const filters = {
      startDate: args.startDate ? new Date(args.startDate) : undefined,
      endDate: args.endDate ? new Date(args.endDate) : undefined,
      paymentMethod: args.paymentMethod || undefined,
      customerSegment: args.customerSegment || undefined,
    };
    return await getAnalyticsSummary(filters);
  },

  get_payment_method_metrics: async (args: { startDate?: string; endDate?: string }) => {
    const filters = {
      startDate: args.startDate ? new Date(args.startDate) : undefined,
      endDate: args.endDate ? new Date(args.endDate) : undefined,
    };
    return await getPaymentMethodMetrics(filters);
  },

  get_failure_analysis: async (args: { startDate?: string; endDate?: string; paymentMethod?: string }) => {
    const filters = {
      startDate: args.startDate ? new Date(args.startDate) : undefined,
      endDate: args.endDate ? new Date(args.endDate) : undefined,
      paymentMethod: args.paymentMethod || undefined,
    };
    return await getFailureReasons(filters);
  },

  get_hourly_performance: async (args: { startDate?: string; endDate?: string; paymentMethod?: string }) => {
    const filters = {
      startDate: args.startDate ? new Date(args.startDate) : undefined,
      endDate: args.endDate ? new Date(args.endDate) : undefined,
      paymentMethod: args.paymentMethod || undefined,
    };
    return await getHourlyPerformance(filters);
  },

  get_customer_segment_analysis: async (args: { startDate?: string; endDate?: string }) => {
    const filters = {
      startDate: args.startDate ? new Date(args.startDate) : undefined,
      endDate: args.endDate ? new Date(args.endDate) : undefined,
    };
    return await getSegmentPerformance(filters);
  },

  get_transaction_examples: async (args: { 
    status?: string; 
    paymentMethod?: string; 
    limit?: number 
  }) => {
    const where: any = { merchantId: 'demo-merchant' };
    if (args.status) where.status = args.status;
    if (args.paymentMethod) where.paymentMethod = args.paymentMethod;

    const txs = await db.transaction.findMany({
      where,
      take: args.limit || 5,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        status: true,
        failureReason: true,
        customerSegment: true,
        timestamp: true
      }
    });

    return txs;
  },

  detect_growth_opportunities: async () => {
    // Run detection to ensure database opportunities are up-to-date
    await detectOpportunities();
    
    // Retrieve them
    const opportunities = await db.opportunity.findMany({
      orderBy: { timestamp: 'desc' },
      include: { recommendations: true }
    });

    return opportunities.map(o => ({
      id: o.id,
      title: o.title,
      type: o.type,
      status: o.status,
      severity: o.severity,
      priority: o.priority,
      affectedCount: o.affectedCount,
      estimatedValue: o.estimatedValue,
      confidence: o.confidence,
      evidence: o.evidence,
      recommendation: o.recommendations[0] || null
    }));
  },

  estimate_revenue_impact: async (args: { targetSuccessRate: number }) => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const baseline = await getAnalyticsSummary({ startDate: thirtyDaysAgo });

    const totalCount = baseline.transactionCount;
    const currentSuccessRate = baseline.successRate;
    const currentSuccessfulCount = Math.round(totalCount * (currentSuccessRate / 100));
    
    const targetSuccessfulCount = Math.round(totalCount * (args.targetSuccessRate / 100));
    const additionalSuccessfulTransactions = Math.max(0, targetSuccessfulCount - currentSuccessfulCount);
    
    const estimatedAdditionalVolume = additionalSuccessfulTransactions * baseline.averageTransactionValue;

    return {
      currentSuccessRate: baseline.successRate,
      targetSuccessRate: args.targetSuccessRate,
      additionalSuccessfulTransactions,
      estimatedAdditionalVolume: Math.round(estimatedAdditionalVolume * 100) / 100
    };
  },

  search_merchant_knowledge: async (args: { query: string }) => {
    return await searchKnowledgeBase(args.query);
  }
};

export type ToolName = keyof typeof tools;

// Metadata for tool definitions to pass to Gemini API
export const toolDeclarations = [
  {
    name: 'get_merchant_summary',
    description: 'Get high-level summary metrics (GMV, Success rate, Transaction counts, Repeat customer rate, unique customers) for a date range.',
    parameters: {
      type: 'OBJECT',
      properties: {
        startDate: { type: 'STRING', description: 'ISO date string (e.g. "2026-08-01")' },
        endDate: { type: 'STRING', description: 'ISO date string (e.g. "2026-08-15")' }
      }
    }
  },
  {
    name: 'get_transaction_metrics',
    description: 'Get key metrics (GMV, success rates) filtered by date, payment method, or customer segment.',
    parameters: {
      type: 'OBJECT',
      properties: {
        startDate: { type: 'STRING', description: 'ISO date string' },
        endDate: { type: 'STRING', description: 'ISO date string' },
        paymentMethod: { type: 'STRING', description: 'Payment method: UPI, CARD, NETBANKING, WALLET' },
        customerSegment: { type: 'STRING', description: 'Customer segment: SMB, Mid-Market, Enterprise' }
      }
    }
  },
  {
    name: 'get_payment_method_metrics',
    description: 'Get transaction counts, success rates, and volume broken down by payment methods (UPI, CARD, NETBANKING, WALLET).',
    parameters: {
      type: 'OBJECT',
      properties: {
        startDate: { type: 'STRING', description: 'ISO date string' },
        endDate: { type: 'STRING', description: 'ISO date string' }
      }
    }
  },
  {
    name: 'get_failure_analysis',
    description: 'Get distribution and counts of payment failure reasons (e.g. BANK_DEGRADED, INSUFFICIENT_FUNDS) for a date range or payment method.',
    parameters: {
      type: 'OBJECT',
      properties: {
        startDate: { type: 'STRING', description: 'ISO date string' },
        endDate: { type: 'STRING', description: 'ISO date string' },
        paymentMethod: { type: 'STRING', description: 'Payment method filter' }
      }
    }
  },
  {
    name: 'get_hourly_performance',
    description: 'Get hourly success rates (0-23 hours) for a date range or payment method to detect peak failure times.',
    parameters: {
      type: 'OBJECT',
      properties: {
        startDate: { type: 'STRING', description: 'ISO date string' },
        endDate: { type: 'STRING', description: 'ISO date string' },
        paymentMethod: { type: 'STRING', description: 'Payment method filter' }
      }
    }
  },
  {
    name: 'get_customer_segment_analysis',
    description: 'Get performance metrics, volume, and success rates grouped by customer segments (SMB, Mid-Market, Enterprise).',
    parameters: {
      type: 'OBJECT',
      properties: {
        startDate: { type: 'STRING', description: 'ISO date string' },
        endDate: { type: 'STRING', description: 'ISO date string' }
      }
    }
  },
  {
    name: 'get_transaction_examples',
    description: 'Fetch sample transaction logs including IDs, amounts, failure reasons, and timestamps to cite specific evidence.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', description: 'Transaction status: SUCCESS, FAILED' },
        paymentMethod: { type: 'STRING', description: 'Payment method filter' },
        limit: { type: 'INTEGER', description: 'Number of transactions to return (default 5)' }
      }
    }
  },
  {
    name: 'detect_growth_opportunities',
    description: 'Run the rule-based Opportunity Detection layer over the database and return currently active opportunities and recommendations.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'estimate_revenue_impact',
    description: 'Determine the estimated financial impact of increasing the overall success rate to a target success rate.',
    parameters: {
      type: 'OBJECT',
      properties: {
        targetSuccessRate: { type: 'NUMBER', description: 'Target success rate in percentage (e.g. 94.5)' }
      },
      required: ['targetSuccessRate']
    }
  },
  {
    name: 'search_merchant_knowledge',
    description: 'Search internal payment knowledge base for retry strategies, UPI fallbacks, netbanking, and card optimization guides.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Keywords to search (e.g. "UPI fallback", "card retry")' }
      },
      required: ['query']
    }
  }
];
