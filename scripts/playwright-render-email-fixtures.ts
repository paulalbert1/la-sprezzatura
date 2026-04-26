// scripts/playwright-render-email-fixtures.ts
// Phase 45 -- Playwright globalSetup: shells out to a separate `vite-node` child
// process that pre-renders the email fixtures. This is the only mechanism that
// escapes Playwright 1.59's bundled react/jsx-runtime shim, which is applied to
// every file Playwright loads (testDir, config, AND globalSetup). The shim
// wraps every JSX element in {__pw_type, type, props, key}, which
// React.renderToString refuses to handle.
//
// vite-node (vs tsx) is required because the scaffold component uses JSX
// without `import React from "react"` -- it relies on the automatic
// jsxImportSource. Plain tsx defaults to the classic React.createElement
// transform and fails. vite-node + vitest.config.ts (which has
// @vitejs/plugin-react) applies the react-jsx automatic transform across
// every file in the dependency tree.
//
// Output: tests/email-snapshots/.playwright-fixtures/scaffold.html

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMPL_SCRIPT = resolve(__dirname, "render-email-fixtures-impl.ts");
const VITEST_CONFIG = resolve(__dirname, "..", "vitest.config.ts");

export default async function globalSetup(): Promise<void> {
  // `npx vite-node --config vitest.config.ts <impl>` runs the impl in a clean
  // Node process with the @vitejs/plugin-react JSX transform active.
  // Playwright's in-process transform does not reach across the process
  // boundary, so the child sees the real react/jsx-runtime.
  execFileSync(
    "npx",
    ["vite-node", "--config", VITEST_CONFIG, IMPL_SCRIPT],
    { stdio: "inherit" },
  );
}
