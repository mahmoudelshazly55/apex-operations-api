# Operations Runbook

## 1. Purpose

This runbook describes how to verify the local application, investigate common failures, and recover the API safely.

## 2. Service Overview

- API: Node.js and Express
- Database: PostgreSQL
- Orchestration: Docker Compose
- Health endpoint: `/health`
- Readiness endpoint: `/ready`
- Version endpoint: `/version`

Run commands from the project directory.

## 3. Initial Health Check

Check container status:

```powershell
docker compose ps
```

Check API health:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Check database readiness:

```powershell
Invoke-RestMethod http://localhost:3000/ready
```

Expected response when the database is connected:

```json
{
  "status": "ready",
  "database": "connected"
}
```

Check the deployed application version:

```powershell
Invoke-RestMethod http://localhost:3000/version
```

## 4. Incident: API Is Not Responding

### Symptoms

- Requests to port 3000 fail.
- The API container is stopped or unhealthy.
- Health checks return errors.

### Investigation

```powershell
docker compose ps
docker compose logs --tail=100 api
docker inspect --format='{{.State.Health.Status}}' $(docker compose ps -q api)
```

Check whether port 3000 is already in use:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

### Recovery

Restart the API service:

```powershell
docker compose restart api
```

Recheck health:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

If the problem persists, inspect the logs before rebuilding or recreating containers.

## 5. Incident: Database Is Not Ready

### Symptoms

- `/ready` returns HTTP 503.
- API logs show database connection errors.
- PostgreSQL is unhealthy or restarting.

### Investigation

```powershell
docker compose ps
docker compose logs --tail=100 db
docker compose logs --tail=100 api
docker compose exec db pg_isready -U apex -d apex_operations
```

The last command assumes the default local database username and database name. If these values were customized, use the values from your local `.env`.

### Recovery

Start the database service if it is stopped:

```powershell
docker compose up -d db
```

Wait for the database health check, then test readiness again:

```powershell
docker compose ps
Invoke-RestMethod http://localhost:3000/ready
```

Do not delete the database volume as a troubleshooting shortcut. It contains persistent database data.

## 6. Incident: Container Build or Startup Fails

Inspect the configuration:

```powershell
docker compose config --quiet
```

Review recent logs:

```powershell
docker compose logs --tail=100
```

Rebuild and start the services when a code or image change requires it:

```powershell
docker compose up --build -d
```

Verify health and readiness afterward. Avoid exposing environment variables or secret values when collecting diagnostic output.

## 7. Failure Investigation Procedure

For any incident:

1. Record the symptom and approximate time.
2. Check container status and health.
3. Review API and database logs.
4. Test `/health` and `/ready` separately.
5. Identify whether the failure is in the application, database, configuration, or container runtime.
6. Apply the smallest safe recovery action.
7. Verify health, readiness, and version.
8. Record the cause, action taken, and outcome.

### Demonstrating a Database Readiness Failure

The automated tests cover both successful database readiness and database query failures using a mock database. This demonstrates the expected API behavior without intentionally damaging the running database.

For a safe live investigation, inspect logs and service health before attempting recovery.

## 8. Rollback Procedure

The current CI workflow builds a Docker image but does not publish it to a registry or perform a production deployment. The procedure below is a template for a deployment that retains previously built images.

1. Identify the last known-good image tag or digest.
2. Confirm that the image exists locally or in the configured registry.
3. Update the deployment configuration to use that exact image.
4. Redeploy using the approved deployment procedure.
5. Verify `/health`, `/ready`, and `/version`.
6. Review logs and confirm the service is stable.
7. Record the previous and restored image versions.

Do not treat changing `APP_VERSION` alone as a rollback. A real rollback must run the previously built application image.

For local assessment work, verify the available images before attempting a rollback:

```powershell
docker image ls apex-operations-api
```

Do not remove the PostgreSQL volume during rollback.

## 9. Security and Data Protection

- Never commit `.env` or production credentials.
- Do not paste secrets into tickets or incident reports.
- Keep database storage persistent.
- Restrict production access to authorized operators.
- Use approved secret storage and least-privilege permissions for production deployments.

## 10. Post-Incident Record

Document:

- Incident date and time
- Observed symptoms
- Affected component
- Relevant sanitized logs
- Root cause, if confirmed
- Recovery action
- Health/readiness verification
- Follow-up prevention work

