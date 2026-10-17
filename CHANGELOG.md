# Changelog

[English](CHANGELOG.md) · [Español](CHANGELOG.es.md)

## Unreleased

### Added

- Internationalization: English (default) and Spanish interface from typed dictionaries in `src/i18n`, a per-person language selector (cookie, then `Accept-Language`, then the installation default), plural/number/date formatting per language and a documented path to add more languages ([guide](docs/i18n.md)).
- `npm run configure` manages languages (`--locales`, `--default-locale`) and the product-form currency list (`--currencies`) with validation; `npm run doctor` checks the localization settings.
- `npm run docs:screenshots` captures every screen (22) from a real, isolated instance and regenerates the gallery, thumbnails and README grids.
- English/Spanish sample catalog with currency-aware pricing (`src/db/demo-catalog.ts`, optional `DEMO_LOCALE`).

### Changed

- **Defaults:** the default currency is now USD and the default language and format are English (`en-US`); they were PYG and Spanish (`es-PY`). Existing prices are not converted. Restore the previous defaults with `npm run configure -- --default-locale es --locale es-PY --currency PYG`.
- API, MCP and runtime messages are now canonical English and keep stable error codes; the interface translates by code. Integrations that matched Spanish message text must use `error.code`.
- Repository screenshots are in English and cover every screen; the four earlier Spanish/PYG images were replaced.
- The point-of-sale sample catalog is now ten English products in USD without remote images.
- Consent scope labels moved from the consent form into the dictionaries.

### Fixed

- The onboarding identifier `pattern` was an invalid regular expression in current browsers (console error, validation skipped).
- The connected-agents page no longer causes a hydration mismatch.
- The optional marker of the product image field no longer wraps onto its own line.

### Tests

- 24 new unit tests (dictionary parity and placeholders, plural rules, language negotiation with hostile input, money formatting/parsing, configuration validation, the `configure` script, error translation, demo catalog) and 4 new browser journeys (language switch without refetching data, browser-language first visit, tampered cookie, localized sign-in/404, currency selector); existing journeys now run in English/USD.

### Documentation

- Adopt the renamed InzaiQ starter repository identity in project documentation and clone instructions.
- Replace the landing README with a structured English overview and a complete Spanish counterpart.
- Add real desktop and mobile interface screenshots, a visual gallery and a documentation index with language labels.

## 0.1.0 — 2026-10-17

- Initial modular Next.js template with real SQL-backed catalog, inventory, orders, audit, tenant isolation, roles and safe money handling.
- Official MCP SDK, Better Auth OAuth/PKCE, tenant-bound consent, granular scopes and immediate revocation.
- Server-derived prices, approved total/currency validation, versioned updates, durable idempotency and atomic cancellation/restocking.
- Supabase/Neon PostgreSQL and Turso/libSQL adapters, portable migrations, default-deny RLS and development-only seed.
- Structured redacted telemetry, optional OpenTelemetry, diagnostics and CI.
- Functional responsive UI and agent assembly documentation.
- Regressions covered: cross-tenant access, audit failure rollback, competing stock sales, stale prices/currency and duplicate writes.
- Tenant-scoped runtime configuration, compare-and-swap updates, auditing and MCP settings tools.
- Standalone Docker configuration, schema-aware readiness, gradual deployments and agent/rollback runbooks.

### Scaling and extensibility

- Batch order-line loading and a tenant/name/ID catalog index.
- Validated PostgreSQL pool configuration and per-replica connection budgeting.
- Scaling and module-extension guides with an agent-facing map of files and contracts.
