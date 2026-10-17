# InzaiQ POS Starter

**An agent-ready foundation for sales, inventory and multi-tenant retail.**

Build a branded point of sale in Next.js, then let business owners manage it through the interface or an authorized MCP agent. Modular services, explicit contracts and shared business rules keep each installation straightforward to extend.

[English](README.md) · [Español](README.es.md)

[![CI](https://github.com/JuanCG13/inzaiq-pos-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/JuanCG13/inzaiq-pos-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](package.json)
[![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](package.json)

[Quickstart](#quickstart) · [Features](#overview) · [MCP](#connect-an-agent) · [Documentation](docs/README.md) · [Latest changes](CHANGELOG.md)

![Nexo POS demo showing the product catalog and cash checkout](docs/screenshots/point-of-sale.png)

*Screenshots show the customizable **Nexo POS** reference interface in Spanish. Adapt its brand, currency, locale and application copy for each customer.*

## Overview

| Capability | Included |
| --- | --- |
| **Cash checkout** | Product search, SKU entry, keyboard barcode input, stock-aware cart, cash received, change and printable receipt |
| **Catalog & inventory** | Product creation/editing, categories, version checks and audited stock adjustments |
| **Sales & reporting** | Persisted sales history and dashboard totals from the database, separated by currency |
| **Multiple businesses** | Better Auth organizations with verified membership and owner, admin, cashier and viewer roles |
| **Agent administration** | Official MCP SDK, Streamable HTTP, OAuth/PKCE, scoped tools and revocable consent |
| **Live operational settings** | Tenant notices and pause/resume for new sales, with version checks and audit |
| **Diagnostics** | Structured logs, request correlation, transactional audit and optional OpenTelemetry export |

**Stack:** Next.js App Router · React · TypeScript · Better Auth · Kysely · Radix · Lucide. Database adapters support **Supabase, Neon, PostgreSQL and Turso**, with local SQLite for development.

The interface, HTTP routes and MCP tools use the same domain service. Tenant access comes from verified membership; amounts use integer minor units and server-side prices. Sales, stock and audit commit together, with persistent idempotency to prevent duplicate operations. Agents receive named business tools, never arbitrary SQL access.

### A closer look

| Inventory | Sales history |
| --- | --- |
| ![Inventory management in the Nexo POS demo](docs/screenshots/inventory.png) | ![Sales history in the Nexo POS demo](docs/screenshots/sales.png) |

<details>
<summary>Mobile point of sale</summary>

<img src="docs/screenshots/pos-mobile.png" alt="Nexo POS cash checkout on a mobile screen" width="280" />

</details>

## Quickstart

Requires **Node.js 22+**. CI uses Node.js 24.

```bash
git clone https://github.com/JuanCG13/inzaiq-pos-starter.git
cd inzaiq-pos-starter
npm ci
npm run demo
```

Open **[localhost:3001](http://localhost:3001)**. The demo creates an isolated `demo.db` and a git-ignored `.env.local` with a fresh secret; it does not overwrite an existing customer configuration. Demo access is restricted to local development and rejected in production. MCP always requires real sign-in and OAuth consent.

## Configure a customer installation

Use a separate checkout from the demo, then set the brand and monetary formatting:

```bash
npm ci
npm run configure -- --name "My store" --currency USD --locale en-US
cp .env.example .env.local
```

Configure the database, canonical application URL and authentication secret in `.env.local`, with `DEMO_MODE=false`. Follow the [assembly guide](docs/assembly.md) and [database guide](docs/database.md), then run:

```bash
npm run db:migrate
npm run auth:migrate
npm run dev
```

Create the owner account at `/sign-in` and the business at `/onboarding`. Organization switching checks the user's membership. Each size/color variation can be represented by a separate SKU.

| Assembly entry point | Purpose |
| --- | --- |
| [`src/template.config.ts`](src/template.config.ts) | Brand, locale, currency and module switches |
| [`template.manifest.json`](template.manifest.json) | Module contracts, dependencies and extension navigation |
| [`AGENTS.md`](AGENTS.md) | Rules for agents modifying an installation |

Changing the configured currency does not convert existing prices. The manifest describes modules; adding an entry does not implement a feature. Follow the [extension recipe](docs/extending.md) for new capabilities.

## Connect an agent

Deploy the application on HTTPS and add **`https://your-domain/api/mcp`** to a compatible ChatGPT, Claude or other MCP client. The owner signs in, selects a business and grants the required scopes. Connection availability depends on the client's account and workspace settings.

Tools cover products, stock, sales, dashboard, audit and operational settings. Writes require explicit confirmation plus server-side role and scope checks. Review or revoke connections at `/onboarding/connections`.

The application does not need an OpenAI or Anthropic API key. Local OAuth/MCP tests are included; a live connection to the customer's account must be verified during setup. See the [MCP guide](docs/mcp.md).

## Verification

The [recorded local verification](docs/verification.md) includes **128 passing automated tests**, **3 passing browser journeys**, a production build and a standalone startup smoke check. This is local evidence, not a cloud capacity benchmark; the CI badge links to the actual GitHub workflow.

```bash
npm run doctor
DEMO_MODE=false npm run verify
npx playwright install chromium
npm run test:e2e
```

`verify` runs type checks, tests and the production build. Browser tests use and modify an isolated demo database. Domain tests exercise real libSQL and PostgreSQL WASM; managed-provider connections and external account integrations require installation-specific validation.

## Production and scale

Docker standalone builds, Kubernetes rolling-update manifests, schema-aware readiness, an HPA template, a connection-budget checker and read-only k6 journeys are provided. Tenant notices and sale admission can change at runtime; code changes use immutable releases and compatible migrations.

| Task | Guide |
| --- | --- |
| Release, migrate and roll back | [Production runbook](docs/production.md) |
| Modify safely with an agent | [Agent workflow](docs/agent-workflow.md) |
| Understand query and data limits | [Scaling](docs/scaling.md) |
| Plan capacity and infrastructure | [Enterprise preparation](docs/enterprise.md) · [HPA](deploy/enterprise/README.md) · [Load tests](tests/load/README.md) |

Live provider connectivity, backup restoration, rollout behavior and load capacity must be validated in the chosen infrastructure. No throughput, million-user capacity or uninterrupted deployment guarantee is claimed.

**Current scope:** cash sales and internal printable receipts. Card processing, fiscal invoices, returns, fractional stock, multi-warehouse operations and offline synchronization require additional modules. The receipt is not a fiscal invoice.

## Documentation

The top-level READMEs are available in English and Spanish. Technical guides currently use both languages; the [documentation index](docs/README.md) identifies the language of each guide.

[Architecture](docs/architecture.md) · [Assembly](docs/assembly.md) · [Database](docs/database.md) · [MCP](docs/mcp.md) · [Telemetry](docs/telemetry.md) · [Runtime settings](docs/runtime-settings.md) · [Extension contracts](docs/business-models.md)

## License

[MIT](LICENSE). Dependencies and sample images retain their respective licenses. Replace demo imagery with assets licensed for the customer installation.
