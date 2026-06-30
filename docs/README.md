# Documentation

Business management system for **Amit Thai & Glass House** — invoicing, inventory, customers, finance, and reporting for a glass/aluminium shop (Bangladesh market, English + Bengali).

> Most files under `features/` are historical *implementation reports* (one per feature, written as it was built). They document intent and decisions, not current API contracts. For the current state of the system, start with the guides and the audit.

## Start here

| I want to… | Read |
|---|---|
| Run the app locally | [../README.md](../README.md) |
| Set up environments / config | [guides/ENVIRONMENT_SETUP.md](guides/ENVIRONMENT_SETUP.md) |
| Deploy to staging/production | [guides/DEPLOYMENT_GUIDE.md](guides/DEPLOYMENT_GUIDE.md) |
| Restore from backup | [guides/RESTORE_INSTRUCTIONS.md](guides/RESTORE_INSTRUCTIONS.md) |
| Run the tests | [guides/TESTING_QUICK_START_GUIDE.md](guides/TESTING_QUICK_START_GUIDE.md) |
| See known issues & what's left for production | [audit/PRODUCTION_READINESS_AUDIT.md](audit/PRODUCTION_READINESS_AUDIT.md) |

## Structure

```
docs/
├── guides/        Operational how-to: setup, deploy, restore, env migration
├── testing/       Test strategy, status, QA sign-off
├── audit/         Production-readiness audit & remediation plan
└── features/      Per-feature implementation reports (historical)
    ├── invoicing/      Invoice creation, printing, variant tracking
    ├── inventory/      Stock, purchases, suppliers, brands, wastage, measurements
    ├── finance/        Calculator, payments, expenses, profit, analytics, daily summary
    ├── customers/      Customer management & credit/trust
    ├── system/         Auth/permissions, audit log, backup, soft-delete, error handling
    └── ux-design/      Navigation, design system, Bengali language, usability
```

## Guides

- [ENVIRONMENT_SETUP.md](guides/ENVIRONMENT_SETUP.md) — local + environment configuration
- [DEPLOYMENT_GUIDE.md](guides/DEPLOYMENT_GUIDE.md) — staging/production deploy
- [ENVIRONMENT_MIGRATION_SUMMARY.md](guides/ENVIRONMENT_MIGRATION_SUMMARY.md) — config migration notes
- [RESTORE_INSTRUCTIONS.md](guides/RESTORE_INSTRUCTIONS.md) — backup restore procedure
- [TESTING_QUICK_START_GUIDE.md](guides/TESTING_QUICK_START_GUIDE.md) — running tests

## Testing

- [TESTING_STRATEGY_COMPLETE.md](testing/TESTING_STRATEGY_COMPLETE.md)
- [TESTING_IMPLEMENTATION_STATUS.md](testing/TESTING_IMPLEMENTATION_STATUS.md)
- [QA_SIGNOFF.md](testing/QA_SIGNOFF.md)

## Audit

- [PRODUCTION_READINESS_AUDIT.md](audit/PRODUCTION_READINESS_AUDIT.md) — full system audit: bugs, security, performance, scalability, architecture, and UX, with a prioritized remediation plan.
