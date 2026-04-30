# Phase 49 Deferred Items

## Plan 49-09 — pre-existing test failures (out of scope)

When Plan 49-09 ran the full vitest suite to verify "no regressions," the
suite reported `62 failed | 1445 passed | 1 skipped | 68 todo` BOTH before
AND after the plan's changes (verified via `git stash` + re-run). The
failure counts are byte-identical; Plan 49-09 introduced zero regressions.

The pre-existing failures span unrelated subsystems (artifactUtils, formatCurrency,
geminiClient, tenantAudit, tenantClient, several admin components, rendering/generate,
etc.) and are NOT in any files Plan 49-09 modified. Per executor SCOPE
BOUNDARY rule: "Only auto-fix issues DIRECTLY caused by the current task's
changes. Pre-existing warnings, linting errors, or failures in unrelated
files are out of scope."

These 62 failures are logged here for the next plan or a dedicated cleanup
phase to triage.
