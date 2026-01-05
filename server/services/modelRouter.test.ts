import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ModelRouterService, TaskType, ModelProvider } from './modelRouter';
import { ApiConfig } from '@shared/types';

// Test configuration
const PBT_CONFIG = { numRuns: 100 };

describe('Model Router Service', () => {
  const modelRouter = new ModelRouterService();

  /**
   * Property 5: Model Router Cost Optimization
   * Feature: go-getter-enhancements, Property 5: Model router selects most cost-effective model
   * Validates: Requirements 3.3
   */
  it('should select the most cost-effective model for any task type', () => {
    fc.assert(
      fc.property(
        // Generate task type
        fc.constantFrom<TaskType>('research', 'analysis', 'generation', 'scoring'),
        // Generate array of API configs with different providers
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            userId: fc.integer({ min: 1, max: 100 }),
            provider: fc.constantFrom<ModelProvider>('perplexity', 'openai', 'anthropic', 'gemini', 'grok', 'manus'),
            apiKey: fc.string({ minLength: 10, maxLength: 50 }),
            baseUrl: fc.option(fc.webUrl()),
            isActive: fc.constant(true), // Only active configs
            lastValidated: fc.option(fc.date()),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          { minLength: 1, maxLength: 6 }
        ),
        (taskType, apiConfigs) => {
          // Ensure we have at least one config for each provider to test cost optimization
          const uniqueProviders = [...new Set(apiConfigs.map(c => c.provider))];
          
          if (uniqueProviders.length < 2) {
            // Skip if we don't have multiple providers to compare costs
            return true;
          }

          const selectedModel = modelRouter.selectModel(taskType, apiConfigs as ApiConfig[]);
          
          if (!selectedModel) {
            // If no model is selected, it means no providers support this task type
            return true;
          }

          // Verify that the selected model is from an active provider
          const activeProviders = new Set(apiConfigs.map(c => c.provider));
          expect(activeProviders.has(selectedModel.provider)).toBe(true);

          // Get all models that could handle this task type from active providers
          const MODEL_CONFIGS = [
            { provider: 'perplexity' as const, model: 'llama-3.1-sonar-small-128k-online', costPer1kTokens: 0.0002, capabilities: ['research', 'analysis'] },
            { provider: 'perplexity' as const, model: 'llama-3.1-sonar-large-128k-online', costPer1kTokens: 0.001, capabilities: ['research', 'analysis', 'generation'] },
            { provider: 'openai' as const, model: 'gpt-4o-mini', costPer1kTokens: 0.00015, capabilities: ['research', 'analysis', 'generation', 'scoring'] },
            { provider: 'openai' as const, model: 'gpt-4o', costPer1kTokens: 0.0025, capabilities: ['research', 'analysis', 'generation', 'scoring'] },
            { provider: 'anthropic' as const, model: 'claude-3-haiku-20240307', costPer1kTokens: 0.00025, capabilities: ['analysis', 'generation', 'scoring'] },
            { provider: 'anthropic' as const, model: 'claude-3-5-sonnet-20241022', costPer1kTokens: 0.003, capabilities: ['research', 'analysis', 'generation', 'scoring'] },
            { provider: 'gemini' as const, model: 'gemini-1.5-flash', costPer1kTokens: 0.000075, capabilities: ['analysis', 'generation', 'scoring'] },
            { provider: 'gemini' as const, model: 'gemini-1.5-pro', costPer1kTokens: 0.00125, capabilities: ['research', 'analysis', 'generation', 'scoring'] },
            { provider: 'grok' as const, model: 'grok-beta', costPer1kTokens: 0.0005, capabilities: ['analysis', 'generation', 'scoring'] },
            { provider: 'manus' as const, model: 'gemini-2.5-flash', costPer1kTokens: 0.0001, capabilities: ['research', 'analysis', 'generation', 'scoring'] },
          ];

          const capableModels = MODEL_CONFIGS.filter(model => 
            model.capabilities.includes(taskType) && 
            activeProviders.has(model.provider)
          );

          if (capableModels.length > 1) {
            // Find the cheapest model
            const cheapestModel = capableModels.reduce((min, current) => 
              current.costPer1kTokens < min.costPer1kTokens ? current : min
            );

            // The selected model should be the cheapest one
            expect(selectedModel.costPer1kTokens).toBe(cheapestModel.costPer1kTokens);
          }

          return true;
        }
      ),
      PBT_CONFIG
    );
  });

  it('should return null when no providers support the task type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<TaskType>('research', 'analysis', 'generation', 'scoring'),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            userId: fc.integer({ min: 1, max: 100 }),
            provider: fc.constant('perplexity' as ModelProvider), // Only perplexity
            apiKey: fc.string({ minLength: 10, maxLength: 50 }),
            baseUrl: fc.option(fc.webUrl()),
            isActive: fc.constant(true),
            lastValidated: fc.option(fc.date()),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (taskType, apiConfigs) => {
          // Test with a task type that perplexity doesn't support
          if (taskType === 'scoring') {
            const selectedModel = modelRouter.selectModel(taskType, apiConfigs as ApiConfig[]);
            expect(selectedModel).toBeNull();
          }
          return true;
        }
      ),
      PBT_CONFIG
    );
  });

  it('should only select from active providers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<TaskType>('research', 'analysis', 'generation', 'scoring'),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            userId: fc.integer({ min: 1, max: 100 }),
            provider: fc.constantFrom<ModelProvider>('perplexity', 'openai', 'anthropic', 'gemini', 'grok', 'manus'),
            apiKey: fc.option(fc.string({ minLength: 10, maxLength: 50 })), // Some may not have API keys
            baseUrl: fc.option(fc.webUrl()),
            isActive: fc.boolean(), // Mix of active and inactive
            lastValidated: fc.option(fc.date()),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          { minLength: 1, maxLength: 6 }
        ),
        (taskType, apiConfigs) => {
          const selectedModel = modelRouter.selectModel(taskType, apiConfigs as ApiConfig[]);
          
          if (selectedModel) {
            // Verify the selected model is from an active provider with API key
            const activeProvidersWithKeys = new Set(
              apiConfigs
                .filter(config => config.isActive && config.apiKey)
                .map(config => config.provider)
            );
            
            expect(activeProvidersWithKeys.has(selectedModel.provider)).toBe(true);
          }

          return true;
        }
      ),
      PBT_CONFIG
    );
  });
});