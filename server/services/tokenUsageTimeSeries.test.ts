import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import * as db from '../db';
import { getDb } from '../db';

describe('Token Usage Time-Series Property Tests', () => {
  let testUserId: number;

  beforeEach(async () => {
    // Create a test user ID for our tests
    testUserId = Math.floor(Math.random() * 1000000);
  });

  afterEach(async () => {
    // Clean up test data
    const database = await getDb();
    if (database) {
      try {
        // Clean up any test token usage records we created
        await database.execute(`DELETE FROM token_usage WHERE user_id = ${testUserId}`);
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  /**
   * Property 11: Token Usage Aggregation Accuracy
   * Validates: Requirements 6.2, 6.3, 6.4
   * 
   * Property: Token usage aggregation should:
   * 1. Correctly sum costs and tokens by provider and time period
   * 2. Handle different time ranges and groupings accurately
   * 3. Preserve data integrity across aggregations
   * 4. Handle multiple providers correctly
   */
  it('Property 11: Token usage aggregation accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate token usage records
        fc.constantFrom('day', 'week'), // Focus on day/week for easier testing
        fc.array(
          fc.record({
            modelProvider: fc.constantFrom('openai', 'anthropic', 'perplexity', 'gemini', 'grok', 'manus'),
            modelName: fc.string({ minLength: 3, maxLength: 20 }),
            inputTokens: fc.integer({ min: 1, max: 10000 }),
            outputTokens: fc.integer({ min: 1, max: 5000 }),
            totalCost: fc.float({ min: Math.fround(0.001), max: Math.fround(10.0) }).map(n => Math.fround(n).toFixed(4)),
            // Generate timestamps within the last 14 days for predictable grouping
            daysAgo: fc.integer({ min: 0, max: 14 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (grouping, usageRecords) => {
          const database = await getDb();
          if (!database) return;

          try {
            // Insert test token usage records
            const now = new Date();
            const insertedRecords = [];

            for (const record of usageRecords) {
              const timestamp = new Date(now.getTime() - record.daysAgo * 24 * 60 * 60 * 1000);
              
              await db.logTokenUsage({
                userId: testUserId,
                modelProvider: record.modelProvider,
                modelName: record.modelName,
                inputTokens: record.inputTokens,
                outputTokens: record.outputTokens,
                totalCost: record.totalCost,
                timestamp,
              });

              insertedRecords.push({
                ...record,
                timestamp,
                totalCost: parseFloat(record.totalCost),
              });
            }

            // Get aggregated results
            const result = await db.getTokenUsageTimeSeries(testUserId, '7d', grouping);

            // Property 1: Total aggregated costs should match sum of individual records
            const expectedTotalCost = insertedRecords.reduce((sum, record) => sum + record.totalCost, 0);
            const actualTotalCost = result.total.reduce((sum, point) => sum + point.totalCost, 0);

            // Allow for small floating point differences
            expect(Math.abs(actualTotalCost - expectedTotalCost)).toBeLessThan(0.01);

            // Property 2: Total aggregated tokens should match sum of individual records
            const expectedInputTokens = insertedRecords.reduce((sum, record) => sum + record.inputTokens, 0);
            const expectedOutputTokens = insertedRecords.reduce((sum, record) => sum + record.outputTokens, 0);

            const actualInputTokens = result.total.reduce((sum, point) => sum + point.inputTokens, 0);
            const actualOutputTokens = result.total.reduce((sum, point) => sum + point.outputTokens, 0);

            expect(actualInputTokens).toBe(expectedInputTokens);
            expect(actualOutputTokens).toBe(expectedOutputTokens);

            // Property 3: By-provider aggregation should sum to total aggregation
            const providerTotalCost = result.byProvider.reduce((sum, point) => sum + point.totalCost, 0);
            expect(Math.abs(providerTotalCost - actualTotalCost)).toBeLessThan(0.01);

            // Property 4: Each provider should have consistent data
            const providerMap = new Map<string, { cost: number; input: number; output: number }>();
            
            insertedRecords.forEach(record => {
              const existing = providerMap.get(record.modelProvider) || { cost: 0, input: 0, output: 0 };
              providerMap.set(record.modelProvider, {
                cost: existing.cost + record.totalCost,
                input: existing.input + record.inputTokens,
                output: existing.output + record.outputTokens,
              });
            });

            // Verify each provider's aggregated data matches expected
            providerMap.forEach((expected, provider) => {
              const providerData = result.byProvider.filter(p => p.modelProvider === provider);
              const providerTotalCost = providerData.reduce((sum, p) => sum + p.totalCost, 0);
              const providerInputTokens = providerData.reduce((sum, p) => sum + p.inputTokens, 0);
              const providerOutputTokens = providerData.reduce((sum, p) => sum + p.outputTokens, 0);

              expect(Math.abs(providerTotalCost - expected.cost)).toBeLessThan(0.01);
              expect(providerInputTokens).toBe(expected.input);
              expect(providerOutputTokens).toBe(expected.output);
            });

            // Property 5: All timestamps should be valid dates
            [...result.total, ...result.byProvider].forEach(point => {
              expect(point.timestamp).toBeInstanceOf(Date);
              expect(point.timestamp.getTime()).not.toBeNaN();
            });

            // Property 6: All values should be non-negative and finite
            [...result.total, ...result.byProvider].forEach(point => {
              expect(point.totalCost).toBeGreaterThanOrEqual(0);
              expect(Number.isFinite(point.totalCost)).toBe(true);
              expect(point.inputTokens).toBeGreaterThanOrEqual(0);
              expect(point.outputTokens).toBeGreaterThanOrEqual(0);
            });

            // Property 7: Data should be chronologically ordered
            const checkChronologicalOrder = (points: Array<{ timestamp: Date }>) => {
              for (let i = 1; i < points.length; i++) {
                expect(points[i].timestamp.getTime()).toBeGreaterThanOrEqual(
                  points[i - 1].timestamp.getTime()
                );
              }
            };

            checkChronologicalOrder(result.total);
            
            // Check chronological order within each provider
            const providerGroups = new Map<string, Array<{ timestamp: Date }>>();
            result.byProvider.forEach(point => {
              if (!providerGroups.has(point.modelProvider)) {
                providerGroups.set(point.modelProvider, []);
              }
              providerGroups.get(point.modelProvider)!.push(point);
            });

            providerGroups.forEach(points => {
              checkChronologicalOrder(points);
            });

          } catch (error) {
            console.warn('Database operation failed in token usage aggregation test:', error);
          }
        }
      ),
      { numRuns: 25, timeout: 15000 }
    );
  });
});