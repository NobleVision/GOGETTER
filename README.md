# GO-GETTER OS

An autonomous business development platform powered by AI. Discover, evaluate, and launch automated money-making opportunities using AI agents.

## Executive Summary

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
    D --> E[Automated Deployment & Setup]
    E --> F[AI Agents Execute Business Operations]
    F --> G[Real-time Monitoring & Optimization]
    G --> H[Revenue Generation & Reporting]
    H --> I[Continuous Learning & Improvement]
    I --> C
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style H fill:#fff3e0
```

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

### 🔐 Enterprise-Grade Security
- **Google OAuth 2.0** - Secure, industry-standard authentication
- **Multi-Provider Support** - Account linking across different OAuth providers
- **JWT Session Management** - Secure, stateless session handling
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
    subgraph "Client Layer"
        UI[React 19 Frontend]
        Auth[Authentication State]
        Charts[Real-time Charts]
    end
    
    subgraph "API Layer"
        tRPC[tRPC API Gateway]
        OAuth[OAuth Endpoints]
        Webhooks[Webhook Handlers]
    end
    
    subgraph "Business Logic"
        Agent[Go-Getter AI Agent]
        Router[Model Router]
        Scoring[Scoring Engine]
        Monitor[Monitoring System]
    end
    
    subgraph "AI Services"
        OpenAI[OpenAI GPT]
        Anthropic[Claude]
        Gemini[Google Gemini]
        Perplexity[Perplexity AI]
        Grok[xAI Grok]
        Manus[Manus AI]
    end
    
    subgraph "Data Layer"
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

### AI Agent Workflow

```mermaid
flowchart TD
    Start([User Completes Wizard]) --> Profile[Create User Profile]
    Profile --> Analyze[AI Agent Analyzes Profile]
    
    Analyze --> Discover[Discover Opportunities]
    Discover --> Score[Calculate Composite Scores]
    Score --> Rank[Rank by User Preferences]
    Rank --> Present[Present Recommendations]
    
    Present --> Select{User Selects Business?}
    Select -->|Yes| Deploy[Deploy Business]
    Select -->|No| Refine[Refine Preferences]
    Refine --> Discover
    
    Deploy --> Monitor[Monitor Performance]
    Monitor --> Optimize[Optimize Operations]
    Optimize --> Revenue[Generate Revenue]
    Revenue --> Report[Report Results]
    Report --> Learn[Learn & Improve]
    Learn --> Discover
    
    style Start fill:#e1f5fe
    style Analyze fill:#e8f5e8
    style Deploy fill:#fff3e0
    style Revenue fill:#e0f2f1
```

### Model Router Intelligence

```mermaid
graph TD
    Request[Incoming AI Request] --> Analyze[Analyze Task Type]
    Analyze --> Route{Route Decision}
    
    Route -->|Creative Writing| OpenAI[OpenAI GPT-4]
    Route -->|Analysis & Reasoning| Anthropic[Claude 3.5]
    Route -->|Research & Facts| Perplexity[Perplexity AI]
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
    
    Response --> Fallback{Request Failed?}
    Fallback -->|Yes| Retry[Try Alternative Model]
    Fallback -->|No| Success[Success]
    
    Retry --> Route
    
    style Request fill:#e3f2fd
    style Route fill:#f3e5f5
    style Cost fill:#fff3e0
    style Success fill:#e8f5e8
```

## Authentication & Security

GO-GETTER OS implements enterprise-grade security with **Google OAuth 2.0** for user authentication, providing a secure, industry-standard authentication flow without requiring users to create separate credentials.

### Enhanced Google OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as Client (React)
    participant Server as Server (Express/Vercel)
    participant Google as Google OAuth
    participant DB as Database

    User->>Client: Click "Sign in with Google"
    Client->>Server: GET /api/oauth/google/init
    Server->>Server: Generate secure state token
    Server->>Server: Store state in session cache
    Server->>Google: Redirect to Google consent screen
    Google->>User: Display consent screen
    User->>Google: Grant permission
    Google->>Server: Redirect to /api/oauth/google/callback?code=...&state=...
    Server->>Server: Validate state token (CSRF protection)
    Server->>Google: Exchange code for tokens
    Google->>Server: Return access_token, id_token
    Server->>Google: GET /userinfo (with access_token)
    Google->>Server: Return user profile (email, name, picture)
    Server->>DB: Upsert user record
    DB->>Server: Return user data
    Server->>Server: Generate JWT session token (HS256)
    Server->>Client: Set secure session cookie & redirect
    Client->>User: Show authenticated dashboard
```

### Multi-Provider Account Linking

```mermaid
graph TD
    NewUser[New OAuth Login] --> CheckEmail{Email Exists?}
    CheckEmail -->|No| CreateUser[Create New User]
    CheckEmail -->|Yes| LinkAccount[Link to Existing Account]
    
    CreateUser --> SetPrimary[Set as Primary Provider]
    LinkAccount --> UpdateProviders[Update auth_providers Array]
    
    SetPrimary --> GenerateSession[Generate JWT Session]
    UpdateProviders --> GenerateSession
    
    GenerateSession --> SetCookie[Set Secure Cookie]
    SetCookie --> Success[Authentication Complete]
    
    style NewUser fill:#e3f2fd
    style LinkAccount fill:#fff3e0
    style Success fill:#e8f5e8
```

### Session Verification & Security

```mermaid
sequenceDiagram
    participant Client as Client (React)
    participant Server as tRPC Server
    participant JWT as JWT Validator
    participant DB as Database
    participant Cache as Session Cache

    Client->>Server: API Request with session cookie
    Server->>JWT: Extract & verify JWT signature
    
    alt JWT Invalid/Expired
        JWT->>Server: Validation failed
        Server->>Client: 401 Unauthorized
        Client->>Client: Redirect to OAuth login
    else JWT Valid
        JWT->>Server: Extract openId from payload
        Server->>Cache: Check session cache
        
        alt Cache Hit
            Cache->>Server: Return cached user data
        else Cache Miss
            Server->>DB: getUserByOpenId(openId)
            alt User Not Found
                Server->>DB: Try getUserByGoogleId (account linking)
            end
            DB->>Server: Return user record
            Server->>Cache: Cache user data (5min TTL)
        end
        
        Server->>DB: Update lastSignedIn timestamp
        Server->>Client: Return API response with user context
    end
```

### Security Features

- **CSRF Protection**: State tokens prevent cross-site request forgery
- **Secure Cookies**: HttpOnly, SameSite, and Secure flags
- **JWT Security**: HS256 signing with 32+ character secrets
- **Account Linking**: Automatic linking of multiple OAuth providers by email
- **Session Management**: Configurable timeouts and refresh mechanisms
- **Environment Validation**: Comprehensive security configuration checks

### Key Authentication Files

```mermaid
graph TD
    subgraph Client
        A[client/src/const.ts] --> |getGoogleLoginUrl| B[DashboardLayout.tsx]
        B --> |Login button| C[/api/oauth/google/init]
        D[useAuth.ts] --> |Session check| E[tRPC auth.me]
    end

    subgraph Server
        C --> F[server/_core/oauth.ts]
        F --> |registerOAuthRoutes| G[/api/oauth/google/callback]
        G --> H[server/_core/googleOAuth.ts]
        H --> |exchangeCodeForTokens| I[Google API]
        H --> |getGoogleUserInfo| I
        G --> J[server/_core/sdk.ts]
        J --> |createSessionToken| K[JWT Session]
        J --> |verifySession| K
    end

    subgraph Database
        G --> L[server/db.ts]
        L --> |upsertUserWithGoogle| M[(PostgreSQL)]
    end

    subgraph "Vercel Serverless"
        N[api/oauth/google/init.ts]
        O[api/oauth/google/callback.ts]
        P[api/oauth/google/status.ts]
    end
```

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
│       ├── _core/hooks/    # Core hooks (useAuth)
│       ├── components/     # UI components
│       │   └── ui/         # shadcn/ui primitives + custom components
│       │       ├── chart-skeleton.tsx    # Chart loading states
│       │       ├── ai-loading.tsx        # AI processing indicators
│       │       └── progress-feedback.tsx # Progress indicators
│       ├── pages/          # Page components
│       │   ├── Wizard.tsx      # Discovery wizard with presets
│       │   ├── Monitoring.tsx  # Real-time dashboard
│       │   └── Settings.tsx    # Account & provider management
│       ├── lib/            # Utilities
│       │   └── errorHandling.ts # Error boundary logic
│       └── const.ts        # Auth URLs and constants
├── server/                 # Express + tRPC backend
│   ├── _core/
│   │   ├── oauth.ts        # OAuth route registration
│   │   ├── googleOAuth.ts  # Google OAuth implementation
│   │   ├── envValidation.ts # Environment security validation
│   │   ├── sdk.ts          # Session management (JWT)
│   │   ├── cookies.ts      # Cookie configuration
│   │   └── env.ts          # Environment variables
│   ├── services/           # Business logic services
│   │   ├── goGetterAgent.ts     # AI agent implementation
│   │   ├── modelRouter.ts       # Multi-model AI routing
│   │   ├── tokenUsageLogging.ts # Token cost tracking
│   │   ├── tokenUsageTimeSeries.ts # Usage analytics
│   │   └── eventsTimeSeries.ts  # Event aggregation
│   ├── db.ts               # Database queries
│   └── routers.ts          # tRPC API routes
├── drizzle/                # Database schema & migrations
│   ├── schema.ts           # Table definitions
│   ├── relations.ts        # Table relationships
│   └── migrations/         # Database migrations
├── shared/                 # Shared types and constants
├── scripts/                # Utility scripts
│   └── seed-businesses.mjs # Business catalog seeding
└── tests/                  # Test files (60+ tests)
    ├── server/             # Backend tests
    │   ├── _core/          # Core functionality tests
    │   └── services/       # Service layer tests
    └── vitest.config.ts    # Test configuration
```

## Recent Major Enhancements (January 2026)

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

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm build:vercel` - Build for Vercel deployment
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema changes

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Express 4, tRPC 11
- **Authentication:** Google OAuth 2.0, JWT sessions
- **Database:** PostgreSQL with Drizzle ORM
- **Charts:** Recharts
- **Deployment:** Vercel (serverless functions)

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (32+ chars) | `your-super-secure-random-secret-key-here-32-chars-min` |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret | `GOCSPX-abcdef123456` |
| `OPENAI_API_KEY` | No | OpenAI API key for GPT models | `sk-proj-abc123...` |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for Claude | `sk-ant-api03-abc123...` |
| `GEMINI_API_KEY` | No | Google Gemini API key | `AIzaSyAbc123...` |
| `PERPLEXITY_API_KEY` | No | Perplexity AI API key | `pplx-abc123...` |
| `GROK_API_KEY` | No | xAI Grok API key | `xai-abc123...` |
| `MANUS_API_KEY` | No | Manus AI API key | `manus-abc123...` |
| `VITE_APP_ID` | No | Application identifier | `go-getter-os` |
| `OWNER_OPEN_ID` | No | Admin user's Open ID | `google-oauth2\|123456789` |
| `NODE_ENV` | No | Environment (development/production) | `development` |
| `PORT` | No | Server port (default: 3000) | `3000` |

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

MIT
