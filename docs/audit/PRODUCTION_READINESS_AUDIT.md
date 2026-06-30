# Production-Readiness Audit — Amit Thai & Glass House

**Date:** 2026-06-30
**Scope:** Full system — backend (Node/Express/Mongoose), frontend (Next.js 15), data model, tests, CI, and UI/UX.
**Method:** Static analysis by 9 parallel domain reviewers (security, backend correctness, data & scalability, backend quality, frontend correctness, frontend quality, UX, testing, performance). Every *critical*/*high* finding was independently re-read and adversarially verified against the cited code; refuted findings were dropped. Where verification corrected a severity, both are shown (`filed → verified`).
**Caveat:** `node_modules` was not installed during the audit, so this is static review — no runtime profiling, no executed test suite. Latency/scale claims are reasoned from query shapes and data growth, not measured.

---

## Verdict

**Not production-ready.** The system is feature-rich and the backend is reasonably layered, but there are **deploy-blocking** defects (the frontend cannot talk to a non-localhost API; login is hard-wired to `localhost`), **security holes** on the authentication path (NoSQL operator injection, no rate limiting, a password-corrupting save hook), **data-integrity risk** on money paths, and a **test/QA story that overstates reality** (a "100% / approved for production" sign-off sitting next to a "5–10% coverage, broken config" status doc). None of these are unfixable; the roadmap at the end sequences them.

The good news: the worst problems are concentrated and mechanical. The single highest-leverage fix — routing every request through the env-aware API client that *already exists but is unused* — simultaneously closes the deploy blocker, the duplicated-auth problem, and the missing-401-handling problem.

### Headline numbers

| Severity | Count |
|---|---|
| Critical (as filed) | 2 — both verified down to High on closer reading, but still must-fix |
| High | ~20 |
| Medium | ~23 |
| Low | ~15 |

### Must-fix before any deploy (P0)

1. **Frontend hard-codes `http://localhost:3001` in 34 places** and never uses the env-aware client → the app is undeployable as-is. *(frontend-quality)*
2. **Login posts to `http://localhost:3001/api/auth/login`** literally → authentication fails in every non-local environment. *(ux / frontend)*
3. **NoSQL operator injection** on `/api/auth/login` and `/register` — no input validation. *(security)*
4. **Password pre-save hook is missing a `return`** → any `user.save()` that doesn't change the password re-hashes the hash and locks the user out. *(security/correctness)*
5. **No rate limiting** on login → brute-force / credential-stuffing open. *(security)*
6. **Transactions require a MongoDB replica set** — money writes use `withTransaction`, which throws on a standalone `mongod`; verify the deploy target is a replica set or every invoice/payment fails. *(correctness)*
7. **Tests don't run / don't test real code**, and `QA_SIGNOFF.md` falsely certifies production-readiness. *(testing)*

> Note: the money paths *do* use transactions correctly (a strength) — the corrected concerns are transaction boundaries (response sent before commit; customer recalc outside the txn) and the replica-set requirement, detailed in §2.

---

## 1. Security

> Real, high-severity gaps concentrated in auth and user management. Stack traces are dev-gated and committed `.env` files hold only placeholders (both checked and cleared), so those are *not* problems.

| # | Sev (filed→verified) | Issue | Location |
|---|---|---|---|
| S1 | Critical → **High** | **NoSQL operator injection / user enumeration.** `/login` only guards `!email`; `{ "email": { "$gt": "" } }` injects a Mongo operator into `User.findOne({ email })`. `bcrypt.compare` still blocks full bypass, but enumeration and regex-DoS are live. `/register` is equally unguarded. | [authController.js:34-46](../../backend/src/controllers/authController.js#L34), [routes/auth.js:15](../../backend/src/routes/auth.js#L15) |
| S2 | **High** | **No rate limiting anywhere.** Config exists in `env.js` but `express-rate-limit` is not installed and never wired → unlimited login attempts. | [index.js:61-83](../../backend/src/index.js#L61) |
| S3 | High → **Medium** | **Mass-assignment in `updateUser`:** `findByIdAndUpdate(id, req.body)` lets any field through (e.g. `role`, `isActive`). | [userController.js:39-43](../../backend/src/controllers/userController.js#L39) |
| S4 | **Medium** | **Password hook bug + weak cost.** `if (!this.isModified('password')) { next(); }` is missing `return`, so it falls through and re-hashes; also `genSalt(10)` ignores the configured 12 rounds. | [User.js:44-51](../../backend/src/models/User.js#L44) |
| S5 | **Medium** | **Long-lived JWT (30d), no revocation/refresh, stored in `localStorage`** → XSS can exfiltrate a month-long token. | [User.js:54-58](../../backend/src/models/User.js#L54) |
| S6 | **Medium** | **No `helmet`** / security response headers. | [index.js:61-67](../../backend/src/index.js#L61) |
| S7 | **Medium** | **Logo upload trusts client-supplied MIME**, no extension allowlist. | [shopConfigController.js:19-40](../../backend/src/controllers/shopConfigController.js#L19) |
| S8 | **Low** | Two divergent authorization systems (role-based vs permission-based) used inconsistently across routes. | `middleware/auth.js`, `middleware/permissions.js` |

**Fix bundle (S1–S2, S6):** add `helmet`, `express-rate-limit` (tight on `/api/auth`), and `express-mongo-sanitize` in `index.js`; add `express-validator` chains to auth routes (the dependency is already installed). **S3:** whitelist updatable fields. **S4:** `if (!this.isModified('password')) return next();` and use `config.bcryptRounds`. **S5:** shorten token life + add refresh, or move to httpOnly cookies.

## 2. Backend Correctness & Money Paths

> **Reviewed directly (the automated reviewer for this dimension failed to produce valid output, so these findings are from a manual read of the money paths).** Encouragingly, the money paths are a relative **strength**: invoice creation, payment recording, and stock purchases all use real `session.withTransaction()` blocks with session-bound reads and stock decrements inside the transaction. The residual issues are about transaction *boundaries* and money representation, not missing transactions.

| # | Sev | Issue | Location |
|---|---|---|---|
| C1 | **Medium** | **Customer totals are recalculated outside the payment transaction.** `addPayment` runs inside `withTransaction`, but `invoice.customer.recalculateTotals()` takes no session and issues its own queries/`save()` on the default connection. If the transaction later aborts, the customer's `totalDue`/balance has already been persisted → drift between invoice state and customer ledger. | [invoicePaymentController.js:102](../../backend/src/controllers/invoicePaymentController.js#L102), [Customer.js:304](../../backend/src/models/Customer.js#L304) |
| C2 | **Medium** | **Success response is sent *before* the transaction commits.** `res.status(201).json({... 'Payment added successfully' ...})` executes inside the `withTransaction` callback; if the commit then fails, the client was told the payment succeeded while the data rolled back. Same pattern in `invoiceController` create/update. | [invoicePaymentController.js:112](../../backend/src/controllers/invoicePaymentController.js#L112), [invoiceController.js:130-452](../../backend/src/controllers/invoiceController.js#L130) |
| C3 | **Medium** | **Transactions require a MongoDB replica set.** `withTransaction` throws on a standalone `mongod` (the cheapest/most common single-VM deploy). Every invoice/payment/stock write would fail in production unless Mongo is run as a replica set (or Atlas). This is undocumented in the deploy guide. | all money-path controllers; [DEPLOYMENT guide](../guides/DEPLOYMENT_GUIDE.md) |
| C4 | Low → **Medium** | **Money stored as floating-point** (27 `type: Number` money fields on Invoice; same elsewhere). Per-line rounding (`Math.round(x*100)/100`) mitigates but does not eliminate drift when many lines/payments are summed. Industry practice is integer minor units (paisa). | [Invoice.js](../../backend/src/models/Invoice.js) (grandTotal/paidAmount/dueAmount), [stockPurchaseController.js:208](../../backend/src/controllers/stockPurchaseController.js#L208) |
| C5 | **Low** | Payment status is derived inline in two places (add + reverse payment) with duplicated paid/partial/due threshold logic — divergence risk. Centralize on the `Invoice` model. | [invoicePaymentController.js:57-93,268-293](../../backend/src/controllers/invoicePaymentController.js#L57) |

**Fixes:** C1 — thread the session into `recalculateTotals(session)` and run it inside the transaction. C2 — move `res.json()` to after `withTransaction` resolves. C3 — document the replica-set requirement and detect/log it at startup. C4 — migrate money to integer paisa (larger change; track separately).



## 3. Data Model & Scalability

> Fine on seed data, several cliffs as invoice/customer/audit volume grows.

| # | Sev | Issue | Location |
|---|---|---|---|
| D1 | **High** | **N+1 in `Customer.calculateDueAging`** — one `Invoice.find` per indebted customer. | [Customer.js:367-444](../../backend/src/models/Customer.js#L367), [customerCreditController.js:105](../../backend/src/controllers/customerCreditController.js#L105) |
| D2 | **High** | **Missing index on `Invoice.customer`** despite filtering on it on every customer-detail/recalc path → full collection scans. | [Invoice.js:1557-1561](../../backend/src/models/Invoice.js#L1557) |
| D3 | **High** | **Unbounded analytics aggregations** with `$push`/`$addToSet` and optional (often absent) date filter → risk of the 16MB BSON document limit. | [businessAnalyticsController.js:319-369](../../backend/src/controllers/businessAnalyticsController.js#L319) |
| D4 | **Medium** | **No `.lean()` on any read query** across all controllers → full Mongoose hydration overhead. | `controllers/*.js` |
| D5 | **Medium** | **`find()` with no limit / uncapped user-supplied `limit`** on report endpoints and model statics. | [Customer.js:547](../../backend/src/models/Customer.js#L547), [Customer.js:371](../../backend/src/models/Customer.js#L371) |
| D6 | **Medium** | **`AuditLog` grows forever** — no TTL/retention, `Mixed` `changes`/`metadata` fields. | [AuditLog.js:90-113](../../backend/src/models/AuditLog.js#L90) |
| D7 | **Medium** | **Unanchored `$regex` search** (case-insensitive) cannot use indexes → full scan per search. | [customerController.js:40-47](../../backend/src/controllers/customerController.js#L40), [productController.js:38-40](../../backend/src/controllers/productController.js#L38) |
| D8 | **Low** | Invoice indexes are all single-field; the common list query (`isActive`+`isDeleted`+`createdAt` sort) has no compound index. | [Invoice.js:1557](../../backend/src/models/Invoice.js#L1557) |
| D9 | **Low** | Unbounded embedded `items[]` subdocument arrays on `Invoice` / `StockPurchase`. | `models/Invoice.js`, `models/StockPurchase.js` |

## 4. Backend Code Quality & Architecture

| # | Sev | Issue | Location |
|---|---|---|---|
| BQ1 | High → **Medium** | **Hardcoded JWT bearer tokens committed** in root-level throwaway test scripts (secret exposure). | [test-stock-purchase.js:2](../../test-stock-purchase.js#L2), `test-simple-stock-purchase.js`, `test-calculator-api.js` |
| BQ2 | **Medium** | **Three competing error-handling layers** (`enhancedErrorHandler` wired; `errorHandler.js` dead; `ErrorResponse` util) → ≥3 different client error shapes. | [middleware/enhancedErrorHandler.js](../../backend/src/middleware/enhancedErrorHandler.js) |
| BQ3 | **Medium** | **5 controllers use raw `try/catch`** that leak `error.message` to clients in a non-standard shape. | [serviceCostController.js:140-147](../../backend/src/controllers/serviceCostController.js#L140) |
| BQ4 | **Medium** | **God-files:** `calculatorController` ~1671 lines (one 300-line handler), `dashboardController` ~1127, `Invoice` model ~1578. | [calculatorController.js:1130-1430](../../backend/src/controllers/calculatorController.js#L1130) |
| BQ5 | **Low** | Dead code committed: `calculatorControllerOld.js`, `auditService.js.backup`. | `backend/src/controllers/`, `backend/src/services/` |
| BQ6 | **Low** | Validation applied inconsistently across routes; no central convention. | `backend/src/routes/*.js` |
| BQ7 | **Low** | `console.*` left in controllers/services instead of the `logger` abstraction. | various |
| BQ8 | **Low** | Duplicated not-found / ObjectId-validation boilerplate across controllers. | various |

## 5. Frontend Correctness

| # | Sev | Issue | Location |
|---|---|---|---|
| FC1 | **High** | **No token-expiry / 401 handling on any page** — an expired session shows empty data or a generic error and never re-authenticates. | [invoices/page.tsx:112-133](../../frontend/src/app/invoices/page.tsx#L112), [lib/api.ts:31-34](../../frontend/src/lib/api.ts#L31) |
| FC2 | High → **Medium** | **Analytics sets an `error` state that is never rendered** → silent failures. | [analytics/page.tsx:107](../../frontend/src/app/analytics/page.tsx#L107) |
| FC3 | High → **Low** | `shop-config` `updateConfig` mutates nested state in place → lost re-renders / corrupted unsaved edits. | [shop-config/page.tsx:261-274](../../frontend/src/app/shop-config/page.tsx#L261) |
| FC4 | **Medium** | Invoices PDF export leaks an appended DOM node when `html2pdf.save()` throws. | [invoices/page.tsx:184-209](../../frontend/src/app/invoices/page.tsx#L184) |
| FC5 | **Medium** | Calculator leaves a stale result visible after a failed recalculation. | [calculator/page.tsx:218-255](../../frontend/src/app/calculator/page.tsx#L218) |
| FC6 | **Medium** | Invoice builder payment status returns `'paid'` for a zero/empty invoice. | [invoice/page.tsx:138-145](../../frontend/src/app/invoice/page.tsx#L138) |
| FC7 | **Medium** | Analytics has no loading indicator initially and can crash on `summary` access for malformed responses. | [analytics/page.tsx:185-200](../../frontend/src/app/analytics/page.tsx#L185) |
| FC8 | **Medium** | Finance / shop-config swallow create/save failures and over-report success. | [finance/page.tsx:216-285](../../frontend/src/app/finance/page.tsx#L216) |
| FC9 | **Low** | Number inputs accept negative / out-of-range values; client min/max not enforced. | various pages |
| FC10 | **Low** | Invoices status filter uses an unlabeled native `<select>` (accessibility). | [invoices/page.tsx:785](../../frontend/src/app/invoices/page.tsx#L785) |
| FC11 | **Low** | Calculator cascading reset-effects can race on rapid selection changes. | [calculator/page.tsx](../../frontend/src/app/calculator/page.tsx) |

## 6. Frontend Code Quality & Architecture

| # | Sev | Issue | Location |
|---|---|---|---|
| FQ1 | Critical → **High** | **API base URL hardcoded `http://localhost:3001` in 34 places**; the env-aware `ApiClient` ([lib/api.ts](../../frontend/src/lib/api.ts)) is imported by **zero** files → undeployable, unmaintainable. | 13 pages; e.g. [invoices/page.tsx:113](../../frontend/src/app/invoices/page.tsx#L113) |
| FQ2 | **High** | **No shared `AuthContext` / route guard** — token read + auth wiring duplicated across 12 pages and 13 components. | [Layout.tsx:64-78](../../frontend/src/components/Layout.tsx#L64) (the only guard) |
| FQ3 | **High** | **401 handling missing from 12 of 13 pages** (only `shop-config` checks `status === 401`). | [shop-config/page.tsx:114](../../frontend/src/app/shop-config/page.tsx#L114) |
| FQ4 | High → **Medium** | 1000+ line page components mix data-fetching, business logic, and UI. | invoices (1088), shop-config (1062), analytics (1033) |
| FQ5 | **High** | **Hardcoded USD currency formatting in payroll** breaks BDT/Bengali i18n. | [payroll/page.tsx:219-225](../../frontend/src/app/payroll/page.tsx#L219) |
| FQ6 | **Medium** | Dead/orphaned code: unused settings tabs, orphaned `apiWithConfirmation` util, no-nav `design-system` page. | `components/settings/*Tab.tsx`, `app/design-system` |
| FQ7 | **Medium** | Weak type safety: 40 `: any` + 13 `as any` casts concentrated in money/permission paths. | `hooks/useDangerousEdit.ts`, `app/analytics/page.tsx`, … |
| FQ8 | **Low** | Each settings tab re-implements its own auth+fetch instead of receiving data/services from the parent. | `components/settings/*Tab.tsx` |

## 7. UI / UX (the owner's "too complex" complaint)

> The information architecture is the root cause. A glass-shop clerk who only makes invoices and checks dues is forced to scan **14 flat, ungrouped sidebar items**, several of which are duplicative, dead, or admin-only.

| # | Sev | Issue | Location |
|---|---|---|---|
| UX1 | High → **Medium** | **14 flat, ungrouped nav items** (11 base + up to 3 owner items) in one `space-y-1` list, no sections. Daily staff see Reports/Analytics/Payroll/Permissions they never use. | [Layout.tsx:87-177](../../frontend/src/components/Layout.tsx#L87) |
| UX2 | High → **Medium** | **Reports and Analytics are duplicate destinations with the same icon — and `/reports` is an empty stub** ("Sales data will be displayed here"), while `/analytics` is the real ~1000-line page. | [reports/page.tsx:250-271](../../frontend/src/app/reports/page.tsx#L250) vs [analytics/page.tsx:300](../../frontend/src/app/analytics/page.tsx#L300) |
| UX3 | **High** | **Hardcoded `localhost` API URLs make the deployed app non-functional** — including login. (Same root cause as FQ1; called out here as a UX-blocking defect.) | [login/page.tsx:25](../../frontend/src/app/login/page.tsx#L25) |
| UX4 | High → **Medium** | **Dead/no-op controls erode trust:** the "New Invoice" button on the invoices page has no handler, "Learn More" on the landing page does nothing, "Profile Settings" in the user menu is a no-op. | [invoices/page.tsx:703](../../frontend/src/app/invoices/page.tsx#L703), [page.tsx:75-80](../../frontend/src/app/page.tsx#L75), [Layout.tsx:255-258](../../frontend/src/components/Layout.tsx#L255) |
| UX5 | **High** | **Recording a customer payment has no entry point on the customer screen** — the Customers table has no actions column, so the most common money task has no obvious path. | [customers/page.tsx:589-663](../../frontend/src/app/customers/page.tsx#L589) |
| UX6 | **Medium** | **i18n gaps:** the "Analytics" nav label is hardcoded English (no `bn` key), and page titles ("Customer Management", "Inventory Management", "Finance Management") bypass `t()` → a Bengali-only owner sees a half-English UI. | [Layout.tsx:134](../../frontend/src/components/Layout.tsx#L134), [customers/page.tsx:403](../../frontend/src/app/customers/page.tsx#L403) |
| UX7 | **Medium** | **Orphaned pages:** the three inventory sub-pages are reachable only via in-page `window.location.href` buttons (lose SPA state), and `/design-system` (a dev page) has no Layout and is user-reachable. | [inventory/page.tsx:336-358](../../frontend/src/app/inventory/page.tsx#L336), [design-system/page.tsx](../../frontend/src/app/design-system/page.tsx) |
| UX8 | **Medium** | **Inconsistent terminology:** nav says "Expenses" but the page title is "Finance Management"; "Create Invoice" (nav noun) vs "New Invoice" (button) vs a separate "Invoices" entry. | [Layout.tsx:118-122](../../frontend/src/components/Layout.tsx#L118) |
| UX9 | **Medium** | Risk-status UI relies on color + English text + animation (accessibility/clarity); emoji used to convey meaning in filters. | [customers/page.tsx:198-296](../../frontend/src/app/customers/page.tsx#L198) |
| UX10 | **Low** | Demo credentials and a hardcoded `© 2024` are printed in the production UI. | [login/page.tsx:169-183](../../frontend/src/app/login/page.tsx#L169), [page.tsx:128](../../frontend/src/app/page.tsx#L128) |

### Proposed information architecture (14 flat items → 5 plain-language sections)

A daily clerk's everyday surface drops from 14 icons to ~3 sections (Home, Sales, Customers).

| Section (en / bn) | Routes | Notes |
|---|---|---|
| **Home / হোম** | `/dashboard` | Today's totals + warnings |
| **Sales / বিক্রয়** | `/invoice` (primary **+ New Invoice**), `/invoices` (history), `/calculator` | Merge the "Create Invoice" + "Invoices" nouns into one section with a single prominent action |
| **Customers & Money / গ্রাহক ও বকেয়া** | `/customers` (+ per-row Record Payment), `/finance` (relabel → **Expenses / খরচ**) | Who owes money + recording payments |
| **Stock / স্টক** | `/inventory`, `/inventory/stock-overview`, `/inventory/stock-purchase`, `/inventory/bd-shop-stock` | Promote the orphaned sub-pages here |
| **Insights / রিপোর্ট** | `/analytics` (single destination) | Drop the stub `/reports` from nav |
| **Admin / সেটিংস** (owner-only, collapsed) | `/settings`, `/shop-config`, `/permissions`, `/soft-delete` | Hidden from daily staff; remove `/design-system` from prod |



## 8. Testing & CI Readiness

> The "production-ready" claims are **not credible.**

| # | Sev | Issue | Location |
|---|---|---|---|
| T1 | **High** | Supertest integration suites import `backend/src/app.js`, **which does not exist** (the app is defined inline in `index.js` and never exported) → suites fail at module load. | [tests/integration/backend/auth.test.js:2](../../tests/integration/backend/auth.test.js#L2) |
| T2 | **High** | ~half of all test files are **self-contained mocks** that re-implement business logic inline and assert against self-generated data → they exercise **zero real source code**. | `tests/unit/backend/.../calculation-accuracy.test.js`, +15 others |
| T3 | **High** | `QA_SIGNOFF.md` certifies "100% / APPROVED FOR PRODUCTION" while `TESTING_IMPLEMENTATION_STATUS.md` in the same repo admits 5–10% coverage and unresolved module-resolution issues. | [docs/testing/QA_SIGNOFF.md](../testing/QA_SIGNOFF.md), [docs/testing/TESTING_IMPLEMENTATION_STATUS.md](../testing/TESTING_IMPLEMENTATION_STATUS.md) |
| T4 | **High** | **No CI** — no `.github/workflows`, no lint/typecheck/test gating. | repo root |
| T5 | **Medium** | Contradictory ESM/CommonJS jest setup (`--experimental-vm-modules` + babel-to-CJS + `require()` in tests). | [backend/package.json](../../backend/package.json) |
| T6 | **Medium** | Frontend has ~2 component tests for ~49 components / 20 pages. | `tests/unit/frontend/components/` |
| T7 | **Low** | Repo-root throwaway test/debug scripts and dead controllers pollute the codebase. | `test-*.js`, `debug-stock-purchase.js` |

## 9. Performance

| # | Sev | Issue | Location |
|---|---|---|---|
| P1 | **High** | All dashboard/analytics aggregations are **uncached and recomputed on every request** (no cache/ETag/Cache-Control anywhere). | [dashboardController.js](../../backend/src/controllers/dashboardController.js), [businessAnalyticsController.js](../../backend/src/controllers/businessAnalyticsController.js) |
| P2 | **High** | Analytics `$unwind`+`$lookup` over the **entire Invoice collection**, no date bound, no `items.*` index. | [businessAnalyticsController.js:155-220](../../backend/src/controllers/businessAnalyticsController.js#L155) |
| P3 | **High** | Invoices page **fetches without a `limit` (gets only 10 rows)** then searches/filters client-side — both broken and an anti-pattern. | [invoices/page.tsx:107-163](../../frontend/src/app/invoices/page.tsx#L107) |
| P4 | **Medium** | `getDueInvoices` loads every due/partial invoice into Node and categorizes with per-row `toObject()` in a JS loop. | [dashboardController.js:566-599](../../backend/src/controllers/dashboardController.js#L566) |
| P5 | **Medium** | No response compression; large formatted JSON payloads on analytics endpoints. | [index.js](../../backend/src/index.js) |
| P6 | **Medium** | Analytics page refetches on every filter-object change and does no memoization of large table renders. | [analytics/page.tsx:143-214](../../frontend/src/app/analytics/page.tsx#L143) |
| P7 | **Low** | `html2pdf.js` (bundles html2canvas + jsPDF) loaded eagerly on the invoice PDF path. | [invoices/page.tsx](../../frontend/src/app/invoices/page.tsx) |

---

## Remediation roadmap

**Phase 0 — Unblock deploy & stop the bleeding (days)**
- FQ1/FQ5/UX-login: route every request through `lib/api.ts` (or at minimum a single `NEXT_PUBLIC_API_URL` base); delete the 34 hardcoded `localhost:3001`. Fix payroll currency.
- S1/S2/S6: add `helmet` + `express-rate-limit` + `express-mongo-sanitize` + `express-validator` on auth.
- S4: fix the password `return next()` bug (data-loss class).
- C2/C3: move success responses to after commit; document + startup-check the replica-set requirement (see §2).
- T3: retract/replace `QA_SIGNOFF.md`'s false certification.

**Phase 1 — Make it correct & trustworthy (1–2 weeks)**
- FQ2/FQ3/FC1: one `AuthContext` + route guard + global 401 → redirect-to-login. Removes ~30 duplicated token reads at once.
- S3/S5/S7: whitelist user updates, shorten/rotate tokens, validate uploads.
- D1/D2/D7: add the `Invoice.customer` index, fix the N+1, anchor search or add text indexes.
- T1/T4/T5: export the Express app, fix jest ESM config, add a CI workflow that runs lint + typecheck + tests.

**Phase 2 — Scale & polish (ongoing)**
- P1/P2/P4: cache dashboard/analytics, bound aggregations by date, add `items.*` indexes, add compression.
- BQ2/BQ4/FQ4: consolidate to one error handler/response shape; split the god-files/god-components.
- D4/D6: add `.lean()` to reads, add an AuditLog TTL.
- Replace the self-mocking tests (T2) with real integration tests.

---

## Already addressed in this pass

**Documentation**
- 63 `*_COMPLETE.md` files moved from the repo root into a `docs/` taxonomy (`guides/`, `testing/`, `features/{invoicing,inventory,finance,customers,system,ux-design}/`, `audit/`) with a navigable [docs index](../README.md). Root README rewritten to describe the real app.

**UI/UX (frontend)**
- **Navigation restructured** (UX1, UX2, UX6, UX8): the 14-item flat sidebar is now **5 labelled, role-aware sections** — Home, Sales (New Invoice / Invoices / Calculator), Customers & Money (Customers / Expenses / Payroll / Reports), Stock (Inventory / Stock Purchases), and an owner/manager-gated Administration group. Admin items are hidden from daily staff. [Layout.tsx](../../frontend/src/components/Layout.tsx)
- **Duplicate Reports/Analytics resolved** (UX2): "Reports" now points at the real `/analytics` page; the empty `/reports` stub is no longer linked.
- **i18n gap closed** (UX6): the hardcoded English "Analytics" label is gone; all nav labels + new section headings have `en`/`bn` keys. [translations.ts](../../frontend/src/utils/translations.ts)
- **Dead/no-op controls fixed** (UX4, UX10): "Profile Settings" now navigates to `/settings` (was a no-op); the dead "Learn More" button and the hardcoded `© 2024` were removed/made dynamic on the landing page. [page.tsx](../../frontend/src/app/page.tsx)
- **Login deploy-blocker fixed** (UX3 / FQ1, partial): login now uses `config.apiUrl` (env-driven) instead of the hardcoded `http://localhost:3001`; demo credentials are gated behind the debug flag (never shown in production). [login/page.tsx](../../frontend/src/app/login/page.tsx)
- Verified with `tsc --noEmit` (0 type errors).

> **Not yet done (documented, not implemented):** the remaining 33 hardcoded `localhost` URLs across 13 pages (FQ1), the shared `AuthContext`/401 guard (FQ2/FQ3/FC1), the security middleware bundle (S1/S2/S6), and the backend correctness/scale/test items. These are larger, cross-cutting changes — see the roadmap above. They were deliberately not attempted blind in one pass without a running test suite.

## Appendix — severity legend

- **Critical:** data loss, auth bypass, or deploy blocker.
- **High:** security/correctness/scale issue that will bite real users in production.
- **Medium:** correctness/maintainability/perf issue to fix before scaling.
- **Low:** hygiene, consistency, polish.
