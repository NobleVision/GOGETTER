import { ApiConfig, UserPreferences } from "@shared/types";
import { modelRouter, TaskType } from "./modelRouter";

export interface BusinessOpportunity {
  name: string;
  description: string;
  vertical: 'content_media' | 'digital_services' | 'ecommerce' | 'data_insights';
  scores: CompositeScores;
  estimatedRevenue: number;
  estimatedCosts: number;
  implementationGuide: string;
  requiredApis?: string[];
  infraRequirements?: string[];
  setupTimeHours?: number;
  minAgentsRequired?: number;
  recommendedModels?: string[];
}

export interface CompositeScores {
  guaranteedDemand: number;
  automationLevel: number;
  tokenEfficiency: number;
  profitMargin: number;
  maintenanceCost: number;
  legalRisk: number;
  competitionSaturation: number;
  compositeScore: number;
}

export interface GoGetterAgent {
  discoverOpportunities(preferences: UserPreferences, userConfigs: ApiConfig[], userId: number): Promise<BusinessOpportunity[]>;
  scoreOpportunity(opportunity: Partial<BusinessOpportunity>): CompositeScores;
}

export class GoGetterAgentService implements GoGetterAgent {
  /**
   * Discover business opportunities using AI
   * Requirements 3.1, 3.2: Use AI to research opportunities based on user preferences
   * Requirements 3.7: Log all AI interactions for token usage tracking
   */
  async discoverOpportunities(preferences: UserPreferences, userConfigs: ApiConfig[], userId: number): Promise<BusinessOpportunity[]> {
    try {
      // Generate research prompt based on user preferences
      const researchPrompt = this.buildResearchPrompt(preferences);
      
      // Use model router to get research results
      const researchResults = await modelRouter.executeWithFallback<string>(
        'research',
        researchPrompt,
        userConfigs,
        userId
      );

      // Generate analysis prompt to structure the research
      const analysisPrompt = this.buildAnalysisPrompt(researchResults, preferences);
      
      // Get structured analysis
      const analysisResults = await modelRouter.executeWithFallback<BusinessOpportunity[]>(
        'analysis',
        analysisPrompt,
        userConfigs,
        userId
      );

      // Score each opportunity and ensure proper structure
      const scoredOpportunities = analysisResults.map(opportunity => {
        const scores = this.scoreOpportunity(opportunity);
        return {
          ...opportunity,
          scores,
          estimatedRevenue: opportunity.estimatedRevenue || 0,
          estimatedCosts: opportunity.estimatedCosts || 0,
          implementationGuide: opportunity.implementationGuide || 'Implementation guide to be developed.',
        };
      });

      // Sort by composite score (highest first)
      return scoredOpportunities.sort((a, b) => b.scores.compositeScore - a.scores.compositeScore);

    } catch (error) {
      console.error('Go-Getter Agent discovery failed:', error);
      throw new Error(`Failed to discover opportunities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Score a business opportunity using composite scoring algorithm
   * Requirements 3.4: Implement composite scoring for discovered opportunities
   */
  scoreOpportunity(opportunity: Partial<BusinessOpportunity>): CompositeScores {
    // Default scores if not provided
    const scores = {
      guaranteedDemand: opportunity.scores?.guaranteedDemand || 50,
      automationLevel: opportunity.scores?.automationLevel || 50,
      tokenEfficiency: opportunity.scores?.tokenEfficiency || 50,
      profitMargin: opportunity.scores?.profitMargin || 50,
      maintenanceCost: opportunity.scores?.maintenanceCost || 50,
      legalRisk: opportunity.scores?.legalRisk || 50,
      competitionSaturation: opportunity.scores?.competitionSaturation || 50,
      compositeScore: 0
    };

    // Calculate composite score using weighted algorithm
    scores.compositeScore = this.calculateCompositeScore(scores);
    
    return scores;
  }

  /**
   * Build research prompt based on user preferences
   * Requirements 3.2: Include user preferences in prompts
   */
  private buildResearchPrompt(preferences: UserPreferences): string {
    const riskLevel = preferences.riskTolerance;
    const interests = preferences.interests.join(', ');
    const capital = preferences.capitalAvailable;
    const skills = preferences.technicalSkills;
    const goals = preferences.businessGoals.join(', ');

    return `
You are a business opportunity researcher. Research and identify 3-5 autonomous micro-business opportunities based on these user preferences:

Risk Tolerance: ${riskLevel}
Interests: ${interests}
Available Capital: $${capital}
Technical Skills: ${skills}
Business Goals: ${goals}

Focus on businesses that can be automated using AI agents and require minimal human intervention. Consider current market trends, emerging technologies, and opportunities in these verticals:
- Content & Media (content creation, social media management, newsletter automation)
- Digital Services (data processing, API services, automation tools)
- E-commerce (dropshipping, digital products, marketplace tools)
- Data & Insights (market research, data analysis, reporting services)

For each opportunity, research:
1. Market demand and competition
2. Automation potential using AI/LLMs
3. Revenue potential and cost structure
4. Required technical setup and APIs
5. Legal and regulatory considerations
6. Time to market and setup complexity

Provide detailed research findings for each opportunity.`;
  }

  /**
   * Build analysis prompt to structure research results
   */
  private buildAnalysisPrompt(researchResults: string, preferences: UserPreferences): string {
    return `
Based on the following research results, structure the findings into a JSON array of business opportunities.

Research Results:
${researchResults}

User Preferences:
- Risk Tolerance: ${preferences.riskTolerance}
- Available Capital: $${preferences.capitalAvailable}
- Technical Skills: ${preferences.technicalSkills}

Return a JSON array with 3-5 business opportunities. Each opportunity should have this exact structure:

{
  "name": "Business Name",
  "description": "Detailed description of the business opportunity",
  "vertical": "content_media" | "digital_services" | "ecommerce" | "data_insights",
  "scores": {
    "guaranteedDemand": 0-100,
    "automationLevel": 0-100,
    "tokenEfficiency": 0-100,
    "profitMargin": 0-100,
    "maintenanceCost": 0-100,
    "legalRisk": 0-100,
    "competitionSaturation": 0-100
  },
  "estimatedRevenue": monthly_revenue_estimate_in_dollars,
  "estimatedCosts": monthly_cost_estimate_in_dollars,
  "implementationGuide": "Step-by-step implementation guide",
  "requiredApis": ["list", "of", "required", "apis"],
  "infraRequirements": ["list", "of", "infrastructure", "requirements"],
  "setupTimeHours": estimated_hours_to_setup,
  "minAgentsRequired": minimum_number_of_ai_agents,
  "recommendedModels": ["recommended", "ai", "models"]
}

Score each factor from 0-100 where:
- guaranteedDemand: How certain is the market demand (higher = more certain)
- automationLevel: How much can be automated (higher = more automated)
- tokenEfficiency: How cost-effective for AI tokens (higher = more efficient)
- profitMargin: Expected profit margins (higher = better margins)
- maintenanceCost: Ongoing maintenance needs (lower = less maintenance)
- legalRisk: Legal/regulatory risks (lower = less risky)
- competitionSaturation: Market competition level (lower = less competition)

Return only the JSON array, no additional text.`;
  }

  /**
   * Calculate composite score using weighted algorithm
   * Same algorithm as used in server/db.ts
   */
  private calculateCompositeScore(scores: Omit<CompositeScores, 'compositeScore'>): number {
    const weights = {
      guaranteedDemand: 0.20,
      automationLevel: 0.15,
      tokenEfficiency: 0.15,
      profitMargin: 0.15,
      maintenanceCost: 0.10,
      legalRisk: 0.10,
      competitionSaturation: 0.10,
    };
    
    // For maintenance cost, legal risk, and competition - lower is better, so we invert
    const score = 
      scores.guaranteedDemand * weights.guaranteedDemand +
      scores.automationLevel * weights.automationLevel +
      scores.tokenEfficiency * weights.tokenEfficiency +
      scores.profitMargin * weights.profitMargin +
      (100 - scores.maintenanceCost) * weights.maintenanceCost +
      (100 - scores.legalRisk) * weights.legalRisk +
      (100 - scores.competitionSaturation) * weights.competitionSaturation;
    
    return Math.round(score);
  }
}

// Export singleton instance
export const goGetterAgent = new GoGetterAgentService();