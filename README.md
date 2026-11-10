# Pocket48 — Personal Money and Expense Logging System

> **CPE 334 Introduction to Software Engineering in the Age of AI Agents**  
> Group Project & Lab 5 Cloud Deployment on Google Cloud Platform (GCP).

Pocket48 is a personal money and expense logging web application designed for individual financial tracking. It allows users to record income and expenses (categorized and accurately tracked in integer satang) while providing an administrator interface for shared category management and account administration.

---

## 1. System Overview & Technology Stack

* **Frontend:** React 18, TypeScript, Vite, TailwindCSS
* **Backend:** Node.js 24, Express, TypeScript, RESTful API
* **Database & ORM:** PostgreSQL 16, Prisma ORM
* **Authentication:** Stateful server-side sessions stored in PostgreSQL, signed HTTP-only cookies
* **Containerization:** Multi-stage Docker build, Docker Compose
* **Cloud Infrastructure (Lab 5):** Google Cloud Run, Cloud SQL for PostgreSQL, Artifact Registry, Secret Manager
* **CI/CD:** GitHub Actions with Workload Identity Federation (WIF)

---

## 2. Project Documentation

All engineering specifications and design documents are version-controlled in the [`docs/`](./docs) directory:

| Document | Purpose |
|---|---|
| [`docs/srs.md`](./docs/srs.md) | **Part A:** Software Requirements Specification (Scope, FR, BR, NFR, Assumptions & Decisions) |
| [`docs/features.md`](./docs/features.md) | **Part B:** Feature Inventory (F-01 to F-15) mapped to requirements and sprints |
| [`docs/traceability.md`](./docs/traceability.md) | **Part B:** Requirements-to-Feature-to-Sprint Traceability matrix |
| [`docs/system-sds.md`](./docs/system-sds.md) | **Part C:** System-Level Software Design Specification (Architecture, Data Model, API, Security) |
| [`docs/sprints/plan.md`](./docs/sprints/plan.md) | **Part D:** Three-Sprint Plan & Sprint 1 Demonstration Scenarios |
| [`docs/sprints/sprint-1/contracts.md`](./docs/sprints/sprint-1/contracts.md) | **Part E:** Sprint 1 Feature Contracts, Acceptance Criteria (AC), Test Specs (STS) & DoD |
| [`docs/labs/lab-05/deployment.md`](./docs/labs/lab-05/deployment.md) | **Lab 5:** Deployment Guide, Environment Variables, Release & Rollback Procedures |

---

## 3. Quick Start & Local Setup (NFR-05)

### Prerequisites
* Docker & Docker Compose
* Node.js 24+ and npm (for local development without Docker)

### Run with Docker Compose (Recommended)
```bash
# 1. Copy environment template
cp server/.env.example server/.env

# 2. Build and start services (PostgreSQL, Migration, API, Frontend)
docker compose up --build -d

# 3. Verify health status
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready

# 4. Access the web app
# Frontend: http://localhost:5173
# API Server: http://localhost:3000
```

### Stop Services & Retain Data
```bash
docker compose down
```

---

## 4. Team Workflow & Branching Strategy

This repository adheres to the CPE 334 Engineering Workflow:
* `main`: Protected production branch. Deployed automatically to Cloud Run via GitHub Actions.
* `staging`: Integration branch. All features merge here first.
* `feature/*` or `refactor/*`: Work branches branched from `staging` and merged via teammate-reviewed Pull Requests.
