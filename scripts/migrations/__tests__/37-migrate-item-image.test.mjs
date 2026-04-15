// scripts/migrations/__tests__/37-migrate-item-image.test.mjs
// Phase 37 Plan 01 -- Wave 0 RED baseline
//
// Requirements covered: PROC-12 (price strip), PROC-14 (multi-image).
// Decision IDs validated: D-08 (itemImage -> images[0] migration), D-16
// (destructive clientCost/retailPrice unset).
//
// Strategy: the migration script does not exist yet. This test harness
// defines the contract that the script must satisfy. When Plan 02 creates
// scripts/migrations/37-migrate-item-image-to-images.mjs, these tests turn
// GREEN. Until then, the import fails at module resolution -- that IS the
// intended RED baseline per the TDD red stage.
//
// RED baseline: migration script is created in Plan 02 Task 4.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---- Mock the Sanity client module ------------------------------------------
// The migration script uses `import { createClient } from '@sanity/client'`.
// We stub it with a chainable patch builder so we can inspect what ops the
// migration issues without hitting any real dataset.

const patchChain = () => {
  const chain = {
    set: vi.fn(() => chain),
    setIfMissing: vi.fn(() => chain),
    append: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    unset: vi.fn(() => chain),
    ifRevisionId: vi.fn(() => chain),
    commit: vi.fn(async () => ({ _id: "patched", transactionId: "tx-test" })),
  };
  return chain;
};

let mockClient;

vi.mock("@sanity/client", () => {
  return {
    createClient: vi.fn(() => mockClient),
  };
});

// ---- Fixtures ---------------------------------------------------------------

function makeProjectA() {
  return {
    _id: "proj-A",
    _type: "project",
    _rev: "revA",
    procurementItems: [
      {
        _key: "itemA1",
        name: "Item A1",
        itemImage: {
          _type: "image",
          asset: { _type: "reference", _ref: "image-ref-a" },
        },
      },
      {
        _key: "itemA2",
        name: "Item A2",
        // no itemImage, no images
      },
    ],
  };
}

function makeProjectB() {
  // Already-migrated: idempotency guard case.
  return {
    _id: "proj-B",
    _type: "project",
    _rev: "revB",
    procurementItems: [
      {
        _key: "itemB1",
        name: "Item B1",
        itemImage: {
          _type: "image",
          asset: { _type: "reference", _ref: "image-ref-b" },
        },
        images: [
          {
            _key: "img-preexisting",
            _type: "image",
            asset: { _type: "reference", _ref: "image-ref-b" },
            isPrimary: true,
            caption: null,
          },
        ],
      },
    ],
  };
}

function makeProjectC() {
  return {
    _id: "proj-C",
    _type: "project",
    _rev: "revC",
    procurementItems: [
      {
        _key: "itemC1",
        name: "Item C1",
      },
    ],
  };
}

function makeProjectD() {
  // Price strip only (D-16): item has clientCost + retailPrice but no itemImage.
  return {
    _id: "proj-D",
    _type: "project",
    _rev: "revD",
    procurementItems: [
      {
        _key: "itemD1",
        name: "Item D1",
        clientCost: 12345,
        retailPrice: 67890,
      },
    ],
  };
}

function makeProjectE() {
  // Combined (D-08 + D-16): itemImage AND clientCost set.
  return {
    _id: "proj-E",
    _type: "project",
    _rev: "revE",
    procurementItems: [
      {
        _key: "itemE1",
        name: "Item E1",
        itemImage: {
          _type: "image",
          asset: { _type: "reference", _ref: "image-ref-e" },
        },
        clientCost: 9999,
        retailPrice: 19999,
      },
    ],
  };
}

// ---- Test harness -----------------------------------------------------------

beforeEach(() => {
  // Reset a fresh mock client per test. .fetch returns the dataset we set up
  // and .patch returns a chainable patch stub whose calls we can inspect.
  mockClient = {
    _dataset: [],
    fetch: vi.fn(async () => mockClient._dataset),
    patch: vi.fn(() => {
      const p = patchChain();
      mockClient._lastPatch = p;
      mockClient._patches.push(p);
      return p;
    }),
    _patches: [],
    _lastPatch: null,
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

// Dynamic import so the module-not-found error surfaces as a failing test
// rather than a harness crash. Each test awaits the import separately.
async function loadMigration() {
  return await import(
    "../37-migrate-item-image-to-images.mjs"
  );
}

describe("migration: itemImage -> images[0] correctness (D-08)", () => {
  it("Project A first item: moves itemImage into images[0] with isPrimary=true, caption=null, and unsets itemImage", async () => {
    mockClient._dataset = [makeProjectA()];
    const mod = await loadMigration();
    await mod.runMigration({ client: mockClient });

    // Find the patch issued for Project A.
    expect(mockClient.patch).toHaveBeenCalledWith("proj-A");
    const projAPatch = mockClient._patches.find((_p, idx) =>
      mockClient.patch.mock.calls[idx]?.[0] === "proj-A",
    );
    expect(projAPatch).toBeDefined();

    // Expect a setIfMissing / append that seeds images[] with the old asset ref.
    const setIfMissingCalls = projAPatch.setIfMissing.mock.calls.flat();
    const appendCalls = projAPatch.append.mock.calls.flat();
    const setCalls = projAPatch.set.mock.calls.flat();
    const combined = JSON.stringify([setIfMissingCalls, appendCalls, setCalls]);
    expect(combined).toContain("image-ref-a");
    expect(combined).toContain("isPrimary");

    // Expect the legacy itemImage to be unset for the first item.
    const unsetArgs = projAPatch.unset.mock.calls.flat().flat();
    expect(
      unsetArgs.some(
        (arg) =>
          typeof arg === "string" && arg.includes("itemImage"),
      ),
      "legacy itemImage must be unset on the migrated item",
    ).toBe(true);
  });

  it("Project A second item: no itemImage -> remains unchanged, no images[] injected", async () => {
    mockClient._dataset = [makeProjectA()];
    const mod = await loadMigration();
    const result = await mod.runMigration({ client: mockClient });

    // Either the migration leaves the second item's images untouched, or the
    // returned tally counts only 1 item migrated for Project A.
    expect(result).toBeDefined();
    expect(
      result.itemsMigrated ?? result.migrated ?? 0,
    ).toBeGreaterThanOrEqual(1);

    // No unset call should target procurementItems[1].itemImage (it wasn't there).
    const allUnsetArgs = (mockClient._patches ?? [])
      .flatMap((p) => p.unset.mock.calls.flat())
      .flat();
    const touchesSecondItem = allUnsetArgs.some(
      (arg) =>
        typeof arg === "string" && arg.includes("procurementItems[1].itemImage"),
    );
    expect(touchesSecondItem).toBe(false);
  });
});

describe("migration: idempotency (D-08)", () => {
  it("Project B (already has images[]) does NOT duplicate-append the pre-existing image", async () => {
    mockClient._dataset = [makeProjectB()];
    const mod = await loadMigration();
    await mod.runMigration({ client: mockClient });

    // The patch for Project B should NOT append a new image entry on top of
    // the pre-existing one. Accept either zero append calls OR append calls
    // whose payload does not reference image-ref-b.
    const projBPatchIdx = mockClient.patch.mock.calls.findIndex(
      (c) => c[0] === "proj-B",
    );
    if (projBPatchIdx < 0) {
      // No patch issued = truly idempotent no-op; pass.
      return;
    }
    const projBPatch = mockClient._patches[projBPatchIdx];
    const appendPayload = JSON.stringify(projBPatch.append.mock.calls);
    const insertPayload = JSON.stringify(projBPatch.insert.mock.calls);
    const doubleAppend = /image-ref-b/.test(appendPayload + insertPayload);
    expect(
      doubleAppend,
      "already-migrated image must not be duplicated (idempotency guard)",
    ).toBe(false);
  });

  it("Running the migration TWICE against Project A yields the same state as running once", async () => {
    // First run
    mockClient._dataset = [makeProjectA()];
    const mod = await loadMigration();
    const first = await mod.runMigration({ client: mockClient });

    // Simulate post-migration state: the dataset now looks like Project B.
    mockClient._dataset = [makeProjectB()];
    mockClient._patches = [];
    mockClient.patch.mockClear();

    const second = await mod.runMigration({ client: mockClient });

    // Second run must report zero items migrated (nothing left to do).
    const secondMigrated =
      second.itemsMigrated ?? second.migrated ?? 0;
    expect(
      secondMigrated,
      "second run must migrate zero items (idempotency)",
    ).toBe(0);
    expect(first).toBeDefined();
  });
});

describe("migration: no-op + dry-run (D-08)", () => {
  it("Project C (no itemImage, no images) produces ZERO patches", async () => {
    mockClient._dataset = [makeProjectC()];
    const mod = await loadMigration();
    await mod.runMigration({ client: mockClient });
    expect(
      mockClient.patch,
      "no-op project must not issue any patch",
    ).not.toHaveBeenCalled();
  });

  it("dryRun: true produces zero .commit() calls on the mocked client", async () => {
    mockClient._dataset = [makeProjectA()];
    const mod = await loadMigration();
    await mod.runMigration({ client: mockClient, dryRun: true });

    const commits = mockClient._patches.flatMap((p) =>
      p.commit.mock.calls,
    );
    expect(
      commits.length,
      "dryRun must not call .commit() on any patch",
    ).toBe(0);
  });
});

describe("migration: destructive price strip (D-16)", () => {
  it("Project D: unsets both clientCost AND retailPrice for item with price fields", async () => {
    mockClient._dataset = [makeProjectD()];
    const mod = await loadMigration();
    const result = await mod.runMigration({ client: mockClient });

    expect(mockClient.patch).toHaveBeenCalledWith("proj-D");
    const projDPatchIdx = mockClient.patch.mock.calls.findIndex(
      (c) => c[0] === "proj-D",
    );
    const projDPatch = mockClient._patches[projDPatchIdx];
    expect(projDPatch).toBeDefined();

    const unsetArgs = projDPatch.unset.mock.calls.flat().flat();
    const hasClientCost = unsetArgs.some(
      (arg) => typeof arg === "string" && arg.includes("clientCost"),
    );
    const hasRetailPrice = unsetArgs.some(
      (arg) => typeof arg === "string" && arg.includes("retailPrice"),
    );
    expect(hasClientCost, "D-16: clientCost must be unset").toBe(true);
    expect(hasRetailPrice, "D-16: retailPrice must be unset").toBe(true);

    expect(
      result.priceFieldsUnset,
      "returned tally must include priceFieldsUnset (D-16)",
    ).toBeGreaterThanOrEqual(1);
  });

  it("Project E (itemImage + clientCost): single project patch handles both migrations; idempotent on second run", async () => {
    mockClient._dataset = [makeProjectE()];
    const mod = await loadMigration();
    const first = await mod.runMigration({ client: mockClient });

    // Exactly one .patch("proj-E") call on first run
    const projEFirstRunCalls = mockClient.patch.mock.calls.filter(
      (c) => c[0] === "proj-E",
    );
    expect(
      projEFirstRunCalls.length,
      "single .patch() call for proj-E on first run (combined migrations)",
    ).toBe(1);

    const projEPatchIdx = mockClient.patch.mock.calls.findIndex(
      (c) => c[0] === "proj-E",
    );
    const projEPatch = mockClient._patches[projEPatchIdx];
    const unsetArgs = projEPatch.unset.mock.calls.flat().flat();
    const hasImageUnset = unsetArgs.some(
      (arg) => typeof arg === "string" && arg.includes("itemImage"),
    );
    const hasPriceUnset = unsetArgs.some(
      (arg) => typeof arg === "string" && arg.includes("clientCost"),
    );
    expect(hasImageUnset).toBe(true);
    expect(hasPriceUnset).toBe(true);

    expect(first.priceFieldsUnset).toBe(1);

    // Second run: simulate post-migration state with images[] set and no price fields.
    mockClient._dataset = [
      {
        _id: "proj-E",
        _type: "project",
        _rev: "revE2",
        procurementItems: [
          {
            _key: "itemE1",
            name: "Item E1",
            images: [
              {
                _key: "img-auto",
                _type: "image",
                asset: { _type: "reference", _ref: "image-ref-e" },
                isPrimary: true,
                caption: null,
              },
            ],
          },
        ],
      },
    ];
    mockClient._patches = [];
    mockClient.patch.mockClear();

    const second = await mod.runMigration({ client: mockClient });
    expect(
      second.priceFieldsUnset,
      "idempotency: zero price-field unsets on second run",
    ).toBe(0);
  });
});
