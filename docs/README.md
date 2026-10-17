# InzaiQ POS Starter documentation

[English overview](../README.md) · [Resumen en español](../README.es.md) · [Latest changes](../CHANGELOG.md)

The top-level READMEs and changelogs are equivalent English and Spanish documents. The technical guides below have **not** all been translated; each link lists its current language. The application interface itself is available in English and Spanish ([guide](i18n.md)).

Los README principales y los historiales de cambios son documentos equivalentes en inglés y español. Las guías técnicas **no** están traducidas íntegramente; cada enlace indica su idioma actual. La interfaz de la aplicación está disponible en inglés y español ([guía](i18n.md)).

| Guide | Language | Covers |
| --- | --- | --- |
| [Assembly](assembly.md) | English | Configure and verify a customer installation |
| [Languages and currency](i18n.md) | English | Interface languages, default currency (USD), regional formats and how to add a language |
| [Screens](screenshots/README.md) | English | Every screen of the reference interface and how the screenshots are captured |
| [Architecture](architecture.md) | English | Layers, shared domain rules and design decisions |
| [Database](database.md) | English | Providers, pools, migrations, tenant isolation and transaction invariants |
| [MCP](mcp.md) | Español | OAuth, tools, permissions, consent and revocation |
| [Runtime settings](runtime-settings.md) | English | Tenant notices and pause/resume controls |
| [Telemetry](telemetry.md) | English | Events, request correlation, redaction and operational diagnosis |
| [Verification](verification.md) | Español | Recorded local results, reproduction and external checks still required |
| [Production](production.md) | Español | Immutable releases, compatible migrations, deployment and rollback |
| [Agent workflow](agent-workflow.md) | Español | Safe changes by coding agents |
| [Extending the system](extending.md) | Español | Add a tested module across domain, HTTP, MCP and UI |
| [Business model contracts](business-models.md) | Español | Extension boundaries for physical delivery, digital access and SaaS |
| [Scaling](scaling.md) | Español | Current query/data limits and paths for growth |
| [Enterprise preparation](enterprise.md) | Español | Capacity planning, infrastructure boundaries and evidence requirements |
| [HPA and connection budget](../deploy/enterprise/README.md) | Español | Autoscaling prerequisites and database connection arithmetic |
| [Read-only load tests](../tests/load/README.md) | Español | k6 setup, journeys, thresholds and benchmark methodology |

For code changes, start with [AGENTS.md](../AGENTS.md), then use [template.manifest.json](../template.manifest.json) to locate the relevant contracts. Documentation of a future extension is not evidence that its adapter or infrastructure is implemented.

[Changelog in English](../CHANGELOG.md) · [Historial de cambios en español](../CHANGELOG.es.md)
