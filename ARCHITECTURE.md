# Architecture — Apex Operations API

## 1. Overview

Apex Operations API is a containerized Node.js and Express service backed by PostgreSQL. Docker Compose runs the API and database as separate services on a private application network.

## 2. Runtime Architecture

```text
Client
  |
  v
Apex Operations API (Node.js 24 / Express)
  |
  +--> GET /health
  +--> GET /ready
  +--> GET /version
  |
  v
PostgreSQL 16
  |
  v
Persistent Docker Volume
```

The API connects to PostgreSQL using environment-based configuration. The database does not publish a host port in the Compose configuration. Its data is stored in a named volume.

## 3. CI Architecture

```text
Developer Push / Pull Request
             |
             v
       GitHub Actions
             |
             v
      Install Dependencies
             |
       +-----+------+
       |            |
       v            v
      ESLint     Automated Tests
       |            |
       +-----+------+
             |
             v
   Production Dependency Audit
             |
             v
       Build Docker Image
             |
             v
        Trivy Image Scan
             |
             v
   Release Gate on main push
```

The diagram is conceptual. The exact execution order and job dependencies are defined in `.github/workflows/ci.yml`; independent jobs may execute in parallel.

## 4. Health and Readiness

- `/health` indicates that the API process responds.
- `/ready` verifies database connectivity and returns HTTP 503 when the database is unavailable.
- `/version` reports the configured application version.

Container health checks provide an additional signal for service status.

## 5. Security Boundaries

- The API runs as a non-root user inside the runtime image.
- PostgreSQL is reachable through the Compose network rather than a published host port.
- Secrets are supplied through environment configuration and must not be committed.
- CI runs dependency auditing and scans the built image with Trivy.

## 6. Deployment Scope

The current implementation supports local Docker Compose operation and local version rollback. CI builds and scans an image but does not currently publish it to a registry or deploy it to a cloud environment.
