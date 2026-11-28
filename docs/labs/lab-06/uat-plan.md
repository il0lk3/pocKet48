# Pocket48: Sprint 1 User Acceptance Test (UAT) Plan

**Course:** CPE334 — Lab 6 (Part A: UAT Preparation & Handoff)  
**Project:** Pocket48 — Personal Money and Expense Logging System (`User` / `Administrator`)  
**Currency & Time Zone:** Thai Baht (`THB`), `Asia/Bangkok`  
**Linked Issue:** `#48`

---

## 1. Baseline Release & Accepted-for-Test Scope

| Item | Value |
|---|---|
| **Repository** | `https://github.com/il0lk3/pocKet48` |
| **Sprint 1 Release Tag / Commit** | `lab5-final` (`298cfa78e0e5aebf730f63c71131702608871695`) |
| **Deployed Cloud Run Revision** | `s90606c10-00008-c2z` |
| **Application URL** | `https://s90606c10-4d7hbszvwq-as.a.run.app` |
| **Sprint 1 Contract Reference** | `docs/sprints/sprint-1/contracts.md` (v1.2) |

### In-Scope Features (Sprint 1)
- **F-01:** Authentication & DB-backed session (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`)
- **F-02:** Record income/expense transactions with server/UI validation and integer-satang storage (`POST /api/transactions`)
- **F-03:** My transactions list ordered newest date first + Income / Expense / Net Balance KPI cards (`GET /api/transactions`)
- **F-04:** Shared category catalogue — seeded categories, Admin create category with case-insensitive uniqueness, signed-in list active categories (`GET /api/categories`, `POST /api/categories`)
- **F-05:** Access control & data ownership isolation — unauthenticated `401`, cross-user `404`, User-to-Admin `403`, **Administrator denial of user financial data (`403`)**

### Out of Scope (Sprint 2 / 3 — Do Not Test for Sprint 1 Acceptance)
- Edit/delete transactions, transaction search/filter, monthly summary breakdown, category rename/deactivate, user account activation/deactivation, monthly budgets, CSV export.

---

## 2. Test Account Labels & Roles (No Secrets)

| Account Label | Email Identifier | Role | Purpose |
|---|---|---|---|
| **Tester User 1** | `user1@pocket48.local` | `USER` | Normal journey, boundary validation, persistence, own-data balance math |
| **Tester User 2** | `user2@pocket48.local` | `USER` | Cross-user isolation & ownership denial checks |
| **Tester Admin** | `admin@pocket48.local` | `ADMINISTRATOR` | Category catalogue checks & **Administrator denial of financial data** |

> **Security Note:** Credentials for these synthetic demo accounts are shared privately with the partner UAT Team. Never store real passwords, tokens, or connection strings in this document or in Git.

---

## 3. Execution Order & Independence

- Run **`UAT-01`** first so `Tester User 1` has known synthetic transactions on record (`UAT-01` IDs/amounts can be referenced by `UAT-03` and `UAT-04`).
- **`UAT-02`** (validation rejections) may run at any time after `UAT-01` and must leave balances unchanged.
- **`UAT-03`** (access control & ownership) requires at least one existing transaction owned by `Tester User 1` (created in `UAT-01`).
- **`UAT-04`** (state, persistence & logout) builds on `UAT-01` so cumulative balance math can be verified across reload and re-login.
- All inputs below use **synthetic amounts and descriptions** only.

---

## 4. Executable Sprint 1 UAT Cases

### `UAT-01`: Normal Domain Journey — Record Income & Expenses with Balance Verification
- **Sprint 1 Requirement / AC:** `F-01`, `F-02`, `F-03` (`FR-01`, `FR-04`, `FR-05`, `BR-01`, `BR-02`, `BR-08` / `AC-01-01`, `AC-02-01`, `AC-03-01`)
- **Purpose:** Verify that an authenticated `USER` can sign in, record one synthetic income and two synthetic expenses in valid categories, and observe accurate newest-first ordering and exact KPI balance arithmetic.
- **Role:** `USER` (`Tester User 1` — `user1@pocket48.local`)
- **Preconditions:**
  - Application is reachable at the baseline URL.
  - Record `Tester User 1`'s initial KPI values before starting: Initial Income $I_0$, Initial Expense $E_0$, Initial Net Balance $B_0 = I_0 - E_0$ (if clean seed, $I_0 = 0.00$, $E_0 = 0.00$, $B_0 = 0.00$).
- **Synthetic Inputs:**
  1. Income: Type = `INCOME`, Category = `Salary`, Amount = `5000.00`, Date = today (`Asia/Bangkok`), Note = `"UAT-01 Monthly Salary"`
  2. Expense #1: Type = `EXPENSE`, Category = `Food & Beverage`, Amount = `120.50`, Date = today (`Asia/Bangkok`), Note = `"UAT-01 Team Lunch"`
  3. Expense #2: Type = `EXPENSE`, Category = `Transportation`, Amount = `45.25`, Date = today (`Asia/Bangkok`), Note = `"UAT-01 BTS Fare"`
- **Numbered User Actions:**
  1. Open `/login`, enter `user1@pocket48.local` and the private password, and click **Sign In**.
  2. Confirm redirect to `/transactions` and note the initial KPI cards ($I_0$, $E_0$, $B_0$).
  3. Open **New Transaction** (`/transactions/new`), select `INCOME`, choose category `Salary`, enter amount `5000.00`, keep date as today, enter note `"UAT-01 Monthly Salary"`, and submit.
  4. Open **New Transaction**, select `EXPENSE`, choose `Food & Beverage`, enter `120.50`, date = today, note `"UAT-01 Team Lunch"`, and submit.
  5. Open **New Transaction**, select `EXPENSE`, choose `Transportation`, enter `45.25`, date = today, note `"UAT-01 BTS Fare"`, and submit.
  6. Inspect the transactions table and the three KPI cards (**Total Income**, **Total Expense**, **Net Balance**).
- **Specific Expected Results:**
  - Login succeeds and redirects to `/transactions`; navigation bar shows `Demo User 1` (`USER`).
  - All 3 transactions save with toast confirmation and appear in the table with amounts `฿5,000.00`, `฿120.50`, and `฿45.25`.
  - **Explicit Balance Calculation:**
    - Added Income = `+฿5,000.00` $\rightarrow$ Total Income = $I_0 + 5,000.00$
    - Added Expense = `฿120.50 + ฿45.25 = ฿165.75` $\rightarrow$ Total Expense = $E_0 + 165.75$
    - Expected Net Balance = $B_0 + (5,000.00 - 165.75) = B_0 + 4,834.25$ THB (exact to 2 decimal places, no rounding error).

---

### `UAT-02`: Business-Rule & Boundary Case — Amount, Future Date & Category-Type Validation
- **Sprint 1 Requirement / AC:** `F-02` (`FR-04`, `BR-01`, `BR-02`, `BR-03` / `AC-02-02`, `AC-02-03`, `AC-02-04`)
- **Purpose:** Verify that invalid amounts, future dates (in `Asia/Bangkok`), and mismatched category types are rejected without altering stored transactions or balances.
- **Role:** `USER` (`Tester User 1` — `user1@pocket48.local`)
- **Preconditions:** Signed in as `Tester User 1` on `/transactions`; note current Total Income, Total Expense, and Net Balance from `UAT-01`.
- **Synthetic Inputs:**
  - Invalid amounts: `0`, `-50.00`, `12.345` (>2 decimal places), `10000000.00` (exceeds `9,999,999.99`)
  - Invalid date: tomorrow's date in `Asia/Bangkok`
  - Mismatched category/type: Type = `EXPENSE` paired with `INCOME` category `Salary`
- **Numbered User Actions:**
  1. Open **New Transaction**, select `EXPENSE` and `Food & Beverage`, enter amount `0`, and attempt to submit.
  2. Repeat with amount `-50.00`, then `12.345`, then `10000000.00`.
  3. Open the `GrandCalendarPicker` date control and try selecting tomorrow's date (or submit tomorrow's date via `POST /api/transactions` if disabled in UI).
  4. Switch Type between `EXPENSE` and `INCOME` in the form and verify category dropdown filtering; optionally send `POST /api/transactions` with `{ "type": "EXPENSE", "amount": 100.00, "categoryId": "<Salary-UUID>", "transactionDate": "<today>" }`.
  5. Return to `/transactions` and check KPI cards and list rows.
- **Specific Expected Results:**
  - Each invalid amount (`0`, `-50.00`, `12.345`, `10000000.00`) is blocked by validation (UI error message and/or HTTP `400 Bad Request`).
  - Future dates are disabled in the calendar picker and rejected with HTTP `400 Bad Request` by the API.
  - Income categories do not appear under `EXPENSE` in the UI dropdown, and mismatched API submission returns HTTP `400 Bad Request`.
  - No rejected entry is saved; Total Income, Total Expense, and Net Balance remain **identical** to pre-test values.

---

### `UAT-03`: Forbidden Role & Ownership Case — Cross-User Isolation, Admin Denial of Financial Data & Anonymous Rejection
- **Sprint 1 Requirement / AC:** `F-04`, `F-05` (`NFR-01`, `BR-04`, `BR-07`, `BR-10`, `D-04` / `AC-04-03`, `AC-05-01`, `AC-05-02`, `AC-05-03`)
- **Purpose:** Verify strict role and tenant boundaries: Users cannot access Admin endpoints, Users cannot read another User's transactions, **Administrators are denied access to all user financial data**, and unauthenticated requests receive `401`.
- **Role:** `USER` (`Tester User 1`, `Tester User 2`), `ADMINISTRATOR` (`Tester Admin`), and Anonymous
- **Preconditions:** `Tester User 1` has at least one saved transaction from `UAT-01` (note one transaction ID `<user1_tx_id>` if inspecting via browser DevTools/API).
- **Synthetic Inputs:**
  - Protected routes: `/admin/categories`, `/transactions`
  - Protected API endpoints: `POST /api/categories`, `GET /api/transactions`, `GET /api/transactions/<user1_tx_id>`, `GET /api/categories`
- **Numbered User Actions:**
  1. **(User $\rightarrow$ Admin route):** While signed in as `Tester User 1` (`USER`), manually navigate browser URL to `/admin/categories`. Also check whether Admin navigation links are hidden.
  2. **(User 2 $\rightarrow$ User 1 data):** Sign out and sign in as `Tester User 2` (`user2@pocket48.local`). Open `/transactions` and inspect the list; in DevTools/curl with `Tester User 2`'s cookie, request `GET /api/transactions/<user1_tx_id>`.
  3. **(Administrator denial of financial data):** Sign out and sign in as `Tester Admin` (`admin@pocket48.local`). Verify landing on `/admin/categories` and absence of User transaction links in the navbar. Manually navigate browser URL to `/transactions` (and `/transactions/new`), and test `GET /api/transactions` with the Admin session cookie.
  4. **(Anonymous access):** Click **Sign Out**. Attempt to open `/transactions` directly in the browser, and call `GET /api/transactions` and `GET /api/categories` without a session cookie.
- **Specific Expected Results:**
  1. `Tester User 1` sees no Admin link in navbar; navigating to `/admin/categories` renders the **403 Forbidden** page (`POST /api/categories` returns HTTP `403`).
  2. `Tester User 2`'s `/transactions` list contains **zero** records belonging to `Tester User 1` (e.g., `"UAT-01 Monthly Salary"` is absent); `GET /api/transactions/<user1_tx_id>` returns HTTP **`404 Not Found`** with no transaction data disclosed.
  3. `Tester Admin` cannot view or modify any user financial records: `/transactions` is blocked/redirected away from transaction data, and `GET /api/transactions` returns HTTP **`403 Forbidden`** with **no financial data** exposed.
  4. After logout, `/transactions` redirects to `/login`; unauthenticated `GET /api/transactions` and `GET /api/categories` return HTTP **`401 Unauthorized`** with no private data.

---

### `UAT-04`: State, History & Persistence Case — Reload, Logout/Re-Login, Date Ordering & Category Uniqueness
- **Sprint 1 Requirement / AC:** `F-01`, `F-03`, `F-04` (`FR-02`, `FR-05`, `FR-06`, `FR-07`, `BR-05`, `NFR-03` / `AC-01-03`, `AC-03-01`, `AC-04-01`, `AC-04-02`, `AC-04-04`)
- **Purpose:** Verify that transaction history, chronological sorting, and computed balances persist across browser reloads and full logout/re-login cycles, that logout invalidates the prior session, and that category state persists without case-insensitive duplicates.
- **Role:** `USER` (`Tester User 1`) and `ADMINISTRATOR` (`Tester Admin`)
- **Preconditions:** `UAT-01` completed (`Tester User 1` net delta `+฿4,834.25` over initial baseline $B_0$).
- **Synthetic Inputs:**
  - Expense #3 (backdated): Type = `EXPENSE`, Category = `Utilities`, Amount = `350.00`, Date = yesterday (`Asia/Bangkok`), Note = `"UAT-04 Water Bill"`
  - Duplicate category attempt (as Admin): Name = `"food & beverage"` (lowercase), Type = `EXPENSE`
- **Numbered User Actions:**
  1. Sign in as `Tester User 1` (`user1@pocket48.local`) and record Expense #3 (`Utilities`, `350.00`, yesterday's date, `"UAT-04 Water Bill"`).
  2. Check row order in `/transactions` and record the updated Total Income, Total Expense, and Net Balance.
  3. Hard-refresh the browser (`Cmd+R` / `Ctrl+R` / `F5`) and verify the table and KPI cards.
  4. Click **Sign Out**, confirm redirect to `/login`, verify the old session cookie can no longer access `/api/auth/me` (returns `401`), and sign back in as `Tester User 1`.
  5. Confirm all `UAT-01` and `UAT-04` rows and balances match step 2.
  6. Sign out, sign in as `Tester Admin` (`admin@pocket48.local`), go to `/admin/categories`, and attempt to create category `"food & beverage"` (`EXPENSE`).
- **Specific Expected Results:**
  - **Ordering:** Today's `UAT-01` transactions appear **above** yesterday's `"UAT-04 Water Bill"` row (newest `transactionDate` first).
  - **Explicit Balance Persistence Math:**
    - Total Income remains $I_0 + 5,000.00$
    - Total Expense becomes $E_0 + 165.75 + 350.00 = E_0 + 515.75$
    - Expected Net Balance = $B_0 + 4,834.25 - 350.00 = B_0 + 4,484.25$ THB
  - Hard refresh and full logout + re-login display the exact same 4 new transactions and Net Balance $B_0 + 4,484.25$ THB; pre-logout session returns `401` on `/api/auth/me`.
  - Admin's duplicate case-insensitive category `"food & beverage"` (`EXPENSE`) is rejected (`400 Bad Request` / inline validation error) and existing `Food & Beverage` category remains intact.
