# Agent runbook: assemble a customer installation

1. Read `AGENTS.md`, `template.manifest.json`, architecture, database and MCP docs. Record customer acceptance criteria before editing.
2. `npm ci`; run `npm run demo` to inspect the reference flow. Use an isolated checkout for demo; never seed a customer's database.
3. Edit `src/template.config.ts` or run `npm run configure -- --name "Customer" --currency PYG --locale es-PY`. Choose valid module combinations. Change demo images/text and contact/payment instructions.
4. Configure a non-demo `.env.local` with the chosen database, a new 32+ character random auth secret and canonical HTTPS public origin. Keep credentials outside git. Run `npm run db:migrate` and `npm run auth:migrate` using an administrative migration connection.
5. Create the owner account at `/sign-in`; create/select the business at `/onboarding`. Each business is a separate organization. Add staff using Better Auth's organization APIs; roles are owner/admin/cashier/viewer. There is no invitation email provider configured by default.
6. Ecommerce only: set `STORE_TENANT_ID` to the store organization's ID shown by the authenticated session/settings. The public store must not choose its tenant from a query string. POS switches membership-validated organizations through Better Auth.
7. Enter real catalog/SKUs. Each size/color variation can be a SKU. Confirm currency/minor-unit conversion and stock. Configure additional payment/fiscal/shipping modules only when required and test them independently.
8. Run `npm run doctor` and `npm run verify`. Exercise success, rejected permissions, stock exhaustion, stale price, duplicate submit and cancelled pending order. Verify no secrets entered the repository.
9. Deploy a new immutable Next Node release using the [production runbook](production.md). Apply reviewed migrations first, then check process liveness at `/api/health` and traffic readiness at `/api/readiness`; readiness checks required migration records and configured auth tables. Configure HTTPS/backup/edge rate limits and exercise the selected cloud database. File SQLite is for local development or an intentionally persistent server, not ephemeral serverless disks.
10. Connect `/api/mcp` in the client's agent via OAuth. Authorize the correct business and minimum scopes. Run a read, an approved reversible change and a revoked-consent test. Record actual evidence; local protocol tests are not evidence of a live ChatGPT/Claude account connection.
11. As owner/admin, verify the [runtime settings](runtime-settings.md) notice and pause/resume controls in `/settings`. Test updates in an already open cashier tab, stale-version rejection and new-sale rejection while paused. Accepted sales retain their lifecycle; a runtime pause does not replace deployment draining.

## Modification discipline

Add one independently testable module at a time. Keep UI/API/MCP bound to the same service; never add direct SQL tools. Add new transport schemas and domain invariants, tests and telemetry together. Update CHANGELOG and README version for each customer release. Run the relevant test suite before full build; avoid unrelated refactors.

Only the documented tenant notice/admission settings change live without a rebuild. Code, build-time branding/module switches and secrets follow reviewed release/configuration deployment; do not patch running processes or enable a live-code reload mechanism. Use compatible additive migrations and preserve old release assets during rolling deployment.

## Provider smoke checklist

Verify the actual connection, migrations, required tables, TLS, pooler configuration, two concurrent stock-consuming requests, persisted audit, and connection cleanup. Test a backup restore before accepting business-critical production use. Run ecommerce and POS in separate databases unless a deliberate integration contract is added; shared code alone does not synchronize their data.
