# Apex Operations API

A containerized Operations API built with Node.js, Express, and PostgreSQL as part of the Apex AI Arabia DevOps Assessment.

## 1. Project Overview

This project demonstrates containerization, automated testing, CI quality gates, database readiness checks, structured logging, security scanning, and version-aware application configuration.

### Key Features

- REST API with health, readiness, and version endpoints.
- PostgreSQL database connectivity.
- Docker runtime image running as a non-root user.
- Docker Compose orchestration with persistent database storage.
- Automated API tests using Jest and Supertest.
- ESLint checks and production dependency auditing.
- GitHub Actions CI pipeline for testing, Docker image building, and vulnerability scanning.
- Trivy image scanning for CRITICAL and HIGH vulnerabilities in OS packages and libraries.
- Release-gate verification after required CI jobs succeed.
- Documented troubleshooting and rollback procedures.

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
   +--> Run ESLint
   |
   +--> Run automated tests
   |
   +--> Audit production dependencies
   |
   +--> Build Docker image (after tests pass)
   |
   +--> Scan image with Trivy
   |
   v
Release Gate (main branch push only)

Local Runtime
   |
   v
Docker Compose
   |
   +--> API container (Node.js 24 / Express)
   |       |
   |       +--> GET /health
   |       +--> GET /ready
   |       +--> GET /version
   |       |
   |       v
   |    PostgreSQL container
   |
   +--> Persistent PostgreSQL volume
```

The API connects to PostgreSQL over the private Docker Compose network. The database is not published directly to the host.

The CI release gate verifies that required checks have succeeded. It does not publish images to a registry or deploy the application to a cloud environment.

## 3. Technology Stack

- Node.js 24
- Express 5
- PostgreSQL 16
- Docker and Docker Compose
- Jest and Supertest
- ESLint
- GitHub Actions
- Trivy vulnerability scanner

## 4. Prerequisites

Install the following tools:

- Git
- Node.js 24 and npm
- Docker Desktop with Docker Compose

Docker Desktop must be running before starting the containers.

## 5. Local Setup

Clone the repository:

```bash
git clone https://github.com/mahmoudelshazly55/apex-operations-api.git
cd apex-operations-api
```

Create a local `.env` file using the example.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Review `.env` and configure a local development database password. Keep `.env` out of version control. Do not commit or share real credentials.

Install dependencies:

```bash
npm ci
```

Run linting:

```bash
npm run lint
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

Example health response:

```json
{
  "status": "ok"
}
```

Example readiness response:

```json
{
  "status": "ready",
  "database": "connected"
}
```

Example version response:

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
| `APP_VERSION` | Version displayed by `/version` and used in the Compose API image tag |
| `DB_HOST` | Database hostname |
| `DB_PORT` | Database port |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password used by the API |
| `DB_NAME` | Database name |
| `POSTGRES_USER` | PostgreSQL initialization username |
| `POSTGRES_PASSWORD` | PostgreSQL initialization password |
| `POSTGRES_DB` | PostgreSQL initialization database |

Docker Compose uses the service name `db` as the database hostname.

The `.env` file is intended for local development. Do not commit real credentials or use local development secrets in production.

Changing `POSTGRES_PASSWORD` in `.env` does not automatically change the password of a role in an already initialized PostgreSQL data volume. If credentials are changed, update the database role and application configuration consistently.

## 8. CI Pipeline

The GitHub Actions workflow is located at `.github/workflows/ci.yml`.

The pipeline:

1. Checks out the repository.
2. Sets up Node.js 24 and npm caching.
3. Installs dependencies using `npm ci`.
4. Runs ESLint.
5. Runs the automated test suite.
6. Audits production dependencies with `npm audit --omit=dev --audit-level=high`.
7. Builds a Docker image tagged with the commit SHA, only after the test job succeeds.
8. Scans the built image with Trivy for CRITICAL and HIGH vulnerabilities in OS packages and libraries, ignoring unfixed findings.
9. Runs release-gate verification on pushes to `main`, after the required jobs succeed.

The release gate is a verification step. It does not publish an image to a registry or deploy to a cloud environment.

### Failure-Gate Demonstration

A separate pull request adds an intentionally failing test to demonstrate the CI gate. The expected result is that the test job fails and the dependent Docker build is skipped.

The intentional failure must not be merged into `main`.

## 9. Automated Testing

Run the normal test suite:

```bash
npm test
```

The test suite covers health checks, readiness behavior with and without a database, database errors, unknown endpoints, and the health endpoint's HEAD request.

Run the separate intentional failure demonstration:

```bash
npm run test:failure-demo
```

This command is expected to exit with a non-zero status. It is not part of the normal test command and should not be used as a passing CI test.

## 10. Observability

The API writes structured JSON logs to standard output. Request log records include the HTTP method, path, status code, duration, and timestamp.

Useful commands:

```powershell
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 db
```

Inspect API container health:

```powershell
docker inspect --format='{{.State.Health.Status}}' (docker compose ps -q api)
```

Docker health checks monitor the API's `/health` endpoint. PostgreSQL has a separate `pg_isready` health check.

For production, consider centralized log aggregation, request and error-rate dashboards, latency metrics, database connection monitoring, and alerts for sustained failures.

## 11. Security

- The API container runs as the non-root `node` user.
- The Dockerfile uses a multi-stage build and installs production dependencies in the dependency stage.
- npm and npx are removed from the final runtime image because they are not needed to run the application.
- `.env` and `node_modules` are excluded from the Docker build context.
- Git ignores `.env`.
- PostgreSQL is not exposed through a host port in the Compose configuration.
- CI audits production dependencies for high-severity vulnerabilities.
- GitHub Actions uses read-only repository contents permissions.
- Trivy scans the built Docker image for CRITICAL and HIGH vulnerabilities in OS packages and libraries, ignoring unfixed findings.

A successful vulnerability scan only describes the scope and findings of that scan. It does not prove that the application is completely vulnerability-free.

Automated secret scanning, production least-privilege deployment permissions, TLS, and approved production secret management should be verified before a production release.

Never commit `.env`, database credentials, API tokens, or other secrets to Git.

## 12. Deployment and Rollback

Docker Compose can run a locally available, version-tagged API image.

For example, in PowerShell:

```powershell
$env:APP_VERSION = "1.0.1"
docker compose up -d --no-deps --force-recreate api
Invoke-RestMethod http://localhost:3000/version
Invoke-RestMethod http://localhost:3000/ready
```

To return to version `1.0.0`:

```powershell
$env:APP_VERSION = "1.0.0"
docker compose up -d --no-deps --force-recreate api
Invoke-RestMethod http://localhost:3000/version
Invoke-RestMethod http://localhost:3000/ready
```

These commands assume the corresponding image tags already exist locally. They recreate the API container without recreating the database service.

The local assessment test confirmed that version `1.0.1` could run with database readiness succeeding, and that switching back to `1.0.0` restored the expected version while preserving database connectivity.

A reproducible production rollback should use an immutable, previously built image tag or digest, redeploy that exact image, and verify application health and readiness afterward.

The current CI pipeline builds and scans an image but does not push it to a registry or perform a production deployment. A complete automated rollback workflow is not currently implemented.

**Important:** Do not use `docker compose down -v` as a rollback step. Removing volumes can delete persistent database data.

## 13. Cost-Aware Cloud Path

For a small workload, a single cloud VM running Docker Compose may be a cost-conscious initial option, provided its availability and operational limitations are acceptable.

A production design should account for backups, monitoring, TLS, firewall rules, secret management, persistent database storage, and recovery requirements.

Managed database or container services can reduce operational burden but may increase cost. Actual pricing depends on region and usage.

## 14. Current Scope and Limitations

This assessment implementation demonstrates local container orchestration, automated CI validation, image vulnerability scanning, database readiness checks, structured logging, and documented version rollback.

The current implementation does not include:

- Automated image publishing to a container registry.
- Automated deployment to a cloud environment.
- A production metrics endpoint or fully configured monitoring and alerting platform.
- A fully automated production rollback workflow.
- A verified production secret-management and backup solution.

These are potential next steps rather than completed capabilities.

## 15. AI Use Disclosure

AI assistance was used to support implementation, troubleshooting, test design, and documentation. Commands, code, and configuration should be reviewed and tested by the project author, who remains responsible for explaining the design decisions and observed results.

## 16. Repository

GitHub: https://github.com/mahmoudelshazly55/apex-operations-api
