import { COOKIE_NAME } from "@shared/const";
// @ts-expect-error — cookie v1.x types resolve correctly at runtime
import { serialize as cookieSerialize } from "cookie";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  masterAdminProcedure,
  createPermissionProcedure,
  router,
} from "./_core/trpc";

// Permission-gated procedures
const businessCatalogProcedure = createPermissionProcedure("businessCatalog");
const myBusinessesProcedure = createPermissionProcedure("myBusinesses");
const monitoringProcedure = createPermissionProcedure("monitoring");
const tokenUsageProcedure = createPermissionProcedure("tokenUsage");
const apiConfigProcedure = createPermissionProcedure("apiConfig");
const webhooksProcedure = createPermissionProcedure("webhooks");
const settingsProcedure = createPermissionProcedure("settings");
import * as db from "./db";
import { goGetterAgent } from "./services/goGetterAgent";
import { sendOtpEmail } from "./services/email";
import { hash as bcryptHash, compare as bcryptCompare } from "bcryptjs";
import { sdk } from "./_core/sdk";
import { voiceAssistantRouter } from "./voiceAssistantRouter";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req as any);
      // Use setHeader instead of clearCookie for compatibility with Vercel serverless
      const clearCookie = cookieSerialize(COOKIE_NAME, "", {
        ...cookieOptions,
        maxAge: 0,
        expires: new Date(0),
      });
      (ctx.res as any).setHeader("Set-Cookie", clearCookie);
      return { success: true } as const;
    }),

    // ── Native Email Auth ──
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          email: z.string().email().max(320),
          password: z.string().min(8).max(128),
        })
      )
      .mutation(async ({ input }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new (await import("@trpc/server")).TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists. Please sign in.",
          });
        }

        const passwordHash = await bcryptHash(input.password, 12);
        const user = await db.createNativeUser({
          email: input.email,
          passwordHash,
          name: input.name,
        });

        // Generate and send OTP
        const code = await db.createVerificationCode(input.email);
        await sendOtpEmail(input.email, code);

        return { success: true, requiresVerification: true, email: input.email };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new (await import("@trpc/server")).TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        const valid = await bcryptCompare(input.password, user.passwordHash);
        if (!valid) {
          throw new (await import("@trpc/server")).TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        if (!user.emailVerified) {
          // Send a fresh OTP
          const code = await db.createVerificationCode(input.email);
          await sendOtpEmail(input.email, code);
          return { success: true, requiresVerification: true, email: input.email };
        }

        // Create session
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req as any);
        const sessionCookie = cookieSerialize(COOKIE_NAME, sessionToken, cookieOptions);
        (ctx.res as any).setHeader("Set-Cookie", sessionCookie);

        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

        return { success: true, requiresVerification: false };
      }),

    verifyEmail: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          code: z.string().length(6),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const valid = await db.verifyCode(input.email, input.code);
        if (!valid) {
          throw new (await import("@trpc/server")).TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired verification code.",
          });
        }

        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new (await import("@trpc/server")).TRPCError({
            code: "NOT_FOUND",
            message: "User not found.",
          });
        }

        await db.setEmailVerified(user.id);

        // Create session
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req as any);
        const sessionCookie = cookieSerialize(COOKIE_NAME, sessionToken, cookieOptions);
        (ctx.res as any).setHeader("Set-Cookie", sessionCookie);

        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

        return { success: true };
      }),

    resendCode: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          // Don't reveal whether the email exists
          return { success: true };
        }
        if (user.emailVerified) {
          return { success: true };
        }

        const code = await db.createVerificationCode(input.email);
        await sendOtpEmail(input.email, code);
        return { success: true };
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

  // Business Catalog (permission-gated)
  businesses: router({
    list: businessCatalogProcedure
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

    get: businessCatalogProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getBusinessById(input.id);
      }),

    create: businessCatalogProcedure
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

    saveDiscovered: businessCatalogProcedure
      .input(z.object({
        name: z.string(),
        description: z.string(),
        vertical: z.string(),
        scores: z.object({
          guaranteedDemand: z.number(),
          automationLevel: z.number(),
          tokenEfficiency: z.number(),
          profitMargin: z.number(),
          maintenanceCost: z.number(),
          legalRisk: z.number(),
          competitionSaturation: z.number(),
          compositeScore: z.number(),
        }),
        estimatedRevenue: z.number(),
        estimatedCosts: z.number(),
        implementationGuide: z.string().optional(),
        requiredApis: z.array(z.string()).optional(),
        infraRequirements: z.array(z.string()).optional(),
        setupTimeHours: z.number().optional(),
        minAgentsRequired: z.number().optional(),
        recommendedModels: z.array(z.string()).optional(),
        agentPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.saveDiscoveredBusiness(ctx.user.id, input);
      }),

    refresh: businessCatalogProcedure
      .input(z.object({
        id: z.number(),
        estimatedRevenuePerHour: z.string().optional(),
        estimatedTokenCostPerHour: z.string().optional(),
        estimatedInfraCostPerDay: z.string().optional(),
        guaranteedDemand: z.number().optional(),
        automationLevel: z.number().optional(),
        tokenEfficiency: z.number().optional(),
        profitMargin: z.number().optional(),
        maintenanceCost: z.number().optional(),
        legalRisk: z.number().optional(),
        competitionSaturation: z.number().optional(),
        implementationGuide: z.string().optional(),
        agentPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return db.updateBusinessDetails(id, updates);
      }),
  }),

  // User's Deployed Businesses (permission-gated)
  userBusinesses: router({
    list: myBusinessesProcedure.query(async ({ ctx }) => {
      return db.getUserBusinesses(ctx.user.id);
    }),

    get: myBusinessesProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserBusinessById(input.id);
      }),

    deploy: myBusinessesProcedure
      .input(z.object({ businessId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateBusinessLastDeployed(input.businessId);
        return db.deployBusiness(ctx.user.id, input.businessId);
      }),

    updateStatus: myBusinessesProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["setup", "running", "paused", "stopped", "failed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserBusinessStatus(input.id, input.status);
        return { success: true };
      }),

    updateMetrics: myBusinessesProcedure
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

  // Token Usage Tracking (permission-gated)
  tokenUsage: router({
    log: tokenUsageProcedure
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
    
    history: tokenUsageProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getTokenUsageByUser(ctx.user.id, input?.limit);
      }),

    summary: tokenUsageProcedure.query(async ({ ctx }) => {
      return db.getTokenUsageSummary(ctx.user.id);
    }),

    timeSeries: tokenUsageProcedure
      .input(z.object({
        timeRange: z.enum(['7d', '30d', '90d']),
        grouping: z.enum(['day', 'week', 'month']),
      }))
      .query(async ({ ctx, input }) => {
        return db.getTokenUsageTimeSeries(ctx.user.id, input.timeRange, input.grouping);
      }),
  }),

  // Business Events & Monitoring (permission-gated)
  events: router({
    log: monitoringProcedure
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

    list: monitoringProcedure
      .input(z.object({
        userBusinessId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getBusinessEvents(input.userBusinessId, input.limit);
      }),

    pendingInterventions: monitoringProcedure.query(async ({ ctx }) => {
      return db.getPendingInterventions(ctx.user.id);
    }),

    timeSeries: monitoringProcedure
      .input(z.object({
        userBusinessId: z.number(),
        timeRange: z.enum(["24h", "7d", "30d", "90d"]),
        grouping: z.enum(["hour", "day", "week"]),
      }))
      .query(async ({ input }) => {
        return db.getAggregatedEvents(input.userBusinessId, input.timeRange, input.grouping);
      }),
  }),

  // API Configuration (permission-gated)
  apiConfig: router({
    list: apiConfigProcedure.query(async ({ ctx }) => {
      return db.getApiConfigs(ctx.user.id);
    }),

    upsert: apiConfigProcedure
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

  // Webhooks (permission-gated)
  webhooks: router({
    list: webhooksProcedure.query(async ({ ctx }) => {
      return db.getWebhooks(ctx.user.id);
    }),

    create: webhooksProcedure
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

    delete: webhooksProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await db.deleteWebhook(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Dashboard Stats (permission-gated)
  dashboard: router({
    stats: monitoringProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),
  }),

  // Discovery Presets
  presets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDiscoveryPresets(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        config: z.object({
          riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
          interests: z.array(z.string()),
          capitalAvailable: z.number(),
          technicalSkills: z.string(),
          businessGoals: z.array(z.string()),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check preset count limit (10 presets max)
        const currentCount = await db.getDiscoveryPresetCount(ctx.user.id);
        if (currentCount >= 10) {
          throw new Error("Maximum preset limit reached. Delete a preset first.");
        }
        
        try {
          return await db.createDiscoveryPreset(ctx.user.id, input.name, input.config);
        } catch (error) {
          if (error instanceof Error && error.message.includes('already exists')) {
            throw new Error(`A preset with the name "${input.name}" already exists`);
          }
          throw error;
        }
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await db.deleteDiscoveryPreset(ctx.user.id, input.id);
        if (!deleted) {
          throw new Error("Preset not found or access denied");
        }
        return { success: true };
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getDiscoveryPresetById(ctx.user.id, input.id);
      }),
  }),

  // User Subscription
  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreateSubscription(ctx.user.id);
    }),
  }),

  // ============ ADMIN ROUTES ============

  admin: router({
    stats: adminProcedure.query(async () => {
      return db.getPipelineStats();
    }),

    recentEvents: adminProcedure
      .input(
        z
          .object({ limit: z.number().min(1).max(100).optional() })
          .optional()
      )
      .query(async ({ input }) => {
        return db.getRecentPipelineEvents(input?.limit);
      }),

    // Pipeline CRUD
    pipeline: router({
      list: adminProcedure
        .input(
          z
            .object({
              phase: z.number().min(0).max(6).optional(),
              status: z
                .enum([
                  "active",
                  "suspended",
                  "completed",
                  "cancelled",
                ])
                .optional(),
              adminId: z.number().optional(),
              search: z.string().optional(),
            })
            .optional()
        )
        .query(async ({ input }) => {
          return db.getPipelineProjects(input ?? undefined);
        }),

      get: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return db.getPipelineProjectById(input.id);
        }),

      create: adminProcedure
        .input(
          z.object({
            businessName: z.string().min(1).max(255),
            pocName: z.string().min(1).max(255),
            pocEmail: z.string().email().optional().or(z.literal("")),
            pocPhone: z.string().max(100).optional(),
            referralSource: z.string().max(100).optional(),
            description: z.string().optional(),
            userId: z.number().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          return db.createPipelineProject({
            ...input,
            pocEmail: input.pocEmail || null,
            adminId: ctx.user.id,
          });
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            businessName: z.string().min(1).max(255).optional(),
            pocName: z.string().min(1).max(255).optional(),
            pocEmail: z
              .string()
              .email()
              .optional()
              .or(z.literal("")),
            pocPhone: z.string().max(100).optional(),
            referralSource: z.string().max(100).optional(),
            description: z.string().optional(),
            status: z
              .enum([
                "active",
                "suspended",
                "completed",
                "cancelled",
              ])
              .optional(),
            metadata: z
              .record(z.string(), z.unknown())
              .optional(),
            retainerPaid: z.boolean().optional(),
            retainerAmount: z.string().optional(),
            profitSharePercentage: z.string().optional(),
            isGrandfathered: z.boolean().optional(),
            subscriptionTier: z
              .enum(["free", "starter", "pro", "unlimited"])
              .optional(),
            mvpUrl: z.string().optional(),
            addOns: z
              .object({
                customerAcquisition: z.boolean().optional(),
                openClawAdmin: z.boolean().optional(),
                infrastructure: z.boolean().optional(),
                businessArtifacts: z.boolean().optional(),
              })
              .optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          return db.updatePipelineProject(id, updates as any);
        }),

      advancePhase: adminProcedure
        .input(
          z.object({
            id: z.number(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          return db.advancePipelinePhase(
            input.id,
            ctx.user.id,
            input.notes
          );
        }),

      regressPhase: adminProcedure
        .input(
          z.object({
            id: z.number(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          return db.regressPipelinePhase(
            input.id,
            ctx.user.id,
            input.notes
          );
        }),

      events: adminProcedure
        .input(
          z.object({
            projectId: z.number(),
            limit: z.number().min(1).max(200).optional(),
          })
        )
        .query(async ({ input }) => {
          return db.getPipelineEvents(
            input.projectId,
            input.limit
          );
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deletePipelineProject(input.id);
          return { success: true };
        }),
    }),

    // Admin User Management
    admins: router({
      list: adminProcedure.query(async () => {
        return db.getAllAdmins();
      }),

      searchUsers: adminProcedure
        .input(
          z.object({
            search: z.string().min(1),
            limit: z.number().min(1).max(50).optional(),
          })
        )
        .query(async ({ input }) => {
          return db.searchUsers(input.search, input.limit);
        }),

      promote: masterAdminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ input }) => {
          await db.promoteToAdmin(input.userId);
          return { success: true };
        }),

      demote: masterAdminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ input }) => {
          await db.demoteFromAdmin(input.userId);
          return { success: true };
        }),
    }),

    // Unified User Administration
    users: router({
      list: adminProcedure
        .input(
          z
            .object({
              search: z.string().optional(),
              role: z.enum(["user", "admin"]).optional(),
              limit: z.number().min(1).max(100).optional(),
              offset: z.number().min(0).optional(),
            })
            .optional()
        )
        .query(async ({ input }) => {
          return db.getAllUsersForAdmin(input);
        }),

      updatePermissions: adminProcedure
        .input(
          z.object({
            userId: z.number(),
            permissions: z.object({
              businessCatalog: z.boolean().optional(),
              myBusinesses: z.boolean().optional(),
              monitoring: z.boolean().optional(),
              tokenUsage: z.boolean().optional(),
              apiConfig: z.boolean().optional(),
              webhooks: z.boolean().optional(),
              settings: z.boolean().optional(),
            }),
          })
        )
        .mutation(async ({ input }) => {
          await db.updateUserPermissions(input.userId, input.permissions);
          return { success: true };
        }),

      updateRole: masterAdminProcedure
        .input(
          z.object({
            userId: z.number(),
            role: z.enum(["user", "admin"]),
          })
        )
        .mutation(async ({ input }) => {
          if (input.role === "admin") {
            await db.promoteToAdmin(input.userId);
          } else {
            await db.demoteFromAdmin(input.userId);
          }
          return { success: true };
        }),
    }),

    voiceAssistant: voiceAssistantRouter,

    // Subscription Management (admin view)
    subscriptions: router({
      get: adminProcedure
        .input(z.object({ userId: z.number() }))
        .query(async ({ input }) => {
          return db.getOrCreateSubscription(input.userId);
        }),

      update: adminProcedure
        .input(
          z.object({
            userId: z.number(),
            tier: z.enum([
              "free",
              "starter",
              "pro",
              "unlimited",
            ]),
          })
        )
        .mutation(async ({ input }) => {
          return db.updateSubscription(input.userId, input.tier);
        }),
    }),
  }),

  // Go-Getter Agent
  agent: router({
    discover: protectedProcedure
      .input(z.object({
        preferences: z.object({
          riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
          interests: z.array(z.string()),
          capitalAvailable: z.number(),
          technicalSkills: z.string(),
          businessGoals: z.array(z.string()),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check subscription wizard usage limit
        const wizardCheck = await db.checkWizardLimit(ctx.user.id);
        if (!wizardCheck.allowed) {
          throw new Error(
            `Wizard usage limit reached (${wizardCheck.limit}/month). Upgrade your subscription for more usages.`
          );
        }

        // Get user's API configurations
        const userConfigs = await db.getApiConfigs(ctx.user.id);
        const activeConfigs = userConfigs.filter(config => config.isActive && config.apiKey);
        
        // Requirements 3.5: Handle fallback to static catalog when no APIs configured
        if (activeConfigs.length === 0) {
          console.log('No active API configs found, falling back to static catalog');
          // Return static business catalog as fallback
          const staticBusinesses = await db.getAllBusinesses(true);
          
          // Convert to BusinessOpportunity format
          return staticBusinesses.slice(0, 5).map(business => ({
            name: business.name,
            description: business.description,
            vertical: business.vertical,
            scores: {
              guaranteedDemand: business.guaranteedDemand,
              automationLevel: business.automationLevel,
              tokenEfficiency: business.tokenEfficiency,
              profitMargin: business.profitMargin,
              maintenanceCost: business.maintenanceCost,
              legalRisk: business.legalRisk,
              competitionSaturation: business.competitionSaturation,
              compositeScore: business.compositeScore,
            },
            estimatedRevenue: parseFloat(business.estimatedRevenuePerHour || '0') * 24 * 30, // Monthly estimate
            estimatedCosts: parseFloat(business.estimatedTokenCostPerHour || '0') * 24 * 30 + parseFloat(business.estimatedInfraCostPerDay || '0') * 30,
            implementationGuide: business.implementationGuide || 'Implementation guide available in business catalog.',
            requiredApis: business.requiredApis || [],
            infraRequirements: business.infraRequirements || [],
            setupTimeHours: business.setupTimeHours,
            minAgentsRequired: business.minAgentsRequired,
            recommendedModels: business.recommendedModels || [],
          }));
        }

        try {
          // Requirements 3.1: Use Go-Getter agent to discover opportunities
          const opportunities = await goGetterAgent.discoverOpportunities(
            input.preferences,
            activeConfigs,
            ctx.user.id
          );

          // Increment wizard usage on success
          await db.incrementWizardUsage(ctx.user.id);

          return opportunities;
        } catch (error) {
          console.error('Agent discovery failed, falling back to static catalog:', error);
          
          // Fallback to static catalog on error
          const staticBusinesses = await db.getAllBusinesses(true);
          return staticBusinesses.slice(0, 5).map(business => ({
            name: business.name,
            description: business.description,
            vertical: business.vertical,
            scores: {
              guaranteedDemand: business.guaranteedDemand,
              automationLevel: business.automationLevel,
              tokenEfficiency: business.tokenEfficiency,
              profitMargin: business.profitMargin,
              maintenanceCost: business.maintenanceCost,
              legalRisk: business.legalRisk,
              competitionSaturation: business.competitionSaturation,
              compositeScore: business.compositeScore,
            },
            estimatedRevenue: parseFloat(business.estimatedRevenuePerHour || '0') * 24 * 30,
            estimatedCosts: parseFloat(business.estimatedTokenCostPerHour || '0') * 24 * 30 + parseFloat(business.estimatedInfraCostPerDay || '0') * 30,
            implementationGuide: business.implementationGuide || 'Implementation guide available in business catalog.',
            requiredApis: business.requiredApis || [],
            infraRequirements: business.infraRequirements || [],
            setupTimeHours: business.setupTimeHours,
            minAgentsRequired: business.minAgentsRequired,
            recommendedModels: business.recommendedModels || [],
          }));
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
