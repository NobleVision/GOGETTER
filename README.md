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

## Local Setup

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database (or use a cloud provider like Neon)

### Installation

1. **Extract the zip file and navigate to the project:**
   ```bash
   unzip go-getter-os.zip
   cd go-getter-os
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   
   # Auth (generate a random secret)
   JWT_SECRET=your-random-secret-key-here
   
   # Optional: OAuth (for Manus authentication)
   VITE_APP_ID=your-app-id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://manus.im/login
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
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       ├── pages/          # Page components
│       └── lib/            # Utilities
├── server/                 # Express + tRPC backend
│   ├── _core/              # Core framework files
│   ├── db.ts               # Database queries
│   └── routers.ts          # tRPC API routes
├── drizzle/                # Database schema
├── shared/                 # Shared types
└── scripts/                # Utility scripts
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema changes

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Express 4, tRPC 11
- **Database:** PostgreSQL with Drizzle ORM
- **Charts:** Recharts

## License

MIT
