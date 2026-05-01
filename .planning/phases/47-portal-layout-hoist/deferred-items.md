# Phase 47 — Deferred Items

Out-of-scope discoveries logged during plan execution. Not fixed in this phase.

## src/pages/portal/client/[token].astro — inlined wordmark remains

**Discovered during:** Plan 47-05 phase-level integration check.

**Surface:** `src/pages/portal/client/[token].astro` still contains the inlined wordmark `<p class="text-xs text-stone tracking-[0.2em] uppercase font-body mb-8">` block.

**Why deferred:** Plan 03 explicitly states (line 52) that the plan "does NOT touch ... `src/pages/portal/client/*` or any other portal subroute outside the five pages listed above." This route is not enumerated in any of the 5 phase-47 plans (only `src/pages/portal/dashboard.astro`, `src/pages/portal/project/[projectId].astro`, `src/pages/portal/[token].astro`, `src/pages/portal/login.astro`, `src/pages/portal/role-select.astro` are). The PURL upgrade landing page treated by Plan 03 is `src/pages/portal/[token].astro` — a different file at a different path level.

**Impact on Phase 47 Success Criterion 1:** The phase-level grep `grep -rE 'tracking-\[0.2em\] uppercase font-body mb-8' src/pages/portal/ src/pages/workorder/ src/pages/building/` returns this single hit; not a regression of the chrome-hoist pattern, just a pre-existing route the phase did not scope. The 13 in-scope pages (5 portal + 3 workorder + 3 building + 2 verify which are server-side and skipped per CONTEXT D-6) are all clean.

**Recommended follow-up:** A small migration plan in v5.3 or v6.0 that extends the chrome-hoist pattern to `src/pages/portal/client/[token].astro`. Scope: same shape as the 47-03 portal-pages migration (add `getPortalBrand` if missing, strip inlined wordmark, decide on `bare` prop based on whether the route is authenticated). Estimated effort: ~5 min single task.
