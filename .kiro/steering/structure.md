# Project Structure

```
├── client/                    # React frontend
│   └── src/
│       ├── components/        # Reusable UI components
│       │   └── ui/            # shadcn/ui primitives
│       ├── pages/             # Route page components
│       ├── contexts/          # React contexts (ThemeContext)
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Utilities (trpc client, utils)
│       └── _core/             # Core framework hooks (useAuth)
│
├── server/                    # Express + tRPC backend
│   ├── routers.ts             # Main tRPC router (appRouter)
│   ├── db.ts                  # Database query functions
│   ├── storage.ts             # File storage helpers
│   └── _core/                 # Core framework (context, auth, env, trpc setup)
│
├── shared/                    # Shared code between client/server
│   ├── types.ts               # Re-exports from drizzle schema
│   ├── const.ts               # Shared constants
│   └── _core/                 # Core shared utilities (errors)
│
├── drizzle/                   # Database schema and migrations
│   ├── schema.ts              # Drizzle table definitions
│   └── relations.ts           # Table relations
│
└── scripts/                   # Utility scripts (seed-businesses.mjs)
```

## Key Patterns

### tRPC Router Structure
Routes are organized by domain in `server/routers.ts`:
- `auth` - Authentication (me, logout)
- `profile` - User profile management
- `businesses` - Business catalog CRUD
- `userBusinesses` - User's deployed businesses
- `tokenUsage` - Token tracking
- `events` - Business event logging
- `apiConfig` - API key management
- `webhooks` - Webhook configuration
- `dashboard` - Aggregated stats

### Procedure Types
- `publicProcedure` - No auth required
- `protectedProcedure` - Requires authenticated user
- `adminProcedure` - Requires admin role

### Database Access
All DB operations go through functions in `server/db.ts`. Use `getDb()` for lazy connection initialization.

### Component Conventions
- Pages wrap content in `<DashboardLayout>`
- Use shadcn/ui components from `@/components/ui/`
- tRPC hooks via `trpc.routerName.procedureName.useQuery()` or `.useMutation()`
