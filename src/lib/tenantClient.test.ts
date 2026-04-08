import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Source-based tests
const clientSource = readFileSync(
  resolve(__dirname, "./tenantClient.ts"),
  "utf-8",
);

describe("tenantClient module", () => {
  it("exports getTenantClient function", () => {
    expect(clientSource).toContain("export function getTenantClient");
  });

  it("uses a client cache Map", () => {
    expect(clientSource).toContain("const clientCache = new Map");
  });

  it("calls createClient from @sanity/client", () => {
    expect(clientSource).toContain("createClient(");
  });

  it("throws for unknown tenant", () => {
    expect(clientSource).toContain("Unknown tenant");
  });

  it("throws for missing env var", () => {
    expect(clientSource).toContain("Missing env var");
  });
});

// Mock @sanity/client
vi.mock("@sanity/client", () => ({
  createClient: vi.fn(() => ({ fetch: vi.fn() })),
}));

describe("tenantClient runtime behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear any cached env
    delete process.env.SANITY_WRITE_TOKEN;
  });

  it("throws Error with 'Unknown tenant' for invalid tenantId", async () => {
    const { getTenantClient } = await import("./tenantClient");
    expect(() => getTenantClient("nonexistent")).toThrow("Unknown tenant");
  });

  it("throws Error with 'Missing env var' when writeTokenEnv is not set", async () => {
    delete process.env.SANITY_WRITE_TOKEN;
    const { getTenantClient } = await import("./tenantClient");
    expect(() => getTenantClient("lasprezzatura")).toThrow("Missing env var");
  });

  it("returns a SanityClient for valid tenantId with env set", async () => {
    process.env.SANITY_WRITE_TOKEN = "test-token";
    const { getTenantClient } = await import("./tenantClient");
    const client = getTenantClient("lasprezzatura");
    expect(client).toBeDefined();
    expect(client).toHaveProperty("fetch");
  });

  it("caches clients (calling twice returns same instance)", async () => {
    process.env.SANITY_WRITE_TOKEN = "test-token";
    const { getTenantClient } = await import("./tenantClient");
    const client1 = getTenantClient("lasprezzatura");
    const client2 = getTenantClient("lasprezzatura");
    expect(client1).toBe(client2);
  });
});
