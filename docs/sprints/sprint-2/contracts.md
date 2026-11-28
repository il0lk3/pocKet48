# Sprint 2 Engineering Contracts: Pocket48

**Version:** 0.1 (DRAFT for teammate review before Sprint 2 implementation)  
**Sprint:** 2 (Core Expansion)  
**Target Checkpoint:** Project Deliverable 2  
**Project:** Pocket48 — Personal Money and Expense Logging System (`User` / `Administrator`)  
**Baseline Release:** Sprint 1 (`lab5-final` / `298cfa78e0e5aebf730f63c71131702608871695`)  
**Linked Issue:** `#56` (`S2-0`)

---

## Revision History

| Version | Date | Author / Reviewer | Changes | Reason | PR / Commit |
|---|---|---|---|---|---|
| 0.1 | 28 Nov 2026 | `@il0lk3` / Pending `@Achikan` | Initial Sprint 2 contracts for `F-07`–`F-12`, explicit design decisions `D-07`–`D-12`, numbered ACs (`AC-07-01`..`AC-12-03`), STS (`TEST-20`..`TEST-54`), and Sprint 2 DoD | Establish versioned contracts & test design before writing any Sprint 2 code (`#56`) | Pending PR into `staging` |

---

## 0. Sprint 2 Engineering Decisions (Recorded Before Implementation)

The following design decisions resolve edge cases across Sprint 2 requirements and directly govern automated test expectations:

| Decision ID | Topic | Agreed Behavior | Linked Req / Prior Decision |
|---|---|---|---|
| **D-07** | Editing a transaction whose category was later deactivated | Allowed (`200 OK`) if `categoryId` is unchanged (preserving historical category reference per `Q-02`); rejected (`400 Bad Request`) if changed to a different category that is inactive (`isActive = false`). | `BR-02`, `FR-09`, `Q-02` |
| **D-08** | Permanent delete & cross-user isolation | Deleting a transaction is a permanent hard delete after explicit UI confirmation. Any `GET`, `PUT`, or `DELETE` on `/api/transactions/:id` for a nonexistent ID or another user's ID returns `404 Not Found` with zero data disclosed and zero state change. | `BR-04`, `FR-10`, `D-04`, `D-05` |
| **D-09** | Deactivated account login & immediate session revocation | A deactivated user (`isActive = false`) attempting `POST /api/auth/login` receives `401 Unauthorized` with the **exact same generic error message** (`"Invalid email or password"`) as a wrong password. When an Administrator deactivates an account, the server deletes all rows in `sessions` for that `userId` immediately so existing cookies fail with `401` on the very next request. | `BR-06`, `FR-01`, `FR-14` |
| **D-10** | Month boundaries (`Asia/Bangkok`) | Month filters (`?month=YYYY-MM`) and monthly summaries (`GET /api/summary?month=YYYY-MM`) match `transactionDate` calendar strings from `YYYY-MM-01` through `YYYY-MM-<lastDayOfMonth>` inclusive. Current-month UI defaults and `BR-03` future-date checks use `Asia/Bangkok` (`UTC+7`). | `A-01`, `BR-03`, `FR-11`, `FR-12` |
| **D-11** | Administrator self-deactivation guard | An Administrator attempting `PATCH /api/admin/users/:id` with `{ "isActive": false }` on their own user ID is refused with `400 Bad Request` (`"Administrators cannot deactivate their own account."`) to prevent system lock-out. | `FR-14`, `BR-10` |
| **D-12** | Category rename continuity & inactive visibility | Renaming a category updates `categories.name` in place so existing transactions (linked by `categoryId`) automatically show the renamed label. `GET /api/categories` remains active-only (`AC-04-04`, `AC-10-02`). Administrators pass `GET /api/categories?includeInactive=true` to list both active and inactive categories; a `USER` passing `includeInactive=true` receives `403 Forbidden`. | `FR-07`, `FR-13`, `BR-05`, `BR-10`, `Q-02` |

---

## 1. Feature Specifications and Acceptance Criteria (AC)

### F-07: Manage a Transaction (View, Edit, Delete)
* **Linked Requirements:** `FR-08`, `FR-09`, `FR-10`, `BR-01`, `BR-02`, `BR-03`, `BR-04`, `BR-07`, `D-04`, `D-05`, `D-07`, `D-08`
* **Description:** Allows an authenticated `USER` to inspect one of their own transactions in full, update its fields under the same domain validation rules as creation, or permanently delete it after explicit confirmation.
* **Feature SDS & Workflow:**
  1. **View Detail:** User clicks a row or "View / Edit" action on `/transactions` -> client loads full transaction via `GET /api/transactions/:id` (or state hydrated from API) and opens detail/edit drawer or `/transactions/:id/edit`.
  2. **Edit Flow:** User edits `type`, `categoryId`, `amount`, `transactionDate`, or `note` -> client runs UX pre-validation -> sends `PUT /api/transactions/:id` -> server verifies session (`USER` role), verifies ownership (`WHERE id = :id AND userId = req.user.id`, else `404`), validates `BR-01`..`BR-03` + `D-07` -> updates row atomically -> returns `200 OK` -> UI refreshes list and KPI totals.
  3. **Delete Flow:** User clicks "Delete" -> UI opens accessible confirmation dialog showing amount/category/date -> on Confirm, sends `DELETE /api/transactions/:id` -> server verifies ownership (else `404`), deletes row permanently (`D-05`) -> returns `200 OK` -> UI removes row and updates KPI totals.
* **UI Behavior:**
  * Each transaction row on `/transactions` includes accessible **Edit** and **Delete** action buttons.
  * Edit form is pre-filled with the transaction's current `type`, `categoryId`, `amount` (2 decimals), `transactionDate`, and `note`. If the transaction uses a category that was later deactivated, that category remains selectable as the current value (labeled `(Inactive)`), while switching to another category only offers active categories matching the selected `type`.
  * Inline error banners show server validation messages without clearing user input.
  * Clicking **Delete** opens a confirmation dialog (`role="dialog"`, `aria-modal="true"`) with **Cancel** and **Confirm Delete** buttons; canceling performs no API request.
* **API Specification:**
  * `GET /api/transactions/:id` *(established in Sprint 1; verified for `FR-08`)*
    * Response `200 OK`: `{ "data": { "id": "...", "amount": 120.5, "amountSatang": 12050, "type": "EXPENSE", "transactionDate": "2026-11-20", "categoryId": "...", "category": { "id": "...", "name": "Food & Beverage", "type": "EXPENSE", "isActive": true }, "note": "Lunch", "createdAt": "...", "updatedAt": "..." } }`
  * `PUT /api/transactions/:id`
    * Request Body: `{ "type": "EXPENSE", "amount": 150.25, "categoryId": "<uuid>", "transactionDate": "2026-11-20", "note": "Updated lunch" }`
    * Response `200 OK`: `{ "data": { ...updatedTransaction } }`
  * `DELETE /api/transactions/:id`
    * Response `200 OK`: `{ "data": { "id": "<uuid>", "deleted": true } }`
  * **Error Responses (Standard Envelope `{ "error": { "code", "message" } }`):**
    * `400 VALIDATION_ERROR`: invalid type, amount (`<= 0`, `> 9999999.99`, `> 2` decimals), invalid/future date (`Asia/Bangkok`), mismatched category type, changed to inactive category (`D-07`), or note `> 200` chars.
    * `401 UNAUTHORIZED`: unauthenticated request.
    * `403 FORBIDDEN`: `ADMINISTRATOR` role (`BR-07`).
    * `404 NOT_FOUND`: transaction ID does not exist or belongs to another user (`BR-04`, `D-04`).
* **Data / Schema Specification:**
  * **No new schema or migration required:** Reuses existing `transactions` table (`amountSatang BigInt`, `transactionDate String`, `updatedAt DateTime @updatedAt`). All writes scope strictly by `{ id, userId: req.user.id }`.
* **Acceptance Criteria:**
  * **AC-07-01 (View Own Transaction):** An authenticated `USER` requesting `GET /api/transactions/:id` for their own transaction receives `200 OK` with all stored fields including category metadata and exact `amountSatang`.
  * **AC-07-02 (Valid Edit):** Submitting valid updated fields via `PUT /api/transactions/:id` (including boundaries `0.01` and `9999999.99`, or keeping an unchanged deactivated category per `D-07`) persists changes to PostgreSQL and returns `200 OK` with updated `amountSatang`.
  * **AC-07-03 (Invalid Edit Rejected & State Unchanged):** Submitting invalid amount (`0`, `-5`, `1.234`, `10000000`), future date (`Asia/Bangkok`), mismatched category type, or switching to an inactive category returns `400 Bad Request` and leaves the stored database record completely unchanged.
  * **AC-07-04 (Cross-User Ownership Isolation):** When User B calls `GET`, `PUT`, or `DELETE /api/transactions/<userA_tx_id>`, the server returns `404 Not Found` with zero data disclosed and User A's record remains unchanged (`BR-04`).
  * **AC-07-05 (Confirmed Delete):** Calling `DELETE /api/transactions/:id` as the owner permanently deletes the row (`200 OK`); subsequent `GET /api/transactions/:id` returns `404` and `GET /api/transactions` no longer lists it. In the UI, deletion requires confirmation before issuing the API call.
  * **AC-07-06 (Auth & Admin Denial):** Anonymous requests to `/api/transactions/:id` return `401`; `ADMINISTRATOR` requests return `403 Forbidden` (`BR-07`).

---

### F-08: Filter Transactions (Month, Type, Category)
* **Linked Requirements:** `FR-11`, `BR-04`, `BR-07`, `D-10`
* **Description:** Allows an authenticated `USER` to narrow their own transaction list by calendar month (`YYYY-MM`), transaction type (`INCOME` / `EXPENSE`), and/or category, individually or in combination.
* **Feature SDS & Workflow:**
  1. User adjusts any combination of Month (`YYYY-MM`), Type (`ALL` / `INCOME` / `EXPENSE`), or Category dropdown in the filter bar on `/transactions`.
  2. Client calls `GET /api/transactions` with active query parameters (`month`, `type`, `categoryId`).
  3. Server validates query params (`month` must match `^\d{4}-(0[1-9]|1[0-2])$`; `type` if provided must be `INCOME` or `EXPENSE`), queries `transactions` filtered by `userId = req.user.id` AND all active filters, ordered by `transactionDate DESC, createdAt DESC`.
  4. Client renders matching rows (or an explicit "No transactions match the selected filters" state with a **Clear Filters** button).
* **UI Behavior:**
  * Filter bar above the Ledger Entries table on `/transactions` containing clearly labeled controls: **Month** (`<input type="month">`), **Type** (`<select>`: All / Income / Expense), **Category** (`<select>`: All / active categories matching type), and **Clear Filters** button.
  * KPI cards reflect the currently loaded list or clearly indicate filtered scope.
  * When filters match zero rows, displays a friendly empty-filter message (distinct from having zero records overall) and offers **Clear Filters**.
* **API Specification:**
  * `GET /api/transactions?month=YYYY-MM&type=INCOME|EXPENSE&categoryId=<uuid>`
    * All query parameters are optional; omitting all preserves exact Sprint 1 behavior (`F-03`).
    * Response `200 OK`: `{ "data": [ ...matchingTransactions ] }` (empty array `[]` when no rows match).
    * Errors: `400 VALIDATION_ERROR` for invalid `month` format (e.g., `2026-13`, `invalid`) or invalid `type` (e.g., `TRANSFER`); `401 UNAUTHORIZED` anonymous; `403 FORBIDDEN` Administrator.
* **Data / Schema Specification:**
  * **No new schema or migration required:** Reuses composite index `@@index([userId, transactionDate])` on `transactions`. Month range filter uses string range `transactionDate >= "${month}-01"` AND `transactionDate <= "${month}-${lastDay}"` (exact ISO `YYYY-MM-DD` lexicographical match).
* **Acceptance Criteria:**
  * **AC-08-01 (Month Filter Boundaries):** `?month=YYYY-MM` includes transactions on the first day (`YYYY-MM-01`) and last day (`YYYY-MM-28/29/30/31`) of that `Asia/Bangkok` month and excludes dates in adjacent months. Invalid `month` returns `400`.
  * **AC-08-02 (Type Filter):** `?type=INCOME` returns only `INCOME` rows; `?type=EXPENSE` returns only `EXPENSE` rows; invalid `type` returns `400`.
  * **AC-08-03 (Category Filter):** `?categoryId=<uuid>` returns only rows linked to that category.
  * **AC-08-04 (Combined AND Filters):** Supplying `month`, `type`, and `categoryId` simultaneously returns only rows satisfying all three conditions.
  * **AC-08-05 (Ownership Isolation Under Filters):** Filters always enforce `userId = req.user.id`; another user's rows matching the same month/type/category are never returned.
  * **AC-08-06 (No-Match Empty State):** When no rows match active filters, API returns `200 OK` with `{ "data": [] }` and UI displays a clear empty-filter state without errors.

---

### F-09: Monthly Summary
* **Linked Requirements:** `FR-12`, `BR-07`, `BR-08`, `NFR-04`, `NFR-07`, `D-03`, `D-10`
* **Description:** Provides an authenticated `USER` with an exact monthly financial overview for a chosen month (`YYYY-MM`): total income, total expense, net balance (computed on read, never persisted), and expense breakdown per category using integer-satang arithmetic.
* **Feature SDS & Workflow:**
  1. User opens **Monthly Summary** (`/summary`) and selects a month (`YYYY-MM`, defaulting to current `Asia/Bangkok` month).
  2. Client requests `GET /api/summary?month=YYYY-MM`.
  3. Server validates `month`, queries caller's transactions within `YYYY-MM-01..YYYY-MM-<lastDay>` including category details, accumulates `totalIncomeSatang`, `totalExpenseSatang`, `balanceSatang = totalIncomeSatang - totalExpenseSatang`, and per-category expense totals strictly using `BigInt` satang arithmetic (pure helper `computeMonthlySummary`), then converts satang to exact 2-decimal THB display strings/numbers.
  4. UI renders Total Income, Total Expense, Net Balance cards and Expense by Category breakdown (ordered highest expense first).
* **UI Behavior:**
  * New authenticated `USER` route `/summary` linked from `AppShell` top navigation bar (`Monthly Summary`).
  * Month selector input (`<label htmlFor="summary-month">Month</label>`).
  * Three summary KPI cards: **Total Income**, **Total Expense**, **Net Balance** (formatted to 2 decimals, e.g., `฿0.30`).
  * **Expense by Category** table/list showing Category Name, Transaction Count, Amount (`฿...`), and Share (`%` of total monthly expense); displays clean empty state when no expenses exist for that month.
  * `ADMINISTRATOR` navigating to `/summary` sees the `403 Access Denied` screen.
* **API Specification:**
  * `GET /api/summary?month=YYYY-MM`
    * Query param `month` is required (or defaults? Contract: **required** `YYYY-MM`; missing or invalid format returns `400 VALIDATION_ERROR` so callers always specify the exact month explicitly).
    * Response `200 OK`:
      ```json
      {
        "data": {
          "month": "2026-11",
          "totalIncome": 5000.00,
          "totalExpense": 165.75,
          "balance": 4834.25,
          "totalIncomeSatang": 500000,
          "totalExpenseSatang": 16575,
          "balanceSatang": 483425,
          "expenseByCategory": [
            {
              "categoryId": "<uuid>",
              "categoryName": "Food & Beverage",
              "totalSatang": 12050,
              "total": 120.50,
              "transactionCount": 1
            }
          ]
        }
      }
      ```
    * Errors: `400 VALIDATION_ERROR` (missing/invalid `month`), `401 UNAUTHORIZED`, `403 FORBIDDEN` (Administrator).
* **Data / Schema Specification:**
  * **No new schema or migration required:** Computed strictly on read from `transactions` joined with `categories` (`BR-08`). Never stores derived balance columns.
* **Acceptance Criteria:**
  * **AC-09-01 (Accurate Monthly Totals & Category Breakdown):** For a fixed dataset spanning multiple months and categories, `GET /api/summary?month=YYYY-MM` returns exact `totalIncome`, `totalExpense`, and `expenseByCategory` totals for only that month.
  * **AC-09-02 (Derived Balance — BR-08):** `balanceSatang === totalIncomeSatang - totalExpenseSatang` is computed dynamically from stored transactions (including negative balance when expenses exceed income); editing/deleting a transaction immediately updates the summary.
  * **AC-09-03 (Exact Integer-Satang Arithmetic — NFR-07):** Unit test confirms summing `0.10` + `0.20` yields exactly `30` satang (`0.30` THB) with zero IEEE 754 floating-point drift (`0.30000000000000004` never appears).
  * **AC-09-04 (Ownership & Admin Restriction):** Summary includes only the caller's transactions; another user's records are excluded; `ADMINISTRATOR` receives `403 Forbidden`.
  * **AC-09-05 (Empty Month):** Querying a valid month with zero transactions returns `200 OK` with zeros (`0`, `0`, `0`) and `expenseByCategory: []`.
  * **AC-09-06 (Invalid Month Rejection):** Missing or malformed `month` (e.g., `2026-00`, `2026-13`, `nov-2026`) returns `400 Bad Request`.
  * **AC-09-07 (Performance Target — NFR-04):** Dedicated benchmark script seeding 1,000 transactions for one user proves 95th-percentile (`p95`) response time `<= 500 ms` for both `GET /api/transactions` and `GET /api/summary?month=YYYY-MM`.

---

### F-10: Category Lifecycle (Admin Rename & Deactivate)
* **Linked Requirements:** `FR-13`, `BR-02`, `BR-05`, `BR-10`, `Q-02`, `D-12`
* **Description:** Enables an `ADMINISTRATOR` to rename existing categories (preserving case-insensitive uniqueness within type) and deactivate categories so they can no longer be used for new transactions while remaining visible on historical transactions.
* **Feature SDS & Workflow:**
  1. Admin opens `/admin/categories`, which loads all categories (active & inactive) via `GET /api/categories?includeInactive=true`.
  2. **Rename:** Admin clicks **Rename** on a category, enters a new name (`1–40` chars), and submits -> `PATCH /api/categories/:id` `{ "name": "..." }` -> server validates length (`1–40`) and case-insensitive uniqueness within same `type` excluding current category ID (`BR-05`) -> updates name -> returns `200 OK`.
  3. **Deactivate:** Admin clicks **Deactivate** -> confirms in confirmation dialog -> `PATCH /api/categories/:id` `{ "isActive": false }` -> server updates `isActive = false` -> returns `200 OK` -> category disappears from `GET /api/categories` and User transaction form dropdown, but existing transactions still render its name via `categoryId`.
* **UI Behavior:**
  * `/admin/categories` displays both Active (`Active` badge) and Inactive (`Inactive` badge) categories.
  * Each category row offers **Rename** (inline edit input + Save/Cancel with visible validation errors) and **Deactivate** (for active categories, guarded by a confirmation dialog).
  * Reactivating via `PATCH /api/categories/:id` `{ "isActive": true }` may also be supported cleanly in the API; UI clearly reflects updated status.
* **API Specification:**
  * `GET /api/categories?includeInactive=true`
    * Without `includeInactive=true`: returns only active categories (`isActive: true`) for any authenticated user (`AC-04-04`).
    * With `includeInactive=true`: allowed only for `ADMINISTRATOR` (returns both active and inactive categories); `USER` receives `403 Forbidden`.
  * `PATCH /api/categories/:id` (`ADMINISTRATOR` only)
    * Request Body: `{ "name"?: string, "isActive"?: boolean }` (at least one field required).
    * Response `200 OK`: `{ "data": { "id": "...", "name": "...", "type": "EXPENSE", "isActive": false } }`
    * Errors: `400 VALIDATION_ERROR` (empty/invalid body, name `< 1` or `> 40` chars, duplicate name case-insensitive in same type per `BR-05`), `401 UNAUTHORIZED`, `403 FORBIDDEN` (`USER` per `BR-10`), `404 NOT_FOUND` (unknown category ID).
* **Data / Schema Specification:**
  * **No new schema or migration required:** Uses existing `categories.name`, `categories.isActive`, and `transactions.categoryId` FK (`ON DELETE RESTRICT`).
* **Acceptance Criteria:**
  * **AC-10-01 (Admin Rename & Case-Insensitive Uniqueness):** Admin renames a category (`1–40` chars) -> `200 OK`, and existing transactions referencing that `categoryId` display the new name. Renaming to an existing name in the same type differing only by case (e.g., `"food & beverage"`) returns `400 Bad Request` (`BR-05`); renaming a category to its own name with different casing (e.g., `"Food & Beverage"` -> `"FOOD & BEVERAGE"`) is allowed.
  * **AC-10-02 (Admin Deactivate & Historical Continuity):** Admin deactivates a category (`isActive: false`) -> `200 OK`; it is excluded from `GET /api/categories` and the User transaction form dropdown, while existing historical transactions still return and display the deactivated category name (`Q-02`).
  * **AC-10-03 (Deactivated Category Blocked for New Transactions):** Attempting `POST /api/transactions` with a deactivated `categoryId` returns `400 Bad Request` (`BR-02`).
  * **AC-10-04 (User Forbidden):** A `USER` calling `PATCH /api/categories/:id` or `GET /api/categories?includeInactive=true` receives `403 Forbidden` (`BR-10`).

---

### F-11: Account Administration & Deactivated Login Enforcement
* **Linked Requirements:** `FR-14`, `BR-06`, `BR-07`, `BR-10`, `NFR-02`, `D-09`, `D-11`
* **Description:** Enables an `ADMINISTRATOR` to list user accounts and activate or deactivate `USER` accounts while enforcing `BR-06` (deactivated accounts cannot log in and existing sessions are immediately invalidated).
* **Feature SDS & Workflow:**
  1. Admin navigates to `/admin/users` (linked in Admin navbar) -> client calls `GET /api/admin/users`.
  2. Server (`requireRole(['ADMINISTRATOR'])`) returns all users (`id`, `email`, `displayName`, `role`, `isActive`, `createdAt`) strictly **omitting `passwordHash`** (`NFR-02`).
  3. Admin clicks **Deactivate** (with confirmation) or **Activate** on a User -> `PATCH /api/admin/users/:id` `{ "isActive": false | true }`.
  4. Server verifies caller is `ADMINISTRATOR`, rejects self-deactivation (`req.user.id === id && isActive === false` -> `400`, `D-11`), updates `users.isActive`, and when `isActive === false`, atomically deletes all `sessions` rows for `userId = id` (`BR-06`, `D-09`).
  5. Subsequent requests with the deactivated user's cookie fail with `401 Unauthorized`; login attempts fail with `401` and generic message `"Invalid email or password"`.
* **UI Behavior:**
  * New Administrator route `/admin/users` linked in `AppShell` Admin navigation (`User Accounts`, alongside `Categories`).
  * Displays table of accounts: Display Name, Email, Role badge, Status badge (`Active` / `Inactive`), Created Date, and Action button (**Deactivate** / **Activate**; disabled with tooltip for the logged-in Admin's own row).
  * Deactivating a User prompts a confirmation dialog before calling `PATCH /api/admin/users/:id`.
  * `USER` navigating to `/admin/users` renders the `403 Access Denied` screen.
* **API Specification:**
  * `GET /api/admin/users` (`ADMINISTRATOR` only)
    * Response `200 OK`: `{ "data": [ { "id": "...", "email": "user1@pocket48.local", "displayName": "Demo User 1", "role": "USER", "isActive": true, "createdAt": "..." } ] }`
  * `PATCH /api/admin/users/:id` (`ADMINISTRATOR` only)
    * Request Body: `{ "isActive": false }` (boolean required)
    * Response `200 OK`: `{ "data": { "id": "...", "email": "...", "displayName": "...", "role": "USER", "isActive": false, "createdAt": "..." } }`
    * Errors: `400 VALIDATION_ERROR` (non-boolean `isActive`, or Admin attempting to deactivate own account per `D-11`), `401 UNAUTHORIZED`, `403 FORBIDDEN` (`USER` per `BR-10`), `404 NOT_FOUND` (unknown user ID).
* **Data / Schema Specification:**
  * **No new schema or migration required:** Uses existing `users.isActive` (Boolean) and `sessions` table (`@@index([userId])`). Deactivation runs inside a Prisma transaction (`prisma.$transaction([update user, deleteMany sessions])`).
* **Acceptance Criteria:**
  * **AC-11-01 (List Accounts Without Secrets):** Admin calling `GET /api/admin/users` receives `200 OK` listing all accounts with status and zero `passwordHash` fields (`NFR-02`).
  * **AC-11-02 (Activate / Deactivate User):** Admin toggles a `USER` account to `isActive: false` and back to `isActive: true` via `PATCH /api/admin/users/:id` (`200 OK`, persisted in PostgreSQL).
  * **AC-11-03 (Deactivated Login Rejected With Generic Error — BR-06):** A deactivated user attempting `POST /api/auth/login` with their valid password receives `401 Unauthorized` with `"Invalid email or password"` (identical to wrong password, `D-09`).
  * **AC-11-04 (Immediate Session Revocation — BR-06):** Deactivating a currently signed-in user immediately deletes their database session rows; their existing cookie receives `401 Unauthorized` on `/api/auth/me`, `/api/transactions`, and `/api/summary`.
  * **AC-11-05 (Role Enforcement & Self-Deactivation Guard):** A `USER` calling `GET/PATCH /api/admin/users*` receives `403 Forbidden` (`BR-10`); an `ADMINISTRATOR` attempting to deactivate their own ID receives `400 Bad Request` (`D-11`).
  * **AC-11-06 (Admin Financial Privacy Preserved — BR-07):** Admin accounts remain strictly blocked (`403 Forbidden`) from reading or modifying any user transactions or monthly summaries.

---

### F-12: Form Usability & Keyboard Accessibility (Cross-Cutting)
* **Linked Requirements:** `NFR-06`
* **Description:** Ensures every form input across Pocket48 has a programmatically associated visible `<label>`, displays clear visible error text near invalid inputs, and supports full keyboard-only operation for main user flows (Login, Record Transaction, Edit Transaction).
* **Feature SDS & Workflow:**
  * Audit and update all forms (`LoginPage`, `TransactionsPage` create & edit forms, `GrandCalendarPicker`, `AdminCategoriesPage` create/rename forms, confirmation modals):
    * Every `<input>`, `<select>`, and `<textarea>` has a visible `<label htmlFor="...">` with matching `id`.
    * Invalid inputs set `aria-invalid="true"` and `aria-describedby="<error-id>"` pointing to visible inline error text (`role="alert"` or `aria-live="polite"`).
    * Interactive buttons (type toggle, calendar picker, modal Confirm/Cancel) are native `<button>` elements with visible focus rings (`:focus-visible`) and `Escape` close support for dialogs/pickers.
    * Date input supports direct keyboard entry (`YYYY-MM-DD`) or keyboard navigation so users never need a mouse to enter/submit a date.
* **UI Behavior:** Covered directly in Feature SDS above.
* **API Specification:** **No API changes required.**
* **Data / Schema Specification:** **No schema or migration changes required.**
* **Acceptance Criteria:**
  * **AC-12-01 (Label-Based Field Association):** Automated component tests locate every form input on Login, Record Transaction, Edit Transaction, and Admin Category forms strictly via `getByLabelText` / `getByLabel`.
  * **AC-12-02 (Visible Inline Error Messages):** Submitting invalid values on Login, Record Transaction, or Edit Transaction displays visible descriptive error text adjacent to each failing field.
  * **AC-12-03 (Keyboard-Only Main Flows):** A Playwright E2E test completes Login and Record Transaction using only keyboard interactions (`Tab`, typing, `Space`/`Enter`) with zero mouse clicks, and verifies the created transaction persists in `/transactions`.

---

## 2. Software Test Specification (STS) — Sprint 2 (`TEST-20` to `TEST-54`)

Test IDs continue sequentially from Sprint 1 (`TEST-01`–`TEST-19`).

| Test ID | Linked AC | Test Level | Preconditions / Input | Action | Expected Outcome |
|---|---|---|---|---|---|
| **TEST-20** | AC-07-01 | Integration (API) | User 1 owns a saved `120.50` THB transaction | `GET /api/transactions/:id` as User 1 | `200 OK`, returns full record with `amountSatang: 12050` & category details |
| **TEST-21** | AC-07-02 | Integration (API) | User 1 owns a saved transaction | `PUT /api/transactions/:id` with valid amount `0.01`, then `9999999.99`, updated note/date | `200 OK`, DB reflects exact updated `amountSatang` (`1`, `999999999`) & fields |
| **TEST-22** | AC-07-02 (D-07) | Integration (API) | User 1 owns a transaction whose category is later deactivated | `PUT /api/transactions/:id` changing amount/note while keeping same `categoryId` | `200 OK`, edit succeeds (`D-07` historical continuity) |
| **TEST-23** | AC-07-03 | Integration (API) | User 1 owns a transaction (`120.50` THB) | `PUT /api/transactions/:id` with invalid amount (`0`, `1.234`, `10000000`), future date, mismatched type, or switching to another inactive category | `400 Bad Request` for each; DB row remains `120.50` unchanged |
| **TEST-24** | AC-07-04 | Integration (Security) | User 1 owns tx `#A`; User 2 is signed in | User 2 calls `GET`, `PUT`, and `DELETE /api/transactions/#A` | `404 Not Found` on all 3; no data returned; User 1's row unchanged in DB |
| **TEST-25** | AC-07-05 | Integration (API) | User 1 owns tx `#A` | `DELETE /api/transactions/#A`, then `GET /api/transactions/#A` and `GET /api/transactions` | `DELETE` returns `200 OK`; follow-up `GET /:id` returns `404`; row absent from list |
| **TEST-26** | AC-07-06 | Integration (Security) | Unauthenticated client & signed-in Admin | Call `GET`, `PUT`, `DELETE /api/transactions/:id` | `401` for anonymous; `403` for Administrator (`BR-07`) |
| **TEST-27** | AC-07-02, AC-07-05 | Component (UI) | Transactions page with seeded transaction | Open Edit form (verify pre-filled values), submit edit, trigger Delete & test Cancel then Confirm | Pre-filled inputs render; edit updates row; Cancel keeps row; Confirm deletes row |
| **TEST-28** | AC-07-02, AC-07-05 | End-to-End (Playwright) | Running app with seeded User 1 | Create expense -> Edit amount -> Reload browser -> Delete with confirm -> Reload | Updated amount persists across reload; after delete + reload row is gone |
| **TEST-29** | AC-08-01 | Integration (API) | User 1 has rows on `2026-10-31`, `2026-11-01`, `2026-11-30`, `2026-12-01` | `GET /api/transactions?month=2026-11`; also `?month=2026-13` | Only Nov 1 & Nov 30 returned (`200`); invalid month returns `400` |
| **TEST-30** | AC-08-02 | Integration (API) | User 1 has INCOME and EXPENSE rows | `GET /api/transactions?type=EXPENSE`; also `?type=INVALID` | Only EXPENSE rows returned (`200`); invalid type returns `400` |
| **TEST-31** | AC-08-03 | Integration (API) | User 1 has rows in Food & Transport | `GET /api/transactions?categoryId=<foodId>` | Only Food rows returned (`200`) |
| **TEST-32** | AC-08-04 | Integration (API) | Mixed months, types, categories | `GET /api/transactions?month=2026-11&type=EXPENSE&categoryId=<foodId>` | Only rows matching all 3 criteria returned (`200`) |
| **TEST-33** | AC-08-05 | Integration (Security) | User 1 & User 2 both have Nov EXPENSE in Food | User 1 queries `?month=2026-11&type=EXPENSE&categoryId=<foodId>` | Only User 1's rows returned; zero User 2 rows |
| **TEST-34** | AC-08-06 | Integration & UI | Filter criteria with zero matching rows | Call API (`?month=2020-01`) and apply filter in UI | API returns `200` `{ data: [] }`; UI displays empty-filter state + Clear Filters |
| **TEST-35** | AC-09-01, AC-09-02 | Integration (API) | User 1 has Nov income `5000.00`, expenses `120.50` (Food) + `45.25` (Transport), plus Oct expense `999.00` | `GET /api/summary?month=2026-11` | `totalIncome: 5000`, `totalExpense: 165.75`, `balance: 4834.25`, 2 categories; Oct excluded |
| **TEST-36** | AC-09-03 | Unit (Domain) | Transactions with `0.10` (10 satang) + `0.20` (20 satang) | Call `computeMonthlySummary` helper | `totalExpenseSatang === 30n`, `totalExpense === 0.3`, formatted `"0.30"` (`NFR-07`) |
| **TEST-37** | AC-09-04 | Integration (Security) | User 1 & User 2 have Nov data; Admin signed in | User 1 & Admin call `GET /api/summary?month=2026-11` | User 1 sees only own totals; Admin receives `403 Forbidden` |
| **TEST-38** | AC-09-05, AC-09-06 | Integration (API) | User 1 signed in | Call `?month=2020-01` (empty), then missing `month` and `?month=bad` | Empty month returns `200` with zeros & `[]`; missing/invalid returns `400` |
| **TEST-39** | AC-09-07 | Performance Script | 1,000 transactions seeded for one user in DB | Measure 30+ requests to `/api/transactions` and `/api/summary?month=...` | `p95 <= 500 ms` for both endpoints (`NFR-04`); raw output preserved |
| **TEST-40** | AC-09-01, AC-09-03 | Component (UI) | Mocked/fixed monthly summary data (`0.10 + 0.20 = 0.30`) | Render `SummaryPage`, inspect cards/category table, switch month | Exact totals and per-category amounts display; month picker triggers reload |
| **TEST-41** | AC-10-01 | Integration (API) | Admin signed in; `"Food & Beverage"` & `"Utilities"` exist | `PATCH /api/categories/:id` rename `"Utilities"` -> `"Bills"`; then attempt rename to `"food & beverage"` | Valid rename `200 OK` (historical tx reflects `"Bills"`); case-insensitive duplicate returns `400` (`BR-05`) |
| **TEST-42** | AC-10-02, AC-10-03 | Integration (API) | Admin signed in; User 1 has existing tx in category `C` | Admin `PATCH` `isActive: false` -> check `GET /api/categories`, User 1 `GET /api/transactions`, and User 1 `POST /api/transactions` with `C` | `C` hidden from `GET /api/categories`; old tx still shows `C`; new tx with `C` returns `400` (`BR-02`) |
| **TEST-43** | AC-10-04 | Integration (Security) | User 1 (`USER`) signed in | `PATCH /api/categories/:id` & `GET /api/categories?includeInactive=true` | Both return `403 Forbidden` (`BR-10`) |
| **TEST-44** | AC-10-01, AC-10-02 | Component (UI) | Admin on `/admin/categories` | Rename category inline and deactivate category with confirmation | Calls `PATCH /api/categories/:id`, shows duplicate error cleanly, updates status badge |
| **TEST-45** | AC-11-01, AC-11-02 | Integration (API) | Admin signed in | `GET /api/admin/users`, then `PATCH /api/admin/users/:user2Id` `{ isActive: false }` and `{ isActive: true }` | List returns users without `passwordHash`; toggle persists (`200 OK`) |
| **TEST-46** | AC-11-03 | Integration (Security) | User 2 deactivated (`isActive: false`) | `POST /api/auth/login` with User 2's correct password | `401 Unauthorized` with exact message `"Invalid email or password"` (`BR-06`, `D-09`) |
| **TEST-47** | AC-11-04 | Integration (Security) | User 2 is actively signed in (valid session cookie) | Admin deactivates User 2 -> User 2 calls `GET /api/auth/me` and `GET /api/transactions` with prior cookie | Both immediately return `401 Unauthorized` and DB session rows for User 2 are deleted (`BR-06`) |
| **TEST-48** | AC-11-05, AC-11-06 | Integration (Security) | User 1 & Admin signed in | User 1 calls `GET/PATCH /api/admin/users*`; Admin tries to deactivate self; Admin calls `/api/transactions` | User 1 -> `403`; Admin self-deactivate -> `400` (`D-11`); Admin `/api/transactions` -> `403` (`BR-07`) |
| **TEST-49** | AC-11-01, AC-11-02 | Component (UI) | Admin on `/admin/users` | Render users list, confirm own Deactivate button disabled, toggle User account with confirm | Displays status badges cleanly and calls `PATCH /api/admin/users/:id` |
| **TEST-50** | AC-12-01, AC-12-02 | Component (UI) | Login, Record Transaction, Edit Transaction, Admin Category forms | Query all inputs strictly via `getByLabelText`; submit invalid values | Every field resolvable by label; visible error text appears for every invalid input (`NFR-06`) |
| **TEST-51** | AC-12-03 | End-to-End (Playwright) | Running app on clean login | Complete Login and Record Transaction using only keyboard (`Tab`, typing, `Enter`) | Transaction created and visible in `/transactions` without any mouse click (`NFR-06`) |
| **TEST-52** | Cross-Feature | Integration (API) | User 1 creates tx -> checks summary -> edits tx -> deletes tx | Verify `/api/summary?month=...` after each mutation | Summary totals & category breakdown update accurately after create, edit, and delete |
| **TEST-53** | Cross-Feature | Integration (API) | Category deactivated after tx created | Verify User 1 list, summary, edit same category (`200`), and create new tx (`400`) | Historical list/summary intact; unchanged-category edit allowed (`D-07`); new creation blocked (`BR-02`) |
| **TEST-54** | Cross-Feature | Integration (Security) | Signed-in User 2 deactivated by Admin | Verify `/api/auth/me`, `/api/transactions`, `/api/summary`, and `/api/auth/login` | All protected endpoints return `401`; login returns generic `401` (`BR-06`) |

---

## 3. Product Definition of Done (DoD) for Sprint 2

A Sprint 2 feature (`F-07` through `F-12`) is complete only when all of the following conditions are satisfied:
1. **Contract Approved First:** Behavior aligns with `docs/sprints/sprint-2/contracts.md` (with any spec adjustments recorded as a new Revision History version, never overwritten silently).
2. **TDD Evidence (RED -> GREEN):** Automated tests reproducing expected behavior fail against the unimplemented/prior code (RED commit or captured run) and pass once implemented (GREEN commit).
3. **Full Regression & Build:** Backend Vitest suite, Frontend Vitest suite, Playwright E2E suite, TypeScript builds, and unified Docker build (`test-and-docker`) all pass without weakening any Sprint 1 test.
4. **Peer Review & Branch Governance:** Implemented on a feature branch from `staging`, linked to its GitHub Issue, substantively reviewed and approved by the non-author teammate, and merged into `staging`.
5. **Traceable Verification Results:** `docs/sprints/sprint-2/test-results.md` maps every Sprint 2 AC (`AC-07-01`..`AC-12-03`) and `TEST-20`..`TEST-54` to actual test files, commands, commits, and pass/fail counts.
6. **Controlled Release:** Promoted from `staging` to `main` via reviewed Release PR **only after Lab 6 UAT partner sign-off/notification**, tagged `sprint2-release`, deployed via keyless WIF CI/CD, and verified live on GCP Cloud Run.
