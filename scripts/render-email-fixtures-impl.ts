// scripts/render-email-fixtures-impl.ts
// Phase 45 -- pre-renders email components into static HTML fixture files
// so Playwright specs can snapshot them without importing React directly.
// Invoked by scripts/playwright-render-email-fixtures.ts (the globalSetup
// shim) via `npx tsx`. See that file's header for why this round-trip is
// necessary (Playwright 1.59's react/jsx-runtime shim).
//
// Output: tests/email-snapshots/.playwright-fixtures/scaffold.html
//
// The reference link from the Playwright harness to the Scaffold component
// lives in this file's import statement:
//   from "../src/emails/__scaffold"

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { render } from "@react-email/render";
import { Scaffold } from "../src/emails/__scaffold";

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
  const html = await render(createElement(Scaffold));
  mkdirSync(FIXTURES_DIR, { recursive: true });
  writeFileSync(SCAFFOLD_FIXTURE, html, "utf8");
  console.log(`Wrote ${SCAFFOLD_FIXTURE} (${Buffer.byteLength(html, "utf8")} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
