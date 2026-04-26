---
phase: 45-email-foundations
plan: snapshot-harness
type: execute
wave: 2
depends_on: [foundation, react-email-scaffold]
files_modified:
  - src/lib/sendUpdate/emailTemplate.test.ts
  - src/lib/sendUpdate/__snapshots__/emailTemplate.test.ts.snap
  - src/lib/workOrder/emailTemplate.test.ts
  - src/lib/workOrder/__snapshots__/emailTemplate.test.ts.snap
  - playwright.config.ts
  - tests/email-snapshots/scaffold.spec.ts
  - tests/email-snapshots/__snapshots__/scaffold.spec.ts-snapshots
autonomous: true
requirements: [EMAIL-09]

must_haves:
  truths:
    - "Send Update has at least 5 golden HTML snapshots (1 baseline + 4 section-toggle permutations) — captured BEFORE Phase 46 touches the template (regression baseline)."
    - "Work Order has at least 2 golden HTML snapshots (baseline + 1 permutation) — captured BEFORE Phase 46 touches the template."
    - "`playwright.config.ts` exists at repo root with chromium-only project, `testDir: \"tests/email-snapshots\"`, deterministic locale + timezone."
    - "`tests/email-snapshots/scaffold.spec.ts` renders `<Scaffold />` at three viewport widths (640 / 600 / 580) and pins each via `toHaveScreenshot()`."
    - "`npm run test:visual` exits 0 (Playwright snapshots green) on a clean run."
    - "`npm run test:visual:update` regenerates baselines on demand (documented usage)."
  artifacts:
    - path: src/lib/sendUpdate/emailTemplate.test.ts
      provides: "5+ snapshot permutations (baseline + no-procurement + no-artifacts + no-milestones + no-personal-note)."
      contains: "toMatchSnapshot"
    - path: src/lib/sendUpdate/__snapshots__/emailTemplate.test.ts.snap
      provides: "Existing 1 snap + 4 new permutation snaps."
      contains: "exports[`buildSendUpdateEmail"
    - path: src/lib/workOrder/emailTemplate.test.ts
      provides: "2+ snapshot tests added inside the existing describe block."
      contains: "toMatchSnapshot"
    - path: src/lib/workOrder/__snapshots__/emailTemplate.test.ts.snap
      provides: "New snapshot file with golden Work Order baseline + 1 permutation."
      contains: "exports[`buildWorkOrderEmail"
    - path: playwright.config.ts
      provides: "Repo-root Playwright config: chromium project, deterministic locale/timezone, snapshot tolerance."
      contains: "defineConfig"
    - path: tests/email-snapshots/scaffold.spec.ts
      provides: "First Playwright spec: render Scaffold at 3 viewports and snapshot."
      contains: "toHaveScreenshot"
  key_links:
    - from: tests/email-snapshots/scaffold.spec.ts
      to: src/emails/__scaffold.tsx
      via: "import { Scaffold }; await render(<Scaffold/>); page.setContent(html)"
      pattern: 'from "../../src/emails/__scaffold"'
    - from: src/lib/sendUpdate/emailTemplate.test.ts
      to: src/lib/sendUpdate/emailTemplate.ts
      via: "buildSendUpdateEmail(fixtureInput(...)) → toMatchSnapshot()"
      pattern: "buildSendUpdateEmail"
    - from: src/lib/workOrder/emailTemplate.test.ts
      to: src/lib/workOrder/emailTemplate.ts
      via: "buildWorkOrderEmail(baseInput(...)) → toMatchSnapshot()"
      pattern: "buildWorkOrderEmail"
---

<objective>
Establish EMAIL-09's regression-baseline harness on two tracks:

1. **Vitest golden HTML snapshots** for the legacy `buildSendUpdateEmail` and `buildWorkOrderEmail` outputs. These must be captured BEFORE Phase 46 touches either template — they are the "this is what the legacy output looked like" frozen baseline that Phase 46's react-email migration is verified against.
2. **Playwright visual snapshot harness** at repo root. Configures the runner, writes the first spec against `<Scaffold />` at three viewport widths approximating Gmail web / Apple Mail / web Outlook (640 / 600 / 580). Phase 46 templates plug into this same harness.

Purpose: EMAIL-09's merge gate. Drift in `emailTemplate.ts` (Phase 46) or in the tokens flowing through `<Tailwind>` will fail loud-fast on the next CI run.

Output: 4-5 new Vitest snaps for Send Update, 2 new Vitest snaps for Work Order (new `__snapshots__/` directory), `playwright.config.ts`, the first Playwright spec, and committed PNG baselines.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/45-email-foundations/45-CONTEXT.md
@.planning/phases/45-email-foundations/45-RESEARCH.md
@.planning/phases/45-email-foundations/45-PATTERNS.md
@.planning/phases/45-email-foundations/45-VALIDATION.md
@./CLAUDE.md
@src/lib/sendUpdate/emailTemplate.ts
@src/lib/sendUpdate/emailTemplate.test.ts
@src/lib/sendUpdate/__snapshots__/emailTemplate.test.ts.snap
@src/lib/workOrder/emailTemplate.ts
@src/lib/workOrder/emailTemplate.test.ts
@src/emails/__scaffold.tsx
@vitest.config.ts

<interfaces>
<!-- Existing fixtureInput shape in src/lib/sendUpdate/emailTemplate.test.ts (lines 13-61). DO NOT change it. -->

```typescript
function fixtureInput(overrides: Partial<SendUpdateEmailInput> = {}): SendUpdateEmailInput {
  const project = fixtureProject();
  return {
    project,
    personalNote: "",
    showMilestones: true,
    showProcurement: true,
    showArtifacts: true,
    pendingArtifacts: fixturePendingArtifacts(),
    baseUrl: "https://lasprezz.com",
    ctaHref: "https://lasprezz.com/portal/dashboard",
    ...overrides,
  };
}
```

<!-- Existing baseInput shape in src/lib/workOrder/emailTemplate.test.ts (lines 13-22). DO NOT change it. -->

```typescript
function baseInput(overrides: Partial<WorkOrderEmailInput> = {}): WorkOrderEmailInput {
  return {
    project: { _id: "P1", title: "Acme Home" },
    contractor: { _id: "C1", name: "Marco DeLuca", email: "marco@deluca.com" },
    workOrderId: "WO1",
    baseUrl: "https://example.com",
    fromDisplayName: "Liz Albert",
    ...overrides,
  };
}
```

<!-- Required playwright.config.ts shape -->
```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/email-snapshots",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  use: {
    locale: "en-US",
    timezoneId: "America/New_York",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
```

<!-- Reference Playwright spec body — RESEARCH lines 405-435 -->
```typescript
import { test, expect } from "@playwright/test";
import { render } from "@react-email/render";
import { Scaffold } from "../../src/emails/__scaffold";

const VIEWPORTS = [
  { name: "gmail", width: 640, height: 1024 },
  { name: "apple", width: 600, height: 1024 },
  { name: "owa",   width: 580, height: 1024 },
];

for (const vp of VIEWPORTS) {
  test(`scaffold renders deterministically -- ${vp.name} (${vp.width}px)`, async ({ page }) => {
    const html = await render(<Scaffold />);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`scaffold-${vp.name}-${vp.width}.png`, {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
    });
  });
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add Send Update permutation snapshots + Work Order baseline snapshots (Vitest)</name>
  <files>src/lib/sendUpdate/emailTemplate.test.ts, src/lib/sendUpdate/__snapshots__/emailTemplate.test.ts.snap, src/lib/workOrder/emailTemplate.test.ts, src/lib/workOrder/__snapshots__/emailTemplate.test.ts.snap</files>
  <read_first>
    - src/lib/sendUpdate/emailTemplate.test.ts (full file — preserve all 11 existing tests; the existing snapshot pattern at lines 159-165 is the analog)
    - src/lib/sendUpdate/__snapshots__/emailTemplate.test.ts.snap (existing snap shape)
    - src/lib/workOrder/emailTemplate.test.ts (full file — preserve all existing tests; this file currently has NO snapshot test)
    - src/lib/sendUpdate/emailTemplate.ts (full file — needed to map fixture overrides to actual sections rendered)
    - .planning/phases/45-email-foundations/45-CONTEXT.md (D-11: targeted ~6-10 fixtures total; D-12: snap files in `__snapshots__/`)
    - .planning/phases/45-email-foundations/45-PATTERNS.md "src/lib/sendUpdate/emailTemplate.test.ts" + "src/lib/workOrder/emailTemplate.test.ts" sections
  </read_first>
  <behavior>
    - The existing 11 tests in `src/lib/sendUpdate/emailTemplate.test.ts` continue to pass unchanged.
    - 4 new `it("snapshot: ...")` cases land inside the existing `describe(...)` block, each calling `expect(html).toMatchSnapshot()` against a section-toggle override.
    - The existing `it("matches existing send-update.ts snapshot when called with the fixture input")` baseline snapshot still passes (it must NOT be invalidated by the new tests).
    - For Work Order: a new `__snapshots__/emailTemplate.test.ts.snap` file is created on first run; it contains a baseline `buildWorkOrderEmail(baseInput())` snap and one permutation snap (longer escaped title).
    - `npx vitest run src/lib/sendUpdate src/lib/workOrder` exits 0 with the snap counts above.
  </behavior>
  <action>
    Step 1 — Open `src/lib/sendUpdate/emailTemplate.test.ts`. APPEND four new `it()` blocks INSIDE the existing top-level `describe("buildSendUpdateEmail (Phase 34 Plan 04)", () => { ... })` block (or whatever the existing describe label is — preserve verbatim), placed AFTER the existing `it("matches existing send-update.ts snapshot ...")` at lines 159-165.

    Each new test exercises one section toggle (D-11 targeted permutations):

    ```typescript
    it("snapshot: renders without procurement section (showProcurement: false)", () => {
      const html = buildSendUpdateEmail(fixtureInput({ showProcurement: false }));
      expect(html).toMatchSnapshot();
    });

    it("snapshot: renders without artifacts section (showArtifacts: false, pendingArtifacts: [])", () => {
      const html = buildSendUpdateEmail(fixtureInput({ showArtifacts: false, pendingArtifacts: [] }));
      expect(html).toMatchSnapshot();
    });

    it("snapshot: renders without milestones section (showMilestones: false)", () => {
      const html = buildSendUpdateEmail(fixtureInput({ showMilestones: false }));
      expect(html).toMatchSnapshot();
    });

    it("snapshot: renders with non-empty personalNote", () => {
      // The default fixture has personalNote: "". This permutation captures the
      // alternate code path where the personal note section IS rendered.
      const html = buildSendUpdateEmail(fixtureInput({ personalNote: "Loving the new fabric samples." }));
      expect(html).toMatchSnapshot();
    });
    ```

    The existing baseline snapshot test (line 159) is the 5th snapshot, satisfying the must_have "at least 5 golden HTML snapshots".

    Step 2 — Run `npx vitest run src/lib/sendUpdate/emailTemplate.test.ts -u` ONCE to write the new snapshot entries to the existing `.snap` file. (`-u` writes new snaps without flagging them as missing; it only updates obsolete ones if no new test was added — for net-new cases like these, it's the standard write step.) Inspect the diff in `src/lib/sendUpdate/__snapshots__/emailTemplate.test.ts.snap` — it should contain 4 NEW `exports[...]` entries plus the original 1.

    Step 3 — Re-run `npx vitest run src/lib/sendUpdate/emailTemplate.test.ts` (no `-u`) to confirm green.

    Step 4 — Open `src/lib/workOrder/emailTemplate.test.ts`. Append two new `it()` blocks INSIDE the existing `describe("buildWorkOrderEmail", () => { ... })`. Place AFTER the last existing `it()`:

    ```typescript
    it("snapshot: legacy buildWorkOrderEmail output for the canonical baseInput", () => {
      // Captured in Phase 45 BEFORE Phase 46 migrates this template to react-email.
      // This snapshot freezes the current Phase-39 string-builder output as the
      // regression baseline.
      const html = buildWorkOrderEmail(baseInput());
      expect(html).toMatchSnapshot();
    });

    it("snapshot: legacy buildWorkOrderEmail output with HTML-escaped project title", () => {
      // Exercises the same escapeHtml() code path the existing line-37-43 test asserts.
      // Distinct fixture so a regression in escape handling fails this snap, not just
      // the toContain check.
      const html = buildWorkOrderEmail(
        baseInput({ project: { _id: "P1", title: "<script>alert(1)</script>" } }),
      );
      expect(html).toMatchSnapshot();
    });
    ```

    Step 5 — Run `npx vitest run src/lib/workOrder/emailTemplate.test.ts -u` once. This creates `src/lib/workOrder/__snapshots__/` (new directory) and writes `emailTemplate.test.ts.snap` with the two new `exports[...]` entries.

    Step 6 — Re-run `npx vitest run src/lib/workOrder/emailTemplate.test.ts` (no `-u`) to confirm green.

    Step 7 — Final smoke: `npx vitest run src/lib/sendUpdate src/lib/workOrder src/emails` exits 0 across all three (this matches the `test:email` npm script wired in 45-PLAN-foundation).

    Important: DO NOT touch `src/lib/sendUpdate/emailTemplate.ts` or `src/lib/workOrder/emailTemplate.ts` source files (D-13). Phase 46 is the only place those files change.
  </action>
  <verify>
    <automated>npx vitest run src/lib/sendUpdate src/lib/workOrder --reporter=basic && grep -c "^exports\\[\`buildSendUpdateEmail" src/lib/sendUpdate/__snapshots__/emailTemplate.test.ts.snap | awk '$1>=5{print "OK send-update";exit 0}{print "FAIL send-update count="$1;exit 1}' && grep -c "^exports\\[\`buildWorkOrderEmail" src/lib/workOrder/__snapshots__/emailTemplate.test.ts.snap | awk '$1>=2{print "OK work-order";exit 0}{print "FAIL work-order count="$1;exit 1}'</automated>
  </verify>
  <acceptance_criteria>
    - `test -f src/lib/workOrder/__snapshots__/emailTemplate.test.ts.snap` exits 0 (new file created).
    - `grep -c "^exports\\[\`buildSendUpdateEmail" src/lib/sendUpdate/__snapshots__/emailTemplate.test.ts.snap` returns at least 5 (1 existing + 4 new).
    - `grep -c "^exports\\[\`buildWorkOrderEmail" src/lib/workOrder/__snapshots__/emailTemplate.test.ts.snap` returns at least 2.
    - `grep -c "snapshot: renders without procurement section" src/lib/sendUpdate/emailTemplate.test.ts` returns 1.
    - `grep -c "snapshot: renders without artifacts section" src/lib/sendUpdate/emailTemplate.test.ts` returns 1.
    - `grep -c "snapshot: renders without milestones section" src/lib/sendUpdate/emailTemplate.test.ts` returns 1.
    - `grep -c "snapshot: renders with non-empty personalNote" src/lib/sendUpdate/emailTemplate.test.ts` returns 1.
    - `grep -c "snapshot: legacy buildWorkOrderEmail" src/lib/workOrder/emailTemplate.test.ts` returns at least 2.
    - `git diff --stat src/lib/sendUpdate/emailTemplate.ts src/lib/workOrder/emailTemplate.ts` returns empty (NO source changes — D-13 untouched).
    - `npx vitest run src/lib/sendUpdate src/lib/workOrder --reporter=basic` exits 0.
    - Re-running the same command a second time still exits 0 with no "obsolete" or "new" snapshot warnings (snapshots are stable).
  </acceptance_criteria>
  <done>Send Update has at least 5 golden snaps, Work Order has at least 2, both `__snapshots__/*.snap` files are committed, and the underlying `emailTemplate.ts` source files were not touched (D-13 boundary respected).</done>
</task>

<task type="auto">
  <name>Task 2: Create playwright.config.ts and tests/email-snapshots/scaffold.spec.ts; commit baseline PNGs</name>
  <files>playwright.config.ts, tests/email-snapshots/scaffold.spec.ts, tests/email-snapshots/__snapshots__/scaffold.spec.ts-snapshots</files>
  <read_first>
    - vitest.config.ts (analog from PATTERNS.md "playwright.config.ts" — same defineConfig + ESM TS shape)
    - .planning/phases/45-email-foundations/45-RESEARCH.md "Pattern 3: Playwright snapshot harness" (lines 398-459 — full reference body)
    - .planning/phases/45-email-foundations/45-RESEARCH.md "Pitfall 5: Playwright font flicker" (lines 622-630 — `document.fonts.ready` mitigation)
    - .planning/phases/45-email-foundations/45-PATTERNS.md "playwright.config.ts" + "tests/email-snapshots/scaffold.spec.ts" sections
    - src/emails/__scaffold.tsx (component being snapped)
  </read_first>
  <action>
    Step 1 — Create `playwright.config.ts` at the repo root with the EXACT shape from the interfaces block. Header comment:

    ```typescript
    // playwright.config.ts
    // Phase 45 -- Playwright runner for the email visual-snapshot harness.
    //
    // Used by `npm run test:visual` (alias for `playwright test`) and
    // `npm run test:visual:update` (regenerates baselines).
    //
    // - Single chromium project (Gmail web / Apple Mail / web Outlook are all
    //   Chromium-equivalent for table-based HTML; Outlook desktop is procedural
    //   per CONTEXT D-10, not in this harness).
    // - Deterministic locale + timezone so date/number formatting in templates
    //   is stable across machines.
    // - Tolerance: 0.01 maxDiffPixelRatio (RESEARCH cited React Emails Pro pattern).
    ```

    Then `defineConfig({ ... })` body verbatim from the interfaces block.

    Step 2 — Create `tests/email-snapshots/scaffold.spec.ts` per the interfaces block. Header:

    ```typescript
    // tests/email-snapshots/scaffold.spec.ts
    // Phase 45 -- first Playwright spec; renders <Scaffold /> at three viewport widths
    // (Gmail web 640px, Apple Mail 600px, web Outlook 580px per RESEARCH).
    // Phase 46 templates land alongside this spec.
    //
    // Pitfall 5 (RESEARCH.md): always wait for document.fonts.ready before
    // toHaveScreenshot to prevent font-flicker pixel-diff flakiness.
    ```

    Then the spec body verbatim. Use `setContent(html, { waitUntil: "networkidle" })` then `await page.evaluate(() => document.fonts.ready)` then `toHaveScreenshot(...)` — exact ordering matters per Pitfall 5.

    Step 3 — Run `npx playwright test tests/email-snapshots/scaffold.spec.ts --update-snapshots` to generate the initial PNG baselines. Playwright will create `tests/email-snapshots/scaffold.spec.ts-snapshots/` with three PNGs:
    - `scaffold-gmail-640-chromium-{platform}.png`
    - `scaffold-apple-600-chromium-{platform}.png`
    - `scaffold-owa-580-chromium-{platform}.png`

    The `{platform}` suffix is `darwin` on the local Mac. CI on Linux will generate `-linux` variants on the first run there — that's expected per RESEARCH "Open Question 3" and Playwright's per-platform snapshot model.

    Step 4 — Commit the generated PNGs (they ARE meant to be in git per Vercel/Playwright snapshot convention). Confirm with `git status tests/email-snapshots/` showing the new PNGs as added.

    Step 5 — Run `npx playwright test tests/email-snapshots/scaffold.spec.ts` (no `--update-snapshots`) to verify the baselines are stable. Re-run a second time. Both must pass with no diffs.

    Step 6 — Run the npm-script aliases to confirm wiring from 45-PLAN-foundation works:
    - `npm run test:visual` exits 0.
    - `npm run test:visual:update` is a no-op (baselines already match) and exits 0.

    Per RESEARCH "Anti-Patterns to Avoid": do NOT run Playwright as part of `npm test`. The default `npm test` is Vitest-only. `npm run test:visual` is the separate Playwright entry point. The CI workflow can run both in sequence.
  </action>
  <verify>
    <automated>npx playwright test tests/email-snapshots/scaffold.spec.ts --reporter=line && ls tests/email-snapshots/scaffold.spec.ts-snapshots/ | grep -cE 'scaffold-(gmail-640|apple-600|owa-580).*\.png$' | awk '$1>=3{exit 0}{exit 1}'</automated>
  </verify>
  <acceptance_criteria>
    - `test -f playwright.config.ts` exits 0 (at repo root, not under `tests/`).
    - `grep -c '^export default defineConfig' playwright.config.ts` returns 1.
    - `grep -c 'testDir: "tests/email-snapshots"' playwright.config.ts` returns 1.
    - `grep -c 'maxDiffPixelRatio: 0.01' playwright.config.ts` returns 1.
    - `grep -c 'browserName: "chromium"' playwright.config.ts` returns 1.
    - `test -f tests/email-snapshots/scaffold.spec.ts` exits 0.
    - `grep -c 'document.fonts.ready' tests/email-snapshots/scaffold.spec.ts` returns 1 (Pitfall 5 mitigation).
    - `grep -c 'toHaveScreenshot' tests/email-snapshots/scaffold.spec.ts` returns at least 1.
    - `grep -c 'from "../../src/emails/__scaffold"' tests/email-snapshots/scaffold.spec.ts` returns 1.
    - `ls tests/email-snapshots/scaffold.spec.ts-snapshots/ | grep -cE 'scaffold-gmail-640.*\\.png$'` returns at least 1.
    - `ls tests/email-snapshots/scaffold.spec.ts-snapshots/ | grep -cE 'scaffold-apple-600.*\\.png$'` returns at least 1.
    - `ls tests/email-snapshots/scaffold.spec.ts-snapshots/ | grep -cE 'scaffold-owa-580.*\\.png$'` returns at least 1.
    - `npx playwright test tests/email-snapshots/scaffold.spec.ts --reporter=line` exits 0.
    - Re-running `npx playwright test tests/email-snapshots/scaffold.spec.ts` a second time exits 0 (baseline is stable, not flaky).
    - `npm run test:visual` exits 0 (the script alias works end-to-end).
  </acceptance_criteria>
  <done>The Playwright runner is configured at repo root, the first spec renders Scaffold at three viewports, three PNG baselines are committed, and the harness passes twice in a row. Phase 46 templates can drop in `tests/email-snapshots/send-update.spec.ts` and `tests/email-snapshots/work-order.spec.ts` against this same config without further setup.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Test fixtures → snapshot files | All build-time / committed artifacts. No untrusted input. |
| Rendered HTML → headless Chromium | Playwright runs fully sandboxed; the loaded HTML never reaches a real network or auth context. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-V14-SNAP-01 | Tampering | Snapshot files (`.snap` + PNG) | mitigate | Snapshots are committed; PR review is the gate. Drift either fixes the snapshot intentionally (with `-u` / `--update-snapshots`) or reveals a regression. |
| T-V14-SNAP-02 | Repudiation | Test history | accept | Snapshots are git-tracked, so every change is attributable. |

(Phase-wide T-V5-01, T-V14-01..04 do not apply directly to harness wiring; they apply to the rendered content the harness verifies.)
</threat_model>

<verification>
- `npm run test:email` exits 0 and reports the new snap counts.
- `npm run test:visual` exits 0 with three PNG baselines stable.
- Both Vitest snap files (`src/lib/sendUpdate/__snapshots__/`, `src/lib/workOrder/__snapshots__/`) and the Playwright PNG directory are tracked in git.
- `git diff --stat src/lib/sendUpdate/emailTemplate.ts src/lib/workOrder/emailTemplate.ts` is empty (D-13 boundary).
</verification>

<success_criteria>
1. Send Update test file has at least 5 `toMatchSnapshot()` calls; the .snap file has at least 5 `exports[...]` entries.
2. Work Order test file has at least 2 `toMatchSnapshot()` calls; a new `__snapshots__/emailTemplate.test.ts.snap` is committed.
3. `playwright.config.ts` exists at repo root with the documented chromium-only / deterministic config.
4. `tests/email-snapshots/scaffold.spec.ts` renders Scaffold at three viewports with `document.fonts.ready` waited for, then asserts via `toHaveScreenshot()`.
5. Three baseline PNGs are committed to `tests/email-snapshots/scaffold.spec.ts-snapshots/`.
6. Both `npm run test:email` and `npm run test:visual` pass on a clean run.
7. The legacy template source files (`src/lib/sendUpdate/emailTemplate.ts`, `src/lib/workOrder/emailTemplate.ts`) are untouched (D-13).
</success_criteria>

<output>
After completion, create `.planning/phases/45-email-foundations/45-snapshot-harness-SUMMARY.md` per `$HOME/.claude/get-shit-done/templates/summary.md`. Capture: snapshot counts (5+/2+ Vitest, 3 Playwright), the `npm run test:visual` runtime, and a note that Phase 46 will swap fixture inputs into the same harness once the templates are migrated.
</output>
