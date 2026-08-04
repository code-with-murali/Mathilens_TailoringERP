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

### Documentation

- 02_DATABASE.md: added the `RefreshTokens` entity (§ 10.14), discovered as a genuine implementation-time gap — the refresh-token rotation behavior was specified but its storage wasn't enumerated in the original 13-entity list.
