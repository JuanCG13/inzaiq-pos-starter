# InzaiQ POS Starter

**An agent-ready foundation for sales, inventory and multi-tenant retail.**

Build a branded point of sale in Next.js, then let business owners manage it through the interface or an authorized MCP agent. Modular services, explicit contracts and shared business rules keep each installation straightforward to extend.

[English](README.md) · [Español](README.es.md)

[![CI](https://github.com/JuanCG13/inzaiq-pos-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/JuanCG13/inzaiq-pos-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](package.json)
[![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](package.json)

[Quickstart](#quickstart) · [Features](#overview) · [MCP](#connect-an-agent) · [Documentation](docs/README.md) · [Latest changes](CHANGELOG.md)

![Nexo POS cash register with a cart, in English with USD totals](docs/screenshots/en/06-pos-cart.png)

*Screenshots show the customizable **Nexo POS** reference interface in English with the default USD currency. The interface also ships in Spanish and accepts more languages through typed dictionaries; each installation adapts its brand, currency, regional format and copy. [Every screen →](docs/screenshots/README.md)*

## Overview

| Capability | Included |
| --- | --- |
| **Cash checkout** | Product search, SKU entry, keyboard barcode input, stock-aware cart, cash received, change and printable receipt |
| **Catalog & inventory** | Product creation/editing, categories, version checks and audited stock adjustments |
| **Sales & reporting** | Persisted sales history and dashboard totals from the database, separated by currency |
| **Languages & currency** | English and Spanish included and switchable per person; add a language with one typed dictionary. USD by default, configurable per installation and per product |
| **Multiple businesses** | Better Auth organizations with verified membership and owner, admin, cashier and viewer roles |
| **Agent administration** | Official MCP SDK, Streamable HTTP, OAuth/PKCE, scoped tools and revocable consent |
| **Live operational settings** | Tenant notices and pause/resume for new sales, with version checks and audit |
| **Diagnostics** | Structured logs, request correlation, transactional audit and optional OpenTelemetry export |

**Stack:** Next.js App Router · React · TypeScript · Better Auth · Kysely · Radix · Lucide. Database adapters support **Supabase, Neon, PostgreSQL and Turso**, with local SQLite for development.

The interface, HTTP routes and MCP tools use the same domain service. Tenant access comes from verified membership; amounts use integer minor units and server-side prices. Sales, stock and audit commit together, with persistent idempotency to prevent duplicate operations. Agents receive named business tools, never arbitrary SQL access.

### A closer look

| Inventory | Sales history |
| --- | --- |
| ![Inventory management in Nexo POS](docs/screenshots/en/09-inventory.png) | ![Sales history in Nexo POS](docs/screenshots/en/12-sales.png) |

<details>
<summary>Mobile point of sale</summary>

<img src="docs/screenshots/en/20-mobile-pos.png" alt="Nexo POS catalog on a mobile screen" width="280" />

</details>

### All screens

Thumbnails link to the full-size image. They are regenerated with the screenshots by `npm run docs:screenshots` ([how they are captured](docs/screenshots/README.md)).

<!-- screens:start -->
<table>
<tr><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/01-sign-in.png"><img src="docs/screenshots/en/thumbs/01-sign-in.jpg" alt="Sign in" width="230"></a><br><sub>Sign in</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/02-create-account.png"><img src="docs/screenshots/en/thumbs/02-create-account.jpg" alt="Create account" width="230"></a><br><sub>Create account</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/03-onboarding.png"><img src="docs/screenshots/en/thumbs/03-onboarding.jpg" alt="Create or choose a business" width="230"></a><br><sub>Create or choose a business</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/04-pos-empty.png"><img src="docs/screenshots/en/thumbs/04-pos-empty.jpg" alt="Empty catalog" width="230"></a><br><sub>Empty catalog</sub></td></tr>
<tr><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/05-pos-catalog.png"><img src="docs/screenshots/en/thumbs/05-pos-catalog.jpg" alt="Point of sale" width="230"></a><br><sub>Point of sale</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/06-pos-cart.png"><img src="docs/screenshots/en/thumbs/06-pos-cart.jpg" alt="Cart" width="230"></a><br><sub>Cart</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/07-pos-checkout.png"><img src="docs/screenshots/en/thumbs/07-pos-checkout.jpg" alt="Cash checkout" width="230"></a><br><sub>Cash checkout</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/08-pos-receipt.png"><img src="docs/screenshots/en/thumbs/08-pos-receipt.jpg" alt="Receipt" width="230"></a><br><sub>Receipt</sub></td></tr>
<tr><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/09-inventory.png"><img src="docs/screenshots/en/thumbs/09-inventory.jpg" alt="Inventory" width="230"></a><br><sub>Inventory</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/10-inventory-new-product.png"><img src="docs/screenshots/en/thumbs/10-inventory-new-product.jpg" alt="New product" width="230"></a><br><sub>New product</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/11-inventory-adjust-stock.png"><img src="docs/screenshots/en/thumbs/11-inventory-adjust-stock.jpg" alt="Adjust stock" width="230"></a><br><sub>Adjust stock</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/12-sales.png"><img src="docs/screenshots/en/thumbs/12-sales.jpg" alt="Sales" width="230"></a><br><sub>Sales</sub></td></tr>
<tr><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/13-sale-details.png"><img src="docs/screenshots/en/thumbs/13-sale-details.jpg" alt="Sale details" width="230"></a><br><sub>Sale details</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/14-settings.png"><img src="docs/screenshots/en/thumbs/14-settings.jpg" alt="Settings" width="230"></a><br><sub>Settings</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/15-quick-help.png"><img src="docs/screenshots/en/thumbs/15-quick-help.jpg" alt="Quick help" width="230"></a><br><sub>Quick help</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/16-pos-paused.png"><img src="docs/screenshots/en/thumbs/16-pos-paused.jpg" alt="Paused register with notice" width="230"></a><br><sub>Paused register with notice</sub></td></tr>
<tr><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/17-oauth-consent.png"><img src="docs/screenshots/en/thumbs/17-oauth-consent.jpg" alt="Agent consent" width="230"></a><br><sub>Agent consent</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/18-connected-agents.png"><img src="docs/screenshots/en/thumbs/18-connected-agents.jpg" alt="Connected agents" width="230"></a><br><sub>Connected agents</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/19-not-found.png"><img src="docs/screenshots/en/thumbs/19-not-found.jpg" alt="Not found" width="230"></a><br><sub>Not found</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/20-mobile-pos.png"><img src="docs/screenshots/en/thumbs/20-mobile-pos.jpg" alt="Point of sale on mobile" width="230"></a><br><sub>Point of sale on mobile</sub></td></tr>
<tr><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/21-mobile-checkout.png"><img src="docs/screenshots/en/thumbs/21-mobile-checkout.jpg" alt="Checkout on mobile" width="230"></a><br><sub>Checkout on mobile</sub></td><td width="25%" align="center" valign="top"><a href="docs/screenshots/en/22-mobile-inventory.png"><img src="docs/screenshots/en/thumbs/22-mobile-inventory.jpg" alt="Inventory on mobile" width="230"></a><br><sub>Inventory on mobile</sub></td><td></td><td></td></tr>
</table>
<!-- screens:end -->

## Quickstart

Requires **Node.js 22+**. CI uses Node.js 24.

```bash
git clone https://github.com/JuanCG13/inzaiq-pos-starter.git
cd inzaiq-pos-starter
npm ci
npm run demo
```

Open **[localhost:3001](http://localhost:3001)**. The interface follows your browser language (English or Spanish) and can be switched from the top bar; `DEMO_LOCALE=es npm run demo` seeds a Spanish sample catalog. The demo creates an isolated `demo.db` and a git-ignored `.env.local` with a fresh secret; it does not overwrite an existing customer configuration. Demo access is restricted to local development and rejected in production. MCP always requires real sign-in and OAuth consent.

## Configure a customer installation

Use a separate checkout from the demo, then set the brand, currency and languages:

```bash
npm ci
npm run configure -- --name "My store"                                  # English + USD, the defaults
npm run configure -- --default-locale es --locale es-PY --currency PYG  # example: Spanish and guaraní
cp .env.example .env.local
```

Each person sees the language they pick in the selector, then their browser's language, then the installation default. The default currency is **USD**; change it, restrict the languages or add a new one with the [languages and currency guide](docs/i18n.md).

Configure the database, canonical application URL and authentication secret in `.env.local`, with `DEMO_MODE=false`. Follow the [assembly guide](docs/assembly.md) and [database guide](docs/database.md), then run:

```bash
npm run db:migrate
npm run auth:migrate
npm run dev
```

Create the owner account at `/sign-in` and the business at `/onboarding`. Organization switching checks the user's membership. Each size/color variation can be represented by a separate SKU.

| Assembly entry point | Purpose |
| --- | --- |
| [`src/template.config.ts`](src/template.config.ts) | Brand, languages, currency, regional format and module switches |
| [`src/i18n/`](src/i18n) | Language registry, typed dictionaries and the language selector |
| [`template.manifest.json`](template.manifest.json) | Module contracts, dependencies and extension navigation |
| [`AGENTS.md`](AGENTS.md) | Rules for agents modifying an installation |

Changing the configured currency does not convert existing prices. The manifest describes modules; adding an entry does not implement a feature. Follow the [extension recipe](docs/extending.md) for new capabilities.

## Connect an agent

Deploy the application on HTTPS and add **`https://your-domain/api/mcp`** to a compatible ChatGPT, Claude or other MCP client. The owner signs in, selects a business and grants the required scopes. Connection availability depends on the client's account and workspace settings.

Tools cover products, stock, sales, dashboard, audit and operational settings. Writes require explicit confirmation plus server-side role and scope checks. Review or revoke connections at `/onboarding/connections`.

The application does not need an OpenAI or Anthropic API key. Local OAuth/MCP tests are included; a live connection to the customer's account must be verified during setup. See the [MCP guide](docs/mcp.md).

## Verification

The [recorded local verification](docs/verification.md) includes **152 passing automated tests**, **7 passing browser journeys**, a production build and a standalone startup smoke check. This is local evidence, not a cloud capacity benchmark; the CI badge links to the actual GitHub workflow.

```bash
npm run doctor
DEMO_MODE=false npm run verify
npx playwright install chromium
npm run test:e2e
npm run docs:screenshots   # optional: regenerate every screenshot from a real isolated instance
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

The top-level READMEs and changelogs are available in English and Spanish. Technical guides currently use both languages; the [documentation index](docs/README.md) identifies the language of each guide.

[Languages & currency](docs/i18n.md) · [Screens](docs/screenshots/README.md) · [Architecture](docs/architecture.md) · [Assembly](docs/assembly.md) · [Database](docs/database.md) · [MCP](docs/mcp.md) · [Telemetry](docs/telemetry.md) · [Runtime settings](docs/runtime-settings.md) · [Extension contracts](docs/business-models.md)

## License

[MIT](LICENSE). Dependencies and sample images retain their respective licenses. Replace demo imagery with assets licensed for the customer installation.
