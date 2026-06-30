# Amit Thai & Glass House — Business Management System

A management system for a glass/aluminium shop: invoicing, inventory, customers, finance, payroll, and reporting. Built for non-technical shop staff, with English + Bengali (বাংলা) support.

- **`backend/`** — Node.js + Express (ESM) API, MongoDB/Mongoose, JWT auth
- **`frontend/`** — Next.js 15 (App Router) + TypeScript, Tailwind, Radix/shadcn UI
- **`docs/`** — guides, testing, audit, and feature reports → [docs/README.md](docs/README.md)

## Getting started

Requires Node.js 18+ and a MongoDB instance.

```bash
# Backend
cd backend
cp .env.example .env        # set MONGODB_URI and JWT_SECRET
npm install
npm run seed:owner          # create the first owner account
npm run dev                 # http://localhost:3001

# Frontend (in a second terminal)
cd frontend
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev                 # http://localhost:3000
```

## Documentation

- **[docs/README.md](docs/README.md)** — full documentation index
- **[docs/guides/ENVIRONMENT_SETUP.md](docs/guides/ENVIRONMENT_SETUP.md)** — configuration
- **[docs/guides/DEPLOYMENT_GUIDE.md](docs/guides/DEPLOYMENT_GUIDE.md)** — deployment
- **[docs/audit/PRODUCTION_READINESS_AUDIT.md](docs/audit/PRODUCTION_READINESS_AUDIT.md)** — known issues & production-readiness plan

## Scripts

| | Backend (`backend/`) | Frontend (`frontend/`) |
|---|---|---|
| Dev | `npm run dev` | `npm run dev` |
| Build / start | `npm start` | `npm run build` / `npm start` |
| Lint | `npm run lint` | `npm run lint` |
| Test | `npm test` | `npm test`, `npm run test:e2e` |
