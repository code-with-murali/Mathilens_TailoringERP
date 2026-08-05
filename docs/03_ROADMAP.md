# 03 — Roadmap

> Living document — updated as each module completes. Phase contract defined in [00_MASTER_SPEC.md § 2.4](./00_MASTER_SPEC.md#24-phase-roadmap).

## Purpose

Tracks the phased delivery plan for Mathilens Tailoring ERP, from repository setup through to a commercially sellable product.

## Phase 0 — Repository Preparation

- [x] Establish repository folder structure
- [x] Define master specification
- [x] Define architecture
- [x] Define database design

## Phase 1 — Platform Foundation (MVP Core)

- [x] Solution scaffolding (Clean Architecture: Domain, Application, Infrastructure, Api, Shared, UnitTests, IntegrationTests)
- [x] Shared kernel (Result type, guard clauses, common constants)
- [x] Domain base entity (audit columns, soft delete, concurrency token)
- [x] Database foundation (PostgreSQL + EF Core Code First, ASP.NET Core Identity, initial migration) — migration generated; application to a live database pending local PostgreSQL/Docker availability
- [x] Authentication module (login, JWT issuance/refresh) — role *assignment* (baseline role seeding, admin role-management) deferred to Phase 2 once a live database is available to verify startup seeding against; role *claims* already flow through JWTs and `[Authorize(Roles = ...)]` is usable today
- [x] Dashboard shell (Next.js frontend scaffold + authenticated shell layout) — login, JWT-backed auth guard, sign-out, dark/light theme toggle; CORS wired on the API for the frontend origin
- [x] CI/CD skeleton (GitHub Actions: build + test on every push/PR) — `.github/workflows/ci.yml`: .NET solution build/test + frontend lint/build, run in parallel

## Phase 2 — Core Operational Modules (MVP)

- [ ] Customer Management — backend complete (Domain, Infrastructure/EF migration, Application CQRS, `CustomersController` REST endpoints, 35 tests); not yet done per 00_MASTER_SPEC.md § 15 Definition of Done: frontend UI (Next.js pages) not yet built, and no live PostgreSQL instance exists yet to verify the create/search/update/delete paths end-to-end (same blocker noted under Phase 1 Database foundation)
- [ ] Measurement Management — backend complete (`Measurement`/`MeasurementHistory` domain entities, EF migration, Application CQRS, `MeasurementsController` REST endpoints, 34 tests); measurement points are a flexible name/value set rather than fixed per-garment-type columns, since 02_DATABASE.md § 10.4 explicitly defers garment-type templates to a future phase — see CHANGELOG.md for the full design rationale. Same gaps as Customer Management: no frontend UI, no live-database verification yet
- [ ] Employee Management — backend complete (`Employee` domain entity, EF migration with a real FK + filtered-unique-index to `Users`, Application CQRS, `EmployeesController` REST endpoints, 22 tests); schema includes the optional `UserId` link to a system login (02_DATABASE.md § 10.6) but no command sets it yet — linking an employee to a login account is an admin/role-management flow, already deferred in Phase 1's Authentication entry for the same live-database reason. Same gaps as the other Phase 2 modules so far: no frontend UI, no live-database verification
- [ ] Tailoring Orders — backend complete: `Order` aggregate root (`OrderItem`s, each with an optional one-to-one `FabricDetails`), a strict enforced status lifecycle (`Received → InProgress → ReadyForDelivery → Delivered`, cancellable from any non-terminal state — 02_DATABASE.md § 10.7), EF migration with real FKs to Customers/Employees, Application CQRS (create with items, add item, set item fabric, transition status, assign employee, get/search), `OrdersController` REST endpoints, 41 tests. Same gaps as the rest of Phase 2: no frontend UI, no live-database verification
- [ ] Fabric Details — built together with Tailoring Orders as one aggregate (`FabricDetails` is owned by `OrderItem`, per 02_DATABASE.md § 10.11's one-to-one option), not a separate module/table set

## Phase 3 — Commercial Modules (MVP)

- [ ] Billing — backend complete: `Invoice` aggregate root (owns `Payment`s), a strict enforced billing status (`Unpaid → PartiallyPaid → Paid`, or `Void` — recomputed automatically as payments are recorded, per 02_DATABASE.md §§ 10.9-10.10), EF migration with real FKs to Orders/Customers, Application CQRS (create invoice from an order's items, record payment, void, get/search), `InvoicesController` REST endpoints, 40 tests. Invoicing is an explicit staff action, not automatic on order delivery — there's no domain-event dispatch mechanism wired up yet (01_ARCHITECTURE.md § 26 is future work). Same gaps as Phase 2: no frontend UI, no live-database verification
- [ ] WhatsApp — backend complete: `WhatsAppMessage` log entity (00_MASTER_SPEC.md § 3: order updates, reminders, delivery notices), EF migration with real FKs to Customers/Orders, Application CQRS (send, get/search), `WhatsAppMessagesController` REST endpoints, 24 tests. Sends via a `MetaWhatsAppSender` targeting Meta's WhatsApp Cloud API directly (the user's explicit provider choice) behind an `IWhatsAppSender` port — **unverified against a live account**: no real Meta credentials have been available, so this client has never actually sent a message, only been written to match Meta's documented API contract. The integration is optional-at-startup (the API still starts fine unconfigured) and fails gracefully per-send if credentials are missing. Same gaps as the rest of Phase 3: no frontend UI, no live-database verification
- [ ] Reports — backend complete: no new Domain entity or migration (reports are pure read-side projections over Orders/Invoices, per 01_ARCHITECTURE.md § 20 Reporting Strategy — "project directly from persistence... bypassing full entity materialization"). Three reports: revenue (invoiced/collected/outstanding totals for a date range), order-status-summary (counts per `OrderStatus` for a date range, every status present even at zero), and outstanding-invoices (paginated, oldest-first). `ReportsController` REST endpoints, 22 tests. **This completes Phase 3's backend** (Billing, WhatsApp, Settings, Reports) — same gaps as everywhere else: no frontend UI, no live-database verification
- [ ] Settings — backend complete: `Setting` key-value entity (02_DATABASE.md § 10.12, explicitly exempt from soft delete — `IAuditable` directly, not `AuditableEntity`), EF migration with a unique index on `Key`, Application CQRS (upsert, delete, get-by-key, paginated list), `SettingsController` REST endpoints (`PUT/GET/DELETE /api/v1/settings/{key}`), 16 tests. Same gaps as the rest of Phase 3: no frontend UI, no live-database verification

## Phase 4 — Hardening & Launch Readiness

- [ ] Security review
- [ ] Performance pass
- [ ] Full test coverage
- [ ] Production readiness validation
- [ ] Production deployment

## Phase 5 — Expansion (Future Modules)

- [ ] Inventory
- [ ] Website
- [ ] E-Commerce
- [ ] Customer Portal
- [ ] AI Features

## Related Documents

- [00_MASTER_SPEC.md](./00_MASTER_SPEC.md)
- [01_ARCHITECTURE.md](./01_ARCHITECTURE.md)
- [02_DATABASE.md](./02_DATABASE.md)
- [04_FEATURES.md](./04_FEATURES.md)
