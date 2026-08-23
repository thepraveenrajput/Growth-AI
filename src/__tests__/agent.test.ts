import { test } from 'node:test';
import assert from 'node:assert';
import { executeAgent } from '../lib/agent/executor';

test('AI Agent Diagnostics & Guardrails', async (t) => {
  await t.test('formats structured recommendation response', async () => {
    const prompt = 'Why did my payment success rate fall yesterday?';
    const response = await executeAgent(prompt);

    // Verify structured output contract
    assert.ok(response.finding, 'Response should contain a diagnostic finding statement');
    assert.ok(Array.isArray(response.evidence), 'Evidence should be an array of metrics');
    assert.ok(response.evidence.length > 0, 'Evidence should contain at least one metrics citation');
    assert.ok(response.likelyCause, 'Response should explain the likely technical cause');
    assert.ok(response.recommendedAction, 'Response should contain an actionable recommendation');
    assert.ok(response.estimatedOpportunity >= 0, 'Response should estimate lost volume');
    assert.ok(response.confidence > 0 && response.confidence <= 100, 'Response should contain confidence rating');
    assert.ok(response.toolCallsExecuted.length > 0, 'Response should track executed tools for observability');
  });

  await t.test('handles non-existent data queries securely with general diagnostic fallback', async () => {
    const prompt = 'Show me information about the moon cycles and payments.';
    const response = await executeAgent(prompt);

    assert.ok(response.finding, 'Should return general evaluations');
    assert.ok(response.toolCallsExecuted.some(tc => tc.toolName === 'get_merchant_summary'), 'Should check baseline merchant summary');
  });
});
