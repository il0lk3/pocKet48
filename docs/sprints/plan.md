# Three-Sprint Plan

Version 0.1 (DRAFT). Feature IDs refer to `docs/features.md`.

| Sprint | Goal | Features | Depends on | Completion outcome | Checkpoint |
|---|---|---|---|---|---|
| 1 | A small working slice with authentication, permissions, and persistence | F-01, F-02, F-03, F-04, F-05, F-06 | none | A User logs in, records an expense, and sees it in their list after a page reload and a server restart. Invalid amounts are rejected. A User cannot create categories and cannot read another User's transaction. All of it is covered by automated tests and runs from the README commands | Deliverable 1 |
| 2 | Complete the core expansion under engineering contracts | F-07, F-08, F-09, F-10, F-11, F-12 | Sprint 1 | A User can manage and filter transactions and view a monthly summary. The Administrator manages categories and accounts. Deactivated accounts cannot log in | Deliverable 2 |
| 3 | Remaining features, integration, and hardening | F-13, F-14, F-15 | Sprint 2 | Budgets with warnings, CSV export, responsive layout, final regression and documentation | Progress at the Sprint 2 date; complete by 13 Dec |

Lab 5 (Docker, CI, GCP) packages and deploys the Sprint 1 release. Later sprints reach the live system through the same pipeline.

## Why this scope for Sprint 1

- It is the smallest vertical slice with real login, two roles, a business transaction with validation, and persistence: sign in → create a transaction → read it back.
- The Administrator has a real Sprint 1 permission (create a category) so that role restrictions can be demonstrated both ways: Administrator succeeds, User is refused.
- Edit, delete, filtering, summaries, budgets, and export are deferred because each needs its own contract and tests, and none is needed to prove the slice.

## Sprint 1 demonstration scenarios

| Scenario | Role | Features | Expected result |
|---|---|---|---|
| Normal journey | User | F-01, F-02, F-03 | Log in, create an expense of 120.50 THB in "Food", reload; the transaction is listed |
| Rule rejection | User | F-02 (BR-01, BR-03) | Amount 0 or a future date is rejected with a clear message; nothing is stored |
| Forbidden operation | User | F-04, F-05 (BR-10) | Creating a category returns 403 |
| Ownership | User A, User B | F-03, F-05 (BR-04) | User A requests User B's transaction and receives 404 with no data |
| Admin privacy | Administrator | F-05 (BR-07) | Requesting any user's transactions is refused |
| Session end | User | F-01 | After logout, protected requests return 401 |

