import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GoGetterAgentService, CompositeScores, BusinessOpportunity } from './goGetterAgent';

// Test configuration
const PBT_CONFIG = { numRuns: 100 };

describe('Go-Getter Agent Service', () => {
  const goGetterAgent = new GoGetterAgentService();

  /**
   * Property 4: Composite Score Calculation Consistency
   * Feature: go-getter-enhancements, Property 4: Composite score calculation produces consistent results
   * Validates: Requirements 3.4
   */
  it('should produce consistent composite scores for the same inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          guaranteedDemand: fc.integer({ min: 0, max: 100 }),
          automationLevel: fc.integer({ min: 0, max: 100 }),
          tokenEfficiency: fc.integer({ min: 0, max: 100 }),
          profitMargin: fc.integer({ min: 0, max: 100 }),
          maintenanceCost: fc.integer({ min: 0, max: 100 }),
          legalRisk: fc.integer({ min: 0, max: 100 }),
          competitionSaturation: fc.integer({ min: 0, max: 100 }),
        }),
        (scores) => {
          // Create a partial business opportunity with the scores
          const opportunity: Partial<BusinessOpportunity> = {
            scores: {
              ...scores,
              compositeScore: 0 // Will be calculated
            }
          };

          // Calculate the composite score multiple times
          const result1 = goGetterAgent.scoreOpportunity(opportunity);
          const result2 = goGetterAgent.scoreOpportunity(opportunity);
          const result3 = goGetterAgent.scoreOpportunity(opportunity);

          // All calculations should produce the same result
          expect(result1.compositeScore).toBe(result2.compositeScore);
          expect(result2.compositeScore).toBe(result3.compositeScore);

          // Score should be between 0 and 100
          expect(result1.compositeScore).toBeGreaterThanOrEqual(0);
          expect(result1.compositeScore).toBeLessThanOrEqual(100);

          // Score should be an integer (rounded)
          expect(Number.isInteger(result1.compositeScore)).toBe(true);

          return true;
        }
      ),
      PBT_CONFIG
    );
  });

  it('should produce scores within valid range for any input', () => {
    fc.assert(
      fc.property(
        fc.record({
          guaranteedDemand: fc.integer({ min: 0, max: 100 }),
          automationLevel: fc.integer({ min: 0, max: 100 }),
          tokenEfficiency: fc.integer({ min: 0, max: 100 }),
          profitMargin: fc.integer({ min: 0, max: 100 }),
          maintenanceCost: fc.integer({ min: 0, max: 100 }),
          legalRisk: fc.integer({ min: 0, max: 100 }),
          competitionSaturation: fc.integer({ min: 0, max: 100 }),
        }),
        (scores) => {
          const opportunity: Partial<BusinessOpportunity> = {
            scores: {
              ...scores,
              compositeScore: 0
            }
          };

          const result = goGetterAgent.scoreOpportunity(opportunity);

          // All individual scores should remain unchanged
          expect(result.guaranteedDemand).toBe(scores.guaranteedDemand);
          expect(result.automationLevel).toBe(scores.automationLevel);
          expect(result.tokenEfficiency).toBe(scores.tokenEfficiency);
          expect(result.profitMargin).toBe(scores.profitMargin);
          expect(result.maintenanceCost).toBe(scores.maintenanceCost);
          expect(result.legalRisk).toBe(scores.legalRisk);
          expect(result.competitionSaturation).toBe(scores.competitionSaturation);

          // Composite score should be calculated and within range
          expect(result.compositeScore).toBeGreaterThanOrEqual(0);
          expect(result.compositeScore).toBeLessThanOrEqual(100);

          return true;
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle missing scores by using defaults', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Randomly include or exclude each score field
          guaranteedDemand: fc.option(fc.integer({ min: 0, max: 100 })),
          automationLevel: fc.option(fc.integer({ min: 0, max: 100 })),
          tokenEfficiency: fc.option(fc.integer({ min: 0, max: 100 })),
          profitMargin: fc.option(fc.integer({ min: 0, max: 100 })),
          maintenanceCost: fc.option(fc.integer({ min: 0, max: 100 })),
          legalRisk: fc.option(fc.integer({ min: 0, max: 100 })),
          competitionSaturation: fc.option(fc.integer({ min: 0, max: 100 })),
        }),
        (partialScores) => {
          // Create opportunity with potentially missing scores
          const opportunity: Partial<BusinessOpportunity> = {
            scores: partialScores as any
          };

          const result = goGetterAgent.scoreOpportunity(opportunity);

          // Should use default value of 50 for any missing scores
          expect(result.guaranteedDemand).toBe(partialScores.guaranteedDemand ?? 50);
          expect(result.automationLevel).toBe(partialScores.automationLevel ?? 50);
          expect(result.tokenEfficiency).toBe(partialScores.tokenEfficiency ?? 50);
          expect(result.profitMargin).toBe(partialScores.profitMargin ?? 50);
          expect(result.maintenanceCost).toBe(partialScores.maintenanceCost ?? 50);
          expect(result.legalRisk).toBe(partialScores.legalRisk ?? 50);
          expect(result.competitionSaturation).toBe(partialScores.competitionSaturation ?? 50);

          // Composite score should still be valid
          expect(result.compositeScore).toBeGreaterThanOrEqual(0);
          expect(result.compositeScore).toBeLessThanOrEqual(100);

          return true;
        }
      ),
      PBT_CONFIG
    );
  });

  it('should produce higher scores for better opportunities', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (baseScore, improvement) => {
          // Create two opportunities: one baseline, one improved
          const baseOpportunity: Partial<BusinessOpportunity> = {
            scores: {
              guaranteedDemand: baseScore,
              automationLevel: baseScore,
              tokenEfficiency: baseScore,
              profitMargin: baseScore,
              maintenanceCost: baseScore,
              legalRisk: baseScore,
              competitionSaturation: baseScore,
              compositeScore: 0
            }
          };

          const improvedOpportunity: Partial<BusinessOpportunity> = {
            scores: {
              guaranteedDemand: Math.min(100, baseScore + improvement),
              automationLevel: Math.min(100, baseScore + improvement),
              tokenEfficiency: Math.min(100, baseScore + improvement),
              profitMargin: Math.min(100, baseScore + improvement),
              // For these, lower is better, so we subtract improvement
              maintenanceCost: Math.max(0, baseScore - improvement),
              legalRisk: Math.max(0, baseScore - improvement),
              competitionSaturation: Math.max(0, baseScore - improvement),
              compositeScore: 0
            }
          };

          const baseResult = goGetterAgent.scoreOpportunity(baseOpportunity);
          const improvedResult = goGetterAgent.scoreOpportunity(improvedOpportunity);

          // If there's actual improvement, the improved opportunity should score higher
          if (improvement > 0) {
            expect(improvedResult.compositeScore).toBeGreaterThanOrEqual(baseResult.compositeScore);
          }

          return true;
        }
      ),
      PBT_CONFIG
    );
  });
});