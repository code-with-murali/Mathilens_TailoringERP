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
- [ ] CI/CD skeleton (GitHub Actions: build + test on every push/PR)

## Phase 2 — Core Operational Modules (MVP)

- [ ] Customer Management
- [ ] Measurement Management
- [ ] Employee Management
- [ ] Tailoring Orders
- [ ] Fabric Details

## Phase 3 — Commercial Modules (MVP)

- [ ] Billing
- [ ] WhatsApp
- [ ] Reports
- [ ] Settings

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
