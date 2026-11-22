# Pocket48 — Personal Money and Expense Logging System

> **CPE 334 Introduction to Software Engineering in the Age of AI Agents**  
> Group Project & Lab 5 Cloud Deployment on Google Cloud Platform (GCP).

Pocket48 is a personal money and expense logging web application designed for individual financial tracking. It allows users to record income and expenses (categorized and accurately tracked in integer satang) while providing an administrator interface for shared category management and account administration.

---

## 1. Live Demo & System Overview

* **Live Cloud Run URL:** https://s90606c10-4d7hbszvwq-as.a.run.app
* **Verify Running Commit:** Check `GET /api/health` (`"commit"` field) at https://s90606c10-4d7hbszvwq-as.a.run.app/api/health or the web UI footer (`· v1.0.0 (<7-char SHA>)`).
* **Release, Rollback & Evidence:** See [`docs/labs/lab-05/deployment.md`](./docs/labs/lab-05/deployment.md#5-repeatable-release--rollback-procedure-r-07-r-08) (Section 5: Release & Rollback) and [`docs/labs/lab-05/deployment.md`](./docs/labs/lab-05/deployment.md#7-lab-5-verification-evidence-index-parts-04) (Section 7: Lab 5 Evidence Index).

### Technology Stack

* **Frontend:** React 18, TypeScript, Vite
* **Backend:** Node.js 24, Express, TypeScript, RESTful API
* **Database & ORM:** PostgreSQL 16, Prisma ORM
* **Authentication:** Stateful server-side sessions stored in PostgreSQL, signed HTTP-only cookies
* **Containerization:** Multi-stage unified `Dockerfile` (Cloud Run) and multi-container `docker-compose.yml` (local)
* **Cloud Infrastructure (Lab 5):** Google Cloud Run, Cloud SQL for PostgreSQL, Artifact Registry, Secret Manager
* **CI/CD:** GitHub Actions (`test-and-docker` + `Deploy demo`) with keyless Workload Identity Federation (WIF)

### Runtime Modes (Local Compose vs. Cloud Run Production)

1. **Local Docker Compose (`docker-compose.yml`):** Runs 4 services — `db` (PostgreSQL 16 on `:5432`), `migrate` (Prisma migrate + seed), `server` (Express API on `:3000`), and `client` (nginx serving the Vite build on `:5173` and proxying `/api` to `server:3000`).
2. **Unified Production Image (root `Dockerfile` / Cloud Run):** Multi-stage single container on port `3000` where Express serves both `/api/*` and the compiled React SPA (`client/dist`) on the same origin.

---

## 2. Project Documentation

All engineering specifications, cloud guides, and Lab 5 evidence are version-controlled in [`docs/`](./docs):

| Document | Purpose |
|---|---|
| [`docs/srs.md`](./docs/srs.md) | **Part A:** Software Requirements Specification (Scope, FR, BR, NFR, Assumptions & Decisions) |
| [`docs/features.md`](./docs/features.md) | **Part B:** Feature Inventory (F-01 to F-15) mapped to requirements and sprints |
| [`docs/traceability.md`](./docs/traceability.md) | **Part B:** Requirements-to-Feature-to-Sprint Traceability matrix |
| [`docs/system-sds.md`](./docs/system-sds.md) | **Part C:** System-Level Software Design Specification (Architecture, Data Model, API, Security) |
| [`docs/sprints/plan.md`](./docs/sprints/plan.md) | **Part D:** Three-Sprint Plan & Sprint 1 Demonstration Scenarios |
| [`docs/sprints/sprint-1/contracts.md`](./docs/sprints/sprint-1/contracts.md) | **Part E:** Sprint 1 Feature Contracts, Acceptance Criteria (AC), Test Specs (STS) & DoD |
| [`docs/sprints/sprint-1/test-results.md`](./docs/sprints/sprint-1/test-results.md) | **Part E:** Sprint 1 AC-to-Test Results Table (Automated & Manual Verification Report) |
| [`docs/labs/lab-05/deployment.md`](./docs/labs/lab-05/deployment.md) | **Lab 5:** Deployment Guide, Environment Variables, Release & Rollback Procedures |
| [`docs/labs/lab-05/deployment.md#7-lab-5-verification-evidence-index-parts-04`](./docs/labs/lab-05/deployment.md#7-lab-5-verification-evidence-index-parts-04) | **Lab 5:** Verification Evidence Index (Checks C-01 through C-06) |
| [`docs/gcp-first-lab.md`](./docs/gcp-first-lab.md) | **Cloud Reference:** First deployment & GCP provisioning guide |
| [`docs/auto-deploy.md`](./docs/auto-deploy.md) | **Cloud Reference:** Automated deploy & rollback workflow overview |
| [`docs/gcp-cicd-guide.md`](./docs/gcp-cicd-guide.md) | **Cloud Reference:** GCP CI/CD setup & troubleshooting reference |

---

## 3. Quick Start & Local Setup (NFR-05, R-02, R-12)

> **Environment & Secrets Policy (R-02, R-12):** All runtime settings are read from environment variables. **Never commit `.env` files, passwords, connection strings, or credentials** — only `.env.example` / `server/.env.example` / `client/.env.example` placeholders are committed.

### Prerequisites
* Docker & Docker Compose
* Node.js 24+ and npm (for running local tests outside Docker)

### Option A: Run Full Stack with Docker Compose (Recommended)
```bash
# 1. Copy root environment template (matching PostgreSQL defaults)
cp .env.example .env

# 2. If an older PostgreSQL volume exists with different credentials, reset it first:
# docker compose down -v

# 3. Build and start services (db, migrate, server, client)
docker compose up --build -d

# 4. Verify health & database readiness
curl --fail http://localhost:3000/api/health
curl --fail http://localhost:3000/api/ready

# 5. Access the web app
# Frontend: http://localhost:5173
# API Server: http://localhost:3000
```

### Stop Services & Retain Data
```bash
docker compose down
```

### Seeded Accounts
`server/prisma/seed.ts` seeds the following accounts idempotently using passwords from `ADMIN_PASSWORD` and `DEMO_USER_PASSWORD` in your `.env` (or Secret Manager in Cloud Run — never hardcode real passwords):
* **Administrator:** `admin@pocket48.local`
* **Demo Users (when `DEMO_USER_PASSWORD` is provided):** `user1@pocket48.local`, `user2@pocket48.local`

### Option B: Run Automated Tests Locally (Unit, Integration, Component & E2E)

```bash
# 1. Configure root .env and server/.env (ensure POSTGRES_PASSWORD matches DATABASE_URL in server/.env)
cp .env.example .env
cp server/.env.example server/.env

# 2. Start PostgreSQL container
docker compose up -d db

# 3. Install dependencies for server and client
npm ci --prefix server && npm ci --prefix client

# 4. Apply migrations and seed baseline accounts & categories
npm run prisma:migrate
npm run prisma:seed

# 5. Run all backend (35) and frontend (11) automated tests
npm test
# Or individually:
npm test --prefix server
npm test --prefix client

# 6. Install Playwright Chromium (first time only) and run E2E journey test (TEST-13 / AC-06-01)
npx --prefix client playwright install chromium
npm run test:e2e
```

See [`docs/sprints/sprint-1/test-results.md`](./docs/sprints/sprint-1/test-results.md) for the full AC-to-test traceability and execution results table.

---

## 4. Team Workflow & Branching Strategy (R-09, R-10)

This repository adheres to the CPE 334 Engineering Workflow protected by `governance-ruleset`:
* **`main`:** Protected production branch. Receives only reviewed Release Pull Requests from `staging` (using `--merge` commit). Every merge to `main` automatically triggers `.github/workflows/deploy.yml` (`Deploy demo`) to deploy to Cloud Run via WIF.
* **`staging`:** Protected integration branch. All work branches merge here first via Pull Request.
* **Work Branches (`<type>/<issue>-<slug>`):** Branch from `staging` using `feat/`, `fix/`, `test/`, `ci/`, `docs/`, or `chore/` followed by the issue number (e.g., `feat/7-record-transaction`, `docs/23-lab5-evidence`).
* **PR & Merge Gate Rules:** Attach the `lab5` label, pass the required `CI & Docker Build / test-and-docker` check, and obtain at least 1 teammate approval (authors never approve their own PRs).
