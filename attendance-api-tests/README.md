# Youth Attendance EDUCATE API  Automated Tests

Playwright (TypeScript) API tests for `POST /api/v1/attendance`.

The suite starts a small in-memory mock of the endpoint automatically, so you
don't need a backend running to try it.

## Run it

```bash
npm install
npm test
```

To see the HTML report afterwards:

```bash
npm run test:report
```

To run the same tests against a real environment instead of the mock:

```bash
BASE_URL= https://staging.example.org npm test
```

## What's covered

| Type | Case | Expected |
|---|---|---|
| Happy path | Valid payload | 201 + `success: true` |
| Validation | Missing `mentor_id` | 400 |
| Validation | Status `"LATE"` | 400 |
| Validation | Impossible date (`2026-02-30`) | 400 |
| Validation | Malformed JSON | 400 |
| Edge case | Empty `participants` array | 400 |
| Edge case | Duplicate `participant_id` in one request | 400 |

## How it's organised

```
mock-server/server.ts        In-memory mock API with the expected validation rules
src/api/AttendanceClient.ts  API Object Model — the only place that knows the endpoint
src/data/attendanceFactory.ts  Builds a valid payload; tests override one field at a time
tests/attendance.spec.ts     The test cases
```

## Assumptions to confirm with the team

- An empty `participants` array is treated as a bad request, since there's
  nothing to record. If the team prefers a `200` no-op, the test changes in one line.
- Duplicate IDs in one request are rejected outright rather than silently de-duplicated,
  because quietly picking one of two conflicting statuses hides a real data problem.
