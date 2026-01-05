import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { 
  InsertUser, users, 
  userProfiles, InsertUserProfile, UserProfile,
  businesses, InsertBusiness, Business,
  userBusinesses, InsertUserBusiness, UserBusiness,
  tokenUsage, InsertTokenUsage,
  businessEvents, InsertBusinessEvent,
  apiConfigs, InsertApiConfig,
  webhooks, InsertWebhook,
  discoveryPresets, InsertDiscoveryPreset, DiscoveryPreset, UserPreferences
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
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

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
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
      // Update existing user
      const updateData: Partial<InsertUser> = {
        updatedAt: new Date(),
        lastSignedIn: user.lastSignedIn || new Date(),
      };
      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateData.role = user.role;
      
      await db.update(users).set(updateData).where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      const role = user.openId === ENV.ownerOpenId ? 'admin' : (user.role || 'user');
      await db.insert(users).values({
        openId: user.openId,
        name: user.name || null,
        email: user.email || null,
        loginMethod: user.loginMethod || null,
        role: role,
        lastSignedIn: user.lastSignedIn || new Date(),
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by Google ID
 * Requirement 2.4: Handle Google users
 */
export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by email
 * Requirement 8.3: Link accounts by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Upsert user with Google OAuth data
 * Requirements 2.4, 2.5, 8.2, 8.3: Handle Google users and account linking
 */
export async function upsertUserWithGoogle(user: {
  openId: string;
  googleId: string;
  name: string | null;
  email: string;
  pictureUrl: string | null;
  loginMethod: string;
  lastSignedIn: Date;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert Google user: database not available");
    return;
  }

  try {
    // First, check if user exists by Google ID
    const existingByGoogleId = await getUserByGoogleId(user.googleId);
    
    if (existingByGoogleId) {
      // Update existing Google user
      await db.update(users).set({
        name: user.name,
        email: user.email,
        pictureUrl: user.pictureUrl,
        lastSignedIn: user.lastSignedIn,
        updatedAt: new Date(),
      }).where(eq(users.googleId, user.googleId));
      return;
    }

    // Check if user exists by email (for account linking)
    const existingByEmail = await getUserByEmail(user.email);
    
    if (existingByEmail) {
      // Link Google account to existing user
      const currentProviders = existingByEmail.authProviders || [];
      const updatedProviders = currentProviders.includes("google") 
        ? currentProviders 
        : [...currentProviders, "google"];
      
      await db.update(users).set({
        googleId: user.googleId,
        pictureUrl: user.pictureUrl || existingByEmail.pictureUrl,
        authProviders: updatedProviders,
        lastSignedIn: user.lastSignedIn,
        updatedAt: new Date(),
      }).where(eq(users.id, existingByEmail.id));
      return;
    }

    // Create new user with Google data
    const role = user.openId === ENV.ownerOpenId ? 'admin' : 'user';
    await db.insert(users).values({
      openId: user.openId,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      pictureUrl: user.pictureUrl,
      loginMethod: user.loginMethod,
      authProviders: ["google"],
      role: role,
      lastSignedIn: user.lastSignedIn,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert Google user:", error);
    throw error;
  }
}

// ============ USER PROFILE OPERATIONS ============

export async function getUserProfile(userId: number): Promise<UserProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getUserProfile(profile.userId);
  
  if (existing) {
    await db.update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, profile.userId));
  } else {
    await db.insert(userProfiles).values(profile);
  }
  
  return getUserProfile(profile.userId);
}

// ============ BUSINESS CATALOG OPERATIONS ============

export async function getAllBusinesses(activeOnly = true): Promise<Business[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return db.select().from(businesses).where(eq(businesses.isActive, true)).orderBy(desc(businesses.compositeScore));
  }
  return db.select().from(businesses).orderBy(desc(businesses.compositeScore));
}

export async function getBusinessesByVertical(vertical: string): Promise<Business[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businesses)
    .where(and(eq(businesses.vertical, vertical as any), eq(businesses.isActive, true)))
    .orderBy(desc(businesses.compositeScore));
}

export async function getBusinessById(id: number): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBusiness(business: InsertBusiness): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  // Calculate composite score
  const compositeScore = calculateCompositeScore(business);
  const scoreTier = getScoreTier(compositeScore);
  
  const result = await db.insert(businesses).values({
    ...business,
    compositeScore,
    scoreTier,
  }).returning();
  
  return result[0];
}

// ============ USER BUSINESS OPERATIONS ============

export async function getUserBusinesses(userId: number): Promise<(UserBusiness & { business: Business })[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select()
    .from(userBusinesses)
    .innerJoin(businesses, eq(userBusinesses.businessId, businesses.id))
    .where(eq(userBusinesses.userId, userId))
    .orderBy(desc(userBusinesses.createdAt));
  
  return result.map(r => ({ ...r.user_businesses, business: r.businesses }));
}

export async function getUserBusinessById(id: number): Promise<(UserBusiness & { business: Business }) | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(userBusinesses)
    .innerJoin(businesses, eq(userBusinesses.businessId, businesses.id))
    .where(eq(userBusinesses.id, id))
    .limit(1);
  
  if (result.length === 0) return undefined;
  return { ...result[0].user_businesses, business: result[0].businesses };
}

export async function deployBusiness(userId: number, businessId: number): Promise<UserBusiness | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(userBusinesses).values({
    userId,
    businessId,
    status: 'setup',
  }).returning();
  
  return result[0];
}

export async function updateUserBusinessStatus(id: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Partial<InsertUserBusiness> = { 
    status: status as any,
    updatedAt: new Date()
  };
  
  if (status === 'running') {
    updateData.startedAt = new Date();
  } else if (status === 'stopped' || status === 'failed') {
    updateData.stoppedAt = new Date();
  }
  
  await db.update(userBusinesses).set(updateData).where(eq(userBusinesses.id, id));
}

export async function updateUserBusinessMetrics(id: number, metrics: {
  totalRevenue?: string;
  totalTokenCost?: string;
  totalInfraCost?: string;
  netProfit?: string;
  dailyRevenue?: string;
  dailyTokenCost?: string;
  activeAgents?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(userBusinesses).set({
    ...metrics,
    lastAgentActivity: new Date(),
    updatedAt: new Date(),
  }).where(eq(userBusinesses.id, id));
}

// ============ TOKEN USAGE OPERATIONS ============

export async function logTokenUsage(usage: InsertTokenUsage): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(tokenUsage).values(usage);
}

export async function getTokenUsageByUser(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tokenUsage)
    .where(eq(tokenUsage.userId, userId))
    .orderBy(desc(tokenUsage.timestamp))
    .limit(limit);
}

export async function getTokenUsageSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    totalCost: sql<string>`COALESCE(SUM(${tokenUsage.totalCost}), 0)`,
    totalInputTokens: sql<number>`COALESCE(SUM(${tokenUsage.inputTokens}), 0)`,
    totalOutputTokens: sql<number>`COALESCE(SUM(${tokenUsage.outputTokens}), 0)`,
  }).from(tokenUsage).where(eq(tokenUsage.userId, userId));
  
  return result[0];
}

// ============ BUSINESS EVENTS OPERATIONS ============

export async function logBusinessEvent(event: InsertBusinessEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(businessEvents).values(event);
}

export async function getBusinessEvents(userBusinessId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessEvents)
    .where(eq(businessEvents.userBusinessId, userBusinessId))
    .orderBy(desc(businessEvents.timestamp))
    .limit(limit);
}

export async function getPendingInterventions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select()
    .from(businessEvents)
    .innerJoin(userBusinesses, eq(businessEvents.userBusinessId, userBusinesses.id))
    .where(and(
      eq(userBusinesses.userId, userId),
      eq(businessEvents.requiresIntervention, true),
      eq(businessEvents.resolved, false)
    ))
    .orderBy(desc(businessEvents.timestamp));
  
  return result.map(r => ({ ...r.business_events, userBusiness: r.user_businesses }));
}

// ============ API CONFIG OPERATIONS ============

export async function getApiConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiConfigs).where(eq(apiConfigs.userId, userId));
}

export async function upsertApiConfig(config: InsertApiConfig): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(apiConfigs)
    .where(and(eq(apiConfigs.userId, config.userId), eq(apiConfigs.provider, config.provider)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(apiConfigs)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(apiConfigs.id, existing[0].id));
  } else {
    await db.insert(apiConfigs).values(config);
  }
}

// ============ WEBHOOK OPERATIONS ============

export async function getWebhooks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhooks).where(eq(webhooks.userId, userId));
}

export async function createWebhook(webhook: InsertWebhook) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(webhooks).values(webhook).returning();
  return result[0];
}

export async function deleteWebhook(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.userId, userId)));
  return true;
}

// ============ DISCOVERY PRESETS OPERATIONS ============

export async function getDiscoveryPresets(userId: number): Promise<DiscoveryPreset[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(discoveryPresets)
    .where(eq(discoveryPresets.userId, userId))
    .orderBy(desc(discoveryPresets.createdAt));
}

export async function createDiscoveryPreset(userId: number, name: string, config: UserPreferences): Promise<DiscoveryPreset | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.insert(discoveryPresets).values({
      userId,
      name,
      config,
    }).returning();
    
    return result[0];
  } catch (error) {
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      throw new Error(`A preset with the name "${name}" already exists`);
    }
    throw error;
  }
}

export async function deleteDiscoveryPreset(userId: number, presetId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.delete(discoveryPresets)
    .where(and(eq(discoveryPresets.id, presetId), eq(discoveryPresets.userId, userId)));
  
  return result.rowCount > 0;
}

export async function getDiscoveryPresetCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(discoveryPresets)
    .where(eq(discoveryPresets.userId, userId));
  
  return result[0]?.count || 0;
}

export async function getDiscoveryPresetById(userId: number, presetId: number): Promise<DiscoveryPreset | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(discoveryPresets)
    .where(and(eq(discoveryPresets.id, presetId), eq(discoveryPresets.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// ============ DASHBOARD STATS ============

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const userBizs = await db.select().from(userBusinesses).where(eq(userBusinesses.userId, userId));
  
  const activeCount = userBizs.filter(b => b.status === 'running').length;
  const totalRevenue = userBizs.reduce((sum, b) => sum + parseFloat(b.totalRevenue || '0'), 0);
  const totalTokenCost = userBizs.reduce((sum, b) => sum + parseFloat(b.totalTokenCost || '0'), 0);
  const totalInfraCost = userBizs.reduce((sum, b) => sum + parseFloat(b.totalInfraCost || '0'), 0);
  const netProfit = totalRevenue - totalTokenCost - totalInfraCost;
  const totalAgents = userBizs.reduce((sum, b) => sum + (b.activeAgents || 0), 0);
  
  return {
    activeBusinesses: activeCount,
    totalBusinesses: userBizs.length,
    totalRevenue: totalRevenue.toFixed(2),
    totalTokenCost: totalTokenCost.toFixed(2),
    totalInfraCost: totalInfraCost.toFixed(2),
    netProfit: netProfit.toFixed(2),
    profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0',
    activeAgents: totalAgents,
  };
}

// ============ HELPER FUNCTIONS ============

function calculateCompositeScore(business: Partial<InsertBusiness>): number {
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
    (business.guaranteedDemand || 50) * weights.guaranteedDemand +
    (business.automationLevel || 50) * weights.automationLevel +
    (business.tokenEfficiency || 50) * weights.tokenEfficiency +
    (business.profitMargin || 50) * weights.profitMargin +
    (100 - (business.maintenanceCost || 50)) * weights.maintenanceCost +
    (100 - (business.legalRisk || 50)) * weights.legalRisk +
    (100 - (business.competitionSaturation || 50)) * weights.competitionSaturation;
  
  return Math.round(score);
}

function getScoreTier(score: number): 'prime' | 'stable' | 'experimental' | 'archived' {
  if (score >= 90) return 'prime';
  if (score >= 70) return 'stable';
  if (score >= 50) return 'experimental';
  return 'archived';
}
