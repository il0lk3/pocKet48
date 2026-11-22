# Pocket48: Deployment and Operational Guide

Deployment specification, repeatable release procedure, and Lab 5 verification evidence index for **Pocket48** (Personal Money and Expense Logging System) on Google Cloud Platform (GCP). Complies with Lab 5 requirements (R-02, R-07, R-08, Section 4.3).

---

## 1. Technology Stack & Deviations from Reference

Pocket48 adopts the Lab 5 reference stack with the following project-specific adaptations:

| Component | Selected Technology | Deviation / Customization from Starter Reference |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Compiled to static distribution (`dist/`) and served by Express in production; footer displays `v1.0.0 (<7-char SHA>)` via `VITE_APP_COMMIT_SHA` |
| **Backend API** | Node.js 24, Express, TypeScript | REST API using integer satang arithmetic (`BigInt`), PostgreSQL-backed sessions (`pocket48_session` signed HTTP-only cookie), and `GET /api/health` exposing `version` + `commit` |
| **Database ORM** | Prisma ORM 5.x | Generates Prisma Client, manages additive SQL migrations; `server/prisma/seed.ts` makes `DEMO_USER_PASSWORD` optional so non-`--demo` production migrations seed Admin + 8 categories cleanly |
| **Database Engine** | Google Cloud SQL (PostgreSQL 16) | Shared-cloud instance `s90606c10-pg` (database `s90606c10`) provisioned via CPE334 Student Cloud Portal |
| **Image Hosting** | Google Artifact Registry | Repository `s90606c10` (`asia-southeast1-docker.pkg.dev/cpe-se-course-2026/s90606c10/s90606c10`) tagged with full 40-character Git commit SHA |
| **App Hosting** | Google Cloud Run (Fully Managed) | Service `s90606c10` on port `3000`, 512Mi RAM, 1 vCPU, min `0` / max `1` instances |
| **Secrets Engine** | Google Secret Manager | Injects `s90606c10-database-url`, `s90606c10-admin-password`, and optional `s90606c10-demo-password` at runtime |
| **CI/CD Pipeline** | GitHub Actions + WIF | `ci-docker.yml` (`test-and-docker`) runs offline deploy checks, server/client Vitest suites, Playwright E2E (`TEST-13`), and root `Dockerfile` build; `deploy.yml` uses keyless WIF via `environment: demo` |
| **Smoke Test** | Python `urllib` + `CookieJar` | `deploy/smoke_test.py` checks `/api/health`, `/api/ready`, `/` publicly, and uses `http.cookiejar.CookieJar` for optional login (`/api/auth/login` → `/api/auth/me` → `/api/categories` → `/api/auth/logout`) |
| **Docker Compose** | Multi-container local stack | Added root `.env.example` and `server/.dockerignore` alongside `server/.env.example`; `docker-compose.yml` adds `/api/ready` healthcheck on `server` |

---

## 2. Environment Variables Specification (R-02)

Every runtime setting is read from environment variables. **Zero real secrets, passwords, or `.env` files are committed to Git.**

| Variable Name | Required? | Secret? | Default / Placeholder Value | Source / Managed In | Purpose / Description |
|---|:---:|:---:|---|---|---|
| `PORT` | Yes | No | `3000` | Cloud Run / `.env` | HTTP listening port for Express server |
| `NODE_ENV` | Yes | No | `production` (`development` locally) | Cloud Run env / `.env` | Runtime mode; enables `Secure` cookie flag in production |
| `TZ` | Yes | No | `Asia/Bangkok` | Cloud Run env / `.env` | Time zone for `Asia/Bangkok` date validation (BR-03) |
| `DATABASE_URL` | Yes | **Yes** | `postgresql://pocket48:pocket48@localhost:5432/pocket48?schema=public` | Secret Manager (`s90606c10-database-url`) / `.env` | PostgreSQL connection string (Unix socket on Cloud Run) |
| `SESSION_SECRET` | Yes | **Yes** | `change-me-to-a-secure-random-string-at-least-32-chars` | Local `.env` / runtime env | Cryptographic secret for signing `pocket48_session` cookie |
| `ADMIN_PASSWORD` | Seed | **Yes** | `change-me-admin-password` | Secret Manager (`s90606c10-admin-password`) / `.env` | Initial password for `admin@pocket48.local` during seed |
| `DEMO_USER_PASSWORD` | Optional | **Yes** | `change-me-demo-password` | Secret Manager (`s90606c10-demo-password`) / `.env` | Optional password for `user1@pocket48.local` & `user2@pocket48.local` |
| `SEED_DEMO_DATA` | No | No | `false` (`true` locally) | Cloud Run job env / `.env` | Controls whether demo users are seeded during migration job |
| `CORS_ORIGIN` | No | No | `http://localhost:5173` | Local `.env` | Allowed CORS origin when frontend runs on separate dev server |
| `APP_VERSION` | No | No | `1.0.0` | `server/src/routes/health.ts` | Application version returned by `GET /api/health` |
| `APP_COMMIT_SHA` | No | No | `dev` (40-char SHA in CI/Docker) | `Dockerfile` `--build-arg` | Deployed Git commit SHA returned by `GET /api/health` |
| `VITE_API_URL` | Build | No | `""` in Docker (`http://localhost:3000` dev) | `Dockerfile` / `client/.env.example` | Frontend API base URL (empty = same origin) |
| `VITE_APP_COMMIT_SHA` | Build | No | `dev` (40-char SHA in Docker) | `Dockerfile` `--build-arg` | Short commit SHA rendered in `AppShell` footer |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Compose | `PASSWORD` is **Yes** | `pocket48` / `change-me-postgres-password` / `pocket48` | Root `.env` (from `.env.example`) | Local PostgreSQL container credentials for `docker-compose.yml` |

---

## 3. Operational Commands (Build, Test, Run, Migrate, Seed)

All commands run from the repository root after copying `.env.example` (or `server/.env.example`) to `.env`:

* **Install dependencies:**
  ```bash
  npm ci --prefix server && npm ci --prefix client
  ```
* **Apply database migrations & seed:**
  ```bash
  npm run prisma:migrate
  npm run prisma:seed
  ```
* **Run automated tests (35 server + 11 client + 1 Playwright E2E = 47 tests):**
  ```bash
  npm test
  npm run test:e2e
  ```
* **Run offline deploy script verification tests:**
  ```bash
  bash -n deploy/deploy.sh deploy/release.sh deploy/teardown.sh
  bash deploy/tests/test_deploy_stub.sh
  bash deploy/tests/test_release_stub.sh
  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
  ```
* **Build production TypeScript & Vite bundles:**
  ```bash
  npm run build
  ```
* **Fresh Docker Compose build & run (Check C-03):**
  ```bash
  docker compose down -v
  cp .env.example .env
  docker compose up --build -d
  docker compose ps -a
  curl --fail http://localhost:3000/api/health
  curl --fail http://localhost:3000/api/ready
  ```
* **Stop Docker Compose while keeping database volume:**
  ```bash
  docker compose down
  ```
* **Build unified production Docker image (matches Cloud Run & CI):**
  ```bash
  docker build --build-arg APP_COMMIT_SHA="$(git rev-parse HEAD)" -t pocket48:latest .
  ```

---

## 4. Google Cloud Platform (GCP) Resource Inventory

| Resource Type | Resource Identifier | Region / Location | Configuration Notes |
|---|---|---|---|
| **GCP Project** | `cpe-se-course-2026` | Global | Shared CPE334 course project provisioned via Student Cloud Portal |
| **Artifact Registry** | `s90606c10` | `asia-southeast1` | Stores versioned images (`.../s90606c10/s90606c10:<40-char SHA>`) |
| **Cloud SQL Instance** | `s90606c10-pg` | `asia-southeast1` | PostgreSQL 16 managed database |
| **Cloud SQL Database** | `s90606c10` | Within `s90606c10-pg` | Stores `users`, `sessions`, `categories`, and `transactions` |
| **Runtime Service Account** | `s90606c10-runner@cpe-se-course-2026.iam.gserviceaccount.com` | Project-level | Cloud SQL Client + Secret Manager Secret Accessor on assigned secrets |
| **Deployer Service Account** | `s90606c10-deployer@cpe-se-course-2026.iam.gserviceaccount.com` | Project-level | Keyless WIF deploy identity (`run.developer`, `artifactregistry.writer`, `iam.serviceAccountUser`) |
| **Cloud Run Service** | `s90606c10` | `asia-southeast1` | URL: `https://s90606c10-4d7hbszvwq-as.a.run.app`, Port `3000`, 512Mi, 1 vCPU, min `0` / max `1` |
| **Cloud Run Migration Job** | `s90606c10-migrate` | `asia-southeast1` | Runs `sh -c "npx prisma migrate deploy && npm run prisma:seed"` |
| **GitHub Environment** | `demo` | GitHub Repo Settings | Restricted to `main` branch; holds `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT` |
| **Branch Protection Ruleset** | `governance-ruleset` | GitHub Repo Settings | Active on `main` & `staging`; empty bypass list; requires 1 PR approval + `test-and-docker` check |

---

## 5. Repeatable Release & Rollback Procedure (R-07, R-08)

### 5.1 Standard Release Procedure
1. Create a feature/fix branch from `staging` (e.g., `git switch staging && git pull && git switch -c feat/<issue>-<slug>`).
2. Commit changes (never commit `.env` or secrets), push, and open a Pull Request into `staging` with label `lab5`.
3. Wait for `CI & Docker Build / test-and-docker` to pass and a teammate to review and approve (zero self-approvals).
4. Merge into `staging`, then open a Release Pull Request from `staging` into `main`.
5. Wait for `test-and-docker` and teammate approval on the Release PR, then merge into `main`.
6. Merging into `main` automatically triggers `.github/workflows/deploy.yml` (**`Deploy demo`**):
   * Runs `ci-docker.yml` (`test-and-docker`)
   * Authenticates to GCP via keyless Workload Identity Federation (WIF)
   * Builds and pushes `asia-southeast1-docker.pkg.dev/cpe-se-course-2026/s90606c10/s90606c10:<40-char SHA>`
   * Resolves the immutable `@sha256` digest and executes `deploy/release.sh` (`s90606c10-migrate` job → `s90606c10` Cloud Run service)
   * Runs `deploy/smoke_test.py` against `https://s90606c10-4d7hbszvwq-as.a.run.app`

### 5.2 How to Identify the Running Commit
* **Method 1 (`GET /api/health`):** Open `https://s90606c10-4d7hbszvwq-as.a.run.app/api/health` and inspect the `"commit"` field (40-character SHA).
* **Method 2 (Web UI Footer):** Check the bottom footer of `https://s90606c10-4d7hbszvwq-as.a.run.app`, which displays `· v1.0.0 (<7-char SHA>)`.
* **Method 3 (GitHub Actions Summary):** Open **Actions → `Deploy demo` → latest run → Summary** and inspect **Commit image tag** and **Digest**.
* **Method 4 (Cloud Run CLI):**
  ```bash
  gcloud run services describe s90606c10 --region asia-southeast1 --project cpe-se-course-2026 \
    --format='value(spec.template.spec.containers[0].image)'
  ```

### 5.3 Rollback & Roll-Forward Procedure (Episode 8)
1. Copy the full 40-character commit SHA of a previously deployed image from a successful `Deploy demo` run summary.
2. Open **GitHub Actions → `Deploy demo` → `Run workflow`**.
3. Select branch `main`, paste the 40-character SHA into `image_tag`, and click **Run workflow**.
4. The workflow skips `test` and `Build and push image`, resolves the existing digest, updates Cloud Run (`s90606c10`), and re-runs `deploy/smoke_test.py`.
5. To roll forward again, repeat with the newer release's 40-character SHA (or leave `image_tag` empty to rebuild and deploy `main`).

---

## 6. Troubleshooting Common Deployment Issues

| Symptom | Likely Cause | Resolution |
|---|---|---|
| `deploy` stops at `Validate deployment settings` | Missing `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, or `WIF_SERVICE_ACCOUNT` in GitHub Environment `demo` | Verify all 4 variables exist under **Settings → Environments → demo** and `demo` allows `main` |
| `rejected by the attribute condition` during WIF auth | GitHub OIDC subject/environment name mismatch | Confirm `environment: demo` in `deploy.yml` matches the Portal WIF binding for `il0lk3/pocKet48` |
| `/api/ready` returns `503` while `/api/health` returns `200` | Cloud Run cannot reach Cloud SQL `s90606c10-pg` | Check Cloud SQL instance status, Cloud SQL connection flag, and `s90606c10-database-url` secret |
| `Image digest not found` during rollback | The target SHA never completed a `Build and push image` step | Use a 40-char SHA from a successful `Deploy demo` run |
| Local `docker compose up` fails on port `5432` | Local host PostgreSQL is already bound to `5432` | Stop host PostgreSQL (`brew services stop postgresql@16`) before starting `pocket48-db` |

---

## 7. Lab 5 Verification Evidence Index (Parts 0–4)

| Rubric Part | Check / Req | Artifact / Direct Link | IDs / Version / Commit | Verification Result |
|---|---|---|---|---|
| **1. CI & Quality Gate** | C-01 / R-05 | [ci-docker.yml](https://github.com/il0lk3/pocKet48/blob/main/.github/workflows/ci-docker.yml), [PR #39](https://github.com/il0lk3/pocKet48/pull/39), [Actions Run #44958251389](https://github.com/il0lk3/pocKet48/actions/runs/44958251389), [Release PR #40](https://github.com/il0lk3/pocKet48/pull/40) | `test-and-docker`, commit `368222a` / `cc63dbd` | Passed in `1m41s` (PR #39) & `1m22s` (PR #40); all 47 tests + deploy checks + Docker build green |
| **1. CI & Quality Gate** | C-02 / R-06, R-10 | [PR #43](https://github.com/il0lk3/pocKet48/pull/43), [Failed Run #45004665169](https://github.com/il0lk3/pocKet48/actions/runs/45004665169), [Issue #20](https://github.com/il0lk3/pocKet48/issues/20) | `test/20-gate-demo-failing`, commit `d2ac7fb` | `test-and-docker` failed on deliberate assertion; `governance-ruleset` blocked merge; PR closed without merging |
| **2. Docker & Reproducible Config** | C-03 / R-01, R-02 | [Dockerfile](https://github.com/il0lk3/pocKet48/blob/main/Dockerfile), [.dockerignore](https://github.com/il0lk3/pocKet48/blob/main/.dockerignore), [docker-compose.yml](https://github.com/il0lk3/pocKet48/blob/main/docker-compose.yml), [.env.example](https://github.com/il0lk3/pocKet48/blob/main/.env.example), [PR #38](https://github.com/il0lk3/pocKet48/pull/38) | Issue `#16`, commit `a30ec14` | Fresh `docker compose up --build -d` from `.env.example` passed `/api/health`, `/api/ready`, and DB volume persistence |
| **3. GCP Deployment & Persistence** | C-04 / R-03 | [Live URL](https://s90606c10-4d7hbszvwq-as.a.run.app), [PR #41](https://github.com/il0lk3/pocKet48/pull/41), [PR #42](https://github.com/il0lk3/pocKet48/pull/42), [Issue #18](https://github.com/il0lk3/pocKet48/issues/18) | Service `s90606c10`, commit `6c66165` | Public URL live; login, transaction creation, and rejection rule verified end-to-end |
| **3. GCP Deployment & Persistence** | C-05 / R-04 | [Issue #22](https://github.com/il0lk3/pocKet48/issues/22), [Redeploy Run #45009905786](https://github.com/il0lk3/pocKet48/actions/runs/45009905786), [Rollback Run #45014196168](https://github.com/il0lk3/pocKet48/actions/runs/45014196168), [Roll-Forward Run #45014411693](https://github.com/il0lk3/pocKet48/actions/runs/45014411693) | Commit `bdfc97f` (`v1.0.0`) ↔ `6c66165` | Transactions & session persisted across redeploy (`45009905786`), rollback to `6c66165` (`45014196168`, `40s`, skipped test/build/migration), and roll-forward to `bdfc97f` (`45014411693`, `40s`) |
| **4. Repeatable Release Pipeline** | C-06 / R-07..R-10 | [PR #44](https://github.com/il0lk3/pocKet48/pull/44), [Release PR #45](https://github.com/il0lk3/pocKet48/pull/45), [Deploy Run #45008859428](https://github.com/il0lk3/pocKet48/actions/runs/45008859428), [Issue #21](https://github.com/il0lk3/pocKet48/issues/21) | Commit `bdfc97f7d9c825e2e906221d781ec4faebc5e08b` | Issue → PR #44 (`staging`, reviewed) → PR #45 (`main`) → WIF `Deploy demo` green; `/api/health` & footer match `bdfc97f` |
