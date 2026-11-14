# Sprint 1 Engineering Contracts: Pocket48

Version 1.0 (BASELINE). Sprint: 1. Target Checkpoint: Deliverable 1 (8 Nov 2026).  
Project: Pocket48 — Personal Money and Expense Logging System.

---

## Revision History

| Version | Date | Author / Reviewer | Changes | Reason | PR / Commit |
|---|---|---|---|---|---|
| 0.1 | 10 Nov 2026 | Team | Initial draft contracts | Initial project baseline | Commit `670a09b` |
| 1.0 | 14 Nov 2026 | @il0lk3 / @Achikan | Added revision history, completed 1:1 AC-to-STS mappings (TEST-01 to TEST-18), documented known limitations | Issue #3 review before coding | PR #25 (Branch `docs/3-sprint1-contract-review`) |

---

## 1. Feature Specifications and Acceptance Criteria (AC)

### F-01: Authentication and Session
* **Linked Requirements:** FR-01, FR-02, FR-03, NFR-02, NFR-03
* **Description:** Provides password-based login for seeded accounts, creates an 8-hour database-backed session, returns current user information, and terminates the session upon logout.
* **API Specification:**
  * `POST /api/auth/login`: `{ "email": "user1@pocket48.local", "password": "..." }` $\to$ Returns user info & sets HTTP-only session cookie.
  * `POST /api/auth/logout`: Clears session cookie and deletes session record in PostgreSQL.
  * `GET /api/auth/me`: Returns `{ "data": { "id": "...", "displayName": "...", "role": "USER" } }` based on valid session cookie.
* **Acceptance Criteria:**
  * **AC-01-01 (Valid Login):** Given an active user with correct credentials, login succeeds (200 OK), sets `pocket48_session` cookie, and returns user profile without password or hash.
  * **AC-01-02 (Invalid Login):** Given incorrect email or wrong password, login fails with HTTP 401 and generic message `"Invalid email or password"`.
  * **AC-01-03 (Session Invalidation on Logout):** Given an active session, after calling logout, subsequent calls to `/api/auth/me` with that cookie return HTTP 401.
  * **AC-01-04 (Role Integrity):** Role returned by `/api/auth/me` comes strictly from the database record; client request cannot alter or override the role.

---

### F-02: Record a Transaction
* **Linked Requirements:** FR-04, BR-01, BR-02, BR-03
* **Description:** Allows an authenticated User to record an income or expense transaction with amount (validated and stored as integer satang), transaction date, active matching category, and optional note.
* **API Specification:**
  * `POST /api/transactions`
  * Request Body:
    ```json
    {
      "type": "EXPENSE",
      "amount": 120.50,
      "categoryId": "uuid-food-category",
      "transactionDate": "2026-11-10",
      "note": "Lunch with team"
    }
    ```
  * Response: HTTP 201 Created with `{ "data": { "id": "...", "amount": 120.50, "amountSatang": 12050, ... } }`
* **Acceptance Criteria:**
  * **AC-02-01 (Valid Transaction):** When a user submits an expense with a positive amount (e.g. 120.50), active EXPENSE category, and date $\le$ today, it is saved and stored as `12050` satang.
  * **AC-02-02 (Amount Boundary Rejection):** Submitting an amount $\le 0$ or $> 9,999,999.99$ or having $> 2$ decimal places returns HTTP 400 Bad Request.
  * **AC-02-03 (Category Type Mismatch):** Submitting an EXPENSE with an INCOME category ID returns HTTP 400 Bad Request.
  * **AC-02-04 (Future Date Rejection):** Submitting a date later than today in Asia/Bangkok time returns HTTP 400 Bad Request.

---

### F-03: My Transactions List
* **Linked Requirements:** FR-05, BR-04
* **Description:** Retrieves the authenticated user's own transactions ordered by `transactionDate` descending (newest first).
* **API Specification:**
  * `GET /api/transactions`
  * Response: HTTP 200 OK with `{ "data": [ { "id": "...", "amount": 120.50, "type": "EXPENSE", ... } ] }`
* **Acceptance Criteria:**
  * **AC-03-01 (List Order):** Transactions are returned in descending order of transaction date.
  * **AC-03-02 (Ownership Isolation):** The returned list contains only transactions belonging to the calling user; no transactions of other users appear.

---

### F-04: Category Catalogue
* **Linked Requirements:** FR-06, FR-07, BR-05, BR-10
* **Description:** Provides shared categories for transactions. Administrator can create new categories with case-insensitive unique names within type; any signed-in user can list active categories.
* **API Specification:**
  * `GET /api/categories`: Returns list of active categories (accessible by any signed-in user).
  * `POST /api/categories`: `{ "name": "Travel", "type": "EXPENSE" }` (accessible only by Administrator).
* **Acceptance Criteria:**
  * **AC-04-01 (Admin Create Category):** An Administrator can create a new category (HTTP 201 Created).
  * **AC-04-02 (Duplicate Name Rejection):** Attempting to create a category with a name differing only by case within the same type (e.g., "Food" and "food") returns HTTP 400 Bad Request.
  * **AC-04-03 (User Forbidden):** A User attempting `POST /api/categories` receives HTTP 403 Forbidden.

---

### F-05: Access Control and Data Ownership (Cross-cutting)
* **Linked Requirements:** NFR-01, BR-04, BR-07, BR-10
* **Acceptance Criteria:**
  * **AC-05-01 (Unauthenticated Rejection):** Requests to `/api/transactions` or `/api/categories` without a valid session return HTTP 401 without private data.
  * **AC-05-02 (Private Transaction Isolation):** If User A requests `GET /api/transactions/:id` of User B's transaction, the API returns HTTP 404 Not Found (revealing no existence or data).
  * **AC-05-03 (Administrator Privacy Restriction):** If an Administrator requests `/api/transactions`, the request is refused with HTTP 403 Forbidden (Admins have no access to user transactions).

---

### F-06: Delivery Baseline (Cross-cutting)
* **Linked Requirements:** NFR-05, NFR-08
* **Acceptance Criteria:**
  * **AC-06-01 (Clean Clone Execution):** Running `npm install && npx prisma migrate deploy && npm run prisma:seed && npm test` succeeds from a fresh clone using only `.env.example`.
  * **AC-06-02 (Zero Committed Secrets):** No password, connection string, or secret appears in repository files.

---

## 2. Software Test Specification (STS)

| Test ID | Linked AC | Test Level | Preconditions / Input | Action | Expected Outcome |
|---|---|---|---|---|---|
| **TEST-01** | AC-01-01 | Integration (API) | Seeded user `user1@pocket48.local` exists | POST `/api/auth/login` with correct password | 200 OK, session cookie present, body has id/role, no password hash |
| **TEST-02** | AC-01-02 | Integration (API) | Seeded user exists | POST `/api/auth/login` with incorrect password | 401 Unauthorized, generic error message |
| **TEST-03** | AC-01-03 | Integration (API) | Logged-in session exists | POST `/api/auth/logout`, then GET `/api/auth/me` | 401 Unauthorized on subsequent request |
| **TEST-04** | AC-02-01 | Unit / API | User logged in, category "Food" (EXPENSE) exists | POST `/api/transactions` with amount `120.50`, valid date | 201 Created, stored in DB with `amountSatang: 12050` |
| **TEST-05** | AC-02-02 | Unit (Domain) | Boundary inputs: `0`, `-10`, `0.001`, `10000000` | Call transaction validation function | Rejection with specific validation error for each boundary |
| **TEST-06** | AC-02-03 | Integration (API) | Category "Salary" (INCOME) exists | POST `/api/transactions` with type `EXPENSE` and Salary category | 400 Bad Request (Type mismatch) |
| **TEST-07** | AC-02-04 | Unit (Domain) | Tomorrow's date in Asia/Bangkok | Call transaction validation function | 400 Bad Request (Future date rejected) |
| **TEST-08** | AC-03-01 | Integration (API) | User has transactions on 2026-11-01 and 2026-11-05 | GET `/api/transactions` | 200 OK, 2026-11-05 appears before 2026-11-01 |
| **TEST-09** | AC-05-02 | Integration (Security) | User A owns transaction #101; User B is signed in | User B requests GET `/api/transactions/101` | 404 Not Found, no transaction content returned |
| **TEST-10** | AC-04-03 | Integration (Security) | User is signed in with role `USER` | POST `/api/categories` with `{ "name": "Bonus", "type": "INCOME" }` | 403 Forbidden |
| **TEST-11** | AC-05-03 | Integration (Security) | Administrator is signed in | GET `/api/transactions` | 403 Forbidden (Admin privacy restriction) |
| **TEST-12** | AC-04-02 | Integration (API) | Category "Food" exists | Admin POST `/api/categories` with name `"food"` | 400 Bad Request (Duplicate name case-insensitive) |
| **TEST-13** | AC-06-01 | End-to-End (UI) | App running locally from clean clone | Playwright E2E: User logs in, creates expense, verifies in table | Journey completes successfully without UI glitches |
| **TEST-14** | AC-01-04 | Integration (API) | Seeded user is `USER` role | Request login and examine `me` endpoint; forge role payload | Role strictly returns `USER` irrespective of client request |
| **TEST-15** | AC-03-02 | Integration (API) | User A and User B both have transactions | User A calls GET `/api/transactions` | List contains 100% User A transactions; 0 of User B |
| **TEST-16** | AC-04-01 | Integration (API) | Administrator is signed in | POST `/api/categories` with `{ "name": "Health", "type": "EXPENSE" }` | 201 Created, category persists in database |
| **TEST-17** | AC-05-01 | Integration (Security) | No session cookie provided | GET `/api/transactions`, GET `/api/categories` | 401 Unauthorized for all protected routes |
| **TEST-18** | AC-06-02 | Repository (Hygiene) | Git repository working tree | Scan repository files for `.env`, passwords, or secret keys | Zero leaks detected; `.env.example` contains only placeholders |

---

## 3. Product Definition of Done (DoD) for Sprint 1

A Sprint 1 feature is complete only when all of the following conditions are met:
1. **Behavior Implemented:** Code satisfies the Feature Design and all linked Acceptance Criteria.
2. **Automated Verification:**
   * Unit tests pass for domain rules (BR-01 satang calculations and date validations).
   * Integration tests pass for database persistence, API contracts, and security/ownership enforcement.
   * End-to-end UI smoke test passes on clean setup.
3. **Traceability:** Feature is tracked via a dedicated GitHub Issue, developed on a feature branch, and integrated into `staging` via a reviewed Pull Request.
4. **Code Review:** The teammate reviewed the PR with substantive comments verifying specific test cases and security rules; self-approval is forbidden.
5. **Quality Gate:** Passes the CI pipeline (`test-and-docker`) before merging into `staging` and `main`.
6. **Documentation & Hygiene:** Setup instructions in `README.md` and `.env.example` remain accurate; no secrets are committed.

---

## 4. Known Limitations & Scope Exclusions for Sprint 1

The following capabilities are explicitly deferred to later sprints in accordance with `docs/sprints/plan.md`:
* **Transaction Management (F-07):** Viewing full transaction detail, editing, and deleting transactions are deferred to Sprint 2.
* **Filtering & Search (F-08):** Filtering by month, type, and category is deferred to Sprint 2.
* **Monthly Summary & Balance Cards (F-09):** Aggregated monthly income, expense totals, and category breakdown are deferred to Sprint 2.
* **Category Lifecycle (F-10):** Renaming and deactivating categories by Administrator are deferred to Sprint 2.
* **Account Administration (F-11):** Administrator UI for activating and deactivating user accounts is deferred to Sprint 2.
* **Monthly Budgets (F-13):** Setting budgets per category and overspending warnings are deferred to Sprint 3.
* **CSV Export (F-14):** Exporting transaction history to CSV format is deferred to Sprint 3.
