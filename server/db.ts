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
  discoveryPresets, InsertDiscoveryPreset, DiscoveryPreset, UserPreferences,
  subscriptions, InsertSubscription, Subscription,
  pipelineProjects, InsertPipelineProject, PipelineProject,
  pipelineEvents, InsertPipelineEvent, PipelineEvent,
  type PipelineMetadata,
  verificationCodes,
  type UserPermissions,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import {
  SUBSCRIPTION_TIERS,
  MVP_EXPIRY_DAYS,
  STAGING_EXPIRY_DAYS,
  RETAINER_MINIMUM,
} from "@shared/const";
import { ilike, or } from "drizzle-orm";
import { randomInt } from "crypto";

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
      // Update existing Google user + ensure master admin flag
      const isMaster = user.email === ENV.masterAdminEmail;
      await db.update(users).set({
        name: user.name,
        email: user.email,
        pictureUrl: user.pictureUrl,
        lastSignedIn: user.lastSignedIn,
        updatedAt: new Date(),
        ...(isMaster && {
          isMasterAdmin: true,
          role: "admin" as const,
        }),
      }).where(eq(users.googleId, user.googleId));
      return;
    }

    // Check if user exists by email (for account linking)
    const existingByEmail = await getUserByEmail(user.email);

    if (existingByEmail) {
      // Link Google account to existing user
      // IMPORTANT: Also update openId to the Google format so session lookup works
      const currentProviders = existingByEmail.authProviders || [];
      const updatedProviders = currentProviders.includes("google")
        ? currentProviders
        : [...currentProviders, "google"];

      console.log(`[Database] Linking Google account to existing user: email=${user.email}, oldOpenId=${existingByEmail.openId}, newOpenId=${user.openId}`);

      await db.update(users).set({
        openId: user.openId, // Update openId to Google format for session lookup
        googleId: user.googleId,
        pictureUrl: user.pictureUrl || existingByEmail.pictureUrl,
        authProviders: updatedProviders,
        lastSignedIn: user.lastSignedIn,
        updatedAt: new Date(),
      }).where(eq(users.id, existingByEmail.id));
      return;
    }

    // Create new user with Google data
    const isMaster = user.email === ENV.masterAdminEmail;
    const role =
      isMaster || user.openId === ENV.ownerOpenId ? "admin" : "user";
    await db.insert(users).values({
      openId: user.openId,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      pictureUrl: user.pictureUrl,
      loginMethod: user.loginMethod,
      authProviders: ["google"],
      emailVerified: true,
      role: role,
      isMasterAdmin: isMaster,
      lastSignedIn: user.lastSignedIn,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert Google user:", error);
    throw error;
  }
}

/**
 * Link Google account to existing user
 * Requirement 8.2: Allow linking additional OAuth providers
 */
export async function linkGoogleAccount(userId: number, googleData: {
  googleId: string;
  pictureUrl: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  try {
    // Get current user to check existing providers
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentProviders = user.authProviders || [];
    const updatedProviders = currentProviders.includes("google")
      ? currentProviders
      : [...currentProviders, "google"];

    // Update user with Google data
    await db.update(users).set({
      googleId: googleData.googleId,
      pictureUrl: googleData.pictureUrl || user.pictureUrl,
      authProviders: updatedProviders,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    return await getUserById(userId);
  } catch (error) {
    console.error("[DB] Failed to link Google account:", error);
    throw error;
  }
}

// ============ NATIVE EMAIL AUTH OPERATIONS ============

export async function createNativeUser(data: {
  email: string;
  passwordHash: string;
  name: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const openId = `email_${data.email}`;
  const [inserted] = await db
    .insert(users)
    .values({
      openId,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      loginMethod: "email",
      authProviders: ["email"],
      emailVerified: false,
      role: "user",
    })
    .returning();
  return inserted;
}

export async function createVerificationCode(
  email: string,
  type: string = "email_verification"
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing unused codes for this email+type
  await db
    .update(verificationCodes)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.type, type),
        sql`${verificationCodes.usedAt} IS NULL`
      )
    );

  await db.insert(verificationCodes).values({
    email,
    code,
    type,
    expiresAt,
  });

  return code;
}

export async function verifyCode(
  email: string,
  code: string,
  type: string = "email_verification"
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code),
        eq(verificationCodes.type, type),
        sql`${verificationCodes.usedAt} IS NULL`,
        sql`${verificationCodes.expiresAt} > NOW()`
      )
    )
    .limit(1);

  if (result.length === 0) return false;

  // Mark as used
  await db
    .update(verificationCodes)
    .set({ usedAt: new Date() })
    .where(eq(verificationCodes.id, result[0].id));

  return true;
}

export async function setEmailVerified(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function updateUserPermissions(
  userId: number,
  permissions: Partial<UserPermissions>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  const currentPerms = (user.permissions ?? {}) as UserPermissions;
  const merged = { ...currentPerms, ...permissions };

  await db
    .update(users)
    .set({ permissions: merged, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getAllUsersForAdmin(filters?: {
  search?: string;
  role?: "user" | "admin";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };

  const conditions = [];

  if (filters?.search && filters.search.length >= 2) {
    conditions.push(
      or(
        ilike(users.name, `%${filters.search}%`),
        ilike(users.email, `%${filters.search}%`)
      )
    );
  }

  if (filters?.role) {
    conditions.push(eq(users.role, filters.role));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult, userRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        pictureUrl: users.pictureUrl,
        loginMethod: users.loginMethod,
        emailVerified: users.emailVerified,
        permissions: users.permissions,
        isMasterAdmin: users.isMasterAdmin,
        lastSignedIn: users.lastSignedIn,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.lastSignedIn))
      .limit(filters?.limit ?? 50)
      .offset(filters?.offset ?? 0),
  ]);

  return {
    users: userRows,
    total: Number(countResult[0]?.count ?? 0),
  };
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

/**
 * Token usage time-series aggregation
 * Requirements 6.2, 6.3: Support aggregation by provider and time groupings
 */
export async function getTokenUsageTimeSeries(
  userId: number,
  timeRange: '7d' | '30d' | '90d',
  grouping: 'day' | 'week' | 'month'
) {
  const db = await getDb();
  if (!db) return { byProvider: [], total: [] };

  // Calculate the start time based on time range
  const now = new Date();
  let startTime: Date;
  
  switch (timeRange) {
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
  }

  // Determine the SQL date truncation function based on grouping
  let dateTrunc: string;
  switch (grouping) {
    case 'day':
      dateTrunc = "date_trunc('day', timestamp)";
      break;
    case 'week':
      dateTrunc = "date_trunc('week', timestamp)";
      break;
    case 'month':
      dateTrunc = "date_trunc('month', timestamp)";
      break;
  }

  // Query for aggregated data by provider
  const byProviderQuery = await db.select({
    timestamp: sql<Date>`${sql.raw(dateTrunc)}`,
    modelProvider: tokenUsage.modelProvider,
    totalCost: sql<string>`COALESCE(SUM(${tokenUsage.totalCost}), 0)`,
    inputTokens: sql<number>`COALESCE(SUM(${tokenUsage.inputTokens}), 0)`,
    outputTokens: sql<number>`COALESCE(SUM(${tokenUsage.outputTokens}), 0)`,
  })
  .from(tokenUsage)
  .where(and(
    eq(tokenUsage.userId, userId),
    sql`${tokenUsage.timestamp} >= ${startTime.toISOString()}`
  ))
  .groupBy(sql.raw(dateTrunc), tokenUsage.modelProvider)
  .orderBy(sql.raw(dateTrunc), tokenUsage.modelProvider);

  // Query for total aggregated data (all providers combined)
  const totalQuery = await db.select({
    timestamp: sql<Date>`${sql.raw(dateTrunc)}`,
    totalCost: sql<string>`COALESCE(SUM(${tokenUsage.totalCost}), 0)`,
    inputTokens: sql<number>`COALESCE(SUM(${tokenUsage.inputTokens}), 0)`,
    outputTokens: sql<number>`COALESCE(SUM(${tokenUsage.outputTokens}), 0)`,
  })
  .from(tokenUsage)
  .where(and(
    eq(tokenUsage.userId, userId),
    sql`${tokenUsage.timestamp} >= ${startTime.toISOString()}`
  ))
  .groupBy(sql.raw(dateTrunc))
  .orderBy(sql.raw(dateTrunc));

  // Convert to the expected format
  const byProvider = byProviderQuery.map(row => ({
    timestamp: row.timestamp,
    modelProvider: row.modelProvider,
    totalCost: parseFloat(row.totalCost),
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
  }));

  const total = totalQuery.map(row => ({
    timestamp: row.timestamp,
    totalCost: parseFloat(row.totalCost),
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
  }));

  return {
    byProvider,
    total,
  };
}

// ============ BUSINESS EVENTS OPERATIONS ============

export async function logBusinessEvent(event: InsertBusinessEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Requirements 7.1, 7.2: Ensure event storage completeness
  // Validate that revenue and cost events have required fields
  if (event.eventType === 'revenue' || event.eventType === 'cost') {
    if (!event.amount || parseFloat(event.amount) < 0) {
      throw new Error(`${event.eventType} events must have a valid positive amount`);
    }
  }

  // Ensure timestamp is present (will use defaultNow if not provided)
  const eventToInsert = {
    ...event,
    timestamp: event.timestamp || new Date(),
  };

  await db.insert(businessEvents).values(eventToInsert);
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

/**
 * Time-series aggregation for business events
 * Requirements 7.3, 7.4: Support time range filtering and aggregation by time period
 */
export async function getAggregatedEvents(
  userBusinessId: number, 
  timeRange: '24h' | '7d' | '30d' | '90d',
  grouping: 'hour' | 'day' | 'week'
) {
  const db = await getDb();
  if (!db) return { revenue: [], costs: [], profit: [] };

  // Calculate the start time based on time range
  const now = new Date();
  let startTime: Date;
  
  switch (timeRange) {
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
  }

  // Determine the SQL date truncation function based on grouping
  let dateTrunc: string;
  switch (grouping) {
    case 'hour':
      dateTrunc = "date_trunc('hour', timestamp)";
      break;
    case 'day':
      dateTrunc = "date_trunc('day', timestamp)";
      break;
    case 'week':
      dateTrunc = "date_trunc('week', timestamp)";
      break;
  }

  // Query for revenue events
  const revenueQuery = await db.select({
    timestamp: sql<Date>`${sql.raw(dateTrunc)}`,
    value: sql<string>`COALESCE(SUM(${businessEvents.amount}), 0)`,
  })
  .from(businessEvents)
  .where(and(
    eq(businessEvents.userBusinessId, userBusinessId),
    eq(businessEvents.eventType, 'revenue'),
    sql`${businessEvents.timestamp} >= ${startTime.toISOString()}`
  ))
  .groupBy(sql.raw(dateTrunc))
  .orderBy(sql.raw(dateTrunc));

  // Query for cost events
  const costQuery = await db.select({
    timestamp: sql<Date>`${sql.raw(dateTrunc)}`,
    value: sql<string>`COALESCE(SUM(${businessEvents.amount}), 0)`,
  })
  .from(businessEvents)
  .where(and(
    eq(businessEvents.userBusinessId, userBusinessId),
    eq(businessEvents.eventType, 'cost'),
    sql`${businessEvents.timestamp} >= ${startTime.toISOString()}`
  ))
  .groupBy(sql.raw(dateTrunc))
  .orderBy(sql.raw(dateTrunc));

  // Convert to the expected format
  const revenue = revenueQuery.map(row => ({
    timestamp: row.timestamp,
    value: parseFloat(row.value),
  }));

  const costs = costQuery.map(row => ({
    timestamp: row.timestamp,
    value: parseFloat(row.value),
  }));

  // Calculate profit by combining revenue and costs
  const profitMap = new Map<string, number>();
  
  // Add revenue (positive contribution to profit)
  revenue.forEach(point => {
    const key = point.timestamp.toISOString();
    profitMap.set(key, (profitMap.get(key) || 0) + point.value);
  });

  // Subtract costs (negative contribution to profit)
  costs.forEach(point => {
    const key = point.timestamp.toISOString();
    profitMap.set(key, (profitMap.get(key) || 0) - point.value);
  });

  // Convert profit map to array and sort by timestamp
  const profit = Array.from(profitMap.entries())
    .map(([timestamp, value]) => ({
      timestamp: new Date(timestamp),
      value,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return {
    revenue,
    costs,
    profit,
  };
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
  
  return (result.rowCount ?? 0) > 0;
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

function calculateProfitTimeDimensions(business: Partial<InsertBusiness>): {
  estimatedRevenuePerDay: string;
  estimatedRevenuePerWeek: string;
  estimatedTokenCostPerDay: string;
  estimatedTokenCostPerWeek: string;
  estimatedInfraCostPerWeek: string;
  estimatedProfitPerHour: string;
  estimatedProfitPerDay: string;
  estimatedProfitPerWeek: string;
} {
  const revenuePerHour = parseFloat(business.estimatedRevenuePerHour || '0');
  const tokenCostPerHour = parseFloat(business.estimatedTokenCostPerHour || '0');
  const infraCostPerDay = parseFloat(business.estimatedInfraCostPerDay || '0');
  
  const revenuePerDay = revenuePerHour * 24;
  const revenuePerWeek = revenuePerDay * 7;
  const tokenCostPerDay = tokenCostPerHour * 24;
  const tokenCostPerWeek = tokenCostPerDay * 7;
  const infraCostPerWeek = infraCostPerDay * 7;
  
  const profitPerHour = revenuePerHour - tokenCostPerHour - (infraCostPerDay / 24);
  const profitPerDay = revenuePerDay - tokenCostPerDay - infraCostPerDay;
  const profitPerWeek = revenuePerWeek - tokenCostPerWeek - infraCostPerWeek;
  
  return {
    estimatedRevenuePerDay: revenuePerDay.toFixed(2),
    estimatedRevenuePerWeek: revenuePerWeek.toFixed(2),
    estimatedTokenCostPerDay: tokenCostPerDay.toFixed(2),
    estimatedTokenCostPerWeek: tokenCostPerWeek.toFixed(2),
    estimatedInfraCostPerWeek: infraCostPerWeek.toFixed(2),
    estimatedProfitPerHour: profitPerHour.toFixed(4),
    estimatedProfitPerDay: profitPerDay.toFixed(2),
    estimatedProfitPerWeek: profitPerWeek.toFixed(2),
  };
}

// ============ SAVE AI-DISCOVERED BUSINESS TO CATALOG ============

export async function saveDiscoveredBusiness(
  userId: number,
  opportunity: {
    name: string;
    description: string;
    vertical: string;
    scores: {
      guaranteedDemand: number;
      automationLevel: number;
      tokenEfficiency: number;
      profitMargin: number;
      maintenanceCost: number;
      legalRisk: number;
      competitionSaturation: number;
      compositeScore: number;
    };
    estimatedRevenue: number;
    estimatedCosts: number;
    implementationGuide?: string;
    requiredApis?: string[];
    infraRequirements?: string[];
    setupTimeHours?: number;
    minAgentsRequired?: number;
    recommendedModels?: string[];
    agentPrompt?: string;
  }
): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const compositeScore = opportunity.scores.compositeScore;
  const scoreTier = getScoreTier(compositeScore);
  
  const revenuePerHour = opportunity.estimatedRevenue / (24 * 30);
  const costPerHour = opportunity.estimatedCosts / (24 * 30);
  const infraCostPerDay = opportunity.estimatedCosts * 0.3 / 30;
  
  const businessData: InsertBusiness = {
    name: opportunity.name,
    description: opportunity.description,
    vertical: opportunity.vertical as any,
    guaranteedDemand: opportunity.scores.guaranteedDemand,
    automationLevel: opportunity.scores.automationLevel,
    tokenEfficiency: opportunity.scores.tokenEfficiency,
    profitMargin: opportunity.scores.profitMargin,
    maintenanceCost: opportunity.scores.maintenanceCost,
    legalRisk: opportunity.scores.legalRisk,
    competitionSaturation: opportunity.scores.competitionSaturation,
    compositeScore,
    scoreTier,
    estimatedRevenuePerHour: revenuePerHour.toFixed(4),
    estimatedTokenCostPerHour: costPerHour.toFixed(4),
    estimatedInfraCostPerDay: infraCostPerDay.toFixed(2),
    setupTimeHours: opportunity.setupTimeHours || 2,
    minAgentsRequired: opportunity.minAgentsRequired || 1,
    recommendedModels: opportunity.recommendedModels || [],
    implementationGuide: opportunity.implementationGuide || '',
    requiredApis: opportunity.requiredApis || [],
    infraRequirements: opportunity.infraRequirements || [],
    agentPrompt: opportunity.agentPrompt || '',
    source: 'ai_discovered',
    discoveredByUserId: userId,
    discoveredAt: new Date(),
    isActive: true,
  };
  
  const profitDimensions = calculateProfitTimeDimensions(businessData);
  
  const result = await db.insert(businesses).values({
    ...businessData,
    ...profitDimensions,
  }).returning();
  
  return result[0];
}

// ============ REFRESH BUSINESS DETAILS ============

export async function updateBusinessDetails(
  id: number,
  updates: Partial<InsertBusiness>
): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const compositeScore = updates.guaranteedDemand ? calculateCompositeScore(updates) : undefined;
  const scoreTier = compositeScore ? getScoreTier(compositeScore) : undefined;
  const profitDimensions = updates.estimatedRevenuePerHour ? calculateProfitTimeDimensions(updates) : {};
  
  await db.update(businesses).set({
    ...updates,
    ...(compositeScore && { compositeScore, scoreTier }),
    ...profitDimensions,
    lastRefreshedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(businesses.id, id));
  
  return getBusinessById(id);
}

// ============ UPDATE DEPLOY TRACKING ============

export async function updateBusinessLastDeployed(businessId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(businesses).set({
    lastDeployedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(businesses.id, businessId));
}

// ============ ADMIN MANAGEMENT OPERATIONS ============

export async function getAllAdmins() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      pictureUrl: users.pictureUrl,
      isMasterAdmin: users.isMasterAdmin,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(eq(users.role, "admin"))
    .orderBy(desc(users.isMasterAdmin), desc(users.lastSignedIn));
}

export async function searchUsers(
  search: string,
  limit: number = 20
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      pictureUrl: users.pictureUrl,
      role: users.role,
    })
    .from(users)
    .where(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    )
    .limit(limit);
}

export async function promoteToAdmin(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function demoteFromAdmin(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Guard: cannot demote master admin
  const user = await getUserById(userId);
  if (user?.isMasterAdmin) {
    throw new Error("Cannot demote the master admin");
  }

  await db
    .update(users)
    .set({ role: "user", updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// ============ PIPELINE PROJECT OPERATIONS ============

export async function createPipelineProject(
  project: InsertPipelineProject
): Promise<PipelineProject> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(pipelineProjects)
    .values(project)
    .returning();

  // Log creation event
  await logPipelineEvent({
    projectId: result[0].id,
    adminId: project.adminId,
    eventType: "project_created",
    toPhase: 0,
    notes: `Project "${project.businessName}" created`,
  });

  return result[0];
}

export async function getPipelineProjects(
  filters?: {
    phase?: number;
    status?: string;
    adminId?: number;
    search?: string;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.phase !== undefined) {
    conditions.push(eq(pipelineProjects.phase, filters.phase));
  }
  if (filters?.status) {
    conditions.push(
      eq(pipelineProjects.status, filters.status as any)
    );
  }
  if (filters?.adminId) {
    conditions.push(eq(pipelineProjects.adminId, filters.adminId));
  }
  if (filters?.search) {
    conditions.push(
      or(
        ilike(pipelineProjects.businessName, `%${filters.search}%`),
        ilike(pipelineProjects.pocName, `%${filters.search}%`),
        ilike(pipelineProjects.pocEmail, `%${filters.search}%`)
      )!
    );
  }

  const where =
    conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: pipelineProjects.id,
      userId: pipelineProjects.userId,
      adminId: pipelineProjects.adminId,
      businessName: pipelineProjects.businessName,
      pocName: pipelineProjects.pocName,
      pocEmail: pipelineProjects.pocEmail,
      pocPhone: pipelineProjects.pocPhone,
      referralSource: pipelineProjects.referralSource,
      phase: pipelineProjects.phase,
      status: pipelineProjects.status,
      description: pipelineProjects.description,
      retainerPaid: pipelineProjects.retainerPaid,
      retainerAmount: pipelineProjects.retainerAmount,
      profitSharePercentage: pipelineProjects.profitSharePercentage,
      isGrandfathered: pipelineProjects.isGrandfathered,
      subscriptionTier: pipelineProjects.subscriptionTier,
      mvpUrl: pipelineProjects.mvpUrl,
      mvpExpiresAt: pipelineProjects.mvpExpiresAt,
      stagingExpiresAt: pipelineProjects.stagingExpiresAt,
      addOns: pipelineProjects.addOns,
      startedAt: pipelineProjects.startedAt,
      createdAt: pipelineProjects.createdAt,
      updatedAt: pipelineProjects.updatedAt,
      adminName: users.name,
      adminEmail: users.email,
    })
    .from(pipelineProjects)
    .leftJoin(users, eq(pipelineProjects.adminId, users.id))
    .where(where)
    .orderBy(desc(pipelineProjects.updatedAt));
}

export async function getPipelineProjectById(
  id: number
): Promise<
  | (PipelineProject & { adminName: string | null; adminEmail: string | null })
  | undefined
> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      id: pipelineProjects.id,
      userId: pipelineProjects.userId,
      adminId: pipelineProjects.adminId,
      businessName: pipelineProjects.businessName,
      pocName: pipelineProjects.pocName,
      pocEmail: pipelineProjects.pocEmail,
      pocPhone: pipelineProjects.pocPhone,
      referralSource: pipelineProjects.referralSource,
      phase: pipelineProjects.phase,
      status: pipelineProjects.status,
      description: pipelineProjects.description,
      cloudinaryFolder: pipelineProjects.cloudinaryFolder,
      startedAt: pipelineProjects.startedAt,
      metadata: pipelineProjects.metadata,
      subscriptionTier: pipelineProjects.subscriptionTier,
      retainerPaid: pipelineProjects.retainerPaid,
      retainerAmount: pipelineProjects.retainerAmount,
      agreementsSigned: pipelineProjects.agreementsSigned,
      profitSharePercentage: pipelineProjects.profitSharePercentage,
      isGrandfathered: pipelineProjects.isGrandfathered,
      mvpUrl: pipelineProjects.mvpUrl,
      mvpExpiresAt: pipelineProjects.mvpExpiresAt,
      stagingExpiresAt: pipelineProjects.stagingExpiresAt,
      addOns: pipelineProjects.addOns,
      createdAt: pipelineProjects.createdAt,
      updatedAt: pipelineProjects.updatedAt,
      adminName: users.name,
      adminEmail: users.email,
    })
    .from(pipelineProjects)
    .leftJoin(users, eq(pipelineProjects.adminId, users.id))
    .where(eq(pipelineProjects.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updatePipelineProject(
  id: number,
  updates: Partial<InsertPipelineProject>
): Promise<PipelineProject | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(pipelineProjects)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(pipelineProjects.id, id));

  const result = await db
    .select()
    .from(pipelineProjects)
    .where(eq(pipelineProjects.id, id))
    .limit(1);
  return result[0];
}

export async function advancePipelinePhase(
  id: number,
  adminId: number,
  notes?: string
): Promise<PipelineProject> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const project = await db
    .select()
    .from(pipelineProjects)
    .where(eq(pipelineProjects.id, id))
    .limit(1);
  if (!project.length) throw new Error("Project not found");

  const current = project[0];
  if (current.phase >= 6) throw new Error("Already at final phase");

  const nextPhase = current.phase + 1;

  // Business rule enforcement
  if (nextPhase === 1 && !current.pocName) {
    throw new Error("POC name is required to advance to IDEA phase");
  }

  if (nextPhase === 4) {
    if (!current.retainerPaid) {
      throw new Error(
        "Retainer must be paid to advance to ACTIVATE phase"
      );
    }
    if (
      parseFloat(current.retainerAmount ?? "0") < RETAINER_MINIMUM
    ) {
      throw new Error(
        `Minimum retainer of $${RETAINER_MINIMUM.toLocaleString()} required`
      );
    }
  }

  const updateData: Partial<InsertPipelineProject> = {
    phase: nextPhase,
    updatedAt: new Date(),
  };

  // Set expiration dates
  if (nextPhase === 3) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + MVP_EXPIRY_DAYS);
    updateData.mvpExpiresAt = expiry;
  }
  if (nextPhase === 4) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + STAGING_EXPIRY_DAYS);
    updateData.stagingExpiresAt = expiry;
  }

  await db
    .update(pipelineProjects)
    .set(updateData)
    .where(eq(pipelineProjects.id, id));

  await logPipelineEvent({
    projectId: id,
    adminId,
    eventType: "phase_advance",
    fromPhase: current.phase,
    toPhase: nextPhase,
    notes,
  });

  const updated = await db
    .select()
    .from(pipelineProjects)
    .where(eq(pipelineProjects.id, id))
    .limit(1);
  return updated[0];
}

export async function regressPipelinePhase(
  id: number,
  adminId: number,
  notes?: string
): Promise<PipelineProject> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const project = await db
    .select()
    .from(pipelineProjects)
    .where(eq(pipelineProjects.id, id))
    .limit(1);
  if (!project.length) throw new Error("Project not found");

  const current = project[0];
  if (current.phase <= 0)
    throw new Error("Already at initial phase");

  const prevPhase = current.phase - 1;

  await db
    .update(pipelineProjects)
    .set({ phase: prevPhase, updatedAt: new Date() })
    .where(eq(pipelineProjects.id, id));

  await logPipelineEvent({
    projectId: id,
    adminId,
    eventType: "phase_regress",
    fromPhase: current.phase,
    toPhase: prevPhase,
    notes,
  });

  const updated = await db
    .select()
    .from(pipelineProjects)
    .where(eq(pipelineProjects.id, id))
    .limit(1);
  return updated[0];
}

export async function deletePipelineProject(
  id: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(pipelineProjects)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(pipelineProjects.id, id));
}

// ============ PIPELINE EVENTS OPERATIONS ============

export async function logPipelineEvent(
  event: InsertPipelineEvent
): Promise<PipelineEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(pipelineEvents)
    .values(event)
    .returning();
  return result[0];
}

export async function getPipelineEvents(
  projectId: number,
  limit: number = 50
): Promise<PipelineEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(pipelineEvents)
    .where(eq(pipelineEvents.projectId, projectId))
    .orderBy(desc(pipelineEvents.createdAt))
    .limit(limit);
}

export async function getRecentPipelineEvents(
  limit: number = 20
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: pipelineEvents.id,
      projectId: pipelineEvents.projectId,
      adminId: pipelineEvents.adminId,
      eventType: pipelineEvents.eventType,
      fromPhase: pipelineEvents.fromPhase,
      toPhase: pipelineEvents.toPhase,
      notes: pipelineEvents.notes,
      createdAt: pipelineEvents.createdAt,
      businessName: pipelineProjects.businessName,
      adminName: users.name,
    })
    .from(pipelineEvents)
    .leftJoin(
      pipelineProjects,
      eq(pipelineEvents.projectId, pipelineProjects.id)
    )
    .leftJoin(users, eq(pipelineEvents.adminId, users.id))
    .orderBy(desc(pipelineEvents.createdAt))
    .limit(limit);
}

// ============ PIPELINE STATS ============

export async function getPipelineStats() {
  const db = await getDb();
  if (!db)
    return {
      total: 0,
      byPhase: [],
      byStatus: [],
    };

  const allProjects = await db
    .select()
    .from(pipelineProjects);

  const byPhase = [0, 1, 2, 3, 4, 5, 6].map((phase) => ({
    phase,
    count: allProjects.filter((p) => p.phase === phase).length,
  }));

  const statuses = ["active", "suspended", "completed", "cancelled"];
  const byStatus = statuses.map((status) => ({
    status,
    count: allProjects.filter((p) => p.status === status).length,
  }));

  const activeProjects = allProjects.filter(
    (p) => p.status === "active"
  );
  const totalRetainers = activeProjects.reduce(
    (sum, p) =>
      sum + (p.retainerPaid ? parseFloat(p.retainerAmount ?? "0") : 0),
    0
  );

  return {
    total: allProjects.length,
    active: activeProjects.length,
    byPhase,
    byStatus,
    totalRetainers,
  };
}

// ============ SUBSCRIPTION OPERATIONS ============

export async function getOrCreateSubscription(
  userId: number
): Promise<Subscription> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const tier = SUBSCRIPTION_TIERS.free;
  const result = await db
    .insert(subscriptions)
    .values({
      userId,
      tier: "free",
      monthlyPrice: String(tier.price),
      wizardUsesLimit: tier.wizardUses,
      tokenRateLimit: tier.tokenRateLimit,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ),
    })
    .returning();

  return result[0];
}

export async function updateSubscription(
  userId: number,
  tierKey: keyof typeof SUBSCRIPTION_TIERS
): Promise<Subscription> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tier = SUBSCRIPTION_TIERS[tierKey];

  // Ensure subscription exists
  await getOrCreateSubscription(userId);

  await db
    .update(subscriptions)
    .set({
      tier: tierKey,
      monthlyPrice: String(tier.price),
      wizardUsesLimit: tier.wizardUses,
      tokenRateLimit: tier.tokenRateLimit,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return result[0];
}

export async function checkWizardLimit(
  userId: number
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const sub = await getOrCreateSubscription(userId);
  const remaining = sub.wizardUsesLimit - sub.wizardUsesThisMonth;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit: sub.wizardUsesLimit,
  };
}

export async function incrementWizardUsage(
  userId: number
): Promise<{ remaining: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(subscriptions)
    .set({
      wizardUsesThisMonth: sql`${subscriptions.wizardUsesThisMonth} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));

  const check = await checkWizardLimit(userId);
  return { remaining: check.remaining };
}
