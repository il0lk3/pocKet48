# Requirements Traceability

Version 1.0 (BASELINE). Sprint 1 AC and TEST IDs refer directly to `docs/sprints/sprint-1/contracts.md`. Later-sprint requirements have feature and sprint allocation; their detailed AC/TEST IDs will be established at their respective sprint starts.

| Requirement | Feature | Sprint | Planned Verification / Evidence |
|---|---|:---:|---|
| FR-01 | F-01 | 1 | Sprint 1; AC-01-01, AC-01-02 / TEST-01, TEST-02 (API & UI tests) |
| FR-02 | F-01 | 1 | Sprint 1; AC-01-03 / TEST-03 (API test: session invalidation) |
| FR-03 | F-01 | 1 | Sprint 1; AC-01-04 / TEST-14 (API test: current user & DB role integrity) |
| FR-04 | F-02 | 1 | Sprint 1; AC-02-01 / TEST-04, TEST-13 (API + DB test; UI journey) |
| FR-05 | F-03 | 1 | Sprint 1; AC-03-01, AC-03-02 / TEST-08, TEST-15 (API + DB test) |
| FR-06 | F-04 | 1 | Sprint 1; AC-04-01 / TEST-16 (API test: Administrator creates category) |
| FR-07 | F-04 | 1 | Sprint 1; AC-04-04 / TEST-19 (API test: list active categories) |
| FR-08 | F-07 | 2 | Sprint 2 (deferred) |
| FR-09 | F-07 | 2 | Sprint 2 (deferred) |
| FR-10 | F-07 | 2 | Sprint 2 (deferred) |
| FR-11 | F-08 | 2 | Sprint 2 (deferred) |
| FR-12 | F-09 | 2 | Sprint 2 (deferred) |
| FR-13 | F-10 | 2 | Sprint 2 (deferred) |
| FR-14 | F-11 | 2 | Sprint 2 (deferred) |
| FR-15 | F-13 | 3 | Sprint 3 (deferred) |
| FR-16 | F-14 | 3 | Sprint 3 (deferred) |
| BR-01 | F-02 | 1 | Sprint 1; AC-02-02 / TEST-05 (Unit boundaries 0, 0.01, 9999999.99, 3 decimals & API) |
| BR-02 | F-02 | 1 | Sprint 1; AC-02-03 / TEST-06 (API test: type mismatch rejection) |
| BR-03 | F-02 | 1 | Sprint 1; AC-02-04 / TEST-07 (Unit test: future date rejection with fixed clock) |
| BR-04 | F-03, F-05 | 1 | Sprint 1; AC-05-02 / TEST-09 (API test: User A requests User B item, expects 404) |
| BR-05 | F-04 | 1 | Sprint 1; AC-04-02 / TEST-12 (API test: duplicate name case-insensitive) |
| BR-06 | F-11 | 2 | Sprint 2 (the account has an `isActive` flag in schema from Sprint 1) |
| BR-07 | F-05 | 1 | Sprint 1; AC-05-03 / TEST-11 (API test: Admin requests user transactions $\to$ 403) |
| BR-08 | F-09 | 2 | Sprint 2 (deferred) |
| BR-09 | F-13 | 3 | Sprint 3 (deferred) |
| BR-10 | F-04, F-05 | 1 | Sprint 1; AC-04-03 / TEST-10 (API test: User creates category $\to$ 403) |
| NFR-01 | F-05 | 1 | Sprint 1; AC-05-01 / TEST-17 (API test over all protected routes $\to$ 401) |
| NFR-02 | F-01 | 1 | Sprint 1; AC-01-01 / TEST-01 (DB and API test: salted hash storage) |
| NFR-03 | F-01 | 1 | Sprint 1; AC-01-03 / TEST-03 (API test: 8-hr DB session & logout) |
| NFR-04 | F-09, F-03 | 2 | Sprint 2 (deferred) |
| NFR-05 | F-06 | 1 | Sprint 1; AC-06-01 / TEST-13 (Clean clone setup and local verification) |
| NFR-06 | F-12 | 2 | Sprint 2 (deferred) |
| NFR-07 | F-09 | 2 | Sprint 2 (deferred) |
| NFR-08 | F-06 | 1 | Sprint 1; AC-06-02 / TEST-18 (Repository security scan & `.env.example` review) |
| NFR-09 | F-15 | 3 | Sprint 3 (deferred) |

## Coverage gaps and approved changes

| Item | Status |
|---|---|
| Uncovered requirements | None at baseline. All 16 FRs, 10 BRs, and 9 NFRs are assigned to features and sprints. |
| Approved changes | Baseline finalized via Issue #3 review. |
| Partially covered in Sprint 1 | BR-06 (flag in schema only), NFR-05 and NFR-08 (local verification; cloud deployment is Lab 5). |
