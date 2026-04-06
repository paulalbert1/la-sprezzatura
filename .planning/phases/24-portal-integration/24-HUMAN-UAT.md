---
status: partial
phase: 24-portal-integration
source: [24-VERIFICATION.md]
started: 2026-04-06T16:42:00.000Z
updated: 2026-04-06T16:42:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Send Update email procurement summary
expected: Send a test email for a full-interior-design project with procurement items. The Procurement section renders with stage-count rows (e.g., "Not Yet Ordered — 2 items") in pipeline order. No prices, savings, delivery dates, or per-item detail. Stages with zero items are omitted.
result: [pending]

### 2. Portal table manufacturer/quantity sub-line
expected: Open portal for a project with manufacturer and quantity data. Each procurement item shows manufacturer below the item name in text-xs text-stone. When quantity is also present, it shows "Kravet · Qty 2" format. Items without manufacturer show no sub-line. Status badges show "Not Yet Ordered" (not "Pending").
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
