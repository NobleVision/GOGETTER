# GO-GETTER OS

An autonomous business development platform powered by AI. Discover, evaluate, and launch automated money-making opportunities using AI agents.

## Executive Summary

![GO-GETTER OS Executive Summary - Platform overview showing the AI-powered autonomous business development system](docs/images/GoGetter01-Executive%20Summary.jfif)

GO-GETTER OS is a revolutionary platform that democratizes entrepreneurship by leveraging artificial intelligence to identify, evaluate, and execute autonomous micro-business opportunities. In an era where traditional employment is increasingly uncertain and the gig economy demands constant personal involvement, GO-GETTER OS offers a third path: **truly passive income through AI-powered business automation**.

### The Problem We Solve

Most people want financial independence but face significant barriers:

- **Lack of business expertise** - Don't know what opportunities exist or how to evaluate them
- **Limited time and resources** - Can't dedicate full-time effort to research and execution
- **Risk aversion** - Fear of losing money on unproven business ideas
- **Technical complexity** - Modern digital businesses require technical skills most people don't have
- **Ongoing management burden** - Even "passive" income streams require constant attention

### Our Solution: AI-Powered Autonomous Business Development

GO-GETTER OS transforms business development from a manual, risky, time-intensive process into an automated, data-driven, and scalable system:

```mermaid
graph TD
    A[User Completes Discovery Wizard] --> B[AI Agent Analyzes Profile]
    B --> C[Personalized Business Recommendations]
    C --> D[User Selects Opportunities]
    D --> E[Automated Deployment and Setup]
    E --> F[AI Agents Execute Business Operations]
    F --> G[Real-time Monitoring and Optimization]
    G --> H[Revenue Generation and Reporting]
    H --> I[Continuous Learning and Improvement]
    I --> C

    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style H fill:#fff3e0
```

![AI-Powered Autonomous Business Development workflow visualization](docs/images/GoGetter02-OurSolutionAI-PoweredAutonomousBusinessDevelopment.jfif)

*The complete business development lifecycle from user onboarding through continuous optimization and revenue generation.*

### How It Works

1. **Intelligent Discovery**: Our AI-powered wizard captures your risk tolerance, available capital, interests, and goals to create a personalized entrepreneurial profile.

2. **Opportunity Identification**: Advanced algorithms analyze market data, competition, automation potential, and profitability to identify viable micro-business opportunities across four key verticals:
   - **Content & Media**: Automated content creation, curation, and distribution
   - **Digital Services**: AI-powered service delivery and customer support
   - **E-commerce**: Automated product sourcing, listing, and fulfillment coordination
   - **Data & Insights**: Information processing, analysis, and reporting services

3. **Risk-Adjusted Scoring**: Each opportunity receives a composite score (0-100) based on seven critical factors:
   - Guaranteed demand (20%)
   - Automation level (15%)
   - Token efficiency (15%)
   - Profit margin (15%)
   - Maintenance cost (10%)
   - Legal/compliance risk (10%)
   - Competition saturation (10%)

4. **Autonomous Execution**: Once deployed, AI agents handle day-to-day operations including customer acquisition, service delivery, quality control, and basic customer support.

5. **Continuous Optimization**: Real-time monitoring tracks performance metrics, identifies optimization opportunities, and automatically adjusts strategies to maximize profitability while minimizing risk.

### Why We Created GO-GETTER OS

The traditional path to financial independence—climbing the corporate ladder or starting a traditional business—is increasingly unreliable. Meanwhile, the digital economy offers unprecedented opportunities for automation and scale, but most people lack the technical expertise to capitalize on them.

GO-GETTER OS bridges this gap by:

- **Democratizing access** to sophisticated business intelligence and automation tools
- **Reducing barriers to entry** through AI-powered guidance and execution
- **Minimizing risk** through data-driven opportunity evaluation and diversification
- **Enabling true scalability** by removing the human bottleneck from business operations

### How It Helps People

**For Aspiring Entrepreneurs:**

- Discover viable business opportunities without extensive market research
- Launch businesses without deep technical knowledge
- Reduce financial risk through intelligent opportunity scoring
- Scale operations without proportional time investment

**For Busy Professionals:**

- Generate passive income streams that don't require constant attention
- Diversify income sources to reduce career risk
- Build wealth while maintaining primary career focus
- Learn entrepreneurship through guided, low-risk experiences

**For Experienced Business Owners:**

- Identify new market opportunities using AI-powered analysis
- Automate routine business operations to focus on strategy
- Optimize existing businesses through advanced analytics
- Scale operations across multiple verticals simultaneously

### The Technology Advantage

GO-GETTER OS leverages cutting-edge AI technologies to provide capabilities that would be impossible for individual entrepreneurs:

- **Multi-Model AI Integration**: Combines the strengths of OpenAI, Anthropic, Google Gemini, Perplexity, and other leading AI models
- **Intelligent Model Routing**: Automatically selects the most cost-effective and capable AI model for each specific task
- **Real-time Market Analysis**: Continuously monitors market conditions, competition, and opportunities
- **Automated Quality Control**: Ensures consistent service delivery without human oversight
- **Predictive Analytics**: Forecasts performance and identifies optimization opportunities before problems arise

## ZERO to HERO Business Pipeline

GO-GETTER OS includes a full-service business consultancy pipeline that takes customers from a raw idea to a live, profitable business. The pipeline is managed through a hidden admin dashboard at `/admin`.

### Pipeline Phases

| Phase | Name | Description |
|-------|------|-------------|
| **00** | **ZERO** | Lead generation & initialization. Create a database record, landing zone, and Cloudinary artifact folder. |
| **01** | **IDEA** | Unstructured discovery & information gathering. Notes, web research, meeting transcripts, voice interviews. |
| **02** | **PLAN** | AI-enhanced planning via multi-LLM synthesis (Grok, OpenAI, Anthropic, Perplexity) fed into Manus AI. |
| **03** | **MVP** | Minimum Viable Product with published demo URL, mock data, executive summaries, and feasibility studies. |
| **04** | **ACTIVATE** | $10k retainer required. Transition to real data in GoGetterOS staging/sandbox. Code reviews, security scans. |
| **05** | **DEPLOY** | Production handover. Migrate from staging to client's own infrastructure (Vercel, domain, repo). |
| **06** | **HERO** | Fully independent, profitable business. Special badge, convention access, and premium perks. |

### Subscription Tiers

| Tier | Price | Wizard Uses/Month | Description |
|------|-------|--------------------|-------------|
| **Free** | $0 | 1 | Try GoGetter OS with a single Business Wizard usage |
| **Starter** | $100/mo | 5 | For early-stage business exploration |
| **Pro** | $500/mo | 20 | For serious business builders |
| **Unlimited** | $1,000/mo | Unlimited | Full platform access with token rate limits |

Self-serve users (tiers 0-2) experience a trimmed-down version of phases 00-03. All paid tiers include token rate limits to prevent API oversubscription.

### Business Rules & Profit Sharing

- **MVP Expiration**: 90 days from Phase 03, with rights agreement
- **Staging Limit**: 90 days in Phase 04 ($10k renewal retainer)
- **Profit Sharing (Gross Revenue)**: 40% ($0-$10M), 30% ($10M-$50M), 25% ($50M+)
- **Buyout**: $100k flat fee to exit profit-sharing agreement
- **Grandfathered Accounts**: 70% share without retainer, 50% with $10k retainer
- **A-la-carte Add-ons** ($10k each): Customer Acquisition, Open Claw Administrator, Infrastructure Setup, Business Artifacts
- **Professional Services**: $250/hr for out-of-scope work

### Admin Dashboard

The admin interface is accessible at `/admin` (no links from the main UI). Access is restricted to users with the admin role.

- **Master Admin**: `nobviz@gmail.com` (via Google OAuth) -- can add/remove other admins
- **Dashboard Overview**: KPIs, phase distribution charts, recent activity feed
- **Business Pipeline**: Filterable project table, create/manage pipeline projects, phase advancement with business rule enforcement
- **User Administration**: Unified user management with role promotion/demotion and per-user granular permission toggles (7 feature flags)
- **Analytics**: Phase distribution, status breakdown, pipeline funnel charts
- **Voice Assistant Console**: Coming soon (ElevenLabs + Twilio)
- **Content Assistant Tools**: Coming soon (NotebookLM + Broll generation)

## Core Features

### 🧭 Intelligent Business Discovery

- **AI-Powered Wizard** - Multi-step onboarding that captures risk tolerance, capital, interests, and goals
- **Personalized Recommendations** - Custom-tailored business opportunities based on your unique profile
- **Discovery Presets** - Save and reuse wizard configurations for different scenarios
- **Market Intelligence** - Real-time analysis of market conditions and opportunities

### 📊 Advanced Business Catalog

- **20+ Curated Opportunities** - Pre-vetted micro-business opportunities across 4 key verticals
- **Composite Scoring System** - Sophisticated 0-100 scoring based on 7 critical success factors
- **Smart Filtering & Sorting** - Find opportunities by vertical, risk level, capital requirements, and profitability
- **Detailed Analytics** - Comprehensive business analysis including setup time, revenue potential, and automation level

### 🤖 Go-Getter AI Agent

- **Real AI Execution** - Powered by multiple leading AI models (OpenAI, Anthropic, Gemini, Perplexity, Grok)
- **Intelligent Model Routing** - Automatically selects the most cost-effective model for each task
- **Personalized Strategy** - Adapts recommendations based on your preferences and risk tolerance
- **Fallback Protection** - Graceful degradation to static catalog when AI services are unavailable

### 📈 Real-Time Monitoring Dashboard

- **Live Performance Metrics** - Track active businesses, revenue, costs, and profitability in real-time
- **Interactive Time-Series Charts** - Visualize trends with customizable time ranges (24h, 7d, 30d, 90d)
- **Business Health Indicators** - Monitor agent status, intervention requests, and system alerts
- **Revenue & Cost Tracking** - Detailed breakdown of income streams and operational expenses

### 💰 Comprehensive Token Management

- **Multi-Model Cost Tracking** - Monitor AI usage across all integrated models
- **Budget Controls** - Set spending limits and receive alerts when approaching thresholds
- **Cost Optimization** - Automatic model selection to minimize expenses while maintaining quality
- **Usage Analytics** - Detailed breakdowns by provider, model, and time period

### 🔐 Enterprise-Grade Security & Authentication

- **Dual Auth Support** - Google OAuth 2.0 and native email/password registration
- **OTP Email Verification** - 6-digit one-time password via SMTP with 10-minute TTL
- **bcrypt Password Hashing** - Industry-standard password security (cost factor 12)
- **RBAC Permission System** - 7 granular feature permissions with admin bypass
- **Multi-Provider Support** - Account linking across different OAuth providers
- **JWT Session Management** - Secure, stateless session handling
- **Email Deliverability** - SPF, DKIM, and DMARC DNS records for reliable inbox delivery
- **Environment Validation** - Comprehensive security checks and configuration validation

### ⚙️ Multi-Model API Configuration

- **Universal AI Integration** - Support for OpenAI, Anthropic, Perplexity, Gemini, Grok, and Manus
- **Flexible Configuration** - Easy setup and management of multiple AI service providers
- **Health Monitoring** - Real-time status checking for all configured services
- **Webhook Integration** - Custom endpoints for business event monitoring and automation

### 🎨 Premium User Experience

- **Modern Dark Theme** - Professional, data-driven design optimized for extended use
- **Responsive Layout** - Seamless experience across desktop, tablet, and mobile devices
- **Smart Loading States** - Skeleton loaders and progress indicators for smooth interactions
- **Error Boundaries** - Graceful error handling with user-friendly recovery options
- **Real-Time Updates** - Live data synchronization without page refreshes

## System Architecture

### High-Level Architecture Overview

```mermaid
graph TB
    subgraph ClientLayer[Client Layer]
        UI[React 19 Frontend]
        Auth[Authentication State]
        Charts[Real-time Charts]
    end

    subgraph APILayer[API Layer]
        tRPC[tRPC API Gateway]
        OAuth[OAuth Endpoints]
        Webhooks[Webhook Handlers]
    end

    subgraph BusinessLogic[Business Logic]
        Agent[Go-Getter AI Agent]
        Router[Model Router]
        Scoring[Scoring Engine]
        Monitor[Monitoring System]
    end

    subgraph AIServices[AI Services]
        OpenAI[OpenAI GPT]
        Anthropic[Claude]
        Gemini[Google Gemini]
        Perplexity[Perplexity AI]
        Grok[xAI Grok]
        Manus[Manus AI]
    end

    subgraph DataLayer[Data Layer]
        DB[(PostgreSQL)]
        Cache[Session Cache]
        Logs[Event Logs]
    end

    UI --> tRPC
    UI --> OAuth
    Auth --> OAuth
    Charts --> tRPC

    tRPC --> Agent
    tRPC --> Scoring
    tRPC --> Monitor

    Agent --> Router
    Router --> OpenAI
    Router --> Anthropic
    Router --> Gemini
    Router --> Perplexity
    Router --> Grok
    Router --> Manus

    Agent --> DB
    Scoring --> DB
    Monitor --> DB
    OAuth --> DB

    Monitor --> Logs
    OAuth --> Cache

    style UI fill:#e3f2fd
    style Agent fill:#e8f5e8
    style DB fill:#fff3e0
    style Router fill:#f3e5f5
```

![High-Level Architecture Overview diagram showing Client, API, Business Logic, AI Services, and Data layers](docs/images/GoGetter03-HighLevelArchitectureOverview.jfif)

*System architecture showing the layered design from React frontend through tRPC API to multi-model AI services and PostgreSQL data storage.*

### AI Agent Workflow

```mermaid
flowchart TD
    Start([User Completes Wizard]) --> Profile[Create User Profile]
    Profile --> Analyze[AI Agent Analyzes Profile]

    Analyze --> Discover[Discover Opportunities]
    Discover --> Score[Calculate Composite Scores]
    Score --> Rank[Rank by User Preferences]
    Rank --> Present[Present Recommendations]

    Present --> Select{User Selects Business}
    Select -->|Yes| Deploy[Deploy Business]
    Select -->|No| Refine[Refine Preferences]
    Refine --> Discover

    Deploy --> MonitorNode[Monitor Performance]
    MonitorNode --> Optimize[Optimize Operations]
    Optimize --> Revenue[Generate Revenue]
    Revenue --> Report[Report Results]
    Report --> Learn[Learn and Improve]
    Learn --> Discover

    style Start fill:#e1f5fe
    style Analyze fill:#e8f5e8
    style Deploy fill:#fff3e0
    style Revenue fill:#e0f2f1
```

![AI Agent Workflow showing the complete discovery to revenue generation process](docs/images/GoGetter04-AIagentWorkflow.jfif)

*The AI agent workflow from user profile creation through business deployment, monitoring, and continuous learning.*

### Model Router Intelligence

```mermaid
graph TD
    Request[Incoming AI Request] --> AnalyzeTask[Analyze Task Type]
    AnalyzeTask --> Route{Route Decision}

    Route -->|Creative Writing| OpenAI[OpenAI GPT-4]
    Route -->|Analysis and Reasoning| Anthropic[Claude 3.5]
    Route -->|Research and Facts| Perplexity[Perplexity AI]
    Route -->|Code Generation| Gemini[Google Gemini]
    Route -->|Real-time Data| Grok[xAI Grok]
    Route -->|Specialized Tasks| Manus[Manus AI]

    OpenAI --> Cost[Calculate Cost]
    Anthropic --> Cost
    Perplexity --> Cost
    Gemini --> Cost
    Grok --> Cost
    Manus --> Cost

    Cost --> Log[Log Usage]
    Log --> Response[Return Response]

    Response --> Fallback{Request Failed}
    Fallback -->|Yes| Retry[Try Alternative Model]
    Fallback -->|No| Success[Success]

    Retry --> Route

    style Request fill:#e3f2fd
    style Route fill:#f3e5f5
    style Cost fill:#fff3e0
    style Success fill:#e8f5e8
```

![Model Router Intelligence showing task-based AI model selection and fallback handling](docs/images/GoGetter05-ModelRouterIntelligence.jfif)

*Intelligent routing system that selects the optimal AI model for each task type with automatic fallback and cost tracking.*

## Authentication & Security

GO-GETTER OS implements enterprise-grade security with **dual authentication**: Google OAuth 2.0 for frictionless sign-in and native email/password registration with OTP email verification. A granular RBAC (Role-Based Access Control) system restricts new users to the Business Wizard by default, with admin-controllable per-feature access.

### Native Email Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as React Client
    participant Server as tRPC Server
    participant DB as Database
    participant SMTP as SMTP Server

    User->>Client: Fill sign-up form (name, email, password)
    Client->>Server: auth.register mutation
    Server->>Server: Hash password (bcrypt, cost 12)
    Server->>DB: Create user (emailVerified=false)
    Server->>Server: Generate 6-digit OTP (10-min TTL)
    Server->>DB: Store verification code
    Server->>SMTP: Send OTP email (info@gogetteros.com)
    SMTP->>User: Receive OTP in inbox
    Client->>Client: Redirect to /verify-email
    User->>Client: Enter 6-digit OTP
    Client->>Server: auth.verifyEmail mutation
    Server->>DB: Validate OTP (not expired, not used)
    Server->>DB: Set emailVerified=true
    Server->>Server: Create JWT session
    Server->>Client: Set session cookie
    Client->>User: Redirect to dashboard
```

### RBAC Permission System

New users (both Google OAuth and email) start with **wizard-only access**. Admins can grant granular permissions through the User Administration panel:

| Permission Key | Feature | Default |
|---|---|---|
| `businessCatalog` | Business Catalog browsing | Restricted |
| `myBusinesses` | My Businesses management | Restricted |
| `monitoring` | Real-time monitoring dashboard | Restricted |
| `tokenUsage` | Token usage analytics | Restricted |
| `apiConfig` | API key configuration | Restricted |
| `webhooks` | Webhook management | Restricted |
| `settings` | Account settings | Restricted |

**Admin users bypass all permission checks** and always have full access. Permissions are enforced on both the tRPC backend (middleware) and the React frontend (sidebar filtering + page guards).

### Enhanced Google OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as React Client
    participant Server as Express Server
    participant Google as Google OAuth
    participant DB as Database

    User->>Client: Click Sign in with Google
    Client->>Server: GET /api/oauth/google/init
    Server->>Server: Generate secure state token
    Server->>Server: Store state in session cache
    Server->>Google: Redirect to consent screen
    Google->>User: Display consent screen
    User->>Google: Grant permission
    Google->>Server: Redirect with code and state
    Server->>Server: Validate state token
    Server->>Google: Exchange code for tokens
    Google->>Server: Return access and id tokens
    Server->>Google: GET /userinfo
    Google->>Server: Return user profile
    Server->>DB: Upsert user record
    DB->>Server: Return user data
    Server->>Server: Generate JWT session token
    Server->>Client: Set session cookie and redirect
    Client->>User: Show authenticated dashboard
```

![Enhanced Google OAuth Flow sequence diagram](docs/images/GoGetter06-EnhancedGoogleOauthFlow.jfif)

*Complete OAuth 2.0 authentication flow from user click through token exchange to session establishment.*

### Multi-Provider Account Linking

```mermaid
graph TD
    NewUser[New OAuth Login] --> CheckEmail{Email Exists}
    CheckEmail -->|No| CreateUser[Create New User]
    CheckEmail -->|Yes| LinkAccount[Link to Existing Account]

    CreateUser --> SetPrimary[Set as Primary Provider]
    LinkAccount --> UpdateProviders[Update auth providers Array]

    SetPrimary --> GenerateSession[Generate JWT Session]
    UpdateProviders --> GenerateSession

    GenerateSession --> SetCookie[Set Secure Cookie]
    SetCookie --> Success[Authentication Complete]

    style NewUser fill:#e3f2fd
    style LinkAccount fill:#fff3e0
    style Success fill:#e8f5e8
```

![Multi-Provider Account Linking flow diagram](docs/images/GoGetter07-Multi-ProviderAccountLinking.jfif)

*Account linking logic that automatically merges OAuth providers based on email matching.*

### Session Verification and Security

```mermaid
sequenceDiagram
    participant Client as React Client
    participant Server as tRPC Server
    participant JWT as JWT Validator
    participant DB as Database
    participant Cache as Session Cache

    Client->>Server: API Request with session cookie
    Server->>JWT: Extract and verify JWT signature

    alt JWT Invalid or Expired
        JWT->>Server: Validation failed
        Server->>Client: 401 Unauthorized
        Client->>Client: Redirect to OAuth login
    else JWT Valid
        JWT->>Server: Extract openId from payload
        Server->>Cache: Check session cache

        alt Cache Hit
            Cache->>Server: Return cached user data
        else Cache Miss
            Server->>DB: getUserByOpenId
            alt User Not Found
                Server->>DB: Try getUserByGoogleId
            end
            DB->>Server: Return user record
            Server->>Cache: Cache user data
        end

        Server->>DB: Update lastSignedIn timestamp
        Server->>Client: Return API response with user context
    end
```

![Session Verification and Security flow diagram](docs/images/GoGetter08-SessionVerificationAndSecurity.jfif)

*JWT validation workflow with cache optimization and graceful error handling.*

### Security Features

- **CSRF Protection**: State tokens prevent cross-site request forgery
- **Secure Cookies**: HttpOnly, SameSite, and Secure flags
- **JWT Security**: HS256 signing with 32+ character secrets
- **Password Hashing**: bcrypt with cost factor 12 for native email accounts
- **OTP Security**: 6-digit codes with 10-minute TTL, single-use, previous codes invalidated
- **RBAC Enforcement**: Permission middleware on tRPC routes + frontend page guards
- **Account Linking**: Automatic linking of multiple OAuth providers by email
- **Session Management**: Configurable timeouts and refresh mechanisms
- **Email Authentication**: SPF, DKIM, and DMARC records prevent spoofing and improve deliverability
- **Environment Validation**: Comprehensive security configuration checks

### Key Authentication Files

```mermaid
graph TD
    subgraph ClientFiles[Client]
        A[client/src/const.ts] -->|getGoogleLoginUrl| B[DashboardLayout.tsx]
        B -->|Login button| C[oauth/google/init]
        D[useAuth.ts] -->|Session check| E[tRPC auth.me]
    end

    subgraph ServerFiles[Server]
        C --> F[server/_core/oauth.ts]
        F -->|registerOAuthRoutes| G[oauth/google/callback]
        G --> H[server/_core/googleOAuth.ts]
        H -->|exchangeCodeForTokens| I[Google API]
        H -->|getGoogleUserInfo| I
        G --> J[server/_core/sdk.ts]
        J -->|createSessionToken| K[JWT Session]
        J -->|verifySession| K
    end

    subgraph DatabaseFiles[Database]
        G --> L[server/db.ts]
        L -->|upsertUserWithGoogle| M[(PostgreSQL)]
    end

    subgraph VercelFiles[Vercel Serverless]
        N[api/oauth/google/init.ts]
        O[api/oauth/google/callback.ts]
        P[api/oauth/google/status.ts]
    end
```

![Key Authentication Files architecture diagram](docs/images/GoGetter09-KeyAuthenticationFiles.jfif)

*File structure and data flow for the complete authentication system across client, server, and database layers.*

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Select "Web application" as the application type
6. Add authorized redirect URIs:
   - For local development: `http://localhost:3000/api/oauth/google/callback`
   - For production: `https://your-domain.com/api/oauth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

## Local Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database (or use a cloud provider like Neon)
- Google OAuth credentials (see "Setting Up Google OAuth" above)

### Installation

1. **Clone or extract the project:**

   ```bash
   cd go-getter-os
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database (Required)
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

   # Security (Required - generate a random 32+ character secret)
   JWT_SECRET=your-random-secret-key-here-at-least-32-chars

   # Google OAuth (Required for authentication)
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Optional: Application ID
   VITE_APP_ID=go-getter-os

   # Optional: Owner Open ID for admin access
   OWNER_OPEN_ID=
   ```

4. **Push the database schema:**

   ```bash
   pnpm db:push
   ```

5. **Seed the business catalog (optional):**

   ```bash
   node scripts/seed-businesses.mjs
   ```

6. **Start the development server:**

   ```bash
   pnpm dev
   ```

7. **Open in browser:**
   Navigate to `http://localhost:3000`

## Project Structure

```
go-getter-os/
├── api/                    # Vercel serverless functions
│   ├── oauth/google/       # Google OAuth endpoints
│   │   ├── init.ts         # Initiates OAuth flow
│   │   ├── callback.ts     # Handles OAuth callback
│   │   └── status.ts       # Checks if OAuth is configured
│   └── trpc/               # tRPC API handler
├── client/                 # React 19 frontend
│   └── src/
│       ├── _core/hooks/    # Core hooks
│       │   ├── useAuth.ts             # Authentication state and session
│       │   └── usePermissions.ts      # RBAC permission checks (can, canAccessRoute)
│       ├── components/     # UI components
│       │   ├── AdminLayout.tsx          # Admin dashboard layout (violet theme)
│       │   ├── AccessRestricted.tsx     # Permission-denied page component
│       │   ├── LandingPage.tsx          # Landing with Google + Email auth forms
│       │   ├── SubscriptionBanner.tsx   # Wizard usage remaining banner
│       │   ├── admin/                   # Admin-specific components
│       │   │   ├── PhaseBadge.tsx       # Color-coded phase badges (00-06)
│       │   │   ├── PhaseStepper.tsx     # Horizontal phase progress indicator
│       │   │   └── NewProjectDialog.tsx # Create pipeline project dialog
│       │   └── ui/         # shadcn/ui primitives + custom components
│       ├── pages/          # Page components
│       │   ├── admin/                   # Admin dashboard pages
│       │   │   ├── AdminDashboard.tsx   # KPIs, charts, activity feed
│       │   │   ├── AdminPipeline.tsx    # Pipeline list with filters
│       │   │   ├── AdminPipelineDetail.tsx # Project detail with tabs
│       │   │   ├── AdminManagement.tsx  # Unified user administration (all users + permissions)
│       │   │   └── AdminAnalytics.tsx   # Pipeline analytics & charts
│       │   ├── VerifyEmail.tsx # OTP verification screen (6-digit input)
│       │   ├── Wizard.tsx      # Discovery wizard with presets
│       │   ├── Monitoring.tsx  # Real-time dashboard (permission-gated)
│       │   └── Settings.tsx    # Account, subscription & provider management
│       ├── lib/            # Utilities
│       │   └── errorHandling.ts # Error boundary logic
│       └── const.ts        # Auth URLs and constants
├── server/                 # Express + tRPC backend
│   ├── _core/
│   │   ├── oauth.ts        # OAuth route registration
│   │   ├── googleOAuth.ts  # Google OAuth implementation
│   │   ├── trpc.ts         # Procedure definitions (public, protected, admin, masterAdmin, permission)
│   │   ├── envValidation.ts # Environment security validation
│   │   ├── sdk.ts          # Session management (JWT)
│   │   ├── cookies.ts      # Cookie configuration
│   │   └── env.ts          # Environment variables (includes SMTP config)
│   ├── services/           # Business logic services
│   │   ├── email.ts             # SMTP email service (OTP sending via nodemailer)
│   │   ├── goGetterAgent.ts     # AI agent implementation
│   │   ├── modelRouter.ts       # Multi-model AI routing
│   │   └── *.test.ts            # Property-based tests
│   ├── db.ts               # Database queries (users, auth, permissions, businesses, pipeline)
│   └── routers.ts          # tRPC API routes (auth, user, admin.users, admin.pipeline)
├── drizzle/                # Database schema & migrations
│   ├── schema.ts           # Table definitions (12 tables)
│   ├── relations.ts        # Table relationships
│   └── migrations/         # Database migrations
├── shared/                 # Shared types, constants, and business rules
│   ├── const.ts            # Subscription tiers, phase names, profit sharing rules
│   ├── permissions.ts      # RBAC permission types, defaults, helpers, route mapping
│   └── types.ts            # Re-exported Drizzle types
├── scripts/                # Utility scripts
│   ├── seed-businesses.mjs          # Business catalog seeding (20 entries)
│   ├── seed-pipeline-data.ts        # Full pipeline mock data (15 businesses, 7 tables)
│   └── grant-existing-permissions.ts # One-time migration: grant full permissions
├── vitest.config.ts        # Test configuration
└── [Tests colocated with source files as *.test.ts - 60+ tests total]
```

## Recent Major Enhancements (April 2026)

### Native Email Auth, OTP Verification & RBAC (Phase 2)
- **Native Email Registration** - Email/password sign-up alongside Google OAuth with tabbed landing page UI
- **OTP Email Verification** - 6-digit code via SMTP (info@gogetteros.com) with 10-minute TTL, branded HTML email
- **Email Verification Gate** - Unverified users redirected to `/verify-email`; Google OAuth users auto-verified
- **Password Security** - bcrypt hashing (bcryptjs, cost factor 12)
- **RBAC Permission System** - 7 granular feature flags (`businessCatalog`, `myBusinesses`, `monitoring`, `tokenUsage`, `apiConfig`, `webhooks`, `settings`)
- **Permission Middleware** - `createPermissionProcedure(key)` factory in tRPC enforces per-route access
- **Frontend Permission Enforcement** - Sidebar filtering via `usePermissions` hook + `AccessRestricted` page guard component
- **Unified User Administration** - Replaced admin-only management with full user dashboard: search, role/verification filters, pagination, per-user permission toggles
- **Email Deliverability** - SPF, DKIM, and DMARC DNS records configured for `gogetteros.com`

### Database Seed Scripts
- **Pipeline Seed** (`seed-pipeline-data.ts`) - 15 micro-businesses across all pipeline phases, 1,000+ events, 300+ token usage records, subscriptions
- **Permissions Migration** (`grant-existing-permissions.ts`) - One-time grant of full permissions to existing users

### Pre-existing Bug Fixes
- **cookie v1.x API** - Fixed `cookie.serialize` import for cookie package v1.0 (ESM named exports)
- **React Query v5** - Removed deprecated `onError` from `useQuery` in `useAuth.ts`, replaced with `useEffect`
- **fetch timeout** - Fixed invalid `timeout` property on fetch, replaced with `AbortSignal.timeout()`
- **Domain Migration** - Fixed Google OAuth redirect URI mismatch after `noblevision.com` → `gogetteros.com` migration

### Admin Dashboard & ZERO to HERO Pipeline
- **Hidden Admin Interface** (`/admin`) with violet-themed layout, separate from user-facing UI
- **Business Pipeline Management**: Full CRUD for pipeline projects with 7-phase stepper, filterable table, and detail views
- **Phase Advancement**: Server-enforced business rules (retainer checks, expiration dates, POC validation)
- **Admin User Management**: Master admin (nobviz@gmail.com) can promote/demote other admins with `masterAdminProcedure` guard
- **Pipeline Analytics**: Phase distribution charts, status breakdown pie chart, pipeline funnel visualization (Recharts)
- **Subscription Tier System**: Free/Starter/Pro/Unlimited tiers with wizard usage gating and token rate limits
- **Wizard Usage Enforcement**: Discovery wizard checks subscription limits before executing, increments on success
- **User-Facing Subscription Info**: Usage banner on wizard page, subscription card in settings

### Database Additions
- **`subscriptions` table**: Tier, pricing, wizard usage tracking, token rate limits
- **`pipeline_projects` table**: 26 columns covering the full ZERO to HERO lifecycle with JSONB metadata
- **`pipeline_events` table**: Audit log for phase transitions and pipeline actions
- **`isMasterAdmin` column on `users`**: Identifies the master admin for role management

### Business Rules Engine
- Profit sharing tiers, grandfathered accounts, $100k buyout, $10k retainers, 90-day expirations
- All constants centralized in `shared/const.ts` for single-source-of-truth

---

## Previous Enhancements (January 2026)

### 🔐 Enhanced Security & Authentication

- **Environment Validation**: Comprehensive security checks for JWT secrets, database URLs, and API configurations
- **Multi-Provider OAuth**: Support for linking multiple OAuth providers to a single account
- **Account Linking**: Automatic account merging based on email addresses
- **Secure Session Management**: Enhanced JWT handling with proper validation and error boundaries

### 🤖 Real AI-Powered Agent System

- **Go-Getter AI Agent**: Fully functional AI agent that analyzes user profiles and discovers personalized business opportunities
- **Intelligent Model Router**: Automatically selects the most cost-effective AI model for each task type
- **Multi-Model Integration**: Support for OpenAI, Anthropic, Gemini, Perplexity, Grok, and Manus APIs
- **Fallback Protection**: Graceful degradation to static catalog when AI services are unavailable
- **Cost Optimization**: Smart model selection to minimize token costs while maintaining quality

### 💾 Discovery Presets System

- **Save Wizard Configurations**: Users can save their discovery wizard settings as reusable presets
- **Preset Management**: Create, load, and delete up to 10 named presets per user
- **Quick Discovery**: Rapidly explore different scenarios without re-entering preferences
- **Preset Validation**: Ensures preset data integrity and handles edge cases

### 📊 Advanced Monitoring & Analytics

- **Real-Time Time-Series Charts**: Interactive charts with customizable time ranges (24h, 7d, 30d, 90d)
- **Event Aggregation**: Sophisticated SQL-based aggregation of revenue, costs, and profit data
- **Chart Data Filtering**: Advanced filtering by time periods with proper data validation
- **Live Dashboard Updates**: Real-time data synchronization without page refreshes

### 💰 Comprehensive Token Management

- **Multi-Provider Tracking**: Monitor token usage across all integrated AI services
- **Time-Series Analytics**: Detailed usage breakdowns by provider, model, and time period
- **Budget Controls**: Set spending limits and receive alerts when approaching thresholds
- **Cost Optimization Insights**: Recommendations for reducing AI costs while maintaining performance

### 🎨 Premium User Experience

- **Smart Loading States**: Skeleton loaders for charts, AI processing indicators, and progress feedback
- **Error Boundaries**: Comprehensive error handling with user-friendly recovery options
- **Responsive Design**: Optimized layouts for desktop, tablet, and mobile devices
- **Dark Theme Polish**: Professional, data-driven design with consistent styling

### 🔧 Developer Experience

- **Comprehensive Testing**: 60+ tests covering all major functionality with property-based testing
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Code Quality**: Consistent code formatting and linting rules
- **Documentation**: Detailed inline documentation and API specifications

### 📈 Multi-Time Profit Dimensions & Business Lifecycle

- **Profit Time Dimensions**: Database schema supports hourly, daily, and weekly revenue, cost, and profit tracking with automated calculations
- **Time Toggle UI**: Business cards display profit metrics with interactive Hourly/Daily/Weekly toggle for granular financial analysis
- **Color-Coded Profit Indicators**: Positive profits shown in green, negative in red for instant visual feedback
- **Business Lifecycle Tracking**: Track key dates including `discoveredAt`, `lastRefreshedAt`, and `lastDeployedAt` for complete business history
- **AI Agent Prompts**: Production-ready `agentPrompt` field stores executable AI instructions for each business opportunity
- **Source Tracking**: Businesses marked as `static` (pre-seeded catalog) or `ai_discovered` (generated by AI agent) with visual badges
- **Save to Catalog**: AI-discovered opportunities can be saved to the permanent business catalog with one click
- **Catalog Refresh**: Re-fetch catalog data automatically after saving new AI discoveries

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm build:vercel` - Build for Vercel deployment
- `pnpm start` - Start production server
- `pnpm check` - TypeScript type checking (no emit)
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema changes
- `pnpm seed:pipeline` - Seed 15 mock businesses with full pipeline data
- `npx tsx scripts/grant-existing-permissions.ts` - Grant full permissions to existing users

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Express 4, tRPC 11
- **Authentication:** Google OAuth 2.0, native email/password (bcryptjs), OTP verification (nodemailer)
- **Authorization:** RBAC with 7 granular permissions, admin bypass
- **Database:** PostgreSQL with Drizzle ORM
- **Charts:** Recharts
- **Email:** Nodemailer via SMTP (SSL/TLS), SPF + DKIM + DMARC
- **Deployment:** Vercel (serverless functions)

## Environment Variables Reference

| Variable               | Required | Description                               | Example                                                 |
| ---------------------- | -------- | ----------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string              | `postgresql://user:pass@host:5432/db?sslmode=require`   |
| `JWT_SECRET`           | Yes      | Secret for signing JWT tokens (32+ chars) | `your-super-secure-random-secret-key-here-32-chars-min` |
| `GOOGLE_CLIENT_ID`     | Yes      | Google OAuth client ID                    | `123456789.apps.googleusercontent.com`                  |
| `GOOGLE_CLIENT_SECRET` | Yes      | Google OAuth client secret                | `GOCSPX-abcdef123456`                                   |
| `OPENAI_API_KEY`       | No       | OpenAI API key for GPT models             | `sk-proj-abc123...`                                     |
| `ANTHROPIC_API_KEY`    | No       | Anthropic API key for Claude              | `sk-ant-api03-abc123...`                                |
| `GEMINI_API_KEY`       | No       | Google Gemini API key                     | `AIzaSyAbc123...`                                       |
| `PERPLEXITY_API_KEY`   | No       | Perplexity AI API key                     | `pplx-abc123...`                                        |
| `GROK_API_KEY`         | No       | xAI Grok API key                          | `xai-abc123...`                                         |
| `MANUS_API_KEY`        | No       | Manus AI API key                          | `manus-abc123...`                                       |
| `VITE_APP_ID`          | No       | Application identifier                    | `go-getter-os`                                          |
| `OWNER_OPEN_ID`        | No       | Admin user's Open ID                      | `google-oauth2\|123456789`                              |
| `MASTER_ADMIN_EMAIL`   | No       | Master admin email (default: nobviz@gmail.com) | `nobviz@gmail.com`                                 |
| `SMTP_HOST`            | No       | SMTP server hostname for OTP emails       | `mail7.g24.pair.com`                                    |
| `SMTP_PORT`            | No       | SMTP port (default: 465 for SSL/TLS)      | `465`                                                   |
| `SMTP_USER`            | No       | SMTP authentication username              | `info@gogetteros.com`                                   |
| `SMTP_PASS`            | No       | SMTP authentication password              | `your-smtp-password`                                    |
| `SMTP_FROM`            | No       | Sender address (default: SMTP_USER)       | `info@gogetteros.com`                                   |
| `CLOUDINARY_URL`       | No       | Cloudinary URL for artifact storage       | `cloudinary://api_key:api_secret@cloud_name`            |
| `ZAI_API_KEY`          | No       | Z.ai GLM-5.1 API key                     | `zai-abc123...`                                         |
| `NODE_ENV`             | No       | Environment (development/production)      | `development`                                           |
| `PORT`                 | No       | Server port (default: 3000)               | `3000`                                                  |

### Security Requirements

- **JWT_SECRET**: Must be at least 32 characters long and cryptographically secure
- **Database URL**: Must use SSL in production (`sslmode=require`)
- **API Keys**: Store securely and never commit to version control
- **OAuth Secrets**: Keep Google OAuth credentials secure and rotate regularly

### AI Service Configuration

GO-GETTER OS supports multiple AI providers for optimal cost and performance. Configure any combination:

- **OpenAI**: Best for creative writing and general tasks
- **Anthropic**: Excellent for analysis and reasoning
- **Gemini**: Strong for code generation and technical tasks
- **Perplexity**: Ideal for research and factual queries
- **Grok**: Good for real-time data and current events
- **Manus**: Specialized for domain-specific tasks

The system automatically routes requests to the most appropriate and cost-effective model based on the task type.

## License

MIT 2026
