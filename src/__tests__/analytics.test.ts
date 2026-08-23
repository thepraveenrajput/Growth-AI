import { test } from 'node:test';
import assert from 'node:assert';
import { getAnalyticsSummary, getPaymentMethodMetrics } from '../lib/analytics';

test('Analytics Summary Calculation', async (t) => {
  await t.test('calculates correct success and failure rates', async () => {
    const summary = await getAnalyticsSummary({});
    
    assert.ok(summary.transactionCount > 0, 'Transaction count should be greater than zero');
    assert.strictEqual(
      Math.round(summary.successRate + summary.failureRate), 
      100, 
      'Success rate + failure rate should equal 100%'
    );
    assert.ok(summary.averageTransactionValue >= 0, 'ATV should be non-negative');
    assert.ok(summary.medianTransactionValue >= 0, 'Median ATV should be non-negative');
    assert.ok(summary.uniqueCustomers > 0, 'Unique customers should be greater than zero');
  });

  await t.test('groups performance by payment method correctly', async () => {
    const methodMetrics = await getPaymentMethodMetrics({});
    
    assert.ok(Array.isArray(methodMetrics), 'Payment method metrics should be an array');
    const methods = methodMetrics.map(m => m.method);
    
    assert.ok(methods.includes('UPI'), 'Should include UPI method metrics');
    assert.ok(methods.includes('CARD'), 'Should include CARD method metrics');
    assert.ok(methods.includes('NETBANKING'), 'Should include NETBANKING method metrics');
    
    const upi = methodMetrics.find(m => m.method === 'UPI');
    if (upi) {
      assert.strictEqual(upi.totalCount, upi.successfulCount + upi.failedCount, 'UPI counts should balance');
    }
  });
});
