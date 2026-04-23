---
status: partial
phase: 42-trades-entity-routes-schema-and-display
source: [42-VERIFICATION.md]
started: 2026-04-23T00:45:00Z
updated: 2026-04-23T00:45:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Relationship radio group form behavior
expected: Validation error 'Select a relationship before saving' appears below the radio group; form submission is blocked. Selecting a relationship and saving creates the record.
result: [pending]

### 2. ContactCardPopover derived label and link
expected: Derived relationship label visible below name; profile link resolves to /admin/trades.
result: [pending]

### 3. Trades list Type column and search filter
expected: Per-row derived labels; search filter matches on relationship label.
result: [pending]

### 4. Detail page meta line typography and segment filtering
expected: Correct segments displayed; empty segments omitted; typography matches UI-SPEC (12.5px, 1.4 line-height, var(--color-text-mid)).
result: [pending]

### 5. WorkOrderComposeModal header derived label (gap closure verification)
expected: Header shows the correct derived label (Contractor or Vendor) based on the record's relationship field.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
