export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// ============ SUBSCRIPTION TIERS ============

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    wizardUses: 1,
    tokenRateLimit: 1000,
    description: "Try GoGetter OS with 1 free Business Wizard usage",
  },
  starter: {
    name: "Starter",
    price: 100,
    wizardUses: 5,
    tokenRateLimit: 5000,
    description: "5 Business Wizard usages per month",
  },
  pro: {
    name: "Pro",
    price: 500,
    wizardUses: 20,
    tokenRateLimit: 25000,
    description: "20 Business Wizard usages per month",
  },
  unlimited: {
    name: "Unlimited",
    price: 1000,
    wizardUses: 999999,
    tokenRateLimit: 100000,
    description: "Unlimited Business Wizard usages with token rate limits",
  },
} as const;

export type SubscriptionTierKey = keyof typeof SUBSCRIPTION_TIERS;

// ============ PIPELINE CONSTANTS ============

export const PHASE_NAMES = [
  "ZERO",
  "IDEA",
  "PLAN",
  "MVP",
  "ACTIVATE",
  "DEPLOY",
  "HERO",
] as const;

export const PHASE_DESCRIPTIONS = [
  "Lead Generation & Initialization",
  "Discovery & Information Gathering",
  "AI-Enhanced Planning & Strategy",
  "Minimum Viable Product",
  "Staging & Refinement",
  "Production & Handover",
  "Graduation & Independence",
] as const;

// ============ BUSINESS RULES ============

export const PROFIT_SHARE_TIERS = [
  { threshold: 0, percentage: 40 },
  { threshold: 10_000_000, percentage: 30 },
  { threshold: 50_000_000, percentage: 25 },
] as const;

export const GRANDFATHERED_SHARE = {
  withoutRetainer: 70,
  withRetainer: 50,
} as const;

export const BUYOUT_FEE = 100_000;
export const RETAINER_MINIMUM = 10_000;
export const ADD_ON_PRICE = 10_000;
export const PROFESSIONAL_SERVICES_RATE = 250; // per hour
export const MVP_EXPIRY_DAYS = 90;
export const STAGING_EXPIRY_DAYS = 90;
