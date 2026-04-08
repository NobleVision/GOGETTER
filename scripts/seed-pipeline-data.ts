/**
 * Seed Script: 15 Mock Micro-Businesses with Full Pipeline Data
 *
 * Populates all major tables for admin dashboard and monitoring testing:
 *   users, businesses, user_businesses, pipeline_projects, pipeline_events,
 *   business_events, token_usage, subscriptions
 *
 * Run:  npx tsx scripts/seed-pipeline-data.ts
 */
import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import {
  users,
  businesses,
  userBusinesses,
  pipelineProjects,
  pipelineEvents,
  businessEvents,
  tokenUsage,
  subscriptions,
} from "../drizzle/schema";
import type {
  InsertUser,
  InsertBusiness,
  InsertUserBusiness,
  InsertPipelineProject,
  InsertPipelineEvent,
  InsertBusinessEvent,
  InsertTokenUsage,
  InsertSubscription,
  PipelineMetadata,
  PipelineAddOns,
  PipelineAgreements,
} from "../drizzle/schema";
import { SUBSCRIPTION_TIERS } from "../shared/const";

// ─── Helpers ────────────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randDec = (min: number, max: number, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function compositeScore(b: {
  guaranteedDemand: number;
  automationLevel: number;
  tokenEfficiency: number;
  profitMargin: number;
  maintenanceCost: number;
  legalRisk: number;
  competitionSaturation: number;
}): number {
  return Math.round(
    b.guaranteedDemand * 0.2 +
      b.automationLevel * 0.15 +
      b.tokenEfficiency * 0.15 +
      b.profitMargin * 0.15 +
      (100 - b.maintenanceCost) * 0.1 +
      (100 - b.legalRisk) * 0.1 +
      (100 - b.competitionSaturation) * 0.1
  );
}

function scoreTier(s: number): "prime" | "stable" | "experimental" | "archived" {
  if (s >= 90) return "prime";
  if (s >= 70) return "stable";
  if (s >= 50) return "experimental";
  return "archived";
}

// ─── BUSINESS DEFINITIONS ───────────────────────────────────────────────────

type Vertical = "content_media" | "digital_services" | "ecommerce" | "data_insights";
type BizStatus = "setup" | "running" | "paused" | "stopped";
type PipeStatus = "active" | "completed";
type SubTier = "free" | "starter" | "pro" | "unlimited";

interface BusinessDef {
  name: string;
  description: string;
  vertical: Vertical;
  phase: number;
  pipelineStatus: PipeStatus;
  bizStatus: BizStatus;
  subTier: SubTier;
  pocName: string;
  pocEmail: string;
  pocPhone: string;
  referralSource: string;
  scores: {
    guaranteedDemand: number;
    automationLevel: number;
    tokenEfficiency: number;
    profitMargin: number;
    maintenanceCost: number;
    legalRisk: number;
    competitionSaturation: number;
  };
  revenuePerHour: number;
  tokenCostPerHour: number;
  infraCostPerDay: number;
  setupCost: number;
  setupTimeHours: number;
  minAgents: number;
  models: string[];
  apis: string[];
  infra: string[];
  activeAgents: number;
  totalRevenue: number;
  totalTokenCost: number;
  totalInfraCost: number;
  retainerPaid: boolean;
  retainerAmount: number;
  profitSharePct: number;
  isGrandfathered: boolean;
  addOns: PipelineAddOns;
  mvpUrl?: string;
}

const BUSINESSES: BusinessDef[] = [
  // ── Phase 0 — ZERO (Lead Gen) ──────────────────────────────
  {
    name: "AI Pet Care Subscription Box",
    description: "Curated monthly pet care boxes with AI-personalized product selection based on pet breed, age, health conditions, and owner preferences. Uses ML to optimize supplier margins and predict churn.",
    vertical: "ecommerce",
    phase: 0, pipelineStatus: "active", bizStatus: "setup", subTier: "free",
    pocName: "Jordan Martinez", pocEmail: "jordan@petbox.co", pocPhone: "+1-555-0101", referralSource: "cold_outreach",
    scores: { guaranteedDemand: 72, automationLevel: 65, tokenEfficiency: 70, profitMargin: 58, maintenanceCost: 40, legalRisk: 15, competitionSaturation: 55 },
    revenuePerHour: 0.42, tokenCostPerHour: 0.08, infraCostPerDay: 1.20, setupCost: 250, setupTimeHours: 6, minAgents: 2, activeAgents: 0,
    models: ["gpt-4o-mini", "claude-3-haiku"], apis: ["stripe", "shipstation"], infra: ["vercel", "supabase"],
    totalRevenue: 0, totalTokenCost: 0, totalInfraCost: 0,
    retainerPaid: false, retainerAmount: 0, profitSharePct: 40, isGrandfathered: false,
    addOns: {},
  },
  {
    name: "Smart Home Energy Advisor",
    description: "AI agent that analyzes smart home energy data, recommends optimizations, negotiates with utility providers, and automates demand-response participation for residential customers.",
    vertical: "digital_services",
    phase: 0, pipelineStatus: "active", bizStatus: "setup", subTier: "free",
    pocName: "Priya Nair", pocEmail: "priya@greenopt.io", pocPhone: "+1-555-0102", referralSource: "linkedin",
    scores: { guaranteedDemand: 68, automationLevel: 78, tokenEfficiency: 82, profitMargin: 62, maintenanceCost: 35, legalRisk: 20, competitionSaturation: 38 },
    revenuePerHour: 0.55, tokenCostPerHour: 0.06, infraCostPerDay: 0.90, setupCost: 180, setupTimeHours: 4, minAgents: 1, activeAgents: 0,
    models: ["gpt-4o", "gemini-1.5-flash"], apis: ["smartthings", "ecobee"], infra: ["cloudflare-workers", "neon"],
    totalRevenue: 0, totalTokenCost: 0, totalInfraCost: 0,
    retainerPaid: false, retainerAmount: 0, profitSharePct: 40, isGrandfathered: false,
    addOns: {},
  },

  // ── Phase 1 — IDEA (Discovery) ─────────────────────────────
  {
    name: "Niche Podcast Monetizer",
    description: "Automated service that finds sponsorship matches for podcasts under 10k downloads, generates personalized ad scripts, handles outreach, and manages billing — all AI-driven.",
    vertical: "content_media",
    phase: 1, pipelineStatus: "active", bizStatus: "setup", subTier: "starter",
    pocName: "Aisha Thompson", pocEmail: "aisha@podprofit.fm", pocPhone: "+1-555-0201", referralSource: "referral",
    scores: { guaranteedDemand: 75, automationLevel: 82, tokenEfficiency: 78, profitMargin: 70, maintenanceCost: 30, legalRisk: 18, competitionSaturation: 42 },
    revenuePerHour: 0.85, tokenCostPerHour: 0.12, infraCostPerDay: 1.50, setupCost: 200, setupTimeHours: 5, minAgents: 2, activeAgents: 0,
    models: ["gpt-4o", "claude-3.5-sonnet"], apis: ["spotify", "stripe", "sendgrid"], infra: ["vercel", "supabase"],
    totalRevenue: 0, totalTokenCost: 0, totalInfraCost: 0,
    retainerPaid: false, retainerAmount: 0, profitSharePct: 40, isGrandfathered: false,
    addOns: {},
  },
  {
    name: "AI Wedding Planning Assistant",
    description: "Full-service AI wedding coordinator managing vendor negotiations, budget tracking, timeline management, and guest communications. Integrates with payment and calendar systems.",
    vertical: "digital_services",
    phase: 1, pipelineStatus: "active", bizStatus: "setup", subTier: "starter",
    pocName: "Marcus Chen", pocEmail: "marcus@wedai.co", pocPhone: "+1-555-0202", referralSource: "conference",
    scores: { guaranteedDemand: 80, automationLevel: 70, tokenEfficiency: 65, profitMargin: 72, maintenanceCost: 45, legalRisk: 22, competitionSaturation: 50 },
    revenuePerHour: 1.20, tokenCostPerHour: 0.18, infraCostPerDay: 2.00, setupCost: 350, setupTimeHours: 8, minAgents: 3, activeAgents: 0,
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro"], apis: ["google-calendar", "stripe", "twilio"], infra: ["vercel", "supabase", "redis"],
    totalRevenue: 0, totalTokenCost: 0, totalInfraCost: 0,
    retainerPaid: false, retainerAmount: 0, profitSharePct: 40, isGrandfathered: false,
    addOns: { businessArtifacts: true },
  },

  // ── Phase 2 — PLAN (Strategy) ──────────────────────────────
  {
    name: "Sustainable Fashion Marketplace",
    description: "AI-curated marketplace matching eco-conscious consumers with verified sustainable fashion brands. Automated quality scoring, carbon footprint calculation, and personalized styling.",
    vertical: "ecommerce",
    phase: 2, pipelineStatus: "active", bizStatus: "setup", subTier: "pro",
    pocName: "Luna Okafor", pocEmail: "luna@ecothread.style", pocPhone: "+1-555-0301", referralSource: "website",
    scores: { guaranteedDemand: 82, automationLevel: 75, tokenEfficiency: 72, profitMargin: 65, maintenanceCost: 48, legalRisk: 25, competitionSaturation: 60 },
    revenuePerHour: 1.80, tokenCostPerHour: 0.22, infraCostPerDay: 3.50, setupCost: 500, setupTimeHours: 12, minAgents: 3, activeAgents: 0,
    models: ["gpt-4o", "claude-3.5-sonnet"], apis: ["stripe", "shopify", "clearbit"], infra: ["vercel", "supabase", "cloudinary"],
    totalRevenue: 0, totalTokenCost: 0, totalInfraCost: 0,
    retainerPaid: false, retainerAmount: 0, profitSharePct: 40, isGrandfathered: false,
    addOns: { customerAcquisition: true, businessArtifacts: true },
  },
  {
    name: "Real Estate Lead Qualifier",
    description: "AI system that scrapes MLS listings, qualifies buyer/seller leads via automated conversations, scores urgency, and routes hot leads to agents with full context briefings.",
    vertical: "data_insights",
    phase: 2, pipelineStatus: "active", bizStatus: "setup", subTier: "pro",
    pocName: "Derek Washington", pocEmail: "derek@realtylead.ai", pocPhone: "+1-555-0302", referralSource: "referral",
    scores: { guaranteedDemand: 88, automationLevel: 85, tokenEfficiency: 76, profitMargin: 78, maintenanceCost: 32, legalRisk: 30, competitionSaturation: 48 },
    revenuePerHour: 2.50, tokenCostPerHour: 0.30, infraCostPerDay: 2.80, setupCost: 400, setupTimeHours: 10, minAgents: 4, activeAgents: 0,
    models: ["gpt-4o", "claude-3.5-sonnet", "perplexity-sonar"], apis: ["zillow", "twilio", "sendgrid"], infra: ["vercel", "supabase", "redis"],
    totalRevenue: 0, totalTokenCost: 0, totalInfraCost: 0,
    retainerPaid: false, retainerAmount: 0, profitSharePct: 40, isGrandfathered: false,
    addOns: { customerAcquisition: true, infrastructure: true },
  },

  // ── Phase 3 — MVP ──────────────────────────────────────────
  {
    name: "Automated Tutoring Platform",
    description: "AI tutoring service for K-12 students with adaptive lesson plans, real-time homework help, progress reports for parents, and automated scheduling with human tutor escalation.",
    vertical: "digital_services",
    phase: 3, pipelineStatus: "active", bizStatus: "running", subTier: "pro",
    pocName: "Sarah Kim", pocEmail: "sarah@learnbot.edu", pocPhone: "+1-555-0401", referralSource: "referral",
    scores: { guaranteedDemand: 90, automationLevel: 80, tokenEfficiency: 68, profitMargin: 74, maintenanceCost: 42, legalRisk: 28, competitionSaturation: 55 },
    revenuePerHour: 3.20, tokenCostPerHour: 0.45, infraCostPerDay: 4.50, setupCost: 600, setupTimeHours: 16, minAgents: 4, activeAgents: 3,
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro"], apis: ["google-classroom", "stripe", "zoom"], infra: ["vercel", "supabase", "redis", "s3"],
    totalRevenue: 1850.40, totalTokenCost: 385.20, totalInfraCost: 135.00,
    retainerPaid: true, retainerAmount: 10000, profitSharePct: 40, isGrandfathered: false,
    addOns: { customerAcquisition: true, infrastructure: true, businessArtifacts: true },
    mvpUrl: "https://learnbot-mvp.vercel.app",
  },
  {
    name: "Local Restaurant SEO Bot",
    description: "Automated local SEO management for restaurants: generates optimized Google Business profiles, responds to reviews, creates social content, and tracks ranking positions.",
    vertical: "digital_services",
    phase: 3, pipelineStatus: "active", bizStatus: "running", subTier: "starter",
    pocName: "Tony Russo", pocEmail: "tony@localfood.seo", pocPhone: "+1-555-0402", referralSource: "cold_outreach",
    scores: { guaranteedDemand: 85, automationLevel: 90, tokenEfficiency: 85, profitMargin: 80, maintenanceCost: 22, legalRisk: 12, competitionSaturation: 45 },
    revenuePerHour: 2.10, tokenCostPerHour: 0.15, infraCostPerDay: 1.80, setupCost: 150, setupTimeHours: 3, minAgents: 2, activeAgents: 2,
    models: ["gpt-4o-mini", "claude-3-haiku"], apis: ["google-business", "yelp", "instagram"], infra: ["vercel", "supabase"],
    totalRevenue: 2240.60, totalTokenCost: 162.30, totalInfraCost: 54.00,
    retainerPaid: true, retainerAmount: 10000, profitSharePct: 40, isGrandfathered: false,
    addOns: { customerAcquisition: true },
    mvpUrl: "https://localfoodseo-mvp.vercel.app",
  },
  {
    name: "Fitness Content Generator",
    description: "AI-powered fitness content studio producing personalized workout videos, meal plans, and progress tracking content for fitness influencers and personal trainers.",
    vertical: "content_media",
    phase: 3, pipelineStatus: "active", bizStatus: "running", subTier: "pro",
    pocName: "Jasmine Rivera", pocEmail: "jasmine@fitgen.ai", pocPhone: "+1-555-0403", referralSource: "instagram",
    scores: { guaranteedDemand: 78, automationLevel: 72, tokenEfficiency: 60, profitMargin: 68, maintenanceCost: 50, legalRisk: 15, competitionSaturation: 62 },
    revenuePerHour: 1.60, tokenCostPerHour: 0.35, infraCostPerDay: 5.00, setupCost: 400, setupTimeHours: 10, minAgents: 3, activeAgents: 2,
    models: ["gpt-4o", "dall-e-3", "claude-3.5-sonnet"], apis: ["youtube", "instagram", "stripe"], infra: ["vercel", "supabase", "cloudinary", "s3"],
    totalRevenue: 980.50, totalTokenCost: 298.40, totalInfraCost: 150.00,
    retainerPaid: true, retainerAmount: 10000, profitSharePct: 40, isGrandfathered: false,
    addOns: { businessArtifacts: true },
    mvpUrl: "https://fitgen-mvp.vercel.app",
  },

  // ── Phase 4 — ACTIVATE (Staging) ───────────────────────────
  {
    name: "AI Gift Recommendation Engine",
    description: "Personalized gift recommendation API serving e-commerce partners. Analyzes recipient profiles, occasion context, budget, and trending items to suggest curated gift sets.",
    vertical: "ecommerce",
    phase: 4, pipelineStatus: "active", bizStatus: "running", subTier: "pro",
    pocName: "Elijah Brooks", pocEmail: "elijah@giftgenius.ai", pocPhone: "+1-555-0501", referralSource: "product_hunt",
    scores: { guaranteedDemand: 84, automationLevel: 92, tokenEfficiency: 88, profitMargin: 82, maintenanceCost: 25, legalRisk: 10, competitionSaturation: 40 },
    revenuePerHour: 4.20, tokenCostPerHour: 0.28, infraCostPerDay: 3.20, setupCost: 300, setupTimeHours: 8, minAgents: 3, activeAgents: 3,
    models: ["gpt-4o", "claude-3.5-sonnet"], apis: ["amazon-product", "stripe", "sendgrid"], infra: ["vercel", "supabase", "redis"],
    totalRevenue: 5680.90, totalTokenCost: 512.40, totalInfraCost: 192.00,
    retainerPaid: true, retainerAmount: 15000, profitSharePct: 40, isGrandfathered: false,
    addOns: { customerAcquisition: true, infrastructure: true, businessArtifacts: true },
    mvpUrl: "https://giftgenius-staging.vercel.app",
  },
  {
    name: "Freelancer Invoice Automator",
    description: "End-to-end invoicing automation for freelancers: generates professional invoices from project descriptions, tracks payments, sends reminders, and provides tax-ready reports.",
    vertical: "digital_services",
    phase: 4, pipelineStatus: "active", bizStatus: "running", subTier: "unlimited",
    pocName: "Nina Patel", pocEmail: "nina@invoiceai.co", pocPhone: "+1-555-0502", referralSource: "referral",
    scores: { guaranteedDemand: 86, automationLevel: 94, tokenEfficiency: 90, profitMargin: 85, maintenanceCost: 18, legalRisk: 20, competitionSaturation: 52 },
    revenuePerHour: 3.80, tokenCostPerHour: 0.18, infraCostPerDay: 2.40, setupCost: 200, setupTimeHours: 5, minAgents: 2, activeAgents: 2,
    models: ["gpt-4o-mini", "claude-3-haiku"], apis: ["stripe", "quickbooks", "sendgrid"], infra: ["vercel", "supabase"],
    totalRevenue: 7420.30, totalTokenCost: 348.60, totalInfraCost: 144.00,
    retainerPaid: true, retainerAmount: 12000, profitSharePct: 35, isGrandfathered: true,
    addOns: { customerAcquisition: true, openClawAdmin: true, infrastructure: true, businessArtifacts: true },
    mvpUrl: "https://invoiceai-staging.vercel.app",
  },

  // ── Phase 5 — DEPLOY (Production) ──────────────────────────
  {
    name: "Crypto Tax Report Generator",
    description: "Automated crypto tax reporting that connects to exchanges and wallets, classifies transactions, calculates gains/losses across jurisdictions, and generates IRS-ready forms.",
    vertical: "data_insights",
    phase: 5, pipelineStatus: "active", bizStatus: "running", subTier: "unlimited",
    pocName: "Raj Gupta", pocEmail: "raj@cryptotax.bot", pocPhone: "+1-555-0601", referralSource: "twitter",
    scores: { guaranteedDemand: 92, automationLevel: 88, tokenEfficiency: 82, profitMargin: 78, maintenanceCost: 35, legalRisk: 42, competitionSaturation: 35 },
    revenuePerHour: 5.50, tokenCostPerHour: 0.55, infraCostPerDay: 6.00, setupCost: 800, setupTimeHours: 20, minAgents: 5, activeAgents: 5,
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro"], apis: ["coinbase", "binance", "etherscan", "stripe"], infra: ["vercel", "supabase", "redis", "s3"],
    totalRevenue: 11250.80, totalTokenCost: 1180.50, totalInfraCost: 540.00,
    retainerPaid: true, retainerAmount: 20000, profitSharePct: 40, isGrandfathered: false,
    addOns: { customerAcquisition: true, openClawAdmin: true, infrastructure: true, businessArtifacts: true },
    mvpUrl: "https://cryptotax.bot",
  },
  {
    name: "AI Music Licensing Platform",
    description: "Automated music licensing marketplace connecting independent artists with content creators. AI handles rights management, usage tracking, royalty splits, and DMCA monitoring.",
    vertical: "content_media",
    phase: 5, pipelineStatus: "active", bizStatus: "running", subTier: "pro",
    pocName: "Zara Williams", pocEmail: "zara@beatclear.io", pocPhone: "+1-555-0602", referralSource: "music_conference",
    scores: { guaranteedDemand: 76, automationLevel: 82, tokenEfficiency: 74, profitMargin: 70, maintenanceCost: 40, legalRisk: 55, competitionSaturation: 30 },
    revenuePerHour: 3.80, tokenCostPerHour: 0.40, infraCostPerDay: 4.50, setupCost: 700, setupTimeHours: 18, minAgents: 4, activeAgents: 4,
    models: ["gpt-4o", "claude-3.5-sonnet", "whisper"], apis: ["spotify", "youtube", "stripe", "soundcloud"], infra: ["vercel", "supabase", "s3", "cloudflare"],
    totalRevenue: 8900.20, totalTokenCost: 890.30, totalInfraCost: 405.00,
    retainerPaid: true, retainerAmount: 15000, profitSharePct: 40, isGrandfathered: false,
    addOns: { customerAcquisition: true, infrastructure: true, businessArtifacts: true },
    mvpUrl: "https://beatclear.io",
  },

  // ── Phase 6 — HERO (Graduated) ─────────────────────────────
  {
    name: "Micro-SaaS Analytics Dashboard",
    description: "White-label analytics platform for micro-SaaS founders. AI auto-generates insights, churn predictions, cohort analysis, and investor-ready reports from Stripe + database metrics.",
    vertical: "data_insights",
    phase: 6, pipelineStatus: "completed", bizStatus: "running", subTier: "unlimited",
    pocName: "Alex Nakamura", pocEmail: "alex@saasmetrics.ai", pocPhone: "+1-555-0701", referralSource: "indie_hackers",
    scores: { guaranteedDemand: 94, automationLevel: 92, tokenEfficiency: 86, profitMargin: 88, maintenanceCost: 28, legalRisk: 10, competitionSaturation: 42 },
    revenuePerHour: 6.80, tokenCostPerHour: 0.50, infraCostPerDay: 5.50, setupCost: 500, setupTimeHours: 14, minAgents: 5, activeAgents: 5,
    models: ["gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro"], apis: ["stripe", "posthog", "sendgrid"], infra: ["vercel", "supabase", "redis", "s3"],
    totalRevenue: 14820.60, totalTokenCost: 1850.40, totalInfraCost: 660.00,
    retainerPaid: true, retainerAmount: 25000, profitSharePct: 30, isGrandfathered: false,
    addOns: { customerAcquisition: true, openClawAdmin: true, infrastructure: true, businessArtifacts: true },
    mvpUrl: "https://saasmetrics.ai",
  },
  {
    name: "AI-Powered Meal Prep Service",
    description: "Fully automated meal prep business: AI generates weekly menus based on dietary needs and local ingredient availability, manages supplier ordering, handles customer subscriptions.",
    vertical: "ecommerce",
    phase: 6, pipelineStatus: "completed", bizStatus: "running", subTier: "unlimited",
    pocName: "Chef David Park", pocEmail: "david@preppedai.com", pocPhone: "+1-555-0702", referralSource: "referral",
    scores: { guaranteedDemand: 88, automationLevel: 78, tokenEfficiency: 72, profitMargin: 75, maintenanceCost: 45, legalRisk: 35, competitionSaturation: 50 },
    revenuePerHour: 5.20, tokenCostPerHour: 0.42, infraCostPerDay: 4.80, setupCost: 600, setupTimeHours: 15, minAgents: 4, activeAgents: 4,
    models: ["gpt-4o", "claude-3.5-sonnet"], apis: ["stripe", "doordash", "instacart"], infra: ["vercel", "supabase", "redis"],
    totalRevenue: 12340.80, totalTokenCost: 1540.20, totalInfraCost: 576.00,
    retainerPaid: true, retainerAmount: 20000, profitSharePct: 35, isGrandfathered: true,
    addOns: { customerAcquisition: true, infrastructure: true, businessArtifacts: true },
    mvpUrl: "https://preppedai.com",
  },
];

// ─── MAIN SEED ──────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  console.log("🌱  Starting pipeline seed…\n");

  // ── 1. Upsert admin user (used as adminId for pipeline) ───
  console.log("  → Upserting seed admin user…");
  const adminOpenId = "seed_admin_pipeline";
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.openId, adminOpenId))
    .limit(1);

  let adminId: number;
  if (existingAdmin.length > 0) {
    adminId = existingAdmin[0].id;
    console.log(`    (existing admin id=${adminId})`);
  } else {
    const [inserted] = await db
      .insert(users)
      .values({
        openId: adminOpenId,
        name: "Pipeline Seed Admin",
        email: "admin@gogetteros.com",
        role: "admin",
        loginMethod: "seed",
        isMasterAdmin: false,
      })
      .returning();
    adminId = inserted.id;
    console.log(`    ✔ Created admin id=${adminId}`);
  }

  // ── 2. Create mock client users (one per business) ────────
  console.log("  → Creating mock client users…");
  const clientUserIds: number[] = [];

  for (let i = 0; i < BUSINESSES.length; i++) {
    const biz = BUSINESSES[i];
    const openId = `seed_client_${i}`;
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);

    if (existing.length > 0) {
      clientUserIds.push(existing[0].id);
    } else {
      const [u] = await db
        .insert(users)
        .values({
          openId,
          name: biz.pocName,
          email: biz.pocEmail,
          role: "user",
          loginMethod: "seed",
          isMasterAdmin: false,
        })
        .returning();
      clientUserIds.push(u.id);
    }
  }
  console.log(`    ✔ ${clientUserIds.length} client users ready`);

  // ── 3. Insert businesses into the catalog ─────────────────
  console.log("  → Inserting businesses into catalog…");
  const businessIds: number[] = [];

  for (const biz of BUSINESSES) {
    const cs = compositeScore(biz.scores);
    const tier = scoreTier(cs);

    const revPerDay = biz.revenuePerHour * 24;
    const revPerWeek = revPerDay * 7;
    const tokenCostPerDay = biz.tokenCostPerHour * 24;
    const tokenCostPerWeek = tokenCostPerDay * 7;
    const infraPerWeek = biz.infraCostPerDay * 7;
    const profitPerHour = biz.revenuePerHour - biz.tokenCostPerHour - biz.infraCostPerDay / 24;
    const profitPerDay = revPerDay - tokenCostPerDay - biz.infraCostPerDay;
    const profitPerWeek = revPerWeek - tokenCostPerWeek - infraPerWeek;

    const existing = await db
      .select()
      .from(businesses)
      .where(eq(businesses.name, biz.name))
      .limit(1);

    if (existing.length > 0) {
      businessIds.push(existing[0].id);
      continue;
    }

    const [ins] = await db
      .insert(businesses)
      .values({
        name: biz.name,
        description: biz.description,
        vertical: biz.vertical,
        guaranteedDemand: biz.scores.guaranteedDemand,
        automationLevel: biz.scores.automationLevel,
        tokenEfficiency: biz.scores.tokenEfficiency,
        profitMargin: biz.scores.profitMargin,
        maintenanceCost: biz.scores.maintenanceCost,
        legalRisk: biz.scores.legalRisk,
        competitionSaturation: biz.scores.competitionSaturation,
        compositeScore: cs,
        scoreTier: tier,
        estimatedRevenuePerHour: biz.revenuePerHour.toFixed(4),
        estimatedRevenuePerDay: revPerDay.toFixed(2),
        estimatedRevenuePerWeek: revPerWeek.toFixed(2),
        estimatedTokenCostPerHour: biz.tokenCostPerHour.toFixed(4),
        estimatedTokenCostPerDay: tokenCostPerDay.toFixed(2),
        estimatedTokenCostPerWeek: tokenCostPerWeek.toFixed(2),
        estimatedInfraCostPerDay: biz.infraCostPerDay.toFixed(2),
        estimatedInfraCostPerWeek: infraPerWeek.toFixed(2),
        estimatedProfitPerHour: profitPerHour.toFixed(4),
        estimatedProfitPerDay: profitPerDay.toFixed(2),
        estimatedProfitPerWeek: profitPerWeek.toFixed(2),
        setupCost: biz.setupCost.toFixed(2),
        setupTimeHours: biz.setupTimeHours,
        minAgentsRequired: biz.minAgents,
        recommendedModels: biz.models,
        implementationGuide: `Step-by-step guide for ${biz.name}. Requires ${biz.apis.join(", ")} integrations.`,
        requiredApis: biz.apis,
        infraRequirements: biz.infra,
        source: "seed",
        isActive: true,
      })
      .returning();

    businessIds.push(ins.id);
  }
  console.log(`    ✔ ${businessIds.length} businesses in catalog`);

  // ── 4. Deploy user_businesses with runtime metrics ────────
  console.log("  → Deploying user_businesses…");
  const userBusinessIds: number[] = [];

  for (let i = 0; i < BUSINESSES.length; i++) {
    const biz = BUSINESSES[i];
    const userId = clientUserIds[i];
    const businessId = businessIds[i];

    const existing = await db
      .select()
      .from(userBusinesses)
      .where(eq(userBusinesses.businessId, businessId))
      .limit(1);

    if (existing.length > 0) {
      userBusinessIds.push(existing[0].id);
      continue;
    }

    const netProfit = biz.totalRevenue - biz.totalTokenCost - biz.totalInfraCost;
    const startedAt = biz.bizStatus !== "setup" ? daysAgo(rand(15, 90)) : undefined;

    const [ub] = await db
      .insert(userBusinesses)
      .values({
        userId,
        businessId,
        status: biz.bizStatus,
        totalRevenue: biz.totalRevenue.toFixed(2),
        totalTokenCost: biz.totalTokenCost.toFixed(2),
        totalInfraCost: biz.totalInfraCost.toFixed(2),
        netProfit: netProfit.toFixed(2),
        dailyRevenue: (biz.revenuePerHour * 24).toFixed(2),
        dailyTokenCost: (biz.tokenCostPerHour * 24).toFixed(2),
        activeAgents: biz.activeAgents,
        lastAgentActivity: biz.activeAgents > 0 ? hoursAgo(rand(1, 12)) : undefined,
        startedAt,
      })
      .returning();

    userBusinessIds.push(ub.id);
  }
  console.log(`    ✔ ${userBusinessIds.length} user_businesses deployed`);

  // ── 5. Create pipeline_projects ───────────────────────────
  console.log("  → Creating pipeline projects…");
  const projectIds: number[] = [];

  for (let i = 0; i < BUSINESSES.length; i++) {
    const biz = BUSINESSES[i];
    const userId = clientUserIds[i];

    const existing = await db
      .select()
      .from(pipelineProjects)
      .where(eq(pipelineProjects.businessName, biz.name))
      .limit(1);

    if (existing.length > 0) {
      projectIds.push(existing[0].id);
      continue;
    }

    const startedDaysAgo = rand(14, 120);
    const metadata = buildMetadata(biz, adminId, startedDaysAgo);
    const agreements = buildAgreements(biz);

    const mvpExpiresAt = biz.phase >= 3 ? daysFromNow(rand(30, 80)) : undefined;
    const stagingExpiresAt = biz.phase >= 4 ? daysFromNow(rand(45, 85)) : undefined;

    const [proj] = await db
      .insert(pipelineProjects)
      .values({
        userId,
        adminId,
        businessName: biz.name,
        pocName: biz.pocName,
        pocEmail: biz.pocEmail,
        pocPhone: biz.pocPhone,
        referralSource: biz.referralSource,
        phase: biz.phase,
        status: biz.pipelineStatus,
        description: biz.description,
        startedAt: daysAgo(startedDaysAgo),
        metadata,
        subscriptionTier: biz.subTier,
        retainerPaid: biz.retainerPaid,
        retainerAmount: biz.retainerAmount.toFixed(2),
        agreementsSigned: agreements,
        profitSharePercentage: biz.profitSharePct.toFixed(2),
        isGrandfathered: biz.isGrandfathered,
        mvpUrl: biz.mvpUrl ?? null,
        mvpExpiresAt: mvpExpiresAt ?? null,
        stagingExpiresAt: stagingExpiresAt ?? null,
        addOns: biz.addOns,
      })
      .returning();

    projectIds.push(proj.id);
  }
  console.log(`    ✔ ${projectIds.length} pipeline projects created`);

  // ── 6. Pipeline events (audit trail) ──────────────────────
  console.log("  → Logging pipeline events…");
  let pipelineEventCount = 0;

  for (let i = 0; i < BUSINESSES.length; i++) {
    const biz = BUSINESSES[i];
    const projId = projectIds[i];

    // Check if we already have events for this project
    const existingEvents = await db
      .select()
      .from(pipelineEvents)
      .where(eq(pipelineEvents.projectId, projId))
      .limit(1);
    if (existingEvents.length > 0) continue;

    // Create a "project_created" event
    const startedDaysAgo = rand(60, 120);
    await db.insert(pipelineEvents).values({
      projectId: projId,
      adminId,
      eventType: "project_created",
      toPhase: 0,
      notes: `Project "${biz.name}" created via seed`,
      createdAt: daysAgo(startedDaysAgo),
    });
    pipelineEventCount++;

    // Create phase_advance events up to current phase
    for (let p = 1; p <= biz.phase; p++) {
      const advanceDaysAgo = Math.max(1, startedDaysAgo - p * rand(8, 15));
      await db.insert(pipelineEvents).values({
        projectId: projId,
        adminId,
        eventType: "phase_advance",
        fromPhase: p - 1,
        toPhase: p,
        notes: phaseAdvanceNote(p, biz.name),
        createdAt: daysAgo(advanceDaysAgo),
      });
      pipelineEventCount++;
    }

    // Add a note event for projects in phases 2+
    if (biz.phase >= 2) {
      await db.insert(pipelineEvents).values({
        projectId: projId,
        adminId,
        eventType: "note_added",
        notes: `Strategy review completed for ${biz.name}. Client aligned on scope and timeline.`,
        createdAt: daysAgo(rand(5, 30)),
      });
      pipelineEventCount++;
    }
  }
  console.log(`    ✔ ${pipelineEventCount} pipeline events logged`);

  // ── 7. Business events (revenue, cost, errors, interventions) ─
  console.log("  → Generating business events…");
  let bizEventCount = 0;

  for (let i = 0; i < BUSINESSES.length; i++) {
    const biz = BUSINESSES[i];
    const ubId = userBusinessIds[i];

    // Only generate events for businesses that are running or paused
    if (biz.bizStatus === "setup" || biz.bizStatus === "stopped") continue;

    // Check if events already exist
    const existingBizEvents = await db
      .select()
      .from(businessEvents)
      .where(eq(businessEvents.userBusinessId, ubId))
      .limit(1);
    if (existingBizEvents.length > 0) continue;

    const eventDays = rand(20, 80);
    const eventsToInsert: InsertBusinessEvent[] = [];

    for (let d = eventDays; d >= 0; d--) {
      const ts = daysAgo(d);

      // Revenue event (daily)
      const dailyRev = randDec(biz.revenuePerHour * 18, biz.revenuePerHour * 30);
      eventsToInsert.push({
        userBusinessId: ubId,
        eventType: "revenue",
        amount: dailyRev.toFixed(4),
        message: `Daily revenue: $${dailyRev.toFixed(2)}`,
        timestamp: ts,
      });

      // Cost event (daily)
      const dailyCost = randDec(biz.tokenCostPerHour * 18, biz.tokenCostPerHour * 28);
      eventsToInsert.push({
        userBusinessId: ubId,
        eventType: "cost",
        amount: dailyCost.toFixed(4),
        message: `Daily token cost: $${dailyCost.toFixed(2)}`,
        timestamp: ts,
      });

      // Agent activity every 3 days
      if (d % 3 === 0 && biz.activeAgents > 0) {
        eventsToInsert.push({
          userBusinessId: ubId,
          eventType: "agent_activity",
          message: `${biz.activeAgents} agents processed ${rand(50, 500)} tasks`,
          eventData: { agentCount: biz.activeAgents, tasksProcessed: rand(50, 500) },
          timestamp: ts,
        });
      }

      // Occasional error (roughly 1 in 12 days)
      if (d % 12 === 7) {
        const isIntervention = d < 10; // recent errors need intervention
        eventsToInsert.push({
          userBusinessId: ubId,
          eventType: "error",
          message: pick([
            "Rate limit exceeded on external API",
            "Payment processing timeout",
            "Model response parsing failed",
            "Webhook delivery failed after 3 retries",
            "Database connection pool exhausted",
          ]),
          requiresIntervention: isIntervention,
          resolved: !isIntervention, // older errors are resolved
          timestamp: ts,
        });
      }

      // Rare intervention events (days 3, 5)
      if (d === 3 || d === 5) {
        eventsToInsert.push({
          userBusinessId: ubId,
          eventType: "intervention",
          message: pick([
            "Customer escalation requires manual review",
            "Unusual spending pattern detected — manual approval needed",
            "Content flagged by moderation — review required",
            "Supplier API credentials expired — renewal needed",
          ]),
          requiresIntervention: true,
          resolved: false,
          timestamp: ts,
        });
      }
    }

    // Batch insert
    if (eventsToInsert.length > 0) {
      // Insert in chunks of 200 to avoid query size limits
      for (let c = 0; c < eventsToInsert.length; c += 200) {
        const chunk = eventsToInsert.slice(c, c + 200);
        await db.insert(businessEvents).values(chunk);
      }
      bizEventCount += eventsToInsert.length;
    }
  }
  console.log(`    ✔ ${bizEventCount} business events generated`);

  // ── 8. Token usage records (multi-provider, 90 days) ──────
  console.log("  → Generating token usage records…");
  let tokenCount = 0;

  const providers = [
    { provider: "openai", models: ["gpt-4o", "gpt-4o-mini"] },
    { provider: "anthropic", models: ["claude-3.5-sonnet", "claude-3-haiku"] },
    { provider: "gemini", models: ["gemini-1.5-pro", "gemini-1.5-flash"] },
  ];

  for (let i = 0; i < BUSINESSES.length; i++) {
    const biz = BUSINESSES[i];
    const userId = clientUserIds[i];
    const ubId = userBusinessIds[i];

    if (biz.bizStatus === "setup") continue;

    // Check existing
    const existingTokens = await db
      .select()
      .from(tokenUsage)
      .where(eq(tokenUsage.userBusinessId, ubId))
      .limit(1);
    if (existingTokens.length > 0) continue;

    const usageRecords: InsertTokenUsage[] = [];
    const spanDays = biz.phase >= 4 ? 80 : biz.phase >= 3 ? 45 : 20;

    for (let d = spanDays; d >= 0; d -= rand(1, 3)) {
      const prov = pick(providers);
      const model = pick(prov.models);
      const inputTok = rand(500, 8000);
      const outputTok = rand(200, 4000);
      const costPerToken = model.includes("mini") || model.includes("haiku") || model.includes("flash")
        ? 0.000001
        : 0.000005;
      const cost = (inputTok + outputTok) * costPerToken;

      usageRecords.push({
        userId,
        userBusinessId: ubId,
        modelProvider: prov.provider,
        modelName: model,
        inputTokens: inputTok,
        outputTokens: outputTok,
        totalCost: cost.toFixed(6),
        timestamp: daysAgo(d),
      });
    }

    if (usageRecords.length > 0) {
      for (let c = 0; c < usageRecords.length; c += 200) {
        await db.insert(tokenUsage).values(usageRecords.slice(c, c + 200));
      }
      tokenCount += usageRecords.length;
    }
  }
  console.log(`    ✔ ${tokenCount} token usage records`);

  // ── 9. Subscriptions ──────────────────────────────────────
  console.log("  → Creating subscriptions…");
  let subCount = 0;

  for (let i = 0; i < BUSINESSES.length; i++) {
    const biz = BUSINESSES[i];
    const userId = clientUserIds[i];

    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    if (existing.length > 0) continue;

    const tierKey = biz.subTier as keyof typeof SUBSCRIPTION_TIERS;
    const tierInfo = SUBSCRIPTION_TIERS[tierKey];

    await db.insert(subscriptions).values({
      userId,
      tier: tierKey,
      monthlyPrice: String(tierInfo.price),
      wizardUsesThisMonth: rand(0, Math.min(3, tierInfo.wizardUses)),
      wizardUsesLimit: tierInfo.wizardUses,
      tokenRateLimit: tierInfo.tokenRateLimit,
      isActive: true,
      currentPeriodStart: daysAgo(rand(5, 25)),
      currentPeriodEnd: daysFromNow(rand(5, 25)),
    });
    subCount++;
  }
  console.log(`    ✔ ${subCount} subscriptions created`);

  // ── Done ──────────────────────────────────────────────────
  console.log("\n✅  Pipeline seed complete!");
  console.log(`    • ${clientUserIds.length} client users`);
  console.log(`    • ${businessIds.length} businesses`);
  console.log(`    • ${userBusinessIds.length} user_businesses`);
  console.log(`    • ${projectIds.length} pipeline projects`);
  console.log(`    • ${pipelineEventCount} pipeline events`);
  console.log(`    • ${bizEventCount} business events`);
  console.log(`    • ${tokenCount} token usage records`);
  console.log(`    • ${subCount} subscriptions`);

  await pool.end();
  process.exit(0);
}

// ─── BUILD HELPERS ──────────────────────────────────────────────────────────

function buildMetadata(biz: BusinessDef, adminId: number, startedDaysAgo: number): PipelineMetadata {
  const meta: PipelineMetadata = {};

  if (biz.phase >= 1) {
    meta.notes = [
      {
        text: `Initial discovery call completed. ${biz.pocName} has a clear vision for ${biz.name}.`,
        adminName: "Pipeline Seed Admin",
        adminId,
        createdAt: daysAgo(startedDaysAgo - 5).toISOString(),
      },
    ];
  }

  if (biz.phase >= 2) {
    meta.notes = [
      ...(meta.notes || []),
      {
        text: `Strategy document approved. Integration requirements: ${biz.apis.join(", ")}.`,
        adminName: "Pipeline Seed Admin",
        adminId,
        createdAt: daysAgo(startedDaysAgo - 15).toISOString(),
      },
    ];
    meta.transcripts = [
      {
        title: "Discovery Call Transcript",
        content: `[Auto-transcribed] Discussion about ${biz.name} scope, target market, and technical requirements with ${biz.pocName}.`,
        source: "zoom",
        createdAt: daysAgo(startedDaysAgo - 8).toISOString(),
      },
    ];
    meta.aiOutputs = [
      {
        model: "gpt-4o",
        prompt: `Analyze the market opportunity for ${biz.name} in the ${biz.vertical} vertical.`,
        output: `Market analysis indicates strong demand (score: ${biz.scores.guaranteedDemand}/100) with moderate competition (${biz.scores.competitionSaturation}/100). Recommended approach: focus on automation (${biz.scores.automationLevel}/100 achievable) to maintain healthy margins.`,
        createdAt: daysAgo(startedDaysAgo - 10).toISOString(),
      },
    ];
  }

  if (biz.phase >= 3 && biz.mvpUrl) {
    meta.artifacts = [
      {
        name: "MVP Deployment",
        url: biz.mvpUrl,
        type: "deployment",
        createdAt: daysAgo(startedDaysAgo - 25).toISOString(),
      },
      {
        name: "Business Requirements Document",
        url: `https://docs.google.com/document/d/seed-${biz.name.replace(/\s+/g, "-").toLowerCase()}`,
        type: "document",
        createdAt: daysAgo(startedDaysAgo - 20).toISOString(),
      },
    ];
  }

  return meta;
}

function buildAgreements(biz: BusinessDef): PipelineAgreements {
  const agreements: PipelineAgreements = {};

  if (biz.phase >= 3) {
    agreements.mvpAgreement = {
      signedAt: daysAgo(rand(30, 60)).toISOString(),
      version: "1.0",
    };
  }
  if (biz.phase >= 4) {
    agreements.eulaAgreement = {
      signedAt: daysAgo(rand(15, 40)).toISOString(),
      version: "1.0",
    };
    agreements.profitShareAgreement = {
      signedAt: daysAgo(rand(15, 40)).toISOString(),
      version: "1.0",
    };
  }

  return agreements;
}

function phaseAdvanceNote(toPhase: number, name: string): string {
  const notes: Record<number, string> = {
    1: `Discovery phase initiated for ${name}. First call scheduled.`,
    2: `Planning phase started. Requirements gathered and scope defined.`,
    3: `MVP development kicked off. Target delivery in 2-4 weeks.`,
    4: `MVP approved by client. Moving to staging environment for refinement.`,
    5: `Staging complete. Production deployment underway.`,
    6: `🎉 ${name} graduated to HERO status! Client is fully operational.`,
  };
  return notes[toPhase] || `Advanced to phase ${toPhase}`;
}

// ─── RUN ────────────────────────────────────────────────────────────────────
main().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
