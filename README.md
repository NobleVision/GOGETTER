# GO-GETTER OS

An autonomous business development platform powered by AI. Discover, evaluate, and launch automated money-making opportunities using AI agents.

## Features

- **Business Discovery Wizard** - Multi-step onboarding to capture your risk tolerance, capital, interests, and goals
- **Business Catalog** - 20+ autonomous micro-business opportunities across 4 verticals
- **Composite Scoring System** - 0-100 scoring based on demand, automation, token efficiency, profit margin, and more
- **Real-time Monitoring Dashboard** - Track active businesses, revenue, token costs, and agent status
- **Multi-Model API Configuration** - Support for OpenAI, Anthropic, Perplexity, Gemini, Grok, and Manus
- **Deployment Blueprints** - Step-by-step implementation guides with code scaffolds
- **Token Cost Tracking** - Monitor AI model usage and optimize costs
- **Webhook Configuration** - Set up endpoints for business event monitoring
- **Google OAuth Authentication** - Secure sign-in with Google accounts

## Authentication

GO-GETTER OS uses **Google OAuth 2.0** for user authentication. This provides a secure, industry-standard authentication flow without requiring users to create separate credentials.

### Google OAuth Flow

The authentication system follows the standard OAuth 2.0 Authorization Code flow:

```mermaid
sequenceDiagram
    participant User
    participant Client as Client (React)
    participant Server as Server (Express/Vercel)
    participant Google as Google OAuth

    User->>Client: Click "Sign in with Google"
    Client->>Server: GET /api/oauth/google/init
    Server->>Server: Generate state token & store
    Server->>Google: Redirect to Google consent screen
    Google->>User: Display consent screen
    User->>Google: Grant permission
    Google->>Server: Redirect to /api/oauth/google/callback?code=...&state=...
    Server->>Server: Validate state token
    Server->>Google: Exchange code for tokens
    Google->>Server: Return access_token, id_token
    Server->>Google: GET /userinfo
    Google->>Server: Return user profile (email, name, picture)
    Server->>Server: Create/update user in database
    Server->>Server: Generate JWT session token
    Server->>Client: Set session cookie & redirect to /
    Client->>User: Show authenticated dashboard
```

### Session Verification Flow

For authenticated API requests, the session is verified using JWT tokens:

```mermaid
sequenceDiagram
    participant Client as Client (React)
    participant Server as Server (tRPC)
    participant DB as Database

    Client->>Server: API Request with session cookie
    Server->>Server: Extract JWT from cookie
    Server->>Server: Verify JWT signature (HS256)
    alt JWT Invalid/Expired
        Server->>Client: 401 Unauthorized
        Client->>Client: Redirect to Google OAuth
    else JWT Valid
        Server->>Server: Extract openId from JWT
        Server->>DB: getUserByOpenId(openId)
        alt User Not Found
            Server->>DB: Try getUserByGoogleId (account linking)
        end
        DB->>Server: Return user record
        Server->>DB: Update lastSignedIn
        Server->>Client: Return API response
    end
```

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
├── client/                 # React frontend
│   └── src/
│       ├── _core/hooks/    # Auth hooks (useAuth)
│       ├── components/     # UI components
│       ├── pages/          # Page components
│       ├── lib/            # Utilities
│       └── const.ts        # Auth URLs and constants
├── server/                 # Express + tRPC backend
│   ├── _core/
│   │   ├── oauth.ts        # OAuth route registration
│   │   ├── googleOAuth.ts  # Google OAuth implementation
│   │   ├── sdk.ts          # Session management (JWT)
│   │   ├── cookies.ts      # Cookie configuration
│   │   └── env.ts          # Environment variables
│   ├── db.ts               # Database queries
│   └── routers.ts          # tRPC API routes
├── drizzle/                # Database schema
├── shared/                 # Shared types and constants
└── scripts/                # Utility scripts
```

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

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (32+ chars) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `VITE_APP_ID` | No | Application identifier |
| `OWNER_OPEN_ID` | No | Admin user's Open ID |
| `NODE_ENV` | No | Environment (development/production) |
| `PORT` | No | Server port (default: 3000) |

## License

MIT
