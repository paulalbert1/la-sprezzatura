import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Read the source file to verify structural properties
const rateLimitSource = readFileSync(
  resolve(__dirname, "./rateLimit.ts"),
  "utf-8",
);

describe("rateLimit module", () => {
  it("imports from @upstash/ratelimit", () => {
    expect(rateLimitSource).toContain("@upstash/ratelimit");
  });

  it("does not use in-memory Map", () => {
    expect(rateLimitSource).not.toContain("new Map");
  });

  it("exports magicLinkRatelimit", () => {
    expect(rateLimitSource).toContain("export");
    expect(rateLimitSource).toContain("magicLinkRatelimit");
  });

  it("exports contactRatelimit", () => {
    expect(rateLimitSource).toContain("export");
    expect(rateLimitSource).toContain("contactRatelimit");
  });

  it("uses sliding window algorithm", () => {
    expect(rateLimitSource).toContain("slidingWindow");
  });
});
