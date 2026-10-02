# Amit Thai & Glass House

Business management system built for a glass and aluminium shop in Bangladesh. It puts stock, invoices, customer dues and day-to-day finances in one place, with a Bengali-language interface for shop staff.

## Modules

- **Inventory:** products, brands, material specs, stock overview, stock purchases and wastage tracking
- **Invoicing:** invoice creation with a glass-pricing calculator, invoice payments, advance payments and print-optimised invoices
- **Customers and suppliers:** customer records with credit and dues tracking, and supplier management
- **Finance:** expenses, investments, profit, daily and business summaries, analytics and reports
- **Payroll:** employees and salary payments
- **Administration:** role-based permissions, audit log, soft delete with restore, backups and shop configuration

## Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, Jest, Playwright |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT authentication, Jest |

## Project structure

```
backend/    Express API (src/routes, src/models)
frontend/   Next.js app (src/app)
scripts/    Maintenance scripts
tests/      Cross-cutting tests
```

## Getting started

```bash
# API
cd backend
npm install
cp .env.example .env     # set MONGODB_URI and JWT_SECRET
npm run dev

# Web app
cd frontend
npm install
npm run dev
```

## Further documentation

- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md): environment variables per environment
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md): deployment steps
- [TESTING_QUICK_START_GUIDE.md](TESTING_QUICK_START_GUIDE.md): running the test suites
- [RESTORE_INSTRUCTIONS.md](RESTORE_INSTRUCTIONS.md): backup and restore

The `*_COMPLETE.md` files in the repository root are implementation notes for individual features.
