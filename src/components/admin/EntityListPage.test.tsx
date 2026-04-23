// @vitest-environment jsdom
// Phase 43 Plan 01 Task 3 — EntityListPage amber completeness dot RED tests.
//
// Covers TRAD-04 (completeness indicator on Trades list view).
// Source of truth:
//   .planning/phases/43-document-checklists-settings-config-and-completeness/43-01-PLAN.md § Task 3
//   .planning/phases/43-document-checklists-settings-config-and-completeness/43-UI-SPEC.md § Copywriting Contract
//
// These tests intentionally FAIL (RED) because EntityListPage does not yet
// accept the contractorChecklistItems / vendorChecklistItems props, nor does
// it render the amber dot. Plan 04 drives them to GREEN.

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import EntityListPage from "./EntityListPage";

afterEach(cleanup);

function makeContractor(over: Record<string, unknown> = {}) {
  return {
    _id: "c1",
    name: "Acme Electrical",
    email: "acme@example.com",
    phone: "",
    company: "",
    trades: [],
    relationship: "contractor",
    documents: [],
    ...over,
  };
}

function findAmberDot(container: HTMLElement): HTMLElement | null {
  const candidates = Array.from(
    container.querySelectorAll("[title], [aria-label]"),
  ) as HTMLElement[];
  return (
    candidates.find(
      (el) =>
        (el.getAttribute("title") ?? "") === "Missing required documents" ||
        (el.getAttribute("aria-label") ?? "") === "Missing required documents",
    ) ?? null
  );
}

describe("EntityListPage — amber completeness dot (TRAD-04)", () => {
  it("renders amber dot when a contractor has no documents but the checklist is non-empty", () => {
    const { container } = render(
      // @ts-expect-error — props added in Plan 04
      <EntityListPage
        entityType="contractor"
        entities={[makeContractor({ documents: [] })]}
        contractorChecklistItems={["W-9"]}
        vendorChecklistItems={[]}
      />,
    );
    expect(findAmberDot(container)).not.toBeNull();
  });

  it("does NOT render amber dot when every checklist item has a matching docType", () => {
    const c = makeContractor({
      documents: [
        { _key: "k1", docType: "W-9" },
        { _key: "k2", docType: "Certificate of insurance" },
      ],
    });
    const { container } = render(
      // @ts-expect-error — props added in Plan 04
      <EntityListPage
        entityType="contractor"
        entities={[c]}
        contractorChecklistItems={["W-9", "Certificate of insurance"]}
        vendorChecklistItems={[]}
      />,
    );
    expect(findAmberDot(container)).toBeNull();
  });

  it("a vendor entity missing a vendor checklist item renders the amber dot (vendor array drives completeness)", () => {
    const v = makeContractor({
      _id: "v1",
      name: "Sample Vendor",
      relationship: "vendor",
      documents: [{ _key: "k1", docType: "W-9" }], // contractor-style doc, not vendor
    });
    const { container } = render(
      // @ts-expect-error — props added in Plan 04
      <EntityListPage
        entityType="contractor"
        entities={[v]}
        contractorChecklistItems={["W-9"]}
        vendorChecklistItems={["Vendor agreement"]}
      />,
    );
    expect(findAmberDot(container)).not.toBeNull();
  });

  it("entity with relationship === null and no documents renders amber dot (D-12 — treated as contractor)", () => {
    const c = makeContractor({
      relationship: null,
      documents: [],
    });
    const { container } = render(
      // @ts-expect-error — props added in Plan 04
      <EntityListPage
        entityType="contractor"
        entities={[c]}
        contractorChecklistItems={["W-9"]}
        vendorChecklistItems={["Vendor agreement"]}
      />,
    );
    expect(findAmberDot(container)).not.toBeNull();
  });

  it("entityType === 'client' never renders an amber dot regardless of completeness props", () => {
    const client = {
      _id: "cl1",
      name: "Sample Client",
      email: "x@y.com",
      phone: "",
      address: null,
    };
    const { container } = render(
      // @ts-expect-error — props added in Plan 04
      <EntityListPage
        entityType="client"
        entities={[client]}
        contractorChecklistItems={["W-9"]}
        vendorChecklistItems={["Vendor agreement"]}
      />,
    );
    expect(findAmberDot(container)).toBeNull();
  });
});
