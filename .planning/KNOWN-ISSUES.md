# Known Issues

Pre-existing problems that don't belong to the active phase but were surfaced during phase work. Logged here so successive phases don't re-discover them, and so opportunistic fixes are guided rather than ad-hoc.

**Format per entry:** location, one-line problem, why-not-fixed-now, opportunistic-fix guidance, surfaced-by.

**Discipline:** when entering a file listed below for unrelated work, take the opportunistic fix if it's small and self-contained. Otherwise leave it. Don't create a separate plan to clear the registry — issues age out as files are touched.

When an issue is fixed (opportunistically or otherwise), strike it through and add a `fixed in: <commit-sha>` line. Periodic prune of struck entries is fine.

---

## Open

### tsc strict-index error in `src/sanity/queries.ts:108`

- **Problem:** TypeScript reports a strict-index error at line 108 (cast/index narrowing not satisfied).
- **Why not fixed now:** Pre-existing before Plan 46-04; verified via git-stash check during Phase 46-04 Task 1 execution. Out of Task 1 scope.
- **Opportunistic-fix guidance:** Plan 46-04 Task 4 modifies `queries.ts` (wires SendUpdate to consume `vendor` + `spec` from the projection). If you're already in this file for 46-04 Task 4, take the fix. Otherwise leave it.
- **Surfaced by:** Phase 46 Plan 04 Task 1 (commit `cec0ee2..734b97b`, 2026-04-28).

### Three cast warnings in `src/sanity/schemas/projectWorkflow.test.ts`

- **Problem:** TypeScript flags three `as any` / unsafe casts in this test file (specific lines TBD — verify with `npx tsc --noEmit` and grep for the warnings).
- **Why not fixed now:** Pre-existing before Plan 46-04; out of any 46-04 task's scope (no 46-04 task touches `projectWorkflow.test.ts`).
- **Opportunistic-fix guidance:** No 46-04 task is expected to enter this file. Defer until a phase that legitimately touches `projectWorkflow.test.ts` (likely a future Sanity workflow plan). Leave alone otherwise.
- **Surfaced by:** Phase 46 Plan 04 Task 1 (verified pre-existing, 2026-04-28).

### WorkOrder snapshot tests fail when run on a calendar day different from snapshot recording

- **Problem:** `src/emails/workOrder/WorkOrder.tsx:27` constructs `sentDate` inline via `new Date().toLocaleDateString(...)`. Snapshot tests capture the formatted date as part of the rendered HTML; running the test suite on a different calendar day from the recording produces a date-drift diff that reads as a test failure even when nothing about the component changed. Three WorkOrder snapshot tests currently fail this way (deferred during Phase 46 Plan 04 Tasks 1–4 as out-of-scope for the SendUpdate redesign).
- **Why not fixed now:** The redesign plan (46-04) is scoped to SendUpdate; WorkOrder's date logic lives in Plan 46-01 era code and a fix would expand 46-04's surface. SendUpdate's new shape (Task 4) already has the fix applied — `sentDate?: string` is an injectable prop on `SendUpdateEmailInput`, defaulting to `formatLongDate(new Date())` only when absent.
- **Fix prescription (NOT just regenerate the snapshot — that kicks the can to the next calendar boundary):**
  1. Add `sentDate?: string` as an optional prop on `WorkOrderEmailInput` in `src/emails/workOrder/WorkOrder.tsx`. Default to `new Date().toLocaleDateString("en-US", {...})` only when the prop is absent. (Pattern mirrored from `SendUpdateEmailInput.sentDate` in `src/emails/sendUpdate/SendUpdate.tsx`.)
  2. Update `src/emails/workOrder/fixtures.ts` to pass an explicit `sentDate: "April 27, 2026"` (or whatever string the snapshot was recorded with) on every fixture. This pins snapshots to a fixed date.
  3. Production call sites in `src/pages/api/admin/work-orders/[id]/send.ts` continue to omit the prop and get current-day behavior — no API change.
  4. Regenerate the three drifted snapshots one final time after the prop is wired.
- **Alternative (rejected):** `vi.useFakeTimers().setSystemTime(...)` in the test file. Works but couples test stability to test framework state rather than to a documented component contract. The prop approach is cleaner because the date becomes a documented part of the component's input shape, useful beyond snapshot stability (e.g., back-dated test sends, deterministic preview rendering).
- **Opportunistic-fix guidance:** If a future plan touches `WorkOrder.tsx` for any reason (Plan 46-03 cutover may; future tenant work might), apply the prop injection in the same change. Otherwise it's a small standalone plan — half a day of work including the snapshot regeneration.
- **Surfaced by:** Phase 46 Plan 04 Task 4 (commit `c96657e` SUMMARY noted 8/11 WorkOrder tests pass; 3 pre-existing date-drift failures, 2026-04-28).

### Two untracked files at repo root: `src/sanity/components/` and `vercel.json`

- **Problem:** `git status` shows two untracked entries that have appeared in two consecutive Phase 46-04 task summaries' "pre-existing, out of scope" disclosures.
- **Why not fixed now:** Out of every 46-04 task's scope. Verified pre-existing via `git stash` discipline by the Task 1 executor (no file modifications by Task 1 or Task 2 caused them to appear).
- **Opportunistic-fix guidance:** If you have signal on whether `src/sanity/components/` is real in-progress work or stale scaffolding, decide and either commit or delete. Same for `vercel.json` — Vercel deploy config typically belongs in the repo, but it's untracked here, suggesting it was generated locally and never committed; verify whether it should be tracked or `.gitignore`d. Neither is blocking.
- **Surfaced by:** Phase 46 Plan 04 Task 1 + Task 2 (logged here per user's "stop disclosing per-task once flagged twice" rule, 2026-04-28).

### `ProcurementItem.status` typed as `string`, not `ProcurementStatus`

- **Problem:** After Phase 46 Plan 04 Task 1 extracted the canonical procurement palette to `src/lib/procurement/statusPills.ts` with a closed-enum `ProcurementStatus` type, the upstream `ProcurementItem.status` is still typed as a broader `string` (likely Sanity-typegen-derived). Consumers must cast at index sites — currently a `as ProcurementStatus` cast in `src/components/admin/ProcurementEditor.tsx`.
- **Why not fixed now:** Real fix is upstream (Sanity typegen or query-result type narrowing). Out of 46-04 scope (a band-aid cast satisfies tsc within 46-04). The real fix is its own track.
- **Opportunistic-fix guidance:** If a future phase tightens Sanity typegen output or refactors the GROQ result types, narrow `ProcurementItem.status` to `ProcurementStatus` from `src/lib/procurement/statusPills.ts`. Then drop the cast in `ProcurementEditor.tsx` (and `Procurement.tsx` once 46-04 Task 4 lands).
- **Surfaced by:** Phase 46 Plan 04 Task 1 deviation note (commit `162eb4a`, 2026-04-28).

---

## Recently fixed

(none yet)
