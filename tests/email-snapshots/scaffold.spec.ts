// tests/email-snapshots/scaffold.spec.ts
// Phase 45 -- first Playwright spec; renders <Scaffold /> at three viewport widths
// (Gmail web 640px, Apple Mail 600px, web Outlook 580px per RESEARCH).
// Phase 46 templates land alongside this spec.
//
// Pitfall 5 (RESEARCH.md): always wait for document.fonts.ready before
// toHaveScreenshot to prevent font-flicker pixel-diff flakiness.
//
// Architecture note: the Scaffold HTML is pre-rendered by
// scripts/playwright-render-email-fixtures.ts (wired as globalSetup in
// playwright.config.ts) and read back here via readFileSync. This sidesteps
// a conflict between Playwright 1.59's bundled react/jsx-runtime shim
// (which Playwright applies to every file under `testDir`) and React's
// actual renderToString. Keeping the React render in a script outside
// `testDir` runs it through Node's normal ESM loader where the real
// react/jsx-runtime is in effect.
// Reference: from "../../src/emails/__scaffold" -- the import lives in
// scripts/playwright-render-email-fixtures.ts, the canonical link from
// this harness to the component being snapshotted.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_FIXTURE = resolve(
  __dirname,
  ".playwright-fixtures",
  "scaffold.html",
);

const VIEWPORTS = [
  { name: "gmail", width: 640, height: 1024 },
  { name: "apple", width: 600, height: 1024 },
  { name: "owa", width: 580, height: 1024 },
];

for (const vp of VIEWPORTS) {
  test(`scaffold renders deterministically -- ${vp.name} (${vp.width}px)`, async ({ page }) => {
    const html = readFileSync(SCAFFOLD_FIXTURE, "utf8");
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
