import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "sanity:client": path.resolve(
        __dirname,
        "src/__mocks__/sanity-client.ts",
      ),
    },
  },
  test: {
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "scripts/**/__tests__/**/*.test.mjs",
    ],
    // Default environment is node for pure-logic tests. Individual React
    // component tests opt into jsdom via the `@vitest-environment jsdom`
    // docblock pragma at the top of the test file. Setup files still run in
    // either environment so @testing-library/jest-dom matchers are available.
    environment: "node",
    setupFiles: ["src/__mocks__/vitest.setup.ts"],
  },
});
