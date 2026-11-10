# Feature Inventory

Version 0.1 (DRAFT). Requirement IDs refer to `docs/srs.md`.

| ID | Feature / responsibility | Description | Requirements | Depends on | Sprint |
|---|---|---|---|---|---|
| F-01 | Authentication and session | Login with email and password, logout, current-user retrieval, 8-hour DB-backed session, password hashing | FR-01, FR-02, FR-03, NFR-02, NFR-03 | none | 1 |
| F-02 | Record a transaction | Create an income or expense with amount, date, category, note, and server-side validation | FR-04, BR-01, BR-02, BR-03 | F-01, F-04 | 1 |
| F-03 | My transactions list | List the signed-in User's own transactions, newest first | FR-05, BR-04 | F-01, F-02 | 1 |
| F-04 | Category catalogue | Seeded categories; Administrator creates a category; any signed-in user lists active categories | FR-06, FR-07, BR-05, BR-10 | F-01 | 1 |
| F-05 | Access control and data ownership (cross-cutting) | Backend role checks, ownership checks, no private data for anonymous requests; the Administrator cannot read user transactions | NFR-01, BR-04, BR-07, BR-10 | F-01 | 1 (established), applies to all later features |
| F-06 | Delivery baseline (cross-cutting) | Environment-based configuration, `.env.example`, migrations, reproducible seed, README, design suitable for Docker and durable storage | NFR-05, NFR-08 | none | 1 (local); deployed in Lab 5 |
| F-07 | Manage a transaction | View, edit, and delete a User's own transaction | FR-08, FR-09, FR-10, BR-01, BR-02, BR-03, BR-04 | F-02, F-03 | 2 |
| F-08 | Filter transactions | Filter the list by month, type, and category | FR-11 | F-03 | 2 |
| F-09 | Monthly summary | Total income, total expense, balance, and expense per category for a month | FR-12, BR-08, NFR-04, NFR-07 | F-03 | 2 |
| F-10 | Category lifecycle | Administrator renames and deactivates a category | FR-13, BR-02, BR-05, BR-10 | F-04 | 2 |
| F-11 | Account administration | Administrator lists accounts and activates or deactivates a User | FR-14, BR-06, BR-10 | F-01 | 2 |
| F-12 | Form usability | Labelled fields, visible error messages, keyboard-operable flows | NFR-06 | F-02, F-07 | 2 |
| F-13 | Monthly budgets | Set a monthly budget per expense category and show a warning when exceeded | FR-15, BR-09 | F-09 | 3 |
| F-14 | CSV export | Export the User's own transactions as CSV | FR-16 | F-03 | 3 |
| F-15 | Responsive layout | All screens usable at 375 px | NFR-09 | all UI features | 3 |

## Coverage check

Every FR-01 to FR-16, BR-01 to BR-10, and NFR-01 to NFR-09 is covered by at least one feature or responsibility above. See `docs/traceability.md` for the requirement-to-sprint table and the coverage notes.

