// scripts/render-email-fixtures-impl.ts
// Phase 45 -- pre-renders email components into static HTML fixture files
// so Playwright specs can snapshot them without importing React directly.
// Invoked by scripts/playwright-render-email-fixtures.ts (the globalSetup
// shim) via `npx tsx`. See that file's header for why this round-trip is
// necessary (Playwright 1.59's react/jsx-runtime shim).
//
// Phase 46 Plan 03 -- extended (D-17) to render the SendUpdate (5 fixtures
// per 46-04 D-22) and WorkOrder (2 fixtures) templates alongside the
// Scaffold reference. Total output: 1 scaffold + 5 SendUpdate + 2 WorkOrder
// = 8 HTML files.
//
// Output dir: tests/email-snapshots/.playwright-fixtures/
//   scaffold.html
//   sendUpdate-{full,noReviewItems,noProcurement,noBody,mixedSubLines}.html
//   workOrder-{default,longTitle}.html

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { render } from "@react-email/render";
import { Scaffold } from "../src/emails/__scaffold";
import { SendUpdate } from "../src/emails/sendUpdate/SendUpdate";
import { FIXTURES as SU_FIXTURES } from "../src/emails/sendUpdate/fixtures";
import { WorkOrder } from "../src/emails/workOrder/WorkOrder";
import { FIXTURES as WO_FIXTURES } from "../src/emails/workOrder/fixtures";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FIXTURES_DIR = resolve(
  __dirname,
  "..",
  "tests",
  "email-snapshots",
  ".playwright-fixtures",
);
const SCAFFOLD_FIXTURE = resolve(FIXTURES_DIR, "scaffold.html");

async function main(): Promise<void> {
  mkdirSync(FIXTURES_DIR, { recursive: true });

  // Scaffold reference (Phase 45 -- preserved unchanged).
  const scaffoldHtml = await render(createElement(Scaffold));
  writeFileSync(SCAFFOLD_FIXTURE, scaffoldHtml, "utf8");
  console.log(`Wrote ${SCAFFOLD_FIXTURE} (${Buffer.byteLength(scaffoldHtml, "utf8")} bytes)`);

  // SendUpdate fixtures (Phase 46 Plan 03 -- D-17 + 46-04 D-22; 5 fixtures).
  for (const [name, build] of Object.entries(SU_FIXTURES)) {
    const html = await render(createElement(SendUpdate, build()));
    const out = resolve(FIXTURES_DIR, `sendUpdate-${name}.html`);
    writeFileSync(out, html, "utf8");
    console.log(`Wrote ${out} (${Buffer.byteLength(html, "utf8")} bytes)`);
  }

  // WorkOrder fixtures (Phase 46 Plan 03 -- D-17; 2 fixtures).
  for (const [name, build] of Object.entries(WO_FIXTURES)) {
    const html = await render(createElement(WorkOrder, build()));
    const out = resolve(FIXTURES_DIR, `workOrder-${name}.html`);
    writeFileSync(out, html, "utf8");
    console.log(`Wrote ${out} (${Buffer.byteLength(html, "utf8")} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
