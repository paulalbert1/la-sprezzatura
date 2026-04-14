---
status: partial
phase: 35-dashboard-polish-global-ux-cleanup
source: [35-VERIFICATION.md]
started: 2026-04-14T12:55:00Z
updated: 2026-04-14T18:45:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. No relative-time badges in admin app
expected: Only absolute MMM d dates; Active Projects right-col shows `Since {MMM d}`; overdue banner long-form `N days overdue` preserved
result: [pending]

### 2. Upcoming Deliveries live filter
expected: Typing client name substring / tracking number / carrier narrows rows per keystroke; empty-state copy matches `No deliveries match your filter.` or `All caught up — no undelivered items.`
result: [pending]

### 3. Upcoming Deliveries `Show delivered (N)` disclosure
expected: Click reveals delivered rows, copy swaps to `Hide delivered`; reload restores default hidden state
result: passed (Playwright-verified 2026-04-14: 2 delivered rows revealed, toggle flipped to `Hide delivered`)

### 4. Active Projects card free-text filter
expected: Typing stage name (e.g., `construction`, `procurement`) or client name narrows rows per keystroke; empty-state renders `No projects match your filter.`
result: passed (Playwright-verified 2026-04-14: typed `north` → only North Shore Primary Bath remained)

### 5. Dashboard Contractor `+ Add new contractor` CTA
expected: CTA navigates to `/admin/contractors/new` and renders the new-contractor form (Name, Email, Phone, Company, Trades) with a working Create button. (Earlier SUMMARY 04 incorrectly flagged this as a deferred 404 — the dynamic route `[contractorId]/index.astro` handles `contractorId === "new"` in new-entity mode; Playwright-confirmed live 2026-04-14.)
result: passed

### 6. Quick-assign single-trade bypass
expected: Picking a contractor with exactly one trade skips the trade picker and fires toast `Assigned {name} as {Sentence-case trade}.`; multi-trade contractor still shows the trade picker.
result: [pending]

### 7. Trade pill sentence-case visual scan
expected: Contractor detail page, Quick Assign flow, and portal Contractor section all render trades in sentence case (e.g., `Electrical rough-in`, `HVAC`, `General contractor`) — no raw slugs, no ALL-CAPS.
result: [pending]

### 8. Tasks cards header Add-task + hide-completed
expected: All three cards (dashboard, project detail, client detail) show `+ Add task` header button. Completed tasks hidden by default. `Show completed (N)` link only appears when completed tasks exist and toggles to `Hide completed`; reload resets the reveal.
result: passed-dashboard-only (Playwright-verified 2026-04-14: dashboard card toggled `Show completed (4)` → `Hide completed` and revealed 4 checked tasks. Project + client surfaces still need human scan for reload-reset check.)

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
