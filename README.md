# Apex Operations API

A containerized Operations API built with Node.js, Express, and PostgreSQL as part of the Apex AI Arabia DevOps Assessment.

## 1. Project Overview

This project demonstrates containerization, automated testing, CI quality gates, service health checks, database readiness checks, structured logging, and version-aware application configuration.

### Key Features

- REST API with health, readiness, and version endpoints.
- PostgreSQL database connectivity.
- Docker image running as a non-root user.
- Docker Compose orchestration with persistent database storage.
- Automated API tests using Jest and Supertest.
- GitHub Actions CI for testing, production dependency auditing, and Docker image builds.
- CI release gate that runs only after tests and image build succeed.

## 2. Architecture

```text
Developer
   |
   v
GitHub Repository
   |
   v
GitHub Actions CI
   |
   +--> Install dependencies
   |
   +--> Run automated tests
   |
   +--> Audit production dependencies
   |
   +--> Build Docker image (only if tests pass)
   |
   v
Release Gate (main branch push only)

Local Runtime
   |
   v
Docker Compose
   |
   +--> API container (Node.js / Express)
   |       |
   |       +--> /health
   |       +--> /ready
   |       +--> /version
   |       |
   |       v
   |    PostgreSQL
   |
   +--> Persistent PostgreSQL volume
```

The API connects to PostgreSQL over the private Docker Compose network. The database is not published directly to the host.

## 3. Technology Stack

- Node.js 20
- Express 5
- PostgreSQL 16
- Docker and Docker Compose
- Jest and Supertest
- GitHub Actions

## 4. Prerequisites

Install the following tools:

- Git
- Node.js 20 and npm
- Docker Desktop with Docker Compose

Docker Desktop must be running before starting the containers.

## 5. Local Setup

Clone the repository:

```bash
git clone https://github.com/mahmoudelshazly55/apex-operations-api.git
cd apex-operations-api
```

Create a local `.env` file using the example:

```bash
cp .env.example .env
```

On Windows PowerShell, use this equivalent command if needed:

```powershell
Copy-Item .env.example .env
```

Review `.env` and set a local development database password. Keep `.env` out of version control.

Install dependencies:

```bash
npm ci
```

Run automated tests:

```bash
npm test
```

Start the application and database:

```bash
docker compose up --build -d
```

Check service status:

```bash
docker compose ps
```

Inspect application logs:

```bash
docker compose logs --tail=100 api
```

## 6. API Endpoints

| Endpoint | Purpose | Expected result |
|---|---|---|
| `GET /health` | Checks whether the API process responds | HTTP 200 |
| `GET /ready` | Checks database readiness | HTTP 200 when connected; HTTP 503 otherwise |
| `GET /version` | Returns the configured application version | HTTP 200 |

Example responses:

Health:

```json
{
  "status": "ok"
}
```

Readiness:

```json
{
  "status": "ready",
  "database": "connected"
}
```

Version:

```json
{
  "version": "1.0.0"
}
```

The version endpoint reads `APP_VERSION` and falls back to `1.0.0` if it is not set.

Test the endpoints in PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/ready
Invoke-RestMethod http://localhost:3000/version
```

## 7. Configuration

Configuration is supplied through environment variables.

| Variable | Purpose |
|---|---|
| `PORT` | API listening port |
| `APP_VERSION` | Version displayed by `/version` |
| `DB_HOST` | Database hostname |
| `DB_PORT` | Database port |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `POSTGRES_USER` | PostgreSQL initialization username |
| `POSTGRES_PASSWORD` | PostgreSQL initialization password |
| `POSTGRES_DB` | PostgreSQL initialization database |

Docker Compose uses the service name `db` as the database hostname.

The `.env` file is intended for local development only. Do not commit real credentials or use local development secrets in production.

## 8. CI Pipeline

The GitHub Actions workflow is located at `.github/workflows/ci.yml`.

The pipeline:

1. Checks out the repository.
2. Sets up Node.js 20 and npm caching.
3. Installs dependencies using `npm ci`.
4. Runs the automated test suite.
5. Audits production dependencies with `npm audit --omit=dev --audit-level=high`.
6. Builds a Docker image tagged with the commit SHA, only after the test job succeeds.
7. Runs the release-gate verification on pushes to `main` after the required jobs succeed.

The release gate is a verification step; it does not publish an image to a registry or deploy to a cloud environment.

### Failure-Gate Demonstration

A separate pull request adds an intentionally failing test to demonstrate the CI gate. The expected result is that the test job fails and the dependent Docker build is skipped.

The intentional failure must not be merged into `main`.

## 9. Automated Testing

Run the normal test suite:

```bash
npm test
```

The current suite covers health checks, readiness behavior with and without a database, database errors, unknown endpoints, and the health endpoint's HEAD request.

Run the separate intentional failure demonstration:

```bash
npm run test:failure-demo
```

This command is expected to exit with a non-zero status. It is not part of the normal test command and should not be used as a passing CI test.

## 10. Observability

The API writes structured JSON logs to standard output. Request log records include the HTTP method, path, status code, duration, and timestamp.

Useful commands:

```bash
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 db
docker inspect --format='{{.State.Health.Status}}' $(docker compose ps -q api)
```

Docker health checks monitor the API's `/health` endpoint. PostgreSQL has a separate `pg_isready` health check.

For production, consider centralized log aggregation, request/error-rate dashboards, latency metrics, database connection monitoring, and alerts for sustained failures.

## 11. Security

- The API container runs as the non-root `node` user.
- `.env` and `node_modules` are excluded from the Docker build context.
- Git ignores `.env`.
- PostgreSQL is not exposed through a host port in the Compose configuration.
- CI audits production dependencies for high-severity vulnerabilities.
- GitHub Actions uses read-only repository contents permissions.
- Production secrets should be supplied through an approved secret manager or deployment platform, not committed to Git.

Image scanning, automated secret scanning, and production least-privilege deployment permissions should be added or verified before a production release.

## 12. Deployment and Rollback Notes

Docker Compose can run a version-configured image locally. For example, in PowerShell:

```powershell
$env:APP_VERSION = "1.0.1"
docker compose up --build -d api
Invoke-RestMethod http://localhost:3000/version
```

This changes the configured application version and rebuilds the local image. It is not, by itself, proof of rollback to a previously preserved image.

A reproducible production rollback should use an immutable, previously built image tag or digest, redeploy that exact image, and verify application health and readiness afterward. The current CI pipeline builds an image but does not push it to a registry or deploy it.

## 13. Cost-Aware Cloud Path

For a small workload, a single cloud VM running Docker Compose may be a cost-conscious initial option, provided its availability and operational limitations are acceptable.

A production design should account for backups, monitoring, TLS, firewall rules, secret management, persistent database storage, and recovery requirements. Managed database or container services can reduce operational burden but may increase cost. Actual pricing depends on region and usage.

## 14. Current Scope and Limitations

This assessment implementation demonstrates local container orchestration and CI validation. It does not currently include an automated cloud deployment, image-registry publishing, production metrics endpoint, or a fully automated rollback workflow.

These are potential next steps rather than completed capabilities.

## 15. AI Use Disclosure

AI assistance was used to support implementation, troubleshooting, test design, and documentation. Commands, code, and configuration should be reviewed and tested by the project author, who remains responsible for explaining the design decisions and observed results.

## 16. Repository

GitHub: https://github.com/mahmoudelshazly55/apex-operations-api
