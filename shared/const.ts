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
    monthlyCredits: 10,
    activeBusinesses: 0,
    wizardUses: 1,
    tokenRateLimit: 1000,
    description: "Browse GoGetterOS with one free wizard run and 10 starter credits.",
  },
  launch_pass: {
    name: "Launch Pass",
    price: 149,
    monthlyCredits: 100,
    activeBusinesses: 1,
    wizardUses: 5,
    tokenRateLimit: 5000,
    description: "One-time access for one business through Genesis to Prototype.",
  },
  starter: {
    name: "Starter",
    price: 99,
    monthlyCredits: 100,
    activeBusinesses: 1,
    wizardUses: 5,
    tokenRateLimit: 5000,
    description: "Monthly access for one active business with 100 credits.",
  },
  pro: {
    name: "Pro",
    price: 499,
    monthlyCredits: 500,
    activeBusinesses: 5,
    wizardUses: 20,
    tokenRateLimit: 25000,
    description: "Scale up to five active businesses with advanced product features.",
  },
  enterprise: {
    name: "Enterprise",
    price: 10000,
    monthlyCredits: 999999,
    activeBusinesses: 999999,
    wizardUses: 999999,
    tokenRateLimit: 100000,
    description: "Retainer-based real deployment, scaling, and professional services.",
  },
  unlimited: {
    name: "Legacy Unlimited",
    price: 1000,
    monthlyCredits: 999999,
    activeBusinesses: 999999,
    wizardUses: 999999,
    tokenRateLimit: 100000,
    description: "Legacy unlimited tier retained for backward compatibility.",
  },
} as const;

export type SubscriptionTierKey = keyof typeof SUBSCRIPTION_TIERS;

// ============ PIPELINE CONSTANTS ============

export const PHASE_NAMES = [
  "Genesis",
  "Spark",
  "Blueprint",
  "Prototype",
  "Momentum",
  "Deploy",
  "Hero",
] as const;

export const PHASE_DESCRIPTIONS = [
  "Establish your account and move from casual visitor to active participant.",
  "Discover or refine the business idea that best fits your goals and constraints.",
  "Use adaptive AI planning to compare opportunities, prompts, timelines, and economics.",
  "Launch a hosted MVP with mock data and refine it through prompts and AI voice feedback.",
  "Retainer-only real deployment, monitoring, scaling, and operational growth.",
  "Production handoff, infrastructure hardening, and business rollout.",
  "Graduation into autonomous, compounding business ownership.",
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
