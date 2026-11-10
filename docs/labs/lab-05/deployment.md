# Pocket48: Deployment and Operational Guide

Deployment specification and operational manual for **Pocket48** (Personal Money and Expense Logging System) on Google Cloud Platform (GCP). Complies with Lab 5 requirements (R-02, R-08, Section 4.3).

---

## 1. Technology Stack & Deviations from Reference

Pocket48 adopts the recommended reference stack with strict adherence to container runtime and security standards:

| Component | Selected Technology | Deviation / Customization from Starter Reference |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Compiled to static distribution (`dist/`) and served directly by Express in production container |
| **Backend API** | Node.js 24, Express, TypeScript | REST API with satang integer arithmetic, strict session middleware |
| **Database ORM** | Prisma ORM 5.x | Generates Prisma Client, manages additive SQL migrations |
| **Database Engine**| Google Cloud SQL (PostgreSQL 16) | Single database instance (`pocket48-pg`) with storage auto-increase disabled |
| **Image Hosting** | Google Artifact Registry | Docker images tagged with full 40-character Git commit SHA |
| **App Hosting** | Google Cloud Run (Fully Managed) | Single container on port 3000, 0-to-3 auto-scaling, scaled to 0 when idle |
| **Secrets Engine** | Google Secret Manager | Secure injection of database credentials and session secrets into Cloud Run |
| **CI/CD Pipeline** | GitHub Actions + Workload Identity Federation | Keyless GCP authentication, automated test gate on PRs, auto-deploy on `main` merge |

---

## 2. Environment Variables Specification (R-02)

Every configuration setting is read from the runtime environment. No real secrets or passwords are committed to Git.

| Variable Name | Required? | Secret? | Default / Example Value | Source / Managed In | Purpose / Description |
|---|:---:|:---:|---|---|---|
| `PORT` | Yes | No | `3000` | Cloud Run (Automatic) / Local `.env` | HTTP listening port for the server. Cloud Run sets this dynamically |
| `NODE_ENV` | Yes | No | `production` (`development` locally) | Cloud Run service env / Local `.env` | Runtime environment mode |
| `TZ` | Yes | No | `Asia/Bangkok` | Cloud Run service env / Local `.env` | Ensures correct "today" date evaluation (A-01, BR-03) |
| `DATABASE_URL` | Yes | **Yes** | `postgresql://user:pass@localhost:5432/pocket48` | GCP Secret Manager (`pocket48-database-url`) / Local `.env` | Connection string to PostgreSQL database |
| `SESSION_SECRET` | Yes | **Yes** | `change-me-session-secret-key` | GCP Secret Manager (`pocket48-session-secret`) / Local `.env` | Cryptographic secret for signing HTTP session cookies |
| `ADMIN_PASSWORD` | Optional | **Yes** | `change-me-admin-secure-pw` | GCP Secret Manager (`pocket48-admin-password`) | Initial password for seeded Administrator account (`admin@pocket48.local`) |
| `DEMO_USER_PASSWORD` | Optional | **Yes** | `change-me-user-secure-pw` | GCP Secret Manager (`pocket48-demo-password`) | Initial password for demo User accounts |
| `SEED_DEMO_DATA` | No | No | `false` (`true` locally) | Cloud Run env / Local `.env` | Toggles whether initial demo users & transactions are seeded on migration |
| `CORS_ORIGIN` | No | No | `http://localhost:5173` | Local `.env` | Allowed CORS origin when frontend is served from separate dev server |

---

## 3. Local Operational Commands

All commands can be executed from a fresh clone with `.env.example` copied to `.env`:

* **Install Dependencies:**
  ```bash
  npm install
  ```
* **Database Migration & Seed:**
  ```bash
  npx prisma migrate deploy
  npm run prisma:seed
  ```
* **Run Tests:**
  ```bash
  npm test
  ```
* **Build Application:**
  ```bash
  npm run build
  ```
* **Run with Docker Compose (Local Integration):**
  ```bash
  docker compose up --build -d
  ```
* **Stop Docker Compose & Retain Data:**
  ```bash
  docker compose down
  ```

---

## 4. Google Cloud Platform (GCP) Resource Inventory

| Resource Type | Resource Identifier | Region / Location | Configuration Notes |
|---|---|---|---|
| **GCP Project** | `cpe334-sec1-teamXX` (replace with actual) | Global | Free trial tier ($300 credit) with budget alert set |
| **Artifact Registry** | `pocket48` | `asia-southeast1` | Standard Docker repository for storing versioned images |
| **Cloud SQL Instance**| `pocket48-pg` | `asia-southeast1` | PostgreSQL 16, tier `db-f1-micro`, storage 10GB, auto-increase off |
| **Cloud SQL Database**| `pocket48` | Within instance | Default UTF-8 database |
| **Runtime Service Account** | `pocket48-runner@<PROJECT_ID>.iam.gserviceaccount.com` | Project-level | Roles: `Cloud SQL Client`, Secret Accessor on specific secrets |
| **Deployer Service Account** | `pocket48-deployer@<PROJECT_ID>.iam.gserviceaccount.com` | Project-level | Role: `Cloud Run Developer`, `Artifact Registry Writer` |
| **Cloud Run Service** | `pocket48` | `asia-southeast1` | Port 3000, 512MB RAM, 1 vCPU, Min 0, Max 3 instances, Allow unauthenticated |
| **Cloud Run Job** | `pocket48-migrate` | `asia-southeast1` | Executes `npx prisma migrate deploy && npm run prisma:seed` prior to traffic migration |
| **WIF Pool & Provider** | `github-actions` / `github-main` | Global | OIDC federation with GitHub repository and `main` branch condition |

---

## 5. Repeatable Release & Rollback Procedure (R-07, R-08)

### 5.1 Standard Release Procedure (via Pipeline)
1. Developer creates a feature branch from `staging` (e.g. `feature/tx-form`).
2. Changes are pushed and a Pull Request is opened against `staging`.
3. CI workflow (`ci-docker.yml` / `test-and-docker` check) runs automated test suites and validates docker build.
4. Teammate reviews PR with specific checks and approves. PR is merged into `staging`.
5. Release PR is opened from `staging` into `main`.
6. Upon merging into `main`, GitHub Actions `Deploy demo` workflow (`deploy.yml`) is automatically triggered:
   * Re-verifies all unit/integration tests (`ci-docker.yml`).
   * Builds and pushes container image tagged with the full 40-character Git commit SHA to Artifact Registry.
   * Executes database migrations via Cloud Run Job (`pocket48-migrate`).
   * Deploys new revision to Cloud Run (`pocket48`) by immutable image digest.
   * Runs automated smoke test (`deploy/smoke_test.py`) against the live Public URL.

### 5.2 How to Identify the Running Commit
* **Method 1 (GitHub Run Summary):** Go to GitHub Actions $\to$ `Deploy demo` $\to$ Select latest run $\to$ View summary under **Pocket48 demo deployment: Commit image tag**.
* **Method 2 (Cloud Run Console):** Open GCP Console $\to$ Cloud Run $\to$ `pocket48` $\to$ **Revisions** tab $\to$ Inspect the deployed image tag on the active revision (100% traffic).
* **Method 3 (CLI):**
  ```bash
  gcloud run services describe pocket48 --region asia-southeast1 --format='value(spec.template.spec.containers[0].image)'
  ```

### 5.3 Rollback Procedure (Episode 8)
1. Identify the 40-character commit SHA of the previous working release from GitHub Actions summary.
2. In GitHub, navigate to **Actions $\to$ Deploy demo $\to$ Run workflow**.
3. Select branch `main`.
4. In the `image_tag` field, paste the full 40-character commit SHA and click **Run workflow**.
5. The pipeline skips test and image build, points Cloud Run directly to the previous image digest, and re-executes the smoke test.
6. Verify live site; note that database state remains intact because migrations are additive.

