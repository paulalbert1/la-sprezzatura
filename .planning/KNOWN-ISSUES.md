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

### `ProcurementItem.status` typed as `string`, not `ProcurementStatus`

- **Problem:** After Phase 46 Plan 04 Task 1 extracted the canonical procurement palette to `src/lib/procurement/statusPills.ts` with a closed-enum `ProcurementStatus` type, the upstream `ProcurementItem.status` is still typed as a broader `string` (likely Sanity-typegen-derived). Consumers must cast at index sites — currently a `as ProcurementStatus` cast in `src/components/admin/ProcurementEditor.tsx`.
- **Why not fixed now:** Real fix is upstream (Sanity typegen or query-result type narrowing). Out of 46-04 scope (a band-aid cast satisfies tsc within 46-04). The real fix is its own track.
- **Opportunistic-fix guidance:** If a future phase tightens Sanity typegen output or refactors the GROQ result types, narrow `ProcurementItem.status` to `ProcurementStatus` from `src/lib/procurement/statusPills.ts`. Then drop the cast in `ProcurementEditor.tsx` (and `Procurement.tsx` once 46-04 Task 4 lands).
- **Surfaced by:** Phase 46 Plan 04 Task 1 deviation note (commit `162eb4a`, 2026-04-28).

---

## Recently fixed

(none yet)
