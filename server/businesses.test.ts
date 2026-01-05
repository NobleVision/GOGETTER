import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getAllBusinesses: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "AI Newsletter Curator",
      description: "Automated newsletter curation using AI",
      vertical: "content_media",
      compositeScore: 85,
      scoreTier: "prime",
      guaranteedDemand: 80,
      automationLevel: 90,
      tokenEfficiency: 85,
      profitMargin: 75,
      maintenanceCost: 20,
      legalRisk: 15,
      competitionSaturation: 40,
      estimatedRevenuePerHour: "5.00",
      estimatedTokenCostPerHour: "0.50",
      estimatedInfraCostPerDay: "2.00",
      setupCost: "100.00",
      setupTimeHours: 4,
      minAgentsRequired: 1,
      recommendedModels: ["gpt-4o-mini"],
      requiredApis: ["OpenAI"],
      infraRequirements: ["Docker"],
      implementationGuide: "Step by step guide...",
      isActive: true,
    },
  ]),
  getBusinessesByVertical: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "AI Newsletter Curator",
      description: "Automated newsletter curation using AI",
      vertical: "content_media",
      compositeScore: 85,
      scoreTier: "prime",
      guaranteedDemand: 80,
      automationLevel: 90,
      tokenEfficiency: 85,
      profitMargin: 75,
      maintenanceCost: 20,
      legalRisk: 15,
      competitionSaturation: 40,
      estimatedRevenuePerHour: "5.00",
      estimatedTokenCostPerHour: "0.50",
      estimatedInfraCostPerDay: "2.00",
      setupCost: "100.00",
      setupTimeHours: 4,
      minAgentsRequired: 1,
      recommendedModels: ["gpt-4o-mini"],
      requiredApis: ["OpenAI"],
      infraRequirements: ["Docker"],
      implementationGuide: "Step by step guide...",
      isActive: true,
    },
  ]),
  getBusinessById: vi.fn().mockResolvedValue({
    id: 1,
    name: "AI Newsletter Curator",
    description: "Automated newsletter curation using AI",
    vertical: "content_media",
    compositeScore: 85,
    scoreTier: "prime",
    guaranteedDemand: 80,
    automationLevel: 90,
    tokenEfficiency: 85,
    profitMargin: 75,
    maintenanceCost: 20,
    legalRisk: 15,
    competitionSaturation: 40,
    estimatedRevenuePerHour: "5.00",
    estimatedTokenCostPerHour: "0.50",
    estimatedInfraCostPerDay: "2.00",
    setupCost: "100.00",
    setupTimeHours: 4,
    minAgentsRequired: 1,
    recommendedModels: ["gpt-4o-mini"],
    requiredApis: ["OpenAI"],
    infraRequirements: ["Docker"],
    implementationGuide: "Step by step guide...",
    isActive: true,
  }),
  getUserProfile: vi.fn().mockResolvedValue(null),
  upsertUserProfile: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    riskTolerance: "moderate",
    capitalAvailable: "10000",
    monthlyTokenBudget: "100",
    aggressiveness: "medium",
    strategyTimeframe: "medium",
    wizardCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getUserBusinesses: vi.fn().mockResolvedValue([]),
  getUserBusinessById: vi.fn().mockResolvedValue(null),
  deployBusiness: vi.fn().mockResolvedValue({ id: 1 }),
  updateUserBusinessStatus: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({
    activeBusinesses: 0,
    totalRevenue: "0.00",
    totalTokenCost: "0.00",
    netProfit: "0.00",
    activeAgents: 0,
    interventionsRequired: 0,
  }),
  getApiConfigs: vi.fn().mockResolvedValue([]),
  upsertApiConfig: vi.fn().mockResolvedValue(undefined),
  getWebhooks: vi.fn().mockResolvedValue([]),
  createWebhook: vi.fn().mockResolvedValue({ id: 1 }),
  deleteWebhook: vi.fn().mockResolvedValue(undefined),
  getBusinessEvents: vi.fn().mockResolvedValue([]),
  logBusinessEvent: vi.fn().mockResolvedValue(undefined),
  getTokenUsageByUser: vi.fn().mockResolvedValue([]),
  getTokenUsageSummary: vi.fn().mockResolvedValue({
    totalCost: "0.00",
    totalInputTokens: 0,
    totalOutputTokens: 0,
  }),
  logTokenUsage: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("businesses router", () => {
  it("lists businesses without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.businesses.list({});

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("compositeScore");
  });

  it("gets a specific business by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.businesses.get({ id: 1 });

    expect(result).toBeDefined();
    expect(result?.name).toBe("AI Newsletter Curator");
    expect(result?.compositeScore).toBe(85);
  });

  it("filters businesses by vertical", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.businesses.list({ vertical: "content_media" });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("dashboard router", () => {
  it("returns dashboard stats for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.stats();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("activeBusinesses");
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("totalTokenCost");
    expect(result).toHaveProperty("netProfit");
  });
});

describe("profile router", () => {
  it("returns null profile for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.profile.get();

    expect(result).toBeNull();
  });

  it("creates/updates user profile", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.profile.upsert({
      riskTolerance: "moderate",
      capitalAvailable: "10000",
      monthlyTokenBudget: "100",
      aggressiveness: "medium",
      strategyTimeframe: "medium",
      wizardCompleted: true,
    });

    expect(result).toBeDefined();
  });
});

describe("userBusinesses router", () => {
  it("lists user businesses for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.userBusinesses.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deploys a business for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.userBusinesses.deploy({ businessId: 1 });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
  });
});

describe("apiConfig router", () => {
  it("lists API configs for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiConfig.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates/updates API config", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiConfig.upsert({
      provider: "openai",
      apiKey: "sk-test-key",
      isActive: true,
    });

    expect(result).toBeDefined();
  });
});

describe("webhooks router", () => {
  it("lists webhooks for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhooks.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a webhook", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhooks.create({
      name: "Test Webhook",
      url: "https://example.com/webhook",
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
  });
});

describe("tokenUsage router", () => {
  it("returns token usage history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tokenUsage.history({ limit: 10 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns token usage summary", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tokenUsage.summary();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalCost");
    expect(result).toHaveProperty("totalInputTokens");
    expect(result).toHaveProperty("totalOutputTokens");
  });
});
