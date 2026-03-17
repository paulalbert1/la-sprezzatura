import { describe, it, expect } from "vitest";
import {
  ARTIFACT_TYPES,
  getArtifactLabel,
  getCurrentVersion,
  isContractSigned,
  getArtifactBadgeStyle,
} from "./artifactUtils";
import type { Artifact, ArtifactVersion } from "./artifactUtils";

describe("ARTIFACT_TYPES", () => {
  it("contains the expected types", () => {
    expect(ARTIFACT_TYPES).toEqual([
      "proposal",
      "floor-plan",
      "design-board",
      "contract",
      "warranty",
      "close-document",
    ]);
  });
});

describe("getArtifactLabel", () => {
  it('returns "Contract" for "contract"', () => {
    expect(getArtifactLabel("contract")).toBe("Contract");
  });

  it('returns "Floor Plan" for "floor-plan"', () => {
    expect(getArtifactLabel("floor-plan")).toBe("Floor Plan");
  });

  it("returns custom name for custom type", () => {
    expect(getArtifactLabel("custom", "Custom Thing")).toBe("Custom Thing");
  });
});

describe("getCurrentVersion", () => {
  const makeVersion = (key: string): ArtifactVersion => ({
    _key: key,
    file: {
      asset: {
        url: `https://cdn.sanity.io/${key}`,
        originalFilename: `file-${key}.pdf`,
        mimeType: "application/pdf",
        size: 1024,
      },
    },
    uploadedAt: "2025-01-01T00:00:00Z",
  });

  it("returns the version matching currentVersionKey", () => {
    const artifact: Artifact = {
      _key: "a1",
      artifactType: "contract",
      currentVersionKey: "v2",
      versions: [makeVersion("v1"), makeVersion("v2"), makeVersion("v3")],
      decisionLog: [],
      notes: [],
    };
    const version = getCurrentVersion(artifact);
    expect(version?._key).toBe("v2");
  });

  it("returns last version if no currentVersionKey", () => {
    const artifact: Artifact = {
      _key: "a1",
      artifactType: "contract",
      versions: [makeVersion("v1"), makeVersion("v2")],
      decisionLog: [],
      notes: [],
    };
    const version = getCurrentVersion(artifact);
    expect(version?._key).toBe("v2");
  });
});

describe("isContractSigned", () => {
  it("returns true when artifact has signedFile with asset url", () => {
    const artifact: Artifact = {
      _key: "a1",
      artifactType: "contract",
      signedFile: {
        asset: {
          url: "https://cdn.sanity.io/signed.pdf",
          originalFilename: "signed.pdf",
        },
      },
      versions: [],
      decisionLog: [],
      notes: [],
    };
    expect(isContractSigned(artifact)).toBe(true);
  });

  it("returns false when no signedFile", () => {
    const artifact: Artifact = {
      _key: "a1",
      artifactType: "contract",
      versions: [],
      decisionLog: [],
      notes: [],
    };
    expect(isContractSigned(artifact)).toBe(false);
  });
});

describe("getArtifactBadgeStyle", () => {
  it('returns charcoal style for "contract"', () => {
    expect(getArtifactBadgeStyle("contract")).toBe(
      "bg-charcoal/10 text-charcoal",
    );
  });

  it('returns emerald style for "close-document"', () => {
    expect(getArtifactBadgeStyle("close-document")).toBe(
      "bg-emerald-50 text-emerald-700",
    );
  });

  it('returns terracotta style for "proposal"', () => {
    expect(getArtifactBadgeStyle("proposal")).toBe(
      "bg-terracotta/10 text-terracotta",
    );
  });

  it("returns stone style for unknown type", () => {
    expect(getArtifactBadgeStyle("custom")).toBe(
      "bg-stone-light/20 text-stone",
    );
  });
});

// TODO: Uncomment after Task 1 adds InvestmentTier, InvestmentSummary, InvestmentLineItem exports
// import type { InvestmentTier, InvestmentSummary, InvestmentLineItem } from "./artifactUtils";
//
// describe("Investment Summary types (Phase 9)", () => {
//   it("InvestmentLineItem has _key, name, price fields", () => {
//     const item: InvestmentLineItem = { _key: "li1", name: "Sofa", price: 250000 };
//     expect(item._key).toBe("li1");
//     expect(item.name).toBe("Sofa");
//     expect(item.price).toBe(250000);
//   });
//
//   it("InvestmentTier has _key, name, optional description, lineItems", () => {
//     const tier: InvestmentTier = {
//       _key: "t1",
//       name: "Essential",
//       lineItems: [{ _key: "li1", name: "Consultation", price: 50000 }],
//     };
//     expect(tier._key).toBe("t1");
//     expect(tier.name).toBe("Essential");
//     expect(tier.description).toBeUndefined();
//     expect(tier.lineItems).toHaveLength(1);
//   });
//
//   it("InvestmentSummary has tiers array and optional selectedTierKey, eagerness, reservations", () => {
//     const summary: InvestmentSummary = {
//       tiers: [
//         { _key: "t1", name: "Basic", lineItems: [] },
//         { _key: "t2", name: "Premium", lineItems: [] },
//       ],
//     };
//     expect(summary.tiers).toHaveLength(2);
//     expect(summary.selectedTierKey).toBeUndefined();
//     expect(summary.eagerness).toBeUndefined();
//     expect(summary.reservations).toBeUndefined();
//   });
//
//   it("Artifact type accepts investmentSummary field", () => {
//     const artifact: Artifact = {
//       _key: "a1",
//       artifactType: "proposal",
//       versions: [],
//       decisionLog: [],
//       notes: [],
//       investmentSummary: {
//         tiers: [{ _key: "t1", name: "Standard", lineItems: [{ _key: "li1", name: "Design", price: 100000 }] }],
//         selectedTierKey: "t1",
//         eagerness: 4,
//         reservations: "Timeline concern",
//       },
//     };
//     expect(artifact.investmentSummary).toBeDefined();
//     expect(artifact.investmentSummary!.selectedTierKey).toBe("t1");
//     expect(artifact.investmentSummary!.eagerness).toBe(4);
//   });
//
//   it('DecisionLogEntry action union includes "tier-selected"', () => {
//     const entry: import("./artifactUtils").DecisionLogEntry = {
//       _key: "d1",
//       action: "tier-selected",
//       timestamp: "2026-03-17T00:00:00Z",
//     };
//     expect(entry.action).toBe("tier-selected");
//   });
// });
