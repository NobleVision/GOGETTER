import { integer, pgEnum, pgTable, text, timestamp, varchar, json, decimal, boolean, serial } from "drizzle-orm/pg-core";

/**
 * Enums for PostgreSQL
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const riskToleranceEnum = pgEnum("risk_tolerance", ["conservative", "moderate", "aggressive"]);
export const technicalSkillsEnum = pgEnum("technical_skills", ["beginner", "intermediate", "advanced", "expert"]);
export const aggressivenessEnum = pgEnum("aggressiveness", ["low", "medium", "high"]);
export const strategyTimeframeEnum = pgEnum("strategy_timeframe", ["short", "medium", "long"]);
export const verticalEnum = pgEnum("vertical", ["content_media", "digital_services", "ecommerce", "data_insights"]);
export const scoreTierEnum = pgEnum("score_tier", ["prime", "stable", "experimental", "archived"]);
export const businessStatusEnum = pgEnum("business_status", ["setup", "running", "paused", "stopped", "failed"]);
export const eventTypeEnum = pgEnum("event_type", ["revenue", "cost", "error", "intervention", "status_change", "agent_activity"]);
export const apiProviderEnum = pgEnum("api_provider", ["manus", "perplexity", "openai", "anthropic", "gemini", "grok"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  // Google OAuth fields
  googleId: varchar("google_id", { length: 64 }),
  pictureUrl: varchar("picture_url", { length: 500 }),
  authProviders: json("auth_providers").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profile for Go-Getter preferences and settings
 */
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  riskTolerance: riskToleranceEnum("risk_tolerance").default("moderate").notNull(),
  capitalAvailable: decimal("capital_available", { precision: 12, scale: 2 }).default("0"),
  interests: json("interests").$type<string[]>(),
  technicalSkills: technicalSkillsEnum("technical_skills").default("beginner").notNull(),
  businessGoals: json("business_goals").$type<string[]>(),
  aggressiveness: aggressivenessEnum("aggressiveness").default("medium").notNull(),
  strategyTimeframe: strategyTimeframeEnum("strategy_timeframe").default("medium").notNull(),
  monthlyTokenBudget: decimal("monthly_token_budget", { precision: 10, scale: 2 }).default("100"),
  wizardCompleted: boolean("wizard_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Business opportunities catalog
 */
export const businesses = pgTable("businesses", {
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
  recommendedModels: json("recommended_models").$type<string[]>(),
  
  // Implementation details
  implementationGuide: text("implementation_guide"),
  requiredApis: json("required_apis").$type<string[]>(),
  infraRequirements: json("infra_requirements").$type<string[]>(),
  codeTemplateUrl: varchar("code_template_url", { length: 500 }),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * User's active/deployed businesses
 */
export const userBusinesses = pgTable("user_businesses", {
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
  configJson: json("config_json").$type<Record<string, unknown>>(),
  
  startedAt: timestamp("started_at"),
  stoppedAt: timestamp("stopped_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserBusiness = typeof userBusinesses.$inferSelect;
export type InsertUserBusiness = typeof userBusinesses.$inferInsert;

/**
 * Token usage tracking
 */
export const tokenUsage = pgTable("token_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userBusinessId: integer("user_business_id").references(() => userBusinesses.id),
  modelProvider: varchar("model_provider", { length: 64 }).notNull(),
  modelName: varchar("model_name", { length: 128 }).notNull(),
  inputTokens: integer("input_tokens").default(0).notNull(),
  outputTokens: integer("output_tokens").default(0).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 6 }).default("0"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type TokenUsage = typeof tokenUsage.$inferSelect;
export type InsertTokenUsage = typeof tokenUsage.$inferInsert;

/**
 * Business events/logs for monitoring
 */
export const businessEvents = pgTable("business_events", {
  id: serial("id").primaryKey(),
  userBusinessId: integer("user_business_id").notNull().references(() => userBusinesses.id),
  eventType: eventTypeEnum("event_type").notNull(),
  eventData: json("event_data").$type<Record<string, unknown>>(),
  amount: decimal("amount", { precision: 10, scale: 4 }),
  message: text("message"),
  requiresIntervention: boolean("requires_intervention").default(false).notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type BusinessEvent = typeof businessEvents.$inferSelect;
export type InsertBusinessEvent = typeof businessEvents.$inferInsert;

/**
 * API configurations for multi-model support
 */
export const apiConfigs = pgTable("api_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: apiProviderEnum("provider").notNull(),
  apiKey: varchar("api_key", { length: 500 }),
  baseUrl: varchar("base_url", { length: 500 }),
  isActive: boolean("is_active").default(false).notNull(),
  lastValidated: timestamp("last_validated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;

/**
 * Webhook configurations
 */
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userBusinessId: integer("user_business_id").references(() => userBusinesses.id),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  secret: varchar("secret", { length: 128 }),
  events: json("events").$type<string[]>(),
  isActive: boolean("is_active").default(true).notNull(),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

/**
 * User preferences interface for discovery wizard
 */
export interface UserPreferences {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  interests: string[];
  capitalAvailable: number;
  technicalSkills: string;
  businessGoals: string[];
}

/**
 * Discovery presets for saving wizard configurations
 */
export const discoveryPresets = pgTable("discovery_presets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  config: json("config").$type<UserPreferences>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DiscoveryPreset = typeof discoveryPresets.$inferSelect;
export type InsertDiscoveryPreset = typeof discoveryPresets.$inferInsert;
