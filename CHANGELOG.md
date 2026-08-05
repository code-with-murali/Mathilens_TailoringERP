# Changelog

All notable changes to Mathilens Tailoring ERP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial repository structure (docs, prompts, src, tests, scripts, assets, docker, CI workflows) prepared for enterprise product development.
- Solution scaffolding: Clean Architecture .NET solution (`MathilensERP.Domain`, `.Application`, `.Infrastructure`, `.Api`, `.Shared`, `.UnitTests`, `.IntegrationTests`) with project references enforcing the documented dependency rules ([01_ARCHITECTURE.md § 6](docs/01_ARCHITECTURE.md#6-dependency-diagram)). Swagger via Swashbuckle per the documented API standard.
- Shared kernel (`MathilensERP.Shared`): `Result`/`Result<T>` and `Error`/`FieldError` types for modeling expected business outcomes without exceptions, `Guard` clauses for Domain invariant enforcement, and `PaginationDefaults` constants — with unit test coverage.
- Domain base entity (`MathilensERP.Domain.Common.AuditableEntity`): standard audit footprint (created/modified/deleted by+when) and soft delete, per 02_DATABASE.md §§ 5-6. Concurrency is deliberately handled at the Infrastructure/EF Core level (PostgreSQL `xmin`), not in Domain.
- Database foundation: EF Core `ApplicationDbContext` targeting PostgreSQL exclusively (`Npgsql.EntityFrameworkCore.PostgreSQL`), ASP.NET Core Identity (`ApplicationUser`/`ApplicationRole`) extended with the standard audit/soft-delete footprint, a `RefreshToken` domain entity for JWT rotation, a centralized soft-delete global query filter and audit-stamping `SaveChanges` interceptor, and the `InitialCreate` Code First migration. Identity's default `AspNetXxx` tables renamed to match 02_DATABASE.md's naming standard (`Users`, `Roles`, `UserRoles`, `UserClaims`, `UserLogins`, `UserTokens`, `RoleClaims`, `RefreshTokens`). 34 unit tests passing.
- Application layer foundation: a small hand-rolled in-process mediator (`ISender`, `ICommand`/`IQuery`, `IPipelineBehavior`) implementing 01_ARCHITECTURE.md § 25.3 without a third-party dependency, plus a FluentValidation-backed `ValidationBehavior` implementing § 11 Validation Strategy. `AddApplication()` registers handlers/validators via assembly scanning, per 00_MASTER_SPEC.md § 16.2.
- Authentication use cases: `LoginCommand` and `RefreshAccessTokenCommand` (Application) with validators, dispatched through `IIdentityService` (a port kept free of ASP.NET Core Identity's concrete types) implemented by `IdentityService` (Infrastructure) — JWT access token issuance, opaque refresh tokens (only the hash persisted), single-use rotation, and replay detection that revokes all of a user's active tokens, per 00_MASTER_SPEC.md § 10.1 / 01_ARCHITECTURE.md § 17. 51 unit tests passing.
- Api layer: `AuthController` (`POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`) and a protected `GET /api/v1/users/me` proving JWT bearer enforcement; `ApiControllerBase` maps `Result`/`Result<T>` to the standard success/error envelope (00_MASTER_SPEC.md § 8.6-8.7) including `ErrorType` → HTTP status mapping; `GlobalExceptionHandler` (§ 13 Exception Strategy) ensures no unhandled exception ever reaches a client as a raw stack trace; JWT bearer authentication middleware, Swagger with a bearer-token security definition, and XML doc comments surfaced in Swagger UI. Verified end-to-end via a local smoke test and 5 new `WebApplicationFactory`-based integration tests covering the paths that don't require a live database (validation failures, missing/malformed bearer tokens) — all passing. 56 tests passing total.

### Documentation

- 02_DATABASE.md: added the `RefreshTokens` entity (§ 10.14), discovered as a genuine implementation-time gap — the refresh-token rotation behavior was specified but its storage wasn't enumerated in the original 13-entity list.
- 00_MASTER_SPEC.md § 5 Technology Stack: dropped FluentAssertions from the Testing row — its license became commercial-only starting v8, an unacceptable risk for a product built to be sold. xUnit's built-in `Assert` (already in use) plus NSubstitute cover the same need at no licensing risk. Recorded as an explicit amendment per the document's own precedence rules.
