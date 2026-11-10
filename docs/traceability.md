# Requirements Traceability

Version 0.1 (DRAFT). Sprint 1 AC and TEST IDs are created in the Sprint 1 engineering contracts (`docs/sprints/sprint-1/`). Until then the "Planned verification" column states the intended test level. Later-sprint requirements need only a feature and a sprint now.

| Requirement | Feature | Sprint | Planned verification |
|---|---|---|---|
| FR-01 | F-01 | 1 | API test (valid and invalid login); UI test |
| FR-02 | F-01 | 1 | API test (session rejected after logout) |
| FR-03 | F-01 | 1 | API test (current user, role from session) |
| FR-04 | F-02 | 1 | API + database test; UI end-to-end journey |
| FR-05 | F-03 | 1 | API + database test; UI end-to-end journey |
| FR-06 | F-04 | 1 | API test as Administrator; forbidden as User |
| FR-07 | F-04 | 1 | API test |
| FR-08 | F-07 | 2 | Later sprint |
| FR-09 | F-07 | 2 | Later sprint |
| FR-10 | F-07 | 2 | Later sprint |
| FR-11 | F-08 | 2 | Later sprint |
| FR-12 | F-09 | 2 | Later sprint |
| FR-13 | F-10 | 2 | Later sprint |
| FR-14 | F-11 | 2 | Later sprint |
| FR-15 | F-13 | 3 | Later sprint |
| FR-16 | F-14 | 3 | Later sprint |
| BR-01 | F-02 | 1 | Unit test (boundaries 0, 0.01, 9,999,999.99, 3 decimals) and API test |
| BR-02 | F-02 | 1 | API test (type mismatch, inactive category) |
| BR-03 | F-02 | 1 | Unit test with a fixed clock; API test |
| BR-04 | F-03, F-05 | 1 | API test (User A requests User B's transaction, expects 404 without data) |
| BR-05 | F-04 | 1 | API test (duplicate name differing only by case) |
| BR-06 | F-11 | 2 | Later sprint (the account has an `isActive` flag from Sprint 1) |
| BR-07 | F-05 | 1 | API test (Administrator requests a user's transactions, expects refusal) |
| BR-08 | F-09 | 2 | Later sprint |
| BR-09 | F-13 | 3 | Later sprint |
| BR-10 | F-04, F-05 | 1 | API test (User creates a category, expects 403) |
| NFR-01 | F-05 | 1 | API test over all protected routes |
| NFR-02 | F-01 | 1 | Database and API response test |
| NFR-03 | F-01 | 1 | API test (expired and logged-out sessions) |
| NFR-04 | F-09, F-03 | 2 | Later sprint (timing script) |
| NFR-05 | F-06 | 1 | Run README on a clean clone; results retained with the release commit |
| NFR-06 | F-12 | 2 | Later sprint |
| NFR-07 | F-09 | 2 | Later sprint |
| NFR-08 | F-06 | 1 | Repository scan; `.env.example` review |
| NFR-09 | F-15 | 3 | Later sprint |

## Coverage gaps and approved changes

| Item | Status |
|---|---|
| Uncovered requirements | None at baseline. |
| Approved changes | None yet. Record each change here with date, reason, and the affected IDs. |
| Partially covered in Sprint 1 | BR-06 (flag in schema only), NFR-05 and NFR-08 (local only; cloud deployment is Lab 5). |

