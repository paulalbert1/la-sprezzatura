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
// - globalSetup pre-renders Scaffold HTML once outside the spec's transform
//   context (Playwright 1.59 ships its own jsx-runtime that breaks React.
//   renderToString when JSX components are imported from spec files).

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/email-snapshots",
  globalSetup: "./scripts/playwright-render-email-fixtures.ts",
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
