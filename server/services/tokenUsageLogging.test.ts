import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { ModelRouterService, ModelProvider } from './modelRouter';
import * as db from '../db';

// Test configuration
const PBT_CONFIG = { numRuns: 100 };

// Mock the database module
vi.mock('../db', () => ({
  logTokenUsage: vi.fn(),
}));

describe('AI Interaction Logging', () => {
  const modelRouter = new ModelRouterService();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 6: AI Interaction Logging Completeness
   * Feature: go-getter-enhancements, Property 6: All AI interactions are logged with complete information
   * Validates: Requirements 3.7
   */
  it('should log all AI interactions with complete information', () => {
    fc.assert(
      fc.property(
        // Generate user ID
        fc.integer({ min: 1, max: 1000 }),
        // Generate optional user business ID
        fc.option(fc.integer({ min: 1, max: 1000 })),
        // Generate model provider
        fc.constantFrom<ModelProvider>('perplexity', 'openai', 'anthropic', 'gemini', 'grok', 'manus'),
        // Generate model name
        fc.string({ minLength: 5, maxLength: 50 }),
        // Generate token usage data
        fc.record({
          prompt_tokens: fc.integer({ min: 1, max: 10000 }),
          completion_tokens: fc.integer({ min: 1, max: 10000 }),
          total_tokens: fc.integer({ min: 2, max: 20000 }),
        }),
        // Generate cost per 1k tokens
        fc.float({ min: 0.00001, max: 0.01 }),
        (userId, userBusinessId, provider, modelName, usage, costPer1kTokens) => {
          // Mock logTokenUsage to track calls
          const mockLogTokenUsage = vi.mocked(db.logTokenUsage);
          mockLogTokenUsage.mockResolvedValue();

          // Create model config
          const modelConfig = {
            provider,
            model: modelName,
            costPer1kTokens,
            capabilities: ['generation' as const]
          };

          // Create mock API response
          const mockResponse = {
            choices: [{
              message: {
                content: 'Mock AI response'
              }
            }],
            usage
          };

          // Test the private logTokenUsage method by calling it directly
          // This focuses on the core property without complex integration
          const logTokenUsageMethod = (modelRouter as any).logTokenUsage.bind(modelRouter);
          
          // Execute the logging
          logTokenUsageMethod(modelConfig, mockResponse, userId, userBusinessId);

          // Verify that logTokenUsage was called exactly once
          expect(mockLogTokenUsage).toHaveBeenCalledTimes(1);

          // Get the logged data
          const loggedData = mockLogTokenUsage.mock.calls[0][0];

          // Verify all required fields are present and correct
          expect(loggedData.userId).toBe(userId);
          expect(loggedData.userBusinessId).toBe(userBusinessId); // Can be null
          expect(loggedData.modelProvider).toBe(provider);
          expect(loggedData.modelName).toBe(modelName);
          expect(loggedData.inputTokens).toBe(usage.prompt_tokens);
          expect(loggedData.outputTokens).toBe(usage.completion_tokens);
          expect(loggedData.totalCost).toBeDefined();
          expect(typeof loggedData.totalCost).toBe('string');
          
          // Verify cost calculation is correct
          const expectedCost = (usage.total_tokens / 1000) * costPer1kTokens;
          const actualCost = parseFloat(loggedData.totalCost);
          expect(Math.abs(actualCost - expectedCost)).toBeLessThan(0.000001); // Allow for floating point precision
          
          return true;
        }
      ),
      PBT_CONFIG
    );
  });

  it('should calculate costs correctly based on token usage', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // userId
        fc.constantFrom<ModelProvider>('perplexity', 'openai', 'anthropic', 'gemini', 'grok', 'manus'),
        fc.string({ minLength: 5, maxLength: 50 }), // modelName
        fc.record({
          prompt_tokens: fc.integer({ min: 1, max: 5000 }),
          completion_tokens: fc.integer({ min: 1, max: 5000 }),
          total_tokens: fc.integer({ min: 2, max: 10000 }),
        }),
        fc.float({ min: 0.00001, max: 0.01 }), // costPer1kTokens
        (userId, provider, modelName, usage, costPer1kTokens) => {
          const mockLogTokenUsage = vi.mocked(db.logTokenUsage);
          mockLogTokenUsage.mockResolvedValue();

          const modelConfig = {
            provider,
            model: modelName,
            costPer1kTokens,
            capabilities: ['generation' as const]
          };

          const mockResponse = {
            choices: [{
              message: {
                content: 'Mock response'
              }
            }],
            usage
          };

          // Test the logging method directly
          const logTokenUsageMethod = (modelRouter as any).logTokenUsage.bind(modelRouter);
          logTokenUsageMethod(modelConfig, mockResponse, userId);

          // Verify cost calculation
          const loggedData = mockLogTokenUsage.mock.calls[0][0];
          const expectedCost = (usage.total_tokens / 1000) * costPer1kTokens;
          const actualCost = parseFloat(loggedData.totalCost);

          // Cost should be calculated correctly
          expect(Math.abs(actualCost - expectedCost)).toBeLessThan(0.000001);
          
          // Cost should be reasonable (positive and proportional)
          expect(actualCost).toBeGreaterThan(0);
          expect(actualCost).toBeLessThan(usage.total_tokens); // Cost per token should be less than $1

          return true;
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle missing usage data gracefully', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // userId
        fc.constantFrom<ModelProvider>('perplexity', 'openai', 'anthropic', 'gemini', 'grok', 'manus'),
        fc.string({ minLength: 5, maxLength: 50 }), // modelName
        fc.float({ min: 0.00001, max: 0.01 }), // costPer1kTokens
        (userId, provider, modelName, costPer1kTokens) => {
          const mockLogTokenUsage = vi.mocked(db.logTokenUsage);
          mockLogTokenUsage.mockResolvedValue();

          const modelConfig = {
            provider,
            model: modelName,
            costPer1kTokens,
            capabilities: ['generation' as const]
          };

          // Mock response without usage data
          const mockResponse = {
            choices: [{
              message: {
                content: 'Mock response'
              }
            }]
            // No usage field
          };

          // Test the logging method directly - should handle missing usage gracefully
          const logTokenUsageMethod = (modelRouter as any).logTokenUsage.bind(modelRouter);
          
          // Should not throw an error
          expect(() => {
            logTokenUsageMethod(modelConfig, mockResponse, userId);
          }).not.toThrow();

          // Should not call logTokenUsage when usage data is missing
          expect(mockLogTokenUsage).not.toHaveBeenCalled();

          return true;
        }
      ),
      PBT_CONFIG
    );
  });

  it('should not fail when logging fails', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // userId
        fc.constantFrom<ModelProvider>('perplexity', 'openai', 'anthropic', 'gemini', 'grok', 'manus'),
        fc.string({ minLength: 5, maxLength: 50 }), // modelName
        fc.record({
          prompt_tokens: fc.integer({ min: 1, max: 1000 }),
          completion_tokens: fc.integer({ min: 1, max: 1000 }),
          total_tokens: fc.integer({ min: 2, max: 2000 }),
        }),
        fc.float({ min: 0.00001, max: 0.01 }), // costPer1kTokens
        (userId, provider, modelName, usage, costPer1kTokens) => {
          // Mock logTokenUsage to fail
          const mockLogTokenUsage = vi.mocked(db.logTokenUsage);
          mockLogTokenUsage.mockRejectedValue(new Error('Database error'));

          const modelConfig = {
            provider,
            model: modelName,
            costPer1kTokens,
            capabilities: ['generation' as const]
          };

          const mockResponse = {
            choices: [{
              message: {
                content: 'Mock response'
              }
            }],
            usage
          };

          // Test the logging method directly - should not throw even if DB fails
          const logTokenUsageMethod = (modelRouter as any).logTokenUsage.bind(modelRouter);
          
          expect(() => {
            logTokenUsageMethod(modelConfig, mockResponse, userId);
          }).not.toThrow();

          return true;
        }
      ),
      PBT_CONFIG
    );
  });
});