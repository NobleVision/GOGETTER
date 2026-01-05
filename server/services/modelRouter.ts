import { ApiConfig } from "@shared/types";
import * as db from "../db";

export type TaskType = 'research' | 'analysis' | 'generation' | 'scoring';
export type ModelProvider = 'perplexity' | 'openai' | 'anthropic' | 'gemini' | 'grok' | 'manus';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  costPer1kTokens: number;
  capabilities: TaskType[];
}

export interface ModelRouter {
  selectModel(taskType: TaskType, userConfigs: ApiConfig[]): ModelConfig | null;
  executeWithFallback<T>(
    taskType: TaskType,
    prompt: string,
    userConfigs: ApiConfig[],
    userId: number,
    userBusinessId?: number
  ): Promise<T>;
}

// Model configurations with cost and capabilities
const MODEL_CONFIGS: ModelConfig[] = [
  // Perplexity - Great for research
  {
    provider: 'perplexity',
    model: 'llama-3.1-sonar-small-128k-online',
    costPer1kTokens: 0.0002,
    capabilities: ['research', 'analysis']
  },
  {
    provider: 'perplexity',
    model: 'llama-3.1-sonar-large-128k-online',
    costPer1kTokens: 0.001,
    capabilities: ['research', 'analysis', 'generation']
  },
  
  // OpenAI - Versatile for all tasks
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    costPer1kTokens: 0.00015,
    capabilities: ['research', 'analysis', 'generation', 'scoring']
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    costPer1kTokens: 0.0025,
    capabilities: ['research', 'analysis', 'generation', 'scoring']
  },
  
  // Anthropic - Good for analysis and generation
  {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    costPer1kTokens: 0.00025,
    capabilities: ['analysis', 'generation', 'scoring']
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    costPer1kTokens: 0.003,
    capabilities: ['research', 'analysis', 'generation', 'scoring']
  },
  
  // Gemini - Cost-effective for generation
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    costPer1kTokens: 0.000075,
    capabilities: ['analysis', 'generation', 'scoring']
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    costPer1kTokens: 0.00125,
    capabilities: ['research', 'analysis', 'generation', 'scoring']
  },
  
  // Grok - Alternative for generation
  {
    provider: 'grok',
    model: 'grok-beta',
    costPer1kTokens: 0.0005,
    capabilities: ['analysis', 'generation', 'scoring']
  },
  
  // Manus - Fallback option
  {
    provider: 'manus',
    model: 'gemini-2.5-flash',
    costPer1kTokens: 0.0001,
    capabilities: ['research', 'analysis', 'generation', 'scoring']
  }
];

export class ModelRouterService implements ModelRouter {
  /**
   * Select the most cost-effective model for a given task type
   * Requirements 3.3: Route requests to most cost-effective model
   */
  selectModel(taskType: TaskType, userConfigs: ApiConfig[]): ModelConfig | null {
    // Get active providers from user configs
    const activeProviders = new Set(
      userConfigs
        .filter(config => config.isActive && config.apiKey)
        .map(config => config.provider)
    );

    // Filter models by capability and active providers
    const capableModels = MODEL_CONFIGS.filter(model => 
      model.capabilities.includes(taskType) && 
      activeProviders.has(model.provider)
    );

    if (capableModels.length === 0) {
      return null;
    }

    // Sort by cost (ascending) and return the cheapest
    capableModels.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens);
    return capableModels[0];
  }

  /**
   * Execute a request with fallback logic
   * Requirements 3.6: Add fallback logic for failed requests
   * Requirements 3.7: Log all AI interactions for token usage tracking
   */
  async executeWithFallback<T>(
    taskType: TaskType,
    prompt: string,
    userConfigs: ApiConfig[],
    userId: number,
    userBusinessId?: number
  ): Promise<T> {
    // Get active providers from user configs
    const activeProviders = new Set(
      userConfigs
        .filter(config => config.isActive && config.apiKey)
        .map(config => config.provider)
    );

    // Get all capable models, sorted by cost
    const capableModels = MODEL_CONFIGS
      .filter(model => 
        model.capabilities.includes(taskType) && 
        activeProviders.has(model.provider)
      )
      .sort((a, b) => a.costPer1kTokens - b.costPer1kTokens);

    if (capableModels.length === 0) {
      throw new Error(`No configured models available for task type: ${taskType}`);
    }

    let lastError: Error | null = null;

    // Try each model in order of cost-effectiveness
    for (const model of capableModels) {
      try {
        const userConfig = userConfigs.find(config => config.provider === model.provider);
        if (!userConfig) continue;

        const result = await this.executeModelRequest<T>(model, prompt, userConfig, userId, userBusinessId);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Model ${model.provider}/${model.model} failed:`, error);
        continue;
      }
    }

    throw new Error(`All models failed. Last error: ${lastError?.message}`);
  }

  /**
   * Execute a request to a specific model
   * Requirements 3.7: Log all AI interactions with model, tokens, cost
   */
  private async executeModelRequest<T>(
    model: ModelConfig,
    prompt: string,
    userConfig: ApiConfig,
    userId: number,
    userBusinessId?: number
  ): Promise<T> {
    const baseUrl = userConfig.baseUrl || this.getDefaultBaseUrl(model.provider);
    const apiKey = userConfig.apiKey;

    if (!apiKey) {
      throw new Error(`No API key configured for ${model.provider}`);
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${model.provider} API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // Log token usage
    await this.logTokenUsage(model, result, userId, userBusinessId);
    
    // Extract content from different response formats
    if (result.choices && result.choices[0] && result.choices[0].message) {
      const content = result.choices[0].message.content;
      
      // Try to parse as JSON if it looks like JSON
      if (typeof content === 'string' && content.trim().startsWith('{')) {
        try {
          return JSON.parse(content) as T;
        } catch {
          // If JSON parsing fails, return as string
          return content as T;
        }
      }
      
      return content as T;
    }

    throw new Error(`Unexpected response format from ${model.provider}`);
  }

  /**
   * Log token usage to database
   * Requirements 3.7: Log all AI interactions with model, tokens, cost
   */
  private async logTokenUsage(
    model: ModelConfig,
    result: any,
    userId: number,
    userBusinessId?: number
  ): Promise<void> {
    try {
      const usage = result.usage;
      if (!usage) {
        console.warn(`No usage data returned from ${model.provider}/${model.model}`);
        return;
      }

      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
      
      // Calculate cost based on model's cost per 1k tokens
      const totalCost = (totalTokens / 1000) * model.costPer1kTokens;

      await db.logTokenUsage({
        userId,
        userBusinessId,
        modelProvider: model.provider,
        modelName: model.model,
        inputTokens,
        outputTokens,
        totalCost: totalCost.toFixed(6)
      });

      console.log(`Logged token usage: ${model.provider}/${model.model} - ${totalTokens} tokens, $${totalCost.toFixed(6)}`);
    } catch (error) {
      console.error('Failed to log token usage:', error);
      // Don't throw - token logging failure shouldn't break the main request
    }
  }

  /**
   * Get default base URL for each provider
   */
  private getDefaultBaseUrl(provider: ModelProvider): string {
    const baseUrls: Record<ModelProvider, string> = {
      perplexity: 'https://api.perplexity.ai',
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      gemini: 'https://generativelanguage.googleapis.com/v1beta',
      grok: 'https://api.x.ai/v1',
      manus: 'https://forge.manus.im/v1'
    };

    return baseUrls[provider];
  }
}

// Export singleton instance
export const modelRouter = new ModelRouterService();