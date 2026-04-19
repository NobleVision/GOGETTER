# GO-GETTER OS - Project Roadmap

This document tracks completed work, in-progress features, and planned enhancements. For feature documentation, see [README.md](./README.md).

---

## Completed (April 2026 — Phase 3: Voice Assistant Operations Centre)

### Voice Assistant Admin Module (`/admin/voice-assistant`)
- [x] **Six-tab admin UI** — Call Admin, AI Admin, Contact Admin, Live Admin, Log Admin, Content Admin (`client/src/pages/admin/AdminVoiceAssistant.tsx`, 1,280+ lines)
- [x] **Database schema** — `ai_voice_agents`, `zoom_meetings`, `scheduled_voice_actions`, `call_logs`, `call_content` tables + 7 new PostgreSQL enums; `users.profile_image_url` + `users.ai_confirmation_code` columns (migration `0006_ambiguous_stryfe.sql`)
- [x] **35+ tRPC procedures** — all `adminProcedure`-protected (overview, agents CRUD, meetings CRUD, scheduler, contacts, live controls, logs, content, webhooks, personality presets, voice preview)
- [x] **Environment validation** — Twilio/ElevenLabs/Zoom/Pika/Cloudinary/Manus/Perplexity keys validated in `server/_core/env.ts`
- [x] **Property-based tests** — fast-check coverage for confirmation-code normalization + agent mode resolution (`server/services/voiceAssistant.test.ts`)

### External Integration Services (live API wiring)
- [x] **Twilio service** (`server/services/twilio.ts`) — outbound call placement, hang-up, call status polling via REST + basic auth
- [x] **ElevenLabs service** (`server/services/elevenlabs.ts`) — voice list, TTS synthesis, Conversational-AI outbound call, end conversation, transcript fetch
- [x] **Zoom service** (`server/services/zoom.ts`) — Server-to-Server OAuth token caching, create / update / delete / end meeting
- [x] **Pika service** (`server/services/pika.ts`) — experimental avatar-stream video dial-in (feature-flagged per meeting)
- [x] **Real Zoom meeting creation** — `createZoomMeeting` now hits Zoom API and stores `join_url`, `start_url`, `passcode`, `zoom_meeting_external_id`
- [x] **Real agent control** — `dropAgentFromCall` routes to Twilio hang-up / ElevenLabs end / Zoom end based on `call_log.type`
- [x] **Real scheduler dispatch** — `dispatchScheduledAction` places actual calls, starts Zoom meetings, and optionally starts a Pika avatar stream when the meeting has `experimental_video_enabled = true`

### HTTP Webhook Endpoints (signature-verified)
- [x] **`POST /api/webhooks/twilio`** — validates `X-Twilio-Signature` (HMAC-SHA1 over sorted form params)
- [x] **`POST /api/webhooks/elevenlabs`** — validates signed-timestamp + HMAC-SHA256 format
- [x] **`POST /api/webhooks/zoom`** — handles `endpoint.url_validation` challenge + HMAC-SHA256 event verification
- [x] **Shared `readRawBody` helper** (`src-api/webhooks/_verify.ts`) — streams raw body for signature checks before JSON parsing
- [x] **Vercel Build Output routes** — registered in `scripts/build-vercel-api.mjs`; underscore-prefixed files are treated as shared helpers and not deployed as separate functions

### Scheduler Runner
- [x] **Vercel Cron** at `/api/cron/voice-scheduler` runs every minute (`* * * * *` in `vercel.json`)
- [x] **`runDueScheduledActions(limit)`** — picks up `scheduled`/`queued` actions whose `start_time <= NOW()`, dispatches each, records result + failures in `call_logs.live_events`
- [x] **Optional `CRON_SECRET`** — endpoint rejects anything without matching `Bearer` token if env var is set

### Wow-Factor UI (Phase 3)
- [x] **Personality presets** — "Friendly Closer", "Analytical PM", "Stoic Observer" — one-click creates a fully-configured agent (voice + mode + emotion triggers + sample prompt)
- [x] **Voice preview button** — synthesizes a sample greeting via ElevenLabs and plays it in-browser
- [x] **Confirmation-code QR** on user Settings — `QRCodeSVG` rendered with `GOGETTEROS:CODE:XXXX;TEL:+1...` payload so a customer can scan-read during a call
- [x] **Dedicated `myConfirmationCode` endpoint** — `protectedProcedure` so any logged-in user can fetch (and lazily generate) their own code

### Bug fixes rolled in
- [x] **Production login unblocker** — applied migration `0006_ambiguous_stryfe.sql` to prod Neon (`users.profile_image_url` / `users.ai_confirmation_code` were missing, causing the Google OAuth callback to crash with Postgres `42703`)
- [x] **Vercel build now auto-migrates** — `build:vercel` script prepends `drizzle-kit migrate &&` so future deploys can't drift again
- [x] **Zero TypeScript errors** — `pnpm check` remains clean

---

## Completed (April 2026 — Phase 2: Auth, RBAC & Admin)

### Native Email Authentication & OTP Verification
- [x] **Database Schema** — `passwordHash`, `emailVerified`, `permissions` (JSON) columns on `users` table; `verification_codes` table for OTPs
- [x] **Email Registration** — `auth.register` tRPC endpoint with bcrypt hashing (bcryptjs, cost 12)
- [x] **Email Login** — `auth.login` tRPC endpoint with credential validation
- [x] **OTP Email Verification** — 6-digit code via nodemailer SMTP, 10-minute TTL, single-use
- [x] **SMTP Email Service** — `server/services/email.ts` using `info@gogetteros.com` with SSL/TLS on port 465
- [x] **Landing Page Auth Forms** — Tabbed Google OAuth + Email sign-up/sign-in on `LandingPage.tsx`
- [x] **OTP Verification Screen** — `/verify-email` page with 6-digit input boxes, resend with cooldown
- [x] **Email Verification Gate** — `DashboardLayout.tsx` redirects unverified users; Google OAuth auto-verified
- [x] **Email Deliverability** — SPF, DKIM, and DMARC DNS records configured for `gogetteros.com`

### RBAC Permission System
- [x] **Shared Permissions Config** — `shared/permissions.ts` with `DEFAULT_PERMISSIONS`, `FULL_PERMISSIONS`, `hasPermission()`, `ROUTE_PERMISSION_MAP`, `PERMISSION_LABELS`
- [x] **Permission Middleware** — `createPermissionProcedure(key)` factory in `server/_core/trpc.ts`
- [x] **Route Enforcement** — Permission-gated procedures on all 7 route groups (businesses, userBusinesses, dashboard, events, tokenUsage, apiConfig, webhooks)
- [x] **usePermissions Hook** — `client/src/_core/hooks/usePermissions.ts` with `can(key)` and `canAccessRoute(path)`
- [x] **Sidebar Filtering** — `DashboardLayout.tsx` filters menu items by user permissions
- [x] **AccessRestricted Component** — `client/src/components/AccessRestricted.tsx` for permission-denied pages
- [x] **Page Guards** — All 7 protected pages (Catalog, MyBusinesses, Monitoring, TokenUsage, ApiConfig, Webhooks, Settings) check permissions
- [x] **Existing User Migration** — `scripts/grant-existing-permissions.ts` grants full permissions to 24 existing users

### Unified Admin User Management
- [x] **admin.users.list** — Paginated, searchable, filterable by role (all users, not just admins)
- [x] **admin.users.updatePermissions** — Toggle individual permission flags per user
- [x] **admin.users.updateRole** — Promote/demote users (master admin only)
- [x] **Unified User Administration Page** — Rewritten `AdminManagement.tsx` with user table, role badges, verification status, login method, per-user permission dialog with 7 toggle switches
- [x] **Admin Sidebar Label** — Renamed "Admin Management" → "User Administration"

### Database Seed Scripts
- [x] **Pipeline Seed** (`scripts/seed-pipeline-data.ts`) — 15 micro-businesses, 15 pipeline projects (phases 0-6), 1,077 business events, 316 token usage records, 71 pipeline events, 15 subscriptions
- [x] **npm script** — `pnpm seed:pipeline` for easy re-running

### Bug Fixes & TypeScript Cleanup
- [x] **cookie v1.x** — Fixed `cookie.serialize` import for ESM named exports
- [x] **React Query v5** — Removed deprecated `onError` from `useQuery`, replaced with `useEffect`
- [x] **fetch timeout** — Replaced invalid `timeout` property with `AbortSignal.timeout()`
- [x] **URLSearchParams iteration** — Fixed `for...of` with `.forEach()` for downlevelIteration compatibility
- [x] **OAuth redirect_uri_mismatch** — Fixed after `noblevision.com` → `gogetteros.com` domain migration
- [x] **Non-null assertion** — Fixed `storedState.userId` type narrowing in `oauth.ts`
- [x] **Zero TypeScript errors** — `pnpm check` passes cleanly

### Domain Migration
- [x] **gogetteros.com** — Migrated from `gogetter.noblevision.com` / `gogetteros.noblevision.com`
- [x] **Google OAuth URIs** — Updated redirect URIs for new domain (including `www` variant)
- [x] **DNS Records** — SPF, DKIM, DMARC configured at pair.com for email deliverability

---

## Completed (April 2026 — Phase 1: Admin & Pipeline)

### Admin Dashboard & ZERO to HERO Pipeline
- [x] **Hidden Admin Dashboard** (`/admin`) with violet-themed layout, access control, and 403 page
- [x] **Business Pipeline Management (Page 01)** - Full CRUD for pipeline projects with filterable table
- [x] **7-Phase Pipeline Stepper** - Visual phase progression (ZERO through HERO) with tooltips
- [x] **Phase Advancement with Business Rules** - Server-enforced retainer checks ($10k min for Phase 04), MVP/staging expiration (90 days), POC validation
- [x] **Pipeline Detail View** - Tabbed interface (Overview, Notes, Voice Transcripts, AI Outputs, Retainer & Agreements) with activity timeline
- [x] **Admin User Management** - Master admin (nobviz@gmail.com) can promote/demote other admins via `masterAdminProcedure`
- [x] **Pipeline Analytics Page** - Phase distribution bar chart, status breakdown pie chart, pipeline funnel (Recharts)
- [x] **Pipeline Events Audit Log** - Track phase advances, regressions, project creation, and all admin actions

### Subscription & Pricing System
- [x] **Subscription Tiers** - Free (1 use), Starter $100/mo (5), Pro $500/mo (20), Unlimited $1000/mo
- [x] **Wizard Usage Gating** - Discovery wizard checks subscription limits before executing AI agents
- [x] **Subscription Banner** - Usage remaining indicator on wizard page
- [x] **Subscription Card in Settings** - Current tier, usage progress bar, upgrade CTA
- [x] **Token Rate Limits** - Per-tier token rate limit configuration

### Database & Schema
- [x] **`subscriptions` table** - Tier management with wizard usage tracking and billing period
- [x] **`pipeline_projects` table** - 26 columns: full lifecycle tracking, JSONB metadata, retainer/agreement fields, add-on packages
- [x] **`pipeline_events` table** - Audit log for phase transitions and pipeline actions
- [x] **`isMasterAdmin` column** - Master admin identification on users table
- [x] **Pipeline/Subscription enums** - `pipeline_status`, `subscription_tier` PostgreSQL enums

### Business Rules & Constants
- [x] **Profit sharing tiers** - 40%/30%/25% based on revenue thresholds, centralized in `shared/const.ts`
- [x] **Grandfathered account logic** - 70% without retainer, 50% with $10k retainer
- [x] **A-la-carte add-ons** - Customer Acquisition, Open Claw Admin, Infrastructure, Business Artifacts ($10k each)
- [x] **$100k buyout fee**, **$250/hr professional services rate**, **90-day expiration rules**

### Environment & Integration
- [x] **CLOUDINARY_URL** - Cloudinary integration for artifact storage (images, recordings, PPTs, etc.)
- [x] **ZAI_API_KEY** - Z.ai GLM-5.1 integration for AI capabilities
- [x] **MASTER_ADMIN_EMAIL** - Configurable master admin email (default: nobviz@gmail.com)

---

## Completed (January 2026)

### Authentication & Security
- [x] Google OAuth 2.0 with CSRF-protected state tokens
- [x] Multi-provider account linking by email
- [x] JWT session management with secure cookies
- [x] Environment validation (JWT secrets, DB URLs, API configs)
- [x] Admin role auto-assignment via `OWNER_OPEN_ID`

### AI Agent System
- [x] Go-Getter AI Agent with personalized opportunity discovery
- [x] Intelligent Model Router (OpenAI, Anthropic, Gemini, Perplexity, Grok, Manus)
- [x] Fallback to static catalog when AI services unavailable
- [x] Cost-optimized model selection per task type

### Core Platform
- [x] Discovery Wizard with save/load presets (max 10 per user)
- [x] Business catalog with composite scoring (7-factor, 0-100 scale)
- [x] Real-time monitoring dashboard with time-series charts
- [x] Token usage tracking and analytics
- [x] Multi-time profit dimensions (hourly/daily/weekly)
- [x] Webhook integration for event monitoring

---

## In Progress

### End-to-End Auth Flow Testing & Hardening
- [ ] Verify OTP email delivery to multiple providers (Gmail ✅, Outlook, Yahoo)
- [ ] Test email sign-up → OTP → dashboard → permission enforcement full flow
- [ ] Test admin toggling permissions for a standard user (frontend reflects changes)
- [ ] Test new user registration gets wizard-only access by default
- [ ] Verify admin bypass works (admins see all sidebar items regardless of permissions)
- [ ] Password reset flow — `auth.forgotPassword` and `auth.resetPassword` endpoints (not yet implemented)

### Vercel Deployment Validation
- [ ] Deploy latest changes to Vercel production
- [ ] Verify SMTP email sending works from Vercel serverless functions
- [ ] Verify cookie domain works correctly on `gogetteros.com` and `www.gogetteros.com`
- [ ] Test Google OAuth + Email auth both work in production

---

## Next Up - High Priority

### Password Reset Flow
- [ ] `auth.forgotPassword` endpoint — generates reset OTP, sends email
- [ ] `auth.resetPassword` endpoint — validates OTP + sets new password
- [ ] `/forgot-password` page with email input
- [ ] `/reset-password` page with OTP + new password form

### Voice Assistant Console — Production Hardening (follow-ups)
- [ ] **Cloudinary upload widget** on AI Admin (avatar) and Contact Admin (profile icon) — replace raw URL input with drag-and-drop
- [ ] **SSE streaming transcript** on Live Admin — replace polling with Postgres `LISTEN/NOTIFY` pipe through a Vercel Edge SSE endpoint
- [ ] **End-to-end integration tests** — signature verification, Zoom create-then-delete round trip, Twilio test credentials, ElevenLabs outbound happy path
- [ ] **Live smoke test** — actually place a call with a personal cell + dial-in to a Zoom meeting; verify `call_logs.live_events` populates correctly
- [ ] **Recording ingestion** — pull Twilio recordings + ElevenLabs transcripts into Cloudinary, store URLs in `call_logs.recording_url` / `transcript_url`
- [ ] **Scheduler observability** — cron-run summary surfaced on Live Admin (last N runs, dispatched count, failures)
- [ ] **Call cost meter** — record Twilio + ElevenLabs per-minute cost on `call_logs.metadata.cost_usd`, surface running tally on Log Admin
- [ ] **"Ask the archive"** RAG query on Log Admin — cross-transcript search via `modelRouter`
- [ ] **Mode-switch timeline** — Gantt-style view of mode transitions inside a call log, using existing `live_events`
- [ ] **Inngest / pg-boss migration** — swap Vercel Cron for durable queue with retries + backoff when call volume warrants it

### Admin Dashboard Page 03 - Content Assistant Tools
- [ ] NotebookLM integration for podcast-style business summaries
- [ ] Broll Generator (interview transcript/codebase to Google Broll prompts)
- [ ] Business artifact generation (PowerPoint presentations, infographics)
- [ ] Media asset library connected to Cloudinary
- [ ] Executive summary charts and documentation generation

### Payment & Billing Integration
- [ ] Stripe integration for subscription billing and recurring payments
- [ ] Retainer payment processing ($10k minimum)
- [ ] A-la-carte add-on purchase flow
- [ ] Invoice generation and payment history

---

## Planned - High Priority

### ZERO to HERO Pipeline Enhancements
- [ ] **Open Claw AI Administrator** - Autonomous self-learning agent for Phase 06 businesses
- [ ] **Manus AI Integration** - Phase 02 (PLAN) auto-generates applications from enhanced prompts
- [ ] **MVP Auto-Publish** - Phase 03 automated deployment to staging with demo data
- [ ] **Cloudinary Upload Integration** - Artifact upload/management within pipeline detail view
- [ ] **Lead Generation Landing Pages** - Phase 00 referral-tracked landing page builder
- [ ] **Agreement & EULA Management** - Digital signature flow for MVP/retainer/profit-share agreements
- [ ] **Staging Environment Automation** - Phase 04 sandbox provisioning and code security scanning
- [ ] **Customer Notification System** - Email/SMS delivery for MVP links, retainer reminders, phase updates

### Additional Auth Providers (Phase 00 Enhancement)
- [x] Native email/password registration with OTP verification ✅
- [ ] Microsoft OAuth integration
- [ ] GitHub OAuth integration
- [ ] Facebook OAuth integration
- [ ] Richer lead data population from OAuth profile info
- [ ] Social login one-click linking (link Google to existing email account)

### Self-Serve User Pipeline (Trimmed ZERO to HERO)
- [ ] User-facing Phase 00-03 workflow in main UI
- [ ] Wizard-to-pipeline conversion for self-serve users
- [ ] MVP agreement signing and 90-day expiration management
- [ ] Upgrade CTA from self-serve to retainer-based Phase 04

---

## Planned - Medium Priority

### Admin Dashboard Enhancements
- [ ] Pipeline Kanban board view (drag-and-drop phase advancement)
- [ ] Bulk operations on pipeline projects (suspend, archive, reassign admin)
- [ ] Advanced pipeline search with saved filters
- [ ] Pipeline project export (PDF reports, CSV)
- [ ] Admin activity dashboard (who did what, when)
- [ ] "Switch to Customer View" impersonation for testing

### Analytics & Reporting
- [ ] Predictive revenue forecasting for pipeline projects
- [ ] Conversion rate tracking between phases
- [ ] Time-to-phase metrics (how long projects spend in each phase)
- [ ] Revenue attribution by referral source
- [ ] Customer lifetime value calculations
- [ ] Automated weekly pipeline summary reports

### Platform & Infrastructure
- [ ] Redis caching layer for pipeline queries
- [ ] Real-time WebSocket updates for admin dashboard
- [ ] CDN integration for Cloudinary-hosted artifacts
- [ ] API rate limiting per subscription tier
- [ ] Automated staging environment provisioning

---

## Planned - Long Term

### Enterprise & Scale
- [ ] Multi-tenant workspace management
- [ ] Enterprise SSO integration
- [ ] White-label platform for partner resellers
- [ ] Custom domain support for client businesses
- [ ] International expansion (multi-language, multi-currency)

### Mobile & Accessibility
- [ ] Native iOS app
- [ ] Native Android app
- [ ] PWA enhancements with push notifications
- [ ] WCAG 2.1 AA compliance
- [ ] Multi-language support

### Advanced AI
- [ ] Multi-agent collaboration for complex Phase 02 planning
- [ ] Custom model fine-tuning for business-specific tasks
- [ ] Computer vision for market analysis
- [ ] Reinforcement learning for business optimization
- [ ] Predictive analytics for business performance

### Financial & Legal
- [ ] Automated tax calculation and reporting
- [ ] Legal document generation (contracts, terms, EULAs)
- [ ] Profit sharing dashboard with revenue tracking
- [ ] Cryptocurrency payment processing
- [ ] International compliance tools (GDPR, SOC 2)

---

## Development Notes

### Code Quality Standards
- Maintain 90%+ test coverage with property-based testing
- Follow TypeScript strict mode for all new code — `pnpm check` must pass with zero errors
- Use `createPermissionProcedure(key)` for user-facing feature routes (enforces RBAC)
- Use `adminProcedure` for all pipeline/dashboard admin operations
- Use `masterAdminProcedure` only for admin role management (promote/demote)
- Pipeline metadata uses typed JSONB interfaces (`PipelineMetadata`, `PipelineAddOns`, `PipelineAgreements`)
- Permission config centralized in `shared/permissions.ts`; business rules in `shared/const.ts`
- New dependencies: `bcryptjs` (password hashing), `nodemailer` (SMTP email)

### Performance Targets
- Page load times under 2 seconds
- API response times under 500ms
- 99.9% uptime for production services
- Support for 10,000+ concurrent users
- Database query optimization for sub-100ms responses

### Security Requirements
- Regular penetration testing and vulnerability assessments
- Automated security scanning in CI/CD pipeline
- Compliance with SOC 2 Type II standards
- Regular backup and disaster recovery testing
- No code access for customers in staging (Phase 04)
