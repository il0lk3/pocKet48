# Pocket48: Lab 6 UAT Environment & Safe Handoff Package

**Course:** CPE334 — Lab 6 (Part A: UAT Preparation & Safe Handoff)  
**Product Team:** Pocket48 (`@Achikan`, `@il0lk3`)  
**Partner UAT Team:** `[TBD — update once paired]`  
**Linked Issue:** `#49`  
**Related UAT Cases:** `docs/labs/lab-06/uat-plan.md` (`#48`, `UAT-01`–`UAT-05`)

---

## 1. Deployed Release & Frozen Baseline

| Field | Value |
|---|---|
| **Repository** | `https://github.com/il0lk3/pocKet48` |
| **Frozen Sprint 1 Tag** | `lab5-final` |
| **Frozen Commit SHA** | `298cfa78e0e5aebf730f63c71131702608871695` |
| **Cloud Run Service / Region** | `s90606c10` (`asia-southeast1`) |
| **Deployed Revision** | `s90606c10-00008-c2z` (`100%` traffic) |
| **Public Application URL** | `https://s90606c10-4d7hbszvwq-as.a.run.app` |
| **Sprint 1 Contract Reference** | `docs/sprints/sprint-1/contracts.md` (`v1.2`) |
| **Currency & Time Zone** | `THB`, `Asia/Bangkok` |

### Pre-Flight Verification (Verified Live)
Before starting `UAT-01`, the UAT Team can confirm the frozen deployment is online and matches `lab5-final`:

```bash
curl -s https://s90606c10-4d7hbszvwq-as.a.run.app/api/health
# Expected: {"status":"ok","version":"1.0.0","commit":"298cfa78e0e5aebf730f63c71131702608871695",...}

curl -s https://s90606c10-4d7hbszvwq-as.a.run.app/api/ready
# Expected: {"status":"ok","database":"connected","db":"connected"}
```

---

## 2. Accepted-for-Test Scope

### In Scope (Sprint 1 — `F-01` to `F-05`)
- **F-01 Authentication & Session:** Login (`/login`), logout, current-user session (`/api/auth/me`), generic `401` error `"Invalid email or password"`.
- **F-02 Record a Transaction:** Create income/expense via **Record Transaction** (`/transactions/new`), server/UI validation (`amount > 0`, `<= 9,999,999.99`, `<= 2` decimals, active matching category, date `<= today` in `Asia/Bangkok`), integer-satang storage.
- **F-03 My Transactions List:** Newest-first list at `/transactions`, KPI cards (**Total Income**, **Total Expense**, **Net Balance**) formatted with `.toFixed(2)` (`฿5000.00`, no thousands commas), immediate redirect to `/transactions` on submit (no toast).
- **F-04 Category Catalogue:** Seeded active categories, Admin create category (`/admin/categories`) with case-insensitive uniqueness, signed-in list active categories (`GET /api/categories`).
- **F-05 Access Control & Data Ownership:** Unauthenticated `401`, cross-user `GET /api/transactions/:id` returning `404`, User-to-Admin `403`, and **Administrator denial of all user financial data (`403`)**.

### Out of Scope (Sprint 2 / 3 — Exclude from Sprint 1 Acceptance)
- Edit or delete transactions (`F-07`), filter by month/type/category (`F-08`), monthly summary breakdown (`F-09`), category rename/deactivate (`F-10`), user account activation/deactivation (`F-11`), monthly budgets (`F-13`), CSV export (`F-14`), mobile `375 px` viewport layout (`F-15`).

---

## 3. Safe Test Accounts & Roles (No Secrets in Git / PDF)

| Account Label | Email Identifier | Role | Assigned UAT Cases |
|---|---|---|---|
| **Tester User 1** | `user1@pocket48.local` | `USER` | `UAT-01`, `UAT-02`, `UAT-03`, `UAT-04` |
| **Tester User 2** | `user2@pocket48.local` | `USER` | `UAT-03` (cross-user isolation check) |
| **Tester Admin** | `admin@pocket48.local` | `ADMINISTRATOR` | `UAT-03` (financial-data denial), `UAT-04` (category creation & duplicate check) |

- **Private Credential Handoff:** Account passwords are sent **privately** to the Partner UAT Team via direct message / course handoff channel. Do **not** commit passwords, tokens, or connection strings to Git or include them in the submitted PDF.
- **Synthetic Data Rule:** Use only synthetic balances, amounts, and descriptions (no real personal or financial data).

---

## 4. Data Setup, Execution Sequence & Reset / Cleanup

### Seeded Baseline Data
The database is idempotently seeded (`server/prisma/seed.ts`) with the 3 accounts above and 8 initial categories:
- **EXPENSE:** `Food & Beverage`, `Transportation`, `Utilities`, `Housing`, `Entertainment`
- **INCOME:** `Salary`, `Freelance`, `Investment`

### Execution Sequence
1. **`UAT-05`** (Invalid login) — independent; run any time while signed out.
2. **`UAT-01`** (Normal domain journey) — **run first** among signed-in cases after recording `Tester User 1`'s initial KPI values ($I_0$, $E_0$, $B_0$).
3. **`UAT-02`** (Validation & boundaries) — run after `UAT-01`; all rejected submissions must leave $I_0/E_0/B_0$ unchanged.
4. **`UAT-03`** (Role & ownership isolation) — run after `UAT-01` using a transaction created by `Tester User 1`.
5. **`UAT-04`** (State, persistence & category lifecycle) — run after `UAT-01` to verify cumulative balance math (`+฿4484.25` delta over $B_0$) across reload, logout/re-login, and Admin category creation.

### Reset / Cleanup Instructions
- Because Delete Transaction (`F-07`) is out of scope in Sprint 1, testers do not delete UAT rows through the UI.
- Prefix every test transaction note and newly created test category with `"UAT-..."` (e.g., `"UAT-01 Monthly Salary"`, `"UAT-04 Medical"`).
- If a clean reset is needed between cycles or after UAT completion, contact the Product Team (`@Achikan` / `@il0lk3`) to reset/re-seed the database.

---

## 5. Coordination, Change Control & Defect Reporting Rules

- **Version Freeze:** `main` and Cloud Run revision `s90606c10-00008-c2z` remain frozen on `lab5-final` (`298cfa7`) throughout initial UAT. The Product Team will notify the Partner UAT Team before deploying any change or fix.
- **No Verbal Explanations Needed:** Execute `UAT-01`–`UAT-05` directly from `docs/labs/lab-06/uat-plan.md`.
- **Execution Recording:** Both UAT Team members must participate and record `Case ID`, `Tester Name/Team`, `Date/Time`, `Tested Version` (`lab5-final` / `298cfa7` / `s90606c10-00008-c2z`), `Inputs`, `Actual Result` (never copy expected results), and `PASS / FAIL / BLOCKED` with readable screenshots/observations.
- **Defect Reporting:** For any actual failure, report a reproducible finding (`Issue ID`, `tested version`, `linked UAT case/req`, `preconditions/data`, `repro steps`, `expected vs actual`, `severity` by user impact, and `evidence`).
- **Availability Escalation:** If the deployed URL becomes unreachable or accounts fail unexpectedly, notify the Product Team and Instructor/TA promptly and retain evidence of the notification.
