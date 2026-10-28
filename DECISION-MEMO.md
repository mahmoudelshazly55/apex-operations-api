# Decision Memo — Apex Operations API

## Decision 1: Node.js and Express

**Decision:** Use Node.js with Express for the HTTP API.

**Rationale:** This provides a lightweight service with simple health, readiness, and version endpoints, plus a familiar ecosystem for automated testing.

**Trade-off:** The application requires dependency management and runtime security updates.

## Decision 2: PostgreSQL

**Decision:** Use PostgreSQL as the persistent relational database.

**Rationale:** It provides reliable relational storage and supports an explicit readiness check using a database query.

**Trade-off:** Database credentials, availability, backups, and schema changes require operational management.

## Decision 3: Docker and Docker Compose

**Decision:** Containerize the API and run it with PostgreSQL through Docker Compose.

**Rationale:** This makes the local environment repeatable and separates application and database processes.

**Trade-off:** Compose is appropriate for a small deployment or assessment environment but does not itself provide multi-node orchestration or high availability.

## Decision 4: Non-root, Multi-stage Runtime Image

**Decision:** Use a multi-stage Docker build and run the application as a non-root user.

**Rationale:** This reduces unnecessary runtime contents and limits privileges inside the container.

**Trade-off:** The final image must still be rebuilt and scanned regularly as base images and dependencies change.

## Decision 5: GitHub Actions and Trivy

**Decision:** Use GitHub Actions for linting, tests, dependency auditing, image builds, and Trivy scanning.

**Rationale:** Automated checks provide repeatable feedback and help prevent known high-severity dependency or image findings from being overlooked.

**Trade-off:** A successful scan is limited to the scanner's coverage and configuration. It is not proof that the application is vulnerability-free.

## Decision 6: Health and Readiness Endpoints

**Decision:** Keep process health separate from database readiness.

**Rationale:** The API may be running while its database connection is unavailable. Separate endpoints help distinguish these states.

**Trade-off:** Monitoring must check readiness as well as process health to detect database-related failures.

## Decision 7: Versioned Images and Rollback

**Decision:** Use an application version to select a local image tag and document rollback commands.

**Rationale:** Versioned tags make it possible to demonstrate returning to a previously built image.

**Trade-off:** The current implementation does not publish immutable images to a registry or automate production rollback. Production deployment should use a retained image digest or immutable tag.

## Summary

The design prioritizes simplicity, repeatability, basic security controls, and clear operational behavior. A production extension should add registry publishing, automated deployment, managed secrets, backup verification, and monitored rollback procedures.
