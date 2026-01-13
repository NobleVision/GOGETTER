# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev          # Start development server with hot reload
pnpm check        # TypeScript type checking (no emit)
pnpm format       # Format code with Prettier
pnpm test         # Run test suite (Vitest)
pnpm build        # Production build
pnpm build:vercel # Build for Vercel serverless deployment
pnpm db:push      # Generate and apply database migrations
```

Seed business catalog: `node scripts/seed-businesses.mjs`

## Architecture Overview

GO-GETTER OS is a full-stack application for AI-powered business opportunity discovery and monitoring.

**Stack:**
- Frontend: React 19 + Vite + TailwindCSS 4 + shadcn/ui + Wouter routing
- Backend: Express + tRPC 11 (end-to-end type safety)
- Database: PostgreSQL + Drizzle ORM
- Auth: Google OAuth 2.0 with JWT sessions (CSRF-protected state tokens)
- AI: Multi-model support (OpenAI, Anthropic, Gemini, Perplexity, Grok, Manus)

**Key Directories:**
- `client/src/` - React frontend with pages, components, hooks
- `server/` - Express backend with tRPC routers and services
- `server/services/` - Business logic (AI agent, model router, scoring)
- `server/_core/` - OAuth, session management, environment validation
- `drizzle/` - Database schema and migrations
- `shared/` - Types and constants shared between client/server
- `api/` - Vercel serverless function handlers (OAuth endpoints at `api/oauth/google/`)

## Code Patterns

**tRPC API:** Routes use `publicProcedure` or `protectedProcedure` in `server/routers.ts`. Protected routes have `ctx.user` guaranteed.

**Path Aliases:**
- `@/` → client/src
- `@shared/` → shared
- `@assets/` → attached_assets

**Error Handling:** Use `HttpError` classes from `shared/_core/errors.ts`:
```typescript
throw BadRequestError("message");
throw UnauthorizedError("message");
```

**Database:** Lazy connection pattern - use `await getDb()` from `server/db.ts`.

**AI Model Routing:** `server/services/modelRouter.ts` selects models based on task type (research, analysis, generation, scoring) with fallback support.

## Testing

Tests are colocated with source files (`*.test.ts`). Run individual test:
```bash
pnpm vitest run server/services/scoring.test.ts
```

## Formatting Rules

- Semicolons required
- Double quotes
- 2-space indentation
- 80 char line width
- Trailing commas (ES5 style)

## Business Scoring System

The composite scoring algorithm (0-100) uses 7 weighted factors:
- Guaranteed demand (20%), Automation level (15%), Token efficiency (15%), Profit margin (15%), Maintenance cost (10%), Legal risk (10%), Competition (10%)

Score tiers: prime, stable, experimental, archived

## Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection (SSL required in production)
- `JWT_SECRET` - Must be 32+ characters
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- AI keys (optional): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, `GROK_API_KEY`, `MANUS_API_KEY`
