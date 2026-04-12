# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Heisenlink is a self-hosted URL shortener and bio page platform. It uses a **split architecture**: a Next.js 14 frontend (TypeScript) and a standalone Express.js backend (plain JavaScript), running as two separate processes in development.

## Commands

```bash
# Development (starts both Express backend + Next.js frontend via concurrently)
npm run dev

# Individual processes
npm run dev:server    # Express backend only (nodemon, port from .env PORT, default 3000)
npm run dev:next      # Next.js frontend only (port 3000)

# Database
npx prisma migrate dev     # Run migrations
npx prisma db push         # Push schema without migration
npm run db:seed            # Seed admin user
npm run db:studio          # Open Prisma Studio GUI

# Build & Production
npm run build              # Next.js build
npm start                  # Start Express server (serves API, Next.js is standalone)

# Testing
npm test                   # Jest (tests are in tests/unit/ and tests/integration/, currently empty)
npm run test:coverage      # Jest with coverage

# Lint & Format
npm run lint               # ESLint on src/
npm run format             # Prettier on src/

# Docker
docker-compose -f docker-compose.dev.yml up -d    # Full dev stack (app + postgres + redis)
docker-compose -f docker-compose.dev.yml up -d db redis   # Just infra
```

## Architecture

### Two-Process Split

- **Express backend** (`src/`): Plain JS (ESM). Entry point `src/server.js`. Runs on PORT (default 3000 in env, but Next.js config proxies to `INTERNAL_API_URL` default port 4000). Handles all `/api/*` routes and URL redirect resolution.
- **Next.js frontend** (`app/`): TypeScript + App Router. Proxies `/api/*` and `/uploads/*` to the Express backend via `next.config.js` rewrites.

### Backend Structure (`src/`)

Follows controller -> service -> Prisma pattern:
- `routes/` - Express route definitions, mounted at `/api/{auth,links,bio,analytics,admin}` plus public redirect routes
- `controllers/` - Request handling, delegates to services
- `services/` - Business logic (links, bio, auth, analytics, cache, LDAP, QR codes, audit)
- `middleware/` - Auth (JWT), admin role check, rate limiting, validation, error handling
- `config/` - App config loader, database (Prisma), Redis, LDAP connection
- `validators/` - Request validation schemas

### Frontend Structure

- `app/(auth)/` - Login pages
- `app/(dashboard)/` - Authenticated dashboard (links, bio, analytics, settings, admin panels)
- `app/[slug]/` - Public short link / bio page resolution
- `components/` - Organized by domain: `links/`, `bio/`, `analytics/`, `admin/`, `dashboard/`, `landing/`, `layout/`, `shared/`, `public/`, `ui/` (shadcn)
- `stores/auth-store.ts` - Zustand store for auth state (JWT tokens, user), persisted to localStorage
- `lib/api.ts` - Axios instance with JWT interceptor and automatic token refresh
- `hooks/` - Custom React hooks (`use-auth`, `use-debounce`)

### Key Technical Details

- **UI**: shadcn/ui (new-york style) + Tailwind CSS + Lucide icons. Path alias `@/*` maps to repo root.
- **State**: Zustand for auth, TanStack React Query for server state
- **Auth**: JWT access + refresh tokens. Optional LDAP/Active Directory integration.
- **Database**: PostgreSQL via Prisma. Models: User, ShortLink, BioPage, BioLink, ClickEvent, AuditLog.
- **Cache**: Redis via ioredis. Used for rate limiting and caching shortlink/bio lookups.
- **Analytics**: ClickEvent records with IP, user-agent parsing (ua-parser-js), referrer, device/browser/OS tracking.
- **QR Codes**: Generated server-side via `qrcode` package.
- **Logging**: Winston logger, outputs to `logs/app.log`.
- **Node.js**: Requires >= 20. Package uses ESM (`"type": "module"`).
