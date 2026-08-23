import { test } from 'node:test';
import assert from 'node:assert';
import db from '../lib/db';
import { detectOpportunities } from '../lib/detector';

test('Opportunity Detection Engine', async (t) => {
  await t.test('detects and writes opportunities to DB', async () => {
    // Run detection
    await detectOpportunities();

    // Query database to ensure opportunities were logged
    const opps = await db.opportunity.findMany({
      include: {
        recommendations: true
      }
    });

    assert.ok(opps.length > 0, 'Should detect at least one opportunity in synthetic dataset');

    // Verify UPI Peak hour failure detection (which is present in synthetic seeding)
    const upiPeak = opps.find(o => o.type === 'PEAK_HOUR_FAILURE');
    assert.ok(upiPeak, 'Seeded data should trigger a UPI Peak Hour Failure opportunity');
    assert.strictEqual(upiPeak.severity, 'HIGH', 'UPI Peak failure should be HIGH severity');
    assert.strictEqual(upiPeak.priority, 'HIGH', 'UPI Peak failure should be HIGH priority');
    assert.ok(upiPeak.recommendations.length > 0, 'Opportunity should have a linked recommendation');
    
    const rec = upiPeak.recommendations[0];
    assert.ok(rec.finding.includes('UPI'), 'Recommendation should describe UPI success rates');
    assert.ok(rec.estimatedOpportunity > 0, 'Should estimate lost payment volume impact');
    assert.strictEqual(rec.status, 'GENERATED', 'Recommendation should start with status GENERATED');

    // Verify Netbanking underperformance detection
    const netbankingUnderperform = opps.find(o => o.type === 'METHOD_UNDERPERFORMANCE');
    assert.ok(netbankingUnderperform, 'Seeded data should trigger Netbanking Method Underperformance');
    assert.strictEqual(netbankingUnderperform.severity, 'MEDIUM', 'Netbanking failure should be MEDIUM severity');
  });
});
