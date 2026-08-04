# Changelog

All notable changes to Mathilens Tailoring ERP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial repository structure (docs, prompts, src, tests, scripts, assets, docker, CI workflows) prepared for enterprise product development.
- Solution scaffolding: Clean Architecture .NET solution (`MathilensERP.Domain`, `.Application`, `.Infrastructure`, `.Api`, `.Shared`, `.UnitTests`, `.IntegrationTests`) with project references enforcing the documented dependency rules ([01_ARCHITECTURE.md § 6](docs/01_ARCHITECTURE.md#6-dependency-diagram)). Swagger via Swashbuckle per the documented API standard.
- Shared kernel (`MathilensERP.Shared`): `Result`/`Result<T>` and `Error`/`FieldError` types for modeling expected business outcomes without exceptions, `Guard` clauses for Domain invariant enforcement, and `PaginationDefaults` constants — with unit test coverage.
