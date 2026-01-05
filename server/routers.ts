import { COOKIE_NAME } from "@shared/const";
import { serialize } from "cookie";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      // Use setHeader instead of clearCookie for compatibility with Vercel serverless
      const clearCookie = serialize(COOKIE_NAME, "", {
        ...cookieOptions,
        maxAge: 0,
        expires: new Date(0),
      });
      ctx.res.setHeader("Set-Cookie", clearCookie);
      return { success: true } as const;
    }),
  }),

  // User Profile Management
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProfile(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).optional(),
        capitalAvailable: z.string().optional(),
        interests: z.array(z.string()).optional(),
        technicalSkills: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
        businessGoals: z.array(z.string()).optional(),
        aggressiveness: z.enum(["low", "medium", "high"]).optional(),
        strategyTimeframe: z.enum(["short", "medium", "long"]).optional(),
        monthlyTokenBudget: z.string().optional(),
        wizardCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertUserProfile({
          userId: ctx.user.id,
          ...input,
        });
      }),
  }),

  // Business Catalog
  businesses: router({
    list: publicProcedure
      .input(z.object({
        vertical: z.enum(["content_media", "digital_services", "ecommerce", "data_insights"]).optional(),
        activeOnly: z.boolean().optional().default(true),
      }).optional())
      .query(async ({ input }) => {
        if (input?.vertical) {
          return db.getBusinessesByVertical(input.vertical);
        }
        return db.getAllBusinesses(input?.activeOnly ?? true);
      }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getBusinessById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string(),
        vertical: z.enum(["content_media", "digital_services", "ecommerce", "data_insights"]),
        guaranteedDemand: z.number().min(0).max(100).optional(),
        automationLevel: z.number().min(0).max(100).optional(),
        tokenEfficiency: z.number().min(0).max(100).optional(),
        profitMargin: z.number().min(0).max(100).optional(),
        maintenanceCost: z.number().min(0).max(100).optional(),
        legalRisk: z.number().min(0).max(100).optional(),
        competitionSaturation: z.number().min(0).max(100).optional(),
        estimatedRevenuePerHour: z.string().optional(),
        estimatedTokenCostPerHour: z.string().optional(),
        estimatedInfraCostPerDay: z.string().optional(),
        setupCost: z.string().optional(),
        setupTimeHours: z.number().optional(),
        minAgentsRequired: z.number().optional(),
        recommendedModels: z.array(z.string()).optional(),
        implementationGuide: z.string().optional(),
        requiredApis: z.array(z.string()).optional(),
        infraRequirements: z.array(z.string()).optional(),
        codeTemplateUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createBusiness(input);
      }),
  }),

  // User's Deployed Businesses
  userBusinesses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBusinesses(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserBusinessById(input.id);
      }),
    
    deploy: protectedProcedure
      .input(z.object({ businessId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deployBusiness(ctx.user.id, input.businessId);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["setup", "running", "paused", "stopped", "failed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserBusinessStatus(input.id, input.status);
        return { success: true };
      }),
    
    updateMetrics: protectedProcedure
      .input(z.object({
        id: z.number(),
        totalRevenue: z.string().optional(),
        totalTokenCost: z.string().optional(),
        totalInfraCost: z.string().optional(),
        netProfit: z.string().optional(),
        dailyRevenue: z.string().optional(),
        dailyTokenCost: z.string().optional(),
        activeAgents: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...metrics } = input;
        await db.updateUserBusinessMetrics(id, metrics);
        return { success: true };
      }),
  }),

  // Token Usage Tracking
  tokenUsage: router({
    log: protectedProcedure
      .input(z.object({
        userBusinessId: z.number().optional(),
        modelProvider: z.string(),
        modelName: z.string(),
        inputTokens: z.number(),
        outputTokens: z.number(),
        totalCost: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.logTokenUsage({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    history: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getTokenUsageByUser(ctx.user.id, input?.limit);
      }),
    
    summary: protectedProcedure.query(async ({ ctx }) => {
      return db.getTokenUsageSummary(ctx.user.id);
    }),
  }),

  // Business Events & Monitoring
  events: router({
    log: protectedProcedure
      .input(z.object({
        userBusinessId: z.number(),
        eventType: z.enum(["revenue", "cost", "error", "intervention", "status_change", "agent_activity"]),
        eventData: z.record(z.string(), z.unknown()).optional(),
        amount: z.string().optional(),
        message: z.string().optional(),
        requiresIntervention: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.logBusinessEvent(input);
        return { success: true };
      }),
    
    list: protectedProcedure
      .input(z.object({
        userBusinessId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getBusinessEvents(input.userBusinessId, input.limit);
      }),
    
    pendingInterventions: protectedProcedure.query(async ({ ctx }) => {
      return db.getPendingInterventions(ctx.user.id);
    }),
  }),

  // API Configuration
  apiConfig: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getApiConfigs(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        provider: z.enum(["manus", "perplexity", "openai", "anthropic", "gemini", "grok"]),
        apiKey: z.string().optional(),
        baseUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertApiConfig({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Webhooks
  webhooks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getWebhooks(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        userBusinessId: z.number().optional(),
        name: z.string(),
        url: z.string().url(),
        secret: z.string().optional(),
        events: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createWebhook({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await db.deleteWebhook(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Dashboard Stats
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
