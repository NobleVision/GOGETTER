// api/index.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/routers.ts
import { z as z2 } from "zod";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Google OAuth configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
};

// server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/db.ts
import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// drizzle/schema.ts
import { integer, pgEnum, pgTable, text, timestamp, varchar, json, decimal, boolean, serial } from "drizzle-orm/pg-core";
var userRoleEnum = pgEnum("user_role", ["user", "admin"]);
var riskToleranceEnum = pgEnum("risk_tolerance", ["conservative", "moderate", "aggressive"]);
var technicalSkillsEnum = pgEnum("technical_skills", ["beginner", "intermediate", "advanced", "expert"]);
var aggressivenessEnum = pgEnum("aggressiveness", ["low", "medium", "high"]);
var strategyTimeframeEnum = pgEnum("strategy_timeframe", ["short", "medium", "long"]);
var verticalEnum = pgEnum("vertical", ["content_media", "digital_services", "ecommerce", "data_insights"]);
var scoreTierEnum = pgEnum("score_tier", ["prime", "stable", "experimental", "archived"]);
var businessStatusEnum = pgEnum("business_status", ["setup", "running", "paused", "stopped", "failed"]);
var eventTypeEnum = pgEnum("event_type", ["revenue", "cost", "error", "intervention", "status_change", "agent_activity"]);
var apiProviderEnum = pgEnum("api_provider", ["manus", "perplexity", "openai", "anthropic", "gemini", "grok"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  // Google OAuth fields
  googleId: varchar("google_id", { length: 64 }),
  pictureUrl: varchar("picture_url", { length: 500 }),
  authProviders: json("auth_providers").$type().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull()
});
var userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  riskTolerance: riskToleranceEnum("risk_tolerance").default("moderate").notNull(),
  capitalAvailable: decimal("capital_available", { precision: 12, scale: 2 }).default("0"),
  interests: json("interests").$type(),
  technicalSkills: technicalSkillsEnum("technical_skills").default("beginner").notNull(),
  businessGoals: json("business_goals").$type(),
  aggressiveness: aggressivenessEnum("aggressiveness").default("medium").notNull(),
  strategyTimeframe: strategyTimeframeEnum("strategy_timeframe").default("medium").notNull(),
  monthlyTokenBudget: decimal("monthly_token_budget", { precision: 10, scale: 2 }).default("100"),
  wizardCompleted: boolean("wizard_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  vertical: verticalEnum("vertical").notNull(),
  // Scoring factors (0-100 each)
  guaranteedDemand: integer("guaranteed_demand").default(50).notNull(),
  automationLevel: integer("automation_level").default(50).notNull(),
  tokenEfficiency: integer("token_efficiency").default(50).notNull(),
  profitMargin: integer("profit_margin").default(50).notNull(),
  maintenanceCost: integer("maintenance_cost").default(50).notNull(),
  legalRisk: integer("legal_risk").default(50).notNull(),
  competitionSaturation: integer("competition_saturation").default(50).notNull(),
  // Computed composite score
  compositeScore: integer("composite_score").default(50).notNull(),
  scoreTier: scoreTierEnum("score_tier").default("experimental").notNull(),
  // Financial projections
  estimatedRevenuePerHour: decimal("estimated_revenue_per_hour", { precision: 10, scale: 4 }).default("0"),
  estimatedTokenCostPerHour: decimal("estimated_token_cost_per_hour", { precision: 10, scale: 4 }).default("0"),
  estimatedInfraCostPerDay: decimal("estimated_infra_cost_per_day", { precision: 10, scale: 2 }).default("0"),
  setupCost: decimal("setup_cost", { precision: 10, scale: 2 }).default("0"),
  setupTimeHours: integer("setup_time_hours").default(1).notNull(),
  // Agent requirements
  minAgentsRequired: integer("min_agents_required").default(1).notNull(),
  recommendedModels: json("recommended_models").$type(),
  // Implementation details
  implementationGuide: text("implementation_guide"),
  requiredApis: json("required_apis").$type(),
  infraRequirements: json("infra_requirements").$type(),
  codeTemplateUrl: varchar("code_template_url", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var userBusinesses = pgTable("user_businesses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  status: businessStatusEnum("status").default("setup").notNull(),
  // Runtime metrics
  totalRevenue: decimal("total_revenue", { precision: 14, scale: 2 }).default("0"),
  totalTokenCost: decimal("total_token_cost", { precision: 14, scale: 2 }).default("0"),
  totalInfraCost: decimal("total_infra_cost", { precision: 14, scale: 2 }).default("0"),
  netProfit: decimal("net_profit", { precision: 14, scale: 2 }).default("0"),
  // Daily metrics (updated daily)
  dailyRevenue: decimal("daily_revenue", { precision: 10, scale: 2 }).default("0"),
  dailyTokenCost: decimal("daily_token_cost", { precision: 10, scale: 2 }).default("0"),
  // Agent status
  activeAgents: integer("active_agents").default(0).notNull(),
  lastAgentActivity: timestamp("last_agent_activity"),
  // Configuration
  webhookUrl: varchar("webhook_url", { length: 500 }),
  configJson: json("config_json").$type(),
  startedAt: timestamp("started_at"),
  stoppedAt: timestamp("stopped_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var tokenUsage = pgTable("token_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userBusinessId: integer("user_business_id").references(() => userBusinesses.id),
  modelProvider: varchar("model_provider", { length: 64 }).notNull(),
  modelName: varchar("model_name", { length: 128 }).notNull(),
  inputTokens: integer("input_tokens").default(0).notNull(),
  outputTokens: integer("output_tokens").default(0).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 6 }).default("0"),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var businessEvents = pgTable("business_events", {
  id: serial("id").primaryKey(),
  userBusinessId: integer("user_business_id").notNull().references(() => userBusinesses.id),
  eventType: eventTypeEnum("event_type").notNull(),
  eventData: json("event_data").$type(),
  amount: decimal("amount", { precision: 10, scale: 4 }),
  message: text("message"),
  requiresIntervention: boolean("requires_intervention").default(false).notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var apiConfigs = pgTable("api_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: apiProviderEnum("provider").notNull(),
  apiKey: varchar("api_key", { length: 500 }),
  baseUrl: varchar("base_url", { length: 500 }),
  isActive: boolean("is_active").default(false).notNull(),
  lastValidated: timestamp("last_validated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userBusinessId: integer("user_business_id").references(() => userBusinesses.id),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  secret: varchar("secret", { length: 128 }),
  events: json("events").$type(),
  isActive: boolean("is_active").default(true).notNull(),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// server/db.ts
var _db = null;
var _pool = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existingUser.length > 0) {
      const updateData = {
        updatedAt: /* @__PURE__ */ new Date(),
        lastSignedIn: user.lastSignedIn || /* @__PURE__ */ new Date()
      };
      if (user.name !== void 0) updateData.name = user.name;
      if (user.email !== void 0) updateData.email = user.email;
      if (user.loginMethod !== void 0) updateData.loginMethod = user.loginMethod;
      if (user.role !== void 0) updateData.role = user.role;
      await db.update(users).set(updateData).where(eq(users.openId, user.openId));
    } else {
      const role = user.openId === ENV.ownerOpenId ? "admin" : user.role || "user";
      await db.insert(users).values({
        openId: user.openId,
        name: user.name || null,
        email: user.email || null,
        loginMethod: user.loginMethod || null,
        role,
        lastSignedIn: user.lastSignedIn || /* @__PURE__ */ new Date()
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByGoogleId(googleId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertUserWithGoogle(user) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert Google user: database not available");
    return;
  }
  try {
    const existingByGoogleId = await getUserByGoogleId(user.googleId);
    if (existingByGoogleId) {
      await db.update(users).set({
        name: user.name,
        email: user.email,
        pictureUrl: user.pictureUrl,
        lastSignedIn: user.lastSignedIn,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.googleId, user.googleId));
      return;
    }
    const existingByEmail = await getUserByEmail(user.email);
    if (existingByEmail) {
      const currentProviders = existingByEmail.authProviders || [];
      const updatedProviders = currentProviders.includes("google") ? currentProviders : [...currentProviders, "google"];
      await db.update(users).set({
        googleId: user.googleId,
        pictureUrl: user.pictureUrl || existingByEmail.pictureUrl,
        authProviders: updatedProviders,
        lastSignedIn: user.lastSignedIn,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, existingByEmail.id));
      return;
    }
    const role = user.openId === ENV.ownerOpenId ? "admin" : "user";
    await db.insert(users).values({
      openId: user.openId,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      pictureUrl: user.pictureUrl,
      loginMethod: user.loginMethod,
      authProviders: ["google"],
      role,
      lastSignedIn: user.lastSignedIn
    });
  } catch (error) {
    console.error("[Database] Failed to upsert Google user:", error);
    throw error;
  }
}
async function getUserProfile(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertUserProfile(profile) {
  const db = await getDb();
  if (!db) return void 0;
  const existing = await getUserProfile(profile.userId);
  if (existing) {
    await db.update(userProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userProfiles.userId, profile.userId));
  } else {
    await db.insert(userProfiles).values(profile);
  }
  return getUserProfile(profile.userId);
}
async function getAllBusinesses(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(businesses).where(eq(businesses.isActive, true)).orderBy(desc(businesses.compositeScore));
  }
  return db.select().from(businesses).orderBy(desc(businesses.compositeScore));
}
async function getBusinessesByVertical(vertical) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businesses).where(and(eq(businesses.vertical, vertical), eq(businesses.isActive, true))).orderBy(desc(businesses.compositeScore));
}
async function getBusinessById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createBusiness(business) {
  const db = await getDb();
  if (!db) return void 0;
  const compositeScore = calculateCompositeScore(business);
  const scoreTier = getScoreTier(compositeScore);
  const result = await db.insert(businesses).values({
    ...business,
    compositeScore,
    scoreTier
  }).returning();
  return result[0];
}
async function getUserBusinesses(userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(userBusinesses).innerJoin(businesses, eq(userBusinesses.businessId, businesses.id)).where(eq(userBusinesses.userId, userId)).orderBy(desc(userBusinesses.createdAt));
  return result.map((r) => ({ ...r.user_businesses, business: r.businesses }));
}
async function getUserBusinessById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(userBusinesses).innerJoin(businesses, eq(userBusinesses.businessId, businesses.id)).where(eq(userBusinesses.id, id)).limit(1);
  if (result.length === 0) return void 0;
  return { ...result[0].user_businesses, business: result[0].businesses };
}
async function deployBusiness(userId, businessId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.insert(userBusinesses).values({
    userId,
    businessId,
    status: "setup"
  }).returning();
  return result[0];
}
async function updateUserBusinessStatus(id, status) {
  const db = await getDb();
  if (!db) return;
  const updateData = {
    status,
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (status === "running") {
    updateData.startedAt = /* @__PURE__ */ new Date();
  } else if (status === "stopped" || status === "failed") {
    updateData.stoppedAt = /* @__PURE__ */ new Date();
  }
  await db.update(userBusinesses).set(updateData).where(eq(userBusinesses.id, id));
}
async function updateUserBusinessMetrics(id, metrics) {
  const db = await getDb();
  if (!db) return;
  await db.update(userBusinesses).set({
    ...metrics,
    lastAgentActivity: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(userBusinesses.id, id));
}
async function logTokenUsage(usage) {
  const db = await getDb();
  if (!db) return;
  await db.insert(tokenUsage).values(usage);
}
async function getTokenUsageByUser(userId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tokenUsage).where(eq(tokenUsage.userId, userId)).orderBy(desc(tokenUsage.timestamp)).limit(limit);
}
async function getTokenUsageSummary(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    totalCost: sql`COALESCE(SUM(${tokenUsage.totalCost}), 0)`,
    totalInputTokens: sql`COALESCE(SUM(${tokenUsage.inputTokens}), 0)`,
    totalOutputTokens: sql`COALESCE(SUM(${tokenUsage.outputTokens}), 0)`
  }).from(tokenUsage).where(eq(tokenUsage.userId, userId));
  return result[0];
}
async function logBusinessEvent(event) {
  const db = await getDb();
  if (!db) return;
  await db.insert(businessEvents).values(event);
}
async function getBusinessEvents(userBusinessId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessEvents).where(eq(businessEvents.userBusinessId, userBusinessId)).orderBy(desc(businessEvents.timestamp)).limit(limit);
}
async function getPendingInterventions(userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(businessEvents).innerJoin(userBusinesses, eq(businessEvents.userBusinessId, userBusinesses.id)).where(and(
    eq(userBusinesses.userId, userId),
    eq(businessEvents.requiresIntervention, true),
    eq(businessEvents.resolved, false)
  )).orderBy(desc(businessEvents.timestamp));
  return result.map((r) => ({ ...r.business_events, userBusiness: r.user_businesses }));
}
async function getApiConfigs(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiConfigs).where(eq(apiConfigs.userId, userId));
}
async function upsertApiConfig(config) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(apiConfigs).where(and(eq(apiConfigs.userId, config.userId), eq(apiConfigs.provider, config.provider))).limit(1);
  if (existing.length > 0) {
    await db.update(apiConfigs).set({ ...config, updatedAt: /* @__PURE__ */ new Date() }).where(eq(apiConfigs.id, existing[0].id));
  } else {
    await db.insert(apiConfigs).values(config);
  }
}
async function getWebhooks(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhooks).where(eq(webhooks.userId, userId));
}
async function createWebhook(webhook) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.insert(webhooks).values(webhook).returning();
  return result[0];
}
async function deleteWebhook(id, userId) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.userId, userId)));
  return true;
}
async function getDashboardStats(userId) {
  const db = await getDb();
  if (!db) return null;
  const userBizs = await db.select().from(userBusinesses).where(eq(userBusinesses.userId, userId));
  const activeCount = userBizs.filter((b) => b.status === "running").length;
  const totalRevenue = userBizs.reduce((sum, b) => sum + parseFloat(b.totalRevenue || "0"), 0);
  const totalTokenCost = userBizs.reduce((sum, b) => sum + parseFloat(b.totalTokenCost || "0"), 0);
  const totalInfraCost = userBizs.reduce((sum, b) => sum + parseFloat(b.totalInfraCost || "0"), 0);
  const netProfit = totalRevenue - totalTokenCost - totalInfraCost;
  const totalAgents = userBizs.reduce((sum, b) => sum + (b.activeAgents || 0), 0);
  return {
    activeBusinesses: activeCount,
    totalBusinesses: userBizs.length,
    totalRevenue: totalRevenue.toFixed(2),
    totalTokenCost: totalTokenCost.toFixed(2),
    totalInfraCost: totalInfraCost.toFixed(2),
    netProfit: netProfit.toFixed(2),
    profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(1) : "0",
    activeAgents: totalAgents
  };
}
function calculateCompositeScore(business) {
  const weights = {
    guaranteedDemand: 0.2,
    automationLevel: 0.15,
    tokenEfficiency: 0.15,
    profitMargin: 0.15,
    maintenanceCost: 0.1,
    legalRisk: 0.1,
    competitionSaturation: 0.1
  };
  const score = (business.guaranteedDemand || 50) * weights.guaranteedDemand + (business.automationLevel || 50) * weights.automationLevel + (business.tokenEfficiency || 50) * weights.tokenEfficiency + (business.profitMargin || 50) * weights.profitMargin + (100 - (business.maintenanceCost || 50)) * weights.maintenanceCost + (100 - (business.legalRisk || 50)) * weights.legalRisk + (100 - (business.competitionSaturation || 50)) * weights.competitionSaturation;
  return Math.round(score);
}
function getScoreTier(score) {
  if (score >= 90) return "prime";
  if (score >= 70) return "stable";
  if (score >= 50) return "experimental";
  return "archived";
}

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // User Profile Management
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUserProfile(ctx.user.id);
    }),
    upsert: protectedProcedure.input(z2.object({
      riskTolerance: z2.enum(["conservative", "moderate", "aggressive"]).optional(),
      capitalAvailable: z2.string().optional(),
      interests: z2.array(z2.string()).optional(),
      technicalSkills: z2.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
      businessGoals: z2.array(z2.string()).optional(),
      aggressiveness: z2.enum(["low", "medium", "high"]).optional(),
      strategyTimeframe: z2.enum(["short", "medium", "long"]).optional(),
      monthlyTokenBudget: z2.string().optional(),
      wizardCompleted: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      return upsertUserProfile({
        userId: ctx.user.id,
        ...input
      });
    })
  }),
  // Business Catalog
  businesses: router({
    list: publicProcedure.input(z2.object({
      vertical: z2.enum(["content_media", "digital_services", "ecommerce", "data_insights"]).optional(),
      activeOnly: z2.boolean().optional().default(true)
    }).optional()).query(async ({ input }) => {
      if (input?.vertical) {
        return getBusinessesByVertical(input.vertical);
      }
      return getAllBusinesses(input?.activeOnly ?? true);
    }),
    get: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getBusinessById(input.id);
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string(),
      description: z2.string(),
      vertical: z2.enum(["content_media", "digital_services", "ecommerce", "data_insights"]),
      guaranteedDemand: z2.number().min(0).max(100).optional(),
      automationLevel: z2.number().min(0).max(100).optional(),
      tokenEfficiency: z2.number().min(0).max(100).optional(),
      profitMargin: z2.number().min(0).max(100).optional(),
      maintenanceCost: z2.number().min(0).max(100).optional(),
      legalRisk: z2.number().min(0).max(100).optional(),
      competitionSaturation: z2.number().min(0).max(100).optional(),
      estimatedRevenuePerHour: z2.string().optional(),
      estimatedTokenCostPerHour: z2.string().optional(),
      estimatedInfraCostPerDay: z2.string().optional(),
      setupCost: z2.string().optional(),
      setupTimeHours: z2.number().optional(),
      minAgentsRequired: z2.number().optional(),
      recommendedModels: z2.array(z2.string()).optional(),
      implementationGuide: z2.string().optional(),
      requiredApis: z2.array(z2.string()).optional(),
      infraRequirements: z2.array(z2.string()).optional(),
      codeTemplateUrl: z2.string().optional()
    })).mutation(async ({ input }) => {
      return createBusiness(input);
    })
  }),
  // User's Deployed Businesses
  userBusinesses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserBusinesses(ctx.user.id);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getUserBusinessById(input.id);
    }),
    deploy: protectedProcedure.input(z2.object({ businessId: z2.number() })).mutation(async ({ ctx, input }) => {
      return deployBusiness(ctx.user.id, input.businessId);
    }),
    updateStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["setup", "running", "paused", "stopped", "failed"])
    })).mutation(async ({ input }) => {
      await updateUserBusinessStatus(input.id, input.status);
      return { success: true };
    }),
    updateMetrics: protectedProcedure.input(z2.object({
      id: z2.number(),
      totalRevenue: z2.string().optional(),
      totalTokenCost: z2.string().optional(),
      totalInfraCost: z2.string().optional(),
      netProfit: z2.string().optional(),
      dailyRevenue: z2.string().optional(),
      dailyTokenCost: z2.string().optional(),
      activeAgents: z2.number().optional()
    })).mutation(async ({ input }) => {
      const { id, ...metrics } = input;
      await updateUserBusinessMetrics(id, metrics);
      return { success: true };
    })
  }),
  // Token Usage Tracking
  tokenUsage: router({
    log: protectedProcedure.input(z2.object({
      userBusinessId: z2.number().optional(),
      modelProvider: z2.string(),
      modelName: z2.string(),
      inputTokens: z2.number(),
      outputTokens: z2.number(),
      totalCost: z2.string()
    })).mutation(async ({ ctx, input }) => {
      await logTokenUsage({
        userId: ctx.user.id,
        ...input
      });
      return { success: true };
    }),
    history: protectedProcedure.input(z2.object({ limit: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return getTokenUsageByUser(ctx.user.id, input?.limit);
    }),
    summary: protectedProcedure.query(async ({ ctx }) => {
      return getTokenUsageSummary(ctx.user.id);
    })
  }),
  // Business Events & Monitoring
  events: router({
    log: protectedProcedure.input(z2.object({
      userBusinessId: z2.number(),
      eventType: z2.enum(["revenue", "cost", "error", "intervention", "status_change", "agent_activity"]),
      eventData: z2.record(z2.string(), z2.unknown()).optional(),
      amount: z2.string().optional(),
      message: z2.string().optional(),
      requiresIntervention: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      await logBusinessEvent(input);
      return { success: true };
    }),
    list: protectedProcedure.input(z2.object({
      userBusinessId: z2.number(),
      limit: z2.number().optional()
    })).query(async ({ input }) => {
      return getBusinessEvents(input.userBusinessId, input.limit);
    }),
    pendingInterventions: protectedProcedure.query(async ({ ctx }) => {
      return getPendingInterventions(ctx.user.id);
    })
  }),
  // API Configuration
  apiConfig: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getApiConfigs(ctx.user.id);
    }),
    upsert: protectedProcedure.input(z2.object({
      provider: z2.enum(["manus", "perplexity", "openai", "anthropic", "gemini", "grok"]),
      apiKey: z2.string().optional(),
      baseUrl: z2.string().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      await upsertApiConfig({
        userId: ctx.user.id,
        ...input
      });
      return { success: true };
    })
  }),
  // Webhooks
  webhooks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getWebhooks(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      userBusinessId: z2.number().optional(),
      name: z2.string(),
      url: z2.string().url(),
      secret: z2.string().optional(),
      events: z2.array(z2.string()).optional()
    })).mutation(async ({ ctx, input }) => {
      return createWebhook({
        userId: ctx.user.id,
        ...input
      });
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const deleted = await deleteWebhook(input.id, ctx.user.id);
      return { success: true };
    })
  }),
  // Dashboard Stats
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getDashboardStats(ctx.user.id);
    })
  })
});

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString2(openId) || !isNonEmptyString2(appId) || !isNonEmptyString2(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/googleOAuth.ts
import { OAuth2Client } from "google-auth-library";
function createOAuth2Client(redirectUri) {
  return new OAuth2Client(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri
  );
}
function getGoogleAuthorizationUrl(redirectUri, state) {
  const client = createOAuth2Client(redirectUri);
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ],
    state,
    prompt: "consent"
  });
  return authUrl;
}
async function exchangeCodeForTokens(code, redirectUri) {
  const client = createOAuth2Client(redirectUri);
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token || "",
    id_token: tokens.id_token || void 0,
    refresh_token: tokens.refresh_token || void 0,
    expiry_date: tokens.expiry_date || void 0,
    token_type: tokens.token_type || "Bearer",
    scope: tokens.scope || ""
  };
}
async function getGoogleUserInfo(accessToken) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
    verified_email: data.verified_email
  };
}
function isGoogleOAuthConfigured() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret);
}

// api/index.ts
import { randomBytes } from "crypto";
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
var oauthStates = /* @__PURE__ */ new Map();
function cleanupExpiredStates() {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1e3;
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.createdAt > TEN_MINUTES) {
      oauthStates.delete(state);
    }
  }
}
app.get("/api/oauth/callback", async (req, res) => {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");
  if (!code || !state) {
    res.status(400).json({ error: "code and state are required" });
    return;
  }
  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
    if (!userInfo.openId) {
      res.status(400).json({ error: "openId missing from user info" });
      return;
    }
    await upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.redirect(302, "/");
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    res.status(500).json({ error: "OAuth callback failed" });
  }
});
app.get("/api/oauth/google/init", (req, res) => {
  if (!isGoogleOAuthConfigured()) {
    res.status(503).json({ error: "Google OAuth is not configured" });
    return;
  }
  const state = randomBytes(32).toString("hex");
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  const redirectUri = `${protocol}://${host}/api/oauth/google/callback`;
  cleanupExpiredStates();
  oauthStates.set(state, { redirectUri, createdAt: Date.now() });
  const authUrl = getGoogleAuthorizationUrl(redirectUri, state);
  res.redirect(302, authUrl);
});
app.get("/api/oauth/google/callback", async (req, res) => {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");
  const error = getQueryParam(req, "error");
  if (error) {
    console.error("[GoogleOAuth] Authorization error:", error);
    res.redirect(302, "/?error=google_auth_denied");
    return;
  }
  if (!code || !state) {
    res.redirect(302, "/?error=google_auth_invalid");
    return;
  }
  const storedState = oauthStates.get(state);
  if (!storedState) {
    console.error("[GoogleOAuth] Invalid or expired state");
    res.redirect(302, "/?error=google_auth_state_invalid");
    return;
  }
  oauthStates.delete(state);
  try {
    const tokens = await exchangeCodeForTokens(code, storedState.redirectUri);
    const googleUser = await getGoogleUserInfo(tokens.access_token);
    if (!googleUser.email) {
      res.redirect(302, "/?error=google_auth_no_email");
      return;
    }
    const googleOpenId = `google_${googleUser.id}`;
    await upsertUserWithGoogle({
      openId: googleOpenId,
      googleId: googleUser.id,
      name: googleUser.name || null,
      email: googleUser.email,
      pictureUrl: googleUser.picture || null,
      loginMethod: "google",
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    const sessionToken = await sdk.createSessionToken(googleOpenId, {
      name: googleUser.name || "",
      expiresInMs: ONE_YEAR_MS
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.redirect(302, "/");
  } catch (error2) {
    console.error("[GoogleOAuth] Callback failed:", error2);
    res.redirect(302, "/?error=google_auth_failed");
  }
});
app.get("/api/oauth/google/status", (_req, res) => {
  res.json({ configured: isGoogleOAuthConfigured() });
});
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var index_default = app;
export {
  index_default as default
};
