# GO-GETTER OS

## Overview
GO-GETTER OS is a full-stack application that provides AI-powered business automation for passive income generation. It helps users identify, evaluate, and execute autonomous micro-business opportunities.

## Tech Stack
- **Frontend**: React 19 with Vite, TailwindCSS, Radix UI components
- **Backend**: Express.js with tRPC for type-safe API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Google OAuth + custom JWT-based sessions

## Project Structure
```
├── client/           # React frontend
│   ├── src/          # React components and hooks
│   └── public/       # Static assets
├── server/           # Express backend
│   ├── _core/        # Core server setup (vite, context, oauth, env)
│   ├── services/     # Business logic services
│   └── routers.ts    # tRPC routers
├── shared/           # Shared types between client/server
├── drizzle/          # Database schema and migrations
└── src-api/          # Vercel API routes (for deployment)
```

## Development

### Running Locally
The application runs on port 5000 with a single command:
```bash
pnpm run dev
```

### Database
- Uses Drizzle ORM with PostgreSQL
- Run migrations: `pnpm run db:push`
- Schema defined in `drizzle/schema.ts`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT tokens (min 32 characters)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)

## Recent Changes
- 2026-01-07: Configured for Replit environment
  - Updated Vite config to allow all hosts for proxy
  - Changed default port to 5000
  - Set up JWT_SECRET environment variable
  - Configured database and ran migrations
