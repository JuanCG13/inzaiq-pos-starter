# Diagnostics and audit

`src/lib/telemetry.ts` owns the signal contract. Pino emits structured JSON to stdout. Optional OTLP exporters start through Next's `src/instrumentation.ts` when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured. There is no mandatory paid telemetry vendor.

Stable signals:
- `api.<feature>.<operation>.completed`: terminal API outcome with request ID, route template, duration and normalized error code.
- `commerce.operation.completed` and `commerce.operation.retry`: domain outcomes and bounded transaction retries.
- `mcp.request.completed` and `mcp.tool.<operation>.completed`: connection and tool execution.
- `ui.request.completed`: browser CustomEvent with the same request ID as the API response. Subscribe in the customer RUM adapter if persistent frontend diagnostics are required.
- `ui.settings.viewed`, `ui.settings.submitted`, `ui.settings.saved`, `ui.settings.reloaded`: runtime settings stages/outcomes without field values. Backend settings operations use `commerce.operation.completed`; see [runtime settings](runtime-settings.md).
- `api.readiness.check.completed`: required-migration/auth-schema readiness result. `/api/health` is process liveness and intentionally avoids database probes and feature logging.
- `app.feature.operation.count` and `app.feature.operation.duration`: OpenTelemetry aggregate metrics, operation/outcome labels only.

The browser sends a safe `x-request-id`. This is a documented correlation fallback, not an invented distributed trace: browser spans/OTLP and W3C trace propagation are not yet configured. Server logs include active trace/span IDs when the OTLP SDK is enabled. No automatic SQL instrumentation is installed because database bind values may contain PII.

Attributes are allowlisted before serialization. Bodies, raw headers, cookies, tokens, connection strings, emails, customer contact information and arbitrary exception messages are not emitted. Expected validation failures are rejections; unexpected errors receive safe codes. Tests cover redaction, shared correlation, normalized outcomes and a throwing telemetry sink.

Business audit lives separately in `commerce_audit` and is committed with the mutation. Audit is tenant-scoped and requires `audit:read`; it contains operation/resource identifiers and bounded change metadata, not customer contact details. Restrict audit retention/export to the client's policy.

`settings.updated` records versions, admission state and notice presence, never notice text. A stale settings write produces `VERSION_CONFLICT`; reload and review before resubmitting. `ORDERS_PAUSED` is an expected rejection of new-sale admission and does not cancel existing sales.

## Operating procedure

1. Ask for the request ID shown in the error; search structured stdout for `request.id`.
2. Inspect the last successful domain stage and `error.code`. Never paste secrets into diagnostics.
3. Run `npm run doctor`, `npm run typecheck`, and the failing feature test.
4. Use the audit trail to confirm whether a mutation committed. Retry a transaction only with the original idempotency key.
5. For an unknown payment/commit outcome, read state before retrying. Never double-charge to compensate for a timeout.
6. If readiness returns 503, check reviewed migrations, auth tables and database connectivity. A healthy liveness response does not establish traffic readiness. Follow the [production runbook](production.md) for code rollouts; runtime pause only controls new-sale admission.

Suggested deployment alerts: API unexpected failure ratio, checkout rejection ratio by code, P95 operation latency, database connectivity, and failed audit writes. Thresholds require a production baseline; no live dashboards or alerts are claimed to be configured. Size OTLP queues and collector retention to the customer's budget; exporters are optional and fail open.
