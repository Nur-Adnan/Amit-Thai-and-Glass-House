# User-Defined Preferred Patterns and Preferences

> Loaded by the PM, Architect, and PO agents so generated PRD/architecture docs stay
> consistent with this project's existing stack. Edit freely — the BMad upgrader will
> preserve your changes (writes a `.bak` if it ever needs to update this file).

## Project Shape

- Full-stack monorepo, two apps, no root `package.json`:
  - `frontend/` — Next.js App Router client
  - `backend/` — Express REST API
- Node.js >= 20 (developed on v22). Default to a single root-level BMad docs tree
  (`docs/prd`, `docs/architecture`, `docs/stories`) unless a story is clearly app-scoped.

## Frontend Stack

- Next.js 15 (App Router) + React 18, TypeScript 5.
- Tailwind CSS 3 with `@tailwindcss/forms` + `@tailwindcss/typography`.
- UI components: shadcn/ui on Radix primitives (`@radix-ui/*`); icons via `lucide-react`.
- Class composition: `clsx` + `tailwind-merge` + `class-variance-authority`.
- PDF/printing: `html2pdf.js`.
- Tests: Jest + Testing Library (unit/component), Playwright (e2e).
- Lint/format: ESLint (`eslint-config-next`, `@typescript-eslint`) + Prettier.

## Backend Stack

- Express 4 on Node, layered structure: `config / controllers / middleware / models / routes / services / utils`.
- Database: MongoDB via Mongoose 9.
- Auth: JWT (`jsonwebtoken`) + `bcryptjs`; input validation via `express-validator`.
- Uploads `multer`, scheduling `node-cron`, HTTP `node-fetch`, config via `dotenv`, `cors`.
- Tests: Jest + `supertest` + `mongodb-memory-server`. Dev runner: `nodemon`.

## Conventions / Preferences

- TypeScript on the frontend; keep types explicit at module boundaries.
- Prefer existing shadcn/Radix components over new UI dependencies.
- Reuse existing Express service/controller patterns; validate at the route boundary.
- Every non-trivial change ships with a matching Jest test (backend integration via supertest).
- Multiple deploy environments exist (`staging` / `production`) — keep env-specific config out of code.

## Things to Avoid

- New runtime dependencies when stdlib or an installed package already covers it.
- Bypassing `express-validator` / auth middleware on API routes.
- Committing secrets — environment values live in per-app `.env` (see `ENVIRONMENT_SETUP.md`).
