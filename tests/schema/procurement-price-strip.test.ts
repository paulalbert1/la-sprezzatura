// tests/schema/procurement-price-strip.test.ts
// Phase 37 Plan 01 -- Wave 0 RED baseline
//
// Requirements covered: PROC-12 (price strip), PROC-14 (multi-image), PROC-13 (non-destructive label rename).
// Decision IDs validated: D-07, D-08, D-11, D-13, D-18.
//
// Strategy: import the project schema and navigate into the procurementItems inline
// array member's fields. Assert the post-Phase-37 end state:
//   - No clientCost, retailPrice, itemImage fields
//   - A new images[] array with image members carrying isPrimary + caption
//   - expectedDeliveryDate survives (D-18; schema field name NOT renamed)
//
// These assertions intentionally FAIL against pre-Phase-37 code. This file
// becomes GREEN after Plan 02 strips price fields and adds images[].

import { describe, it, expect } from "vitest";
import { project } from "../../src/sanity/schemas/project";

// Narrow types to let us poke at the schema tree without littering `any`.
type SchemaField = {
  name: string;
  type: string;
  fields?: SchemaField[];
  of?: Array<{
    type: string;
    name?: string;
    fields?: SchemaField[];
  }>;
};

function getProcurementItemFields(): SchemaField[] {
  const procField = (project.fields as SchemaField[] | undefined)?.find(
    (f) => f.name === "procurementItems",
  );
  if (!procField) {
    throw new Error(
      "procurementItems field missing from project schema -- harness cannot run",
    );
  }
  if (procField.type !== "array") {
    throw new Error(
      `procurementItems expected type "array", got "${procField.type}"`,
    );
  }
  const arrayMember = procField.of?.[0];
  if (!arrayMember) {
    throw new Error("procurementItems has no array members defined");
  }
  if (!arrayMember.fields) {
    throw new Error(
      "procurementItems array member has no fields[] array defined",
    );
  }
  return arrayMember.fields;
}

describe("Phase 37: procurementItems schema price-strip (PROC-12, D-13)", () => {
  it("procurementItem fields array does NOT contain clientCost", () => {
    const fields = getProcurementItemFields();
    const names = fields.map((f) => f.name);
    expect(
      names,
      "clientCost must be removed from procurementItems schema (D-13)",
    ).not.toContain("clientCost");
  });

  it("procurementItem fields array does NOT contain retailPrice", () => {
    const fields = getProcurementItemFields();
    const names = fields.map((f) => f.name);
    expect(
      names,
      "retailPrice must be removed from procurementItems schema (D-13)",
    ).not.toContain("retailPrice");
  });
});

describe("Phase 37: procurementItems schema itemImage -> images[] (PROC-14, D-07, D-08)", () => {
  it("procurementItem fields array does NOT contain itemImage (replaced by images[])", () => {
    const fields = getProcurementItemFields();
    const names = fields.map((f) => f.name);
    expect(
      names,
      "itemImage must be replaced by images[] (D-08)",
    ).not.toContain("itemImage");
  });

  it("procurementItem fields array DOES contain an images field of type array", () => {
    const fields = getProcurementItemFields();
    const imagesField = fields.find((f) => f.name === "images");
    expect(
      imagesField,
      "images[] field must exist on procurementItem (PROC-14, D-07)",
    ).toBeDefined();
    expect(
      imagesField?.type,
      "images field must be of type array",
    ).toBe("array");
  });

  it("images[] array members are type image with isPrimary boolean + caption string inline fields", () => {
    const fields = getProcurementItemFields();
    const imagesField = fields.find((f) => f.name === "images");
    expect(imagesField).toBeDefined();
    const arrayMember = imagesField?.of?.[0];
    expect(
      arrayMember,
      "images[] must declare at least one array member type (D-07)",
    ).toBeDefined();
    expect(
      arrayMember?.type,
      "images[] array member must be of type image (D-07)",
    ).toBe("image");

    const memberFields = arrayMember?.fields ?? [];
    const memberNames = memberFields.map((f) => f.name);
    expect(
      memberNames,
      "images[] array member must define isPrimary field (D-09/D-11)",
    ).toContain("isPrimary");
    expect(
      memberNames,
      "images[] array member must define caption field (D-11)",
    ).toContain("caption");

    const isPrimary = memberFields.find((f) => f.name === "isPrimary");
    expect(
      isPrimary?.type,
      "isPrimary must be boolean",
    ).toBe("boolean");

    const caption = memberFields.find((f) => f.name === "caption");
    expect(
      caption?.type,
      "caption must be string",
    ).toBe("string");
  });
});

describe("Phase 37: non-destructive label rename (PROC-13, D-18)", () => {
  it("procurementItem fields array DOES still contain expectedDeliveryDate (schema field NOT renamed)", () => {
    const fields = getProcurementItemFields();
    const names = fields.map((f) => f.name);
    expect(
      names,
      "expectedDeliveryDate stays on the schema; only display copy changes (D-18)",
    ).toContain("expectedDeliveryDate");
  });
});
