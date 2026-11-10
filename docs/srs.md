# Software Requirements Specification: Pocket48

Version 0.1 (DRAFT for team review). Project: Pocket48, CPE 334 Group Project. Theme: Personal Money and Expense Logging System (User / Administrator).

## 1. Stakeholder problem and context

Many people track their income and spending in chat notes or spreadsheets. Entries are inconsistent, easy to lose, and hard to total at the end of the month. The result is that people cannot answer simple questions such as "how much did I spend on food this month?" or "am I over what I planned?".

This product is a web application in which a signed-in person records income and expenses, assigns each to a category, and reviews their own history and monthly totals. An administrator maintains the shared category list and the user accounts. Each person's financial records are private to that person.

Context: individual, personal use. All amounts are in Thai Baht (THB). Dates and "today" use the Asia/Bangkok time zone.

## 2. Actors and responsibilities

| Actor | Description | Responsibilities |
|---|---|---|
| User | An authenticated person using the app for their own money | Log in and out; create, view, edit, delete their own transactions; filter them; view monthly summary; set budgets; export their data |
| Administrator | An authenticated operator of the system | Create, rename, deactivate shared categories; list user accounts and activate/deactivate them. Cannot read or change any user's transactions |
| Anonymous visitor | Not signed in | Can only reach the login screen and public health endpoints |

Accounts are created by the seed (demo/test accounts). Self-registration, password recovery, and advanced account administration are out of scope.

## 3. Product scope

### 3.1 In scope
- Authentication with server-side sessions, two roles (User, Administrator)
- Income and expense transactions with category, amount, date, optional note
- Shared category catalogue maintained by the Administrator
- Per-user monthly summary, filtering, monthly budgets with a warning, CSV export of own data
- Administrator account activation/deactivation

### 3.2 Explicit exclusions
- Bank or card synchronisation, receipt or file upload, OCR
- Multiple currencies or exchange rates
- Shared, family, or group wallets
- Self-registration, password recovery, social login
- Real payments or notifications by email/SMS
- Native mobile application (the web UI must work on a phone-width screen, see NFR-09)

## 4. Functional requirements (FR)

| ID | Requirement (observable behaviour) |
|---|---|
| FR-01 | A person with an active account can log in with email and password. Wrong email or wrong password is rejected with the same generic error message. |
| FR-02 | A signed-in person can log out. After logout, the previous session is rejected by every protected endpoint. |
| FR-03 | The app can retrieve the current signed-in user (id, display name, role) from the session. The role is never chosen by the client. |
| FR-04 | A User can create a transaction with type (income or expense), amount, date, category, and optional note. It is saved to the database under that User. |
| FR-05 | A User can list their own transactions, newest transaction date first. |
| FR-06 | An Administrator can create a category with a name and a type (income or expense). |
| FR-07 | Any signed-in person can list the active categories (used by the transaction form). |
| FR-08 | A User can view one of their own transactions in full. |
| FR-09 | A User can edit their own transaction. The same validation as creation applies. |
| FR-10 | A User can delete their own transaction after confirmation. |
| FR-11 | A User can filter their own transactions by month, type, and category. |
| FR-12 | A User can see, for a chosen month, total income, total expense, balance, and expense total per category. |
| FR-13 | An Administrator can rename a category and deactivate it. |
| FR-14 | An Administrator can list user accounts and activate or deactivate a User account. |
| FR-15 | A User can set a monthly budget for an expense category. When the month's expense total in that category exceeds the budget, the summary shows a warning. |
| FR-16 | A User can export their own transactions as a CSV file. |

## 5. Business rules (BR)

| ID | Rule |
|---|---|
| BR-01 | A transaction amount must be greater than 0, have at most 2 decimal places, and not exceed 9,999,999.99 THB. |
| BR-02 | A transaction must use an active category whose type equals the transaction type (an expense cannot use an income category). |
| BR-03 | A transaction date cannot be later than today (Asia/Bangkok). |
| BR-04 | A User can read, change, or delete only their own transactions. A request for another user's transaction returns "not found" and no data. |
| BR-05 | A category name is 1 to 40 characters and unique within its type, ignoring letter case. |
| BR-06 | A deactivated account cannot log in, and its existing sessions are rejected. |
| BR-07 | An Administrator cannot read or change any user's transactions. |
| BR-08 | Balance equals total income minus total expense. It is computed from stored transactions and is never stored separately. |
| BR-09 | A budget is unique per user, expense category, and month, and its amount must be greater than 0. |
| BR-10 | Only an Administrator can create, rename, or deactivate a category, or change an account's active state. A User attempting this is refused. |

## 6. Non-functional requirements (NFR)

| ID | Requirement and measurable target | Verification | Sprint |
|---|---|---|---|
| NFR-01 | An unauthenticated request to any protected endpoint is rejected (401) without returning private data. | API test over every protected route | 1 |
| NFR-02 | Passwords are stored only as salted hashes; no response ever contains a password or hash. | Test that the stored value differs from the plain password and that API responses lack the field | 1 |
| NFR-03 | A session expires 8 hours after login and is invalidated on logout. Sessions live in the database. | API test with an expired and a logged-out session | 1 |
| NFR-04 | The transaction list and the monthly summary respond in 500 ms or less (95th percentile) with 1,000 transactions for one user on a developer machine. | Timing test script | 2 |
| NFR-05 | A fresh clone can be set up, migrated, seeded, tested, and started using only the commands in the README and `.env.example`. | Run the README commands on a clean clone | 1 |
| NFR-06 | Every form field has a visible label and a visible error message; main flows work by keyboard only. | UI tests selecting fields by label; manual keyboard check | 2 |
| NFR-07 | Money is exact: the summary of 0.10 + 0.20 equals 0.30 and no value shows floating-point rounding errors. | Unit test on summary calculation | 2 |
| NFR-08 | No secret (password, session secret, connection string) is committed to Git or sent to the client; all are read from environment variables. | Repository scan and review of `.env.example` | 1 |
| NFR-09 | All screens are usable without horizontal scrolling at 375 px width. | Playwright viewport tests | 3 |

## 7. Assumptions, decisions, and open questions

| ID | Type | Statement | Status |
|---|---|---|---|
| A-01 | Assumption | All users are in the Asia/Bangkok time zone; the server decides "today". | Open to change |
| A-02 | Assumption | Demo accounts come from the seed; their passwords come from environment variables and are shared privately. | Decided |
| D-01 | Decision | The Administrator cannot see individual transactions. Money data is private, and admins only need the category list and accounts. | Decided |
| D-02 | Decision | Categories are global and managed by the Administrator; Users cannot create their own. This keeps Sprint 1 small. | Decided; revisit in Sprint 3 if time allows |
| D-03 | Decision | Amounts are stored as integer satang (1/100 THB) to avoid floating-point errors. | Decided |
| D-04 | Decision | Another user's transaction returns 404 (not 403), so its existence is not revealed. | Decided |
| D-05 | Decision | Deleting a transaction is a permanent delete after confirmation. | Decided |
| D-06 | Decision | Stack: React + TypeScript + Vite, Express + TypeScript, Prisma, PostgreSQL, Vitest and Playwright. Session cookie, session rows in PostgreSQL. | Decided |
| Q-01 | Question | Does the Sprint 1 example in `group_work_specs.docx` for this theme require something this draft omits? | Open: check before submission |
| Q-02 | Question | Should a deactivated category stay visible on old transactions? | Answered: yes (BR-02 only restricts new use) |

