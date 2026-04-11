// Global Vitest setup — only runs for the test suite.
// Adds @testing-library/jest-dom custom matchers to `expect` for *.test.tsx
// DOM-render suites. The matchers are safe to import from non-DOM suites too
// (they no-op without a matching DOM state), so this file can be loaded
// unconditionally.

import "@testing-library/jest-dom/vitest";
