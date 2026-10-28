# Observability Plan — Apex Operations API

## 1. Current Signals

The application currently provides:

- Structured JSON logs written to standard output.
- `/health` for API process health.
- `/ready` for database readiness.
- `/version` for application version identification.
- Docker health checks for the API and PostgreSQL services.

Useful commands:

```powershell
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 db
```

## 2. Metrics to Collect

For a production deployment, collect:

| Metric | Purpose |
|---|---|
| Request rate | Understand API traffic |
| HTTP 5xx rate | Detect server-side failures |
| Request latency (p95/p99) | Identify slow requests |
| Readiness failures | Detect inability to serve database-dependent requests |
| Database connection failures | Identify database connectivity issues |
| Container restarts | Detect repeated crashes |
| CPU and memory usage | Identify resource pressure |
| Database storage usage | Avoid running out of storage |

The current project does not implement a dedicated metrics endpoint or a complete metrics collection system.

## 3. Suggested Alerts

These are proposed starting thresholds and should be tuned to actual workload and baseline behavior.

| Alert | Proposed trigger | Suggested response |
|---|---|---|
| API unavailable | Health check fails repeatedly for 2 minutes | Inspect container status and recent logs |
| API error rate elevated | HTTP 5xx rate exceeds 5% for 5 minutes with meaningful traffic | Check application errors and dependencies |
| Readiness failure | Database readiness fails repeatedly for 2 minutes | Verify database health, credentials, and network |
| High latency | p95 latency exceeds 1 second for 10 minutes | Inspect slow requests and database queries |
| Resource pressure | CPU or memory remains above 85% for 10 minutes | Inspect resource usage and workload |
| Database storage pressure | Storage exceeds 80% capacity | Investigate growth and plan capacity |

These thresholds are recommendations, not active alerts in the current repository.

## 4. Log Handling

- Write structured logs to standard output.
- Include timestamps, request method, path, status, and request duration.
- Avoid logging passwords, tokens, authorization headers, or other secrets.
- Forward logs to a centralized logging platform in production.
- Define retention and access policies appropriate to the environment.

## 5. Incident Triage

1. Run `docker compose ps` to inspect service states.
2. Review recent API and database logs.
3. Call `/health` to verify API responsiveness.
4. Call `/ready` to verify database connectivity.
5. Confirm configuration and secret consistency without exposing secret values.
6. Follow the recovery and rollback steps in `RUNBOOK.md`.

## 6. Production Follow-up

Before production use, select a metrics and alerting platform, configure dashboards and notifications, test alert delivery, and document ownership and escalation procedures.
