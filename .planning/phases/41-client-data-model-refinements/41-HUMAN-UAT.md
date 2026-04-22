---
status: partial
phase: 41-client-data-model-refinements
source: [41-VERIFICATION.md]
started: 2026-04-22T15:38:00Z
updated: 2026-04-22T15:38:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Address round-trip (CLNT-11)
expected: Navigate to a client detail page (/admin/clients/{id}). Edit all four address fields (street, city, state, zip). Save. Reload the page. All four fields should retain the saved values.
result: [pending]

### 2. Address column renders real data (CLNT-12)
expected: Navigate to /admin/clients. Clients with a city and/or state should show "City, ST" in the Address column. Clients with no address show "—".
result: [pending]

### 3. Address sort (CLNT-12)
expected: Click the Address column header on /admin/clients. List re-orders by city ascending. Click again — descending.
result: [pending]

### 4. City search filter (CLNT-12)
expected: Type a city name (e.g. "Darien") into the search box on /admin/clients. List filters to show only clients whose city or state contains the search term.
result: [pending]

### 5. Phone format display (CLNT-10)
expected: On /admin/clients and /admin/contractors, 10-digit phone cells render as (NNN) NNN-NNNN. Open a ContactCardPopover — phone link text is formatted; the tel: href uses raw digits.
result: [pending]

### 6. preferredContact absent from UI (CLNT-13)
expected: Open a client detail form — no "Preferred Contact" select is visible. Open a ContactCard hover — no "Prefers:" line appears.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
