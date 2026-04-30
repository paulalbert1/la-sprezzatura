---
phase: 49
plan: 02
subsystem: sanity-schema
tags: [sanity-schema, audit, impersonation, foundations, IMPER-06]
requirements: [IMPER-06]
dependency_graph:
  requires:
    - "Sanity Studio schemaTypes substrate (existing src/sanity/schemas/index.ts)"
  provides:
    - "Sanity document type 'impersonationAudit' for downstream Plan 03 audit writers"
    - "Schema registration so getTenantClient resolves the new doc type"
    - "Closed-enum validation for eventType / targetRole / exitReason"
  affects:
    - "src/sanity/schemas/index.ts (one new import + array entry)"
tech_stack:
  added: []
  patterns:
    - "defineType + defineField (Sanity v3 schema authoring) — same as workOrder/client schemas"
    - "Closed-enum via type:'string' + options.list (mirrors projectWorkflow.ts status field)"
    - "Header comment cites D-decisions (workOrder.ts pattern)"
key_files:
  created:
    - "src/sanity/schemas/impersonationAudit.ts"
    - "src/sanity/schemas/impersonationAudit.test.ts"
  modified:
    - "src/sanity/schemas/index.ts (+1 import, +1 array entry)"
decisions:
  - "Schema fields match D-17 verbatim (13 fields, 9 required, 3 closed enums)"
  - "sessionId modeled as string and explicitly documented as a SHA-256 hash, not the raw token (D-17)"
  - "exitedAt + exitReason are optional/nullable so 'start' docs can omit them (D-17)"
  - "D-18 timeout-doc-deletion compromise documented in the schema header comment"
  - "Vision-friendly preview wired (adminEmail / eventType / targetEntityName) for Liz's audit-log read interface"
metrics:
  duration: "~6 min"
  completed_date: "2026-04-30"
  tasks_completed: 2
  files_changed: 3
---

# Phase 49 Plan 02: Impersonation Audit Sanity Schema Summary

**One-liner:** New `impersonationAudit` Sanity document type with 13 fields, 9 required validations, and 3 closed enums — the schema substrate that Plan 03's audit writers and Plan 09's IMPER-06 CI tests depend on.

## What Shipped

A single-file Sanity schema, its test suite, and a one-line registration in the schema index.

- **`src/sanity/schemas/impersonationAudit.ts`** — `defineType` with the D-17 field shape verbatim:
  - 9 required fields: `tenantId`, `sessionId`, `eventType`, `adminEmail`, `adminEntityId`, `targetRole`, `targetEntityId`, `projectId`, `mintedAt`
  - 4 optional fields: `targetEntityName`, `projectName`, `exitedAt`, `exitReason`
  - 3 closed enums: `eventType` ∈ {start, exit, timeout}; `targetRole` ∈ {client, contractor, building_manager}; `exitReason` ∈ {manual, ttl, admin-logout}
  - Header comment cites both `49-CONTEXT.md D-17` (schema shape) and `49-CONTEXT.md D-18` (timeout-doc-deletion compromise)
  - Vision-friendly preview block (`adminEmail` / `eventType` / `targetEntityName`)
- **`src/sanity/schemas/impersonationAudit.test.ts`** — 7 vitest assertions covering shape, required-validation presence, closed-enum membership, and a string check on the source file confirming the D-18 trade-off is documented.
- **`src/sanity/schemas/index.ts`** — added `impersonationAudit` import + array entry, slotted alphabetically between `designOption` and `project`.

## Decisions Made

- **Schema fields ARE D-17 verbatim.** No deviation. The 13 fields and their nullability match the CONTEXT block character-for-character. The closed-enum lists match D-17's union types exactly.
- **`sessionId` modeled as a plain string** (not a separate hashed-token type) — Sanity has no opaque-string primitive. The header comment + Plan 03's `hashImpersonationToken` writer enforce the SHA-256 invariant at the trust boundary.
- **`exitedAt` and `exitReason` are optional, not required.** D-17 says "null on start docs" — Sanity treats absence-of-validation as "may be omitted," which is the correct shape for start docs that have no exit info yet.
- **D-18 trade-off documented in the schema header.** Per CONTEXT directive "Document this in the schema header comment." Test 7 asserts the substring `D-18` is present in the source file.

## Verification Results

| Gate | Command | Result |
|------|---------|--------|
| 7 schema unit tests | `npm run test -- --run src/sanity/schemas/impersonationAudit.test.ts` | 7/7 pass |
| Full schema test suite (regression) | `npm run test -- --run src/sanity/schemas/` | 133/133 pass (11 files) |
| Schema registered | `grep -c 'impersonationAudit' src/sanity/schemas/index.ts` | 2 (import + array entry) ✓ |
| D-18 documented in source | `grep -c 'D-18' src/sanity/schemas/impersonationAudit.ts` | 2 (≥1 required) ✓ |
| Required-field count | `grep -c 'r.required()' src/sanity/schemas/impersonationAudit.ts` | 9 (= D-17 required count) ✓ |
| Closed-enum eventType present | `grep -E "'(start\|exit\|timeout)'" src/sanity/schemas/impersonationAudit.ts \| wc -l` | 4 (≥3 required) ✓ |
| Closed-enum targetRole present | `grep -E "'(client\|contractor\|building_manager)'" src/sanity/schemas/impersonationAudit.ts \| wc -l` | 4 (≥3 required) ✓ |
| TypeScript (scoped) | `npx tsc --noEmit 2>&1 \| grep -E "impersonationAudit\|schemas/index"` | no errors ✓ |

### Note on the typecheck gate

The plan invokes `npm run typecheck`, but this repo has no `typecheck` script — the closest gate is `npx tsc --noEmit`. Running it surfaces a wide set of **pre-existing** type errors unrelated to plan 49-02 (engine.ts, close-document.ts, sanity/image.ts, sanity/queries.ts, projectWorkflow.test.ts, etc.). Per the executor SCOPE BOUNDARY rule, these are out of scope for this plan and were not introduced by these changes. A scoped check filtering the diff (`grep -E "impersonationAudit|schemas/index"`) returns zero errors. Logged here as informational; not a deviation requiring a fix.

## Deviations from Plan

**None — plan executed exactly as written, with one tooling clarification.**

Tooling clarification: the plan's `npm run typecheck` gate was satisfied by `npx tsc --noEmit` scoped to the plan's modified files (no errors). The `typecheck` script does not exist in this repo's `package.json`. This is a documentation gap, not a code deviation — no schema fields, validations, or registration order changed from what the plan specified.

## Commits

| Task | Type | Hash | Message |
|------|------|------|---------|
| 1 (RED) | test | `4169c68` | test(49-02): add failing tests for impersonationAudit schema |
| 1 (GREEN) | feat | `64c8e10` | feat(49-02): add impersonationAudit Sanity schema (D-17 verbatim) |
| 2 | feat | `e85c1cc` | feat(49-02): register impersonationAudit in schemaTypes |

## TDD Gate Compliance

Plan 49-02's Task 1 used TDD per `tdd="true"`:
- **RED** (`4169c68`) — 7 tests added; vitest run confirmed import-resolution failure (the schema file did not yet exist).
- **GREEN** (`64c8e10`) — schema implemented; 7/7 tests pass.
- **REFACTOR** — none needed; the GREEN implementation is the natural shape and required no cleanup.

Task 2 is a one-line schema-index registration; no new test file was created (per plan instructions — the typecheck/grep gates are sufficient and the existing 133-test schema suite still passes).

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries beyond what the threat register already covers (T-49-04). Tenant scoping for the new doc type continues to be enforced via `getTenantClient` dataset routing — Plan 03 owns the write-time tenant binding and SHA-256 sessionId enforcement.

## Known Stubs

None. The schema is the substrate; downstream plans (03, 06, 09) wire writers and tests against it.

## Self-Check: PASSED

- Files exist:
  - `src/sanity/schemas/impersonationAudit.ts` ✓
  - `src/sanity/schemas/impersonationAudit.test.ts` ✓
  - `src/sanity/schemas/index.ts` (modified) ✓
- Commits exist:
  - `4169c68` ✓
  - `64c8e10` ✓
  - `e85c1cc` ✓

## Handoff Notes for Plan 03

- Import the schema directly from `src/sanity/schemas/impersonationAudit.ts` if you need its name constant; or reference by string `_type: 'impersonationAudit'` (the writers in Plan 03 use the latter per CONTEXT pattern).
- All 9 required fields will throw client-side validation if omitted at create time. Plan 03's `writeStartAndTimeoutAuditDocs` and `writeExitAuditDoc` MUST populate them.
- `sessionId` is a plain `string` field — Plan 03's `hashImpersonationToken` is the authoritative producer. Never write the raw token.
- `exitedAt` / `exitReason` are nullable — pass `null` (or omit) on `start` docs; populate on `exit` and `timeout` docs.
- The Vision preview surfaces `adminEmail` as title and `eventType` as subtitle, so Plan 03 should populate `targetEntityName` and `projectName` (denormalized, optional) for log readability — Liz reads via Vision per CONTEXT specifics §1.
