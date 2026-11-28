# Sprint 3 Engineering Contracts: Pocket48

**Version:** 0.1 (DRAFT for teammate review before Sprint 3 implementation)  
**Sprint:** 3 (Remaining Features, Integration & Hardening)  
**Target Checkpoints:** Project Deliverable 2 (Progress) & Final Delivery (13 Dec 2026)  
**Project:** Pocket48 — Personal Money and Expense Logging System (`User` / `Administrator`)  
**Linked Issue:** `#57` (`S3-0`)

---

## Revision History

| Version | Date | Author / Reviewer | Changes | Reason | PR / Commit |
|---|---|---|---|---|---|
| 0.1 | 28 Nov 2026 | `@il0lk3` / Pending `@Achikan` | Initial Sprint 3 contracts for `F-13` (Monthly Budgets), `F-14` (CSV Export), and `F-15` (Responsive Layout 375 px) with numbered ACs (`AC-13-01`..`AC-15-03`), STS (`TEST-55`..`TEST-66`), and status tracking | Define complete Sprint 3 contracts & test design before implementation (Deliverable 2 Part C, `#57`) | Pending PR into `staging` |

---

## 0. Sprint 3 Feature Status Overview (Updated Honestly Per Checkpoint)

| Feature ID | Feature Name | Linked Req | Planned Status for Deliverable 2 | Current Status (v0.1) | Target Final Completion |
|---|---|---|---|---|---|
| **F-14** | CSV Export | `FR-16`, `BR-04`, `BR-07`, `NFR-01` | **Implement & Test** (selected Sprint 3 working progress) | `Planned` | Deliverable 2 Release Candidate |
| **F-13** | Monthly Budgets | `FR-15`, `BR-09`, `BR-04`, `BR-07` | Contract defined; implement if time allows or schedule before 13 Dec | `Planned` | By 12 Dec 2026 |
| **F-15** | Responsive Layout (`375 px`) | `NFR-09` | Contract & Playwright viewport tests planned; harden last | `Planned` | By 12 Dec 2026 |

---

## 1. Feature Specifications and Acceptance Criteria (AC)

### F-13: Monthly Budgets (With Over-Budget Warning)
* **Linked Requirements:** `FR-15`, `BR-09`, `BR-04`, `BR-07`, `NFR-01`, `D-03`, `D-10`
* **Description:** Allows an authenticated `USER` to define or update a monthly spending budget (amount `> 0`) for an active `EXPENSE` category in a specific month (`YYYY-MM`), and automatically highlights categories whose monthly expenses exceed their budget in the Monthly Summary.
* **Feature SDS & Workflow:**
  1. User opens Monthly Summary (`/summary`), selects a month (`YYYY-MM`), and enters a budget amount for an active `EXPENSE` category.
  2. Client sends `PUT /api/budgets` `{ "categoryId": "<uuid>", "month": "YYYY-MM", "amount": 3000.00 }`.
  3. Server validates `USER` role, valid `month` (`YYYY-MM`), amount (`BR-01` bounds `0.01`..`9999999.99`, max 2 decimals -> integer `amountSatang`), and verifies category exists, is active, and has `type === 'EXPENSE'` (`BR-09`).
  4. Server upserts into `budgets` using unique key `(userId, categoryId, month)`.
  5. `GET /api/summary?month=YYYY-MM` joins the user's budgets for that month and computes `budgetSatang`, `budget`, `remainingSatang = budgetSatang - totalSatang`, and `overBudget = totalSatang > budgetSatang` (strictly greater than triggers the warning per `FR-15`).
* **UI Behavior:**
  * On `/summary`, each expense category row (and a "Set Monthly Budget" form) lets the user set/update a THB budget for the selected month.
  * Categories with `overBudget === true` display a visible high-contrast warning badge (e.g., `"Over budget by ฿..."`, `role="status"`).
  * Validation errors (e.g., amount `<= 0` or invalid decimal precision) display inline next to the budget input.
* **API Specification:**
  * `GET /api/budgets?month=YYYY-MM` (`USER` only) -> `200 OK`: `{ "data": [ { "id": "...", "categoryId": "...", "categoryName": "Food & Beverage", "month": "2026-11", "amount": 3000.00, "amountSatang": 300000 } ] }`
  * `PUT /api/budgets` (`USER` only) -> Request: `{ "categoryId": "<uuid>", "month": "YYYY-MM", "amount": 3000.00 }` -> `200 OK` / `201 Created`: `{ "data": { ...budget } }`
  * `DELETE /api/budgets/:id` (`USER` only, owner check -> `404` if not owner) -> `200 OK`: `{ "data": { "id": "...", "deleted": true } }`
  * `GET /api/summary?month=YYYY-MM` extension: each `expenseByCategory` item optionally includes `budgetSatang: number | null`, `budget: number | null`, `overBudget: boolean`.
  * Errors: `400 VALIDATION_ERROR` (`amount <= 0`, `> 2` decimals, invalid `month`, `INCOME` category, or inactive category), `401 UNAUTHORIZED`, `403 FORBIDDEN` (Administrator), `404 NOT_FOUND` (foreign/unknown budget ID).
* **Data / Schema Specification (New Table & Prisma Migration Required):**
  ```prisma
  model Budget {
    id           String   @id @default(uuid())
    userId       String
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    categoryId   String
    category     Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
    month        String   // YYYY-MM (Asia/Bangkok)
    amountSatang BigInt
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    @@unique([userId, categoryId, month])
    @@index([userId, month])
    @@map("budgets")
  }
  ```
* **Acceptance Criteria:**
  * **AC-13-01 (Set / Update Budget):** User sets a positive monthly budget for an active `EXPENSE` category (`200`/`201`); submitting again for the same `(user, category, month)` updates the single unique record without creating duplicates (`BR-09`).
  * **AC-13-02 (Over-Budget Warning):** When monthly expenses in a category strictly exceed its budget (`expenseSatang > budgetSatang`), `GET /api/summary` sets `overBudget: true` and the UI displays an explicit over-budget warning; when equal (`===`) or below (`<`), `overBudget` is `false`.
  * **AC-13-03 (Invalid Amount Rejected):** Budget amount `<= 0`, `> 9999999.99`, or having `> 2` decimal places returns `400 Bad Request` (`BR-09`).
  * **AC-13-04 (Expense Category Only):** Attempting to set a budget on an `INCOME` category or inactive category returns `400 Bad Request` (`BR-09`).
  * **AC-13-05 (Ownership & Admin Restriction):** Budgets are strictly isolated per user (another user cannot view/delete them -> `404`); `ADMINISTRATOR` receives `403 Forbidden`; anonymous receives `401`.

---

### F-14: CSV Export (Selected Deliverable 2 Sprint 3 Progress)
* **Linked Requirements:** `FR-16`, `BR-04`, `BR-07`, `NFR-01`
* **Description:** Allows an authenticated `USER` to download their own transactions (optionally filtered by month) as a standards-compliant, formula-injection-safe CSV file.
* **Feature SDS & Workflow:**
  1. User clicks **Export CSV** on `/transactions` (honoring the active month filter if selected).
  2. Browser navigates/fetches `GET /api/transactions/export.csv` (optionally `?month=YYYY-MM&type=...&categoryId=...`).
  3. Server verifies `USER` role (`requireRole(['USER'])`), validates optional filter parameters identically to `F-08`, fetches only `userId = req.user.id` ordered by `transactionDate DESC, createdAt DESC`, serializes rows via pure utility `formatTransactionsCsv(rows)`, and streams the response with `text/csv` headers.
  4. **CSV Escaping & Formula-Injection Defense:**
     * Header row: `date,type,category,amount_thb,note`
     * `amount_thb`: exact 2-decimal THB string from `amountSatang` (e.g., `120.50`) with zero floating-point drift.
     * Formula-injection neutralization: if a text field (`category` or `note`) starts with `=`, `+`, `-`, or `@` (or tab/CR before them), prefix with a single quote `'` so spreadsheet applications (Excel / Google Sheets) treat it strictly as literal text.
     * RFC-4180 quoting: wrap any field containing `,`, `"`, `\n`, or `\r` in double quotes `"..."` and double any internal quotes (`""`).
* **UI Behavior:**
  * Visible **Export CSV** button in the `/transactions` header/toolbar (accessible label, keyboard focusable).
  * Clicking triggers file download from `/api/transactions/export.csv` (preserving active `month` / `type` / `categoryId` filter query string).
* **API Specification:**
  * `GET /api/transactions/export.csv` (optional query params: `month=YYYY-MM`, `type=INCOME|EXPENSE`, `categoryId=<uuid>`)
  * Response `200 OK`:
    * `Content-Type: text/csv; charset=utf-8`
    * `Content-Disposition: attachment; filename="pocket48-transactions.csv"` (or `pocket48-transactions-YYYY-MM.csv` when `month` is supplied)
    * Body:
      ```csv
      date,type,category,amount_thb,note
      2026-11-22,EXPENSE,Food & Beverage,120.50,Lunch with team
      ```
  * Errors: `400 VALIDATION_ERROR` (invalid `month` or `type`), `401 UNAUTHORIZED` (anonymous), `403 FORBIDDEN` (Administrator per `BR-07`).
* **Data / Schema Specification:**
  * **No new schema or migration required:** Reads directly from existing `transactions` and `categories` tables scoped by `userId = req.user.id`.
* **Acceptance Criteria:**
  * **AC-14-01 (Own Data Only & Role Protection):** Export contains 100% of the calling `USER`'s matching rows and 0 rows belonging to any other user (`BR-04`); `ADMINISTRATOR` receives `403 Forbidden` (`BR-07`).
  * **AC-14-02 (Header & Exact Decimal Formatting):** Response begins with header `date,type,category,amount_thb,note`, followed by one line per transaction with `amount_thb` formatted to exactly 2 decimal places (`120.50`, `0.30`). Empty result returns header row only (`200 OK`).
  * **AC-14-03 (Formula Injection & RFC-4180 Escaping):** Notes/values starting with `=`, `+`, `-`, or `@` (e.g., `=CMD()`, `+SUM(A1)`, `-1+1`, `@evil`) are neutralized with a leading `'`; values containing commas, quotes, or newlines are properly quoted and escaped.
  * **AC-14-04 (Auth & Download Headers):** Anonymous requests return `401 Unauthorized`; valid responses include `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="..."`.

---

### F-15: Responsive Layout (`375 px` Mobile Viewport)
* **Linked Requirements:** `NFR-09`
* **Description:** Ensures every Pocket48 screen is cleanly usable on a phone-width (`375 px`) screen with zero horizontal page scrolling and readable, tappable controls.
* **Feature SDS & Workflow:**
  * Audit CSS stylesheets across all application routes (`/login`, `/transactions`, `/transactions/new`, `/summary`, `/admin/categories`, `/admin/users`) at `375 x 812` viewport.
  * Stack header/navbar links, KPI cards, filter bars, and action buttons cleanly on viewports `<= 640px`; wrap wide tables in horizontal inner scroll containers or card layouts so `document.documentElement.scrollWidth <= window.innerWidth` holds on every route.
* **UI Behavior:** Covered directly in Feature SDS above.
* **API Specification:** **No API changes required.**
* **Data / Schema Specification:** **No schema or migration changes required.**
* **Acceptance Criteria:**
  * **AC-15-01 (Zero Horizontal Overflow on User Screens):** At `375x812` viewport, `/login`, `/transactions`, `/transactions/new`, and `/summary` each satisfy `document.documentElement.scrollWidth <= window.innerWidth`.
  * **AC-15-02 (Zero Horizontal Overflow on Admin Screens):** At `375x812` viewport, `/admin/categories` and `/admin/users` satisfy `document.documentElement.scrollWidth <= window.innerWidth`.
  * **AC-15-03 (Mobile Core Journey Usable):** A Playwright test at `375x812` signs in and records a transaction without clipped/off-screen submit buttons.

---

## 2. Software Test Specification (STS) — Sprint 3 (`TEST-55` to `TEST-66`)

| Test ID | Linked AC | Test Level | Preconditions / Input | Action | Expected Outcome | Status (v0.1) |
|---|---|---|---|---|---|---|
| **TEST-55** | AC-13-01 | Integration (API) | User 1 signed in; active EXPENSE category `Food` | `PUT /api/budgets` (`3000.00`), then repeat (`3500.00`) for same month | First creates, second updates single unique row (`350000` satang) | Planned |
| **TEST-56** | AC-13-02 | Integration (API) | User 1 has budget `100.00` in Food; records `100.00` then `+0.01` | Call `GET /api/summary?month=...` after each | `overBudget: false` at `100.00`; `overBudget: true` at `100.01` | Planned |
| **TEST-57** | AC-13-03 | Integration (API) | Invalid budgets: `0`, `-10`, `1.234`, `10000000` | `PUT /api/budgets` for each | `400 Bad Request` (`BR-09`) | Planned |
| **TEST-58** | AC-13-04 | Integration (API) | `Salary` (INCOME) and an inactive EXPENSE category | `PUT /api/budgets` targeting each | `400 Bad Request` (`BR-09`) | Planned |
| **TEST-59** | AC-13-05 | Integration (Security) | User 1 owns budget `#B`; User 2 & Admin signed in | User 2 tries `DELETE /api/budgets/#B`; Admin calls `GET/PUT /api/budgets` | User 2 -> `404`; Admin -> `403`; Anonymous -> `401` | Planned |
| **TEST-60** | AC-14-01 | Integration (Security) | User 1 & User 2 both have transactions; Admin signed in | User 1 & Admin call `GET /api/transactions/export.csv` | User 1 CSV contains only User 1 rows; Admin -> `403` | Planned |
| **TEST-61** | AC-14-02 | Integration (API) | User 1 has `5000.00` INCOME & `120.50` EXPENSE | `GET /api/transactions/export.csv` (and `?month=2020-01` empty) | Exact header `date,type,category,amount_thb,note`, formatted `5000.00` & `120.50`; empty month returns header only | Planned |
| **TEST-62** | AC-14-03 | Unit & API | Notes: `=CMD()`, `+1+1`, `-2`, `@sum`, `Lunch, "special"` | Run `formatTransactionsCsv` and `GET /api/transactions/export.csv` | Formula prefixes neutralized (`'=CMD()`, `'+1+1`, `'-2`, `'@sum`); commas & quotes RFC-4180 escaped | Planned |
| **TEST-63** | AC-14-04 | Integration (API) & UI | Anonymous & signed-in User 1 | Unauthenticated `GET /api/transactions/export.csv`; authenticated `GET`; click Export CSV button in UI | Anonymous -> `401`; Authenticated -> `200` with `text/csv` & `attachment; filename=...`; UI button wired | Planned |
| **TEST-64** | AC-15-01 | End-to-End (Playwright) | Viewport `375x812` | Visit `/login`, `/transactions`, `/transactions/new`, `/summary` | `scrollWidth <= innerWidth` on all User screens | Planned |
| **TEST-65** | AC-15-02 | End-to-End (Playwright) | Viewport `375x812`, Admin signed in | Visit `/admin/categories`, `/admin/users` | `scrollWidth <= innerWidth` on all Admin screens | Planned |
| **TEST-66** | AC-15-03 | End-to-End (Playwright) | Viewport `375x812`, User 1 | Complete login and create transaction flow on mobile viewport | Submit button visible/tappable; transaction saved without horizontal scroll | Planned |

---

## 3. Sprint 3 Definition of Done (DoD)

1. Every implemented Sprint 3 feature follows TDD (`RED` -> `GREEN`), passes teammate PR review and `test-and-docker` CI on `staging`, and updates the status table above honestly (never marking unexecuted tests as done).
2. Any Prisma schema change (`F-13` `Budget`) includes a clean migration verified via `npx prisma migrate deploy` both in CI and on Cloud Run's migration job.
3. All Sprint 1, Sprint 2, and implemented Sprint 3 tests pass in full regression before promoting to `main`.
