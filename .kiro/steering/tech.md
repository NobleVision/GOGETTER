# Tech Stack

## Frontend
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui components (Radix UI primitives)
- wouter for routing
- TanStack React Query for server state
- tRPC React client for type-safe API calls
- Recharts for data visualization
- Framer Motion for animations

## Backend
- Express 4 server
- tRPC 11 for type-safe API layer
- superjson for data serialization

## Database
- PostgreSQL
- Drizzle ORM for schema and queries
- drizzle-kit for migrations

## Build & Dev
- Vite 7 for bundling and dev server
- esbuild for server bundling
- pnpm as package manager
- TypeScript 5.9
- Vitest for testing
- Prettier for formatting

## Common Commands

```bash
# Development
pnpm dev              # Start dev server (tsx watch)

# Build
pnpm build            # Build client (Vite) + server (esbuild)
pnpm start            # Run production build

# Database
pnpm db:push          # Generate and run migrations

# Quality
pnpm check            # TypeScript type checking
pnpm format           # Prettier formatting
pnpm test             # Run tests with Vitest
```

## Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
