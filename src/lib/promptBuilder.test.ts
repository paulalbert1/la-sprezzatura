import { describe, it, expect } from "vitest";
import {
  buildLuxuryPrompt,
  buildRefinementPrompt,
  buildImageRoleLabel,
  LUXURY_PERSONA_PROMPT,
  type ImageInput,
} from "./promptBuilder";

describe("LUXURY_PERSONA_PROMPT", () => {
  it("is a non-empty string containing 'luxury interior design'", () => {
    expect(LUXURY_PERSONA_PROMPT).toBeTruthy();
    expect(LUXURY_PERSONA_PROMPT).toContain("luxury interior design");
  });
});

describe("buildImageRoleLabel", () => {
  it("returns string starting with 'FLOOR PLAN:' for Floor Plan type", () => {
    const result = buildImageRoleLabel("Floor Plan", {});
    expect(result).toMatch(/^FLOOR PLAN:/);
  });

  it("returns string containing 'EXISTING SPACE PHOTO' for that type", () => {
    const result = buildImageRoleLabel("Existing Space Photo", {});
    expect(result).toContain("EXISTING SPACE PHOTO");
  });

  it("includes location in brackets for Furniture Reference with location", () => {
    const result = buildImageRoleLabel("Furniture Reference", {
      location: "left wall",
      copyExact: true,
    });
    expect(result).toContain("FURNITURE REFERENCE");
    expect(result).toContain("[left wall]");
  });

  it("includes 'Replicate this piece exactly' when copyExact is true", () => {
    const result = buildImageRoleLabel("Furniture Reference", {
      copyExact: true,
    });
    expect(result).toContain("Replicate this piece exactly");
  });

  it("includes 'Apply style' when copyExact is false for Inspiration", () => {
    const result = buildImageRoleLabel("Inspiration", { copyExact: false });
    expect(result).toContain("Apply");
    expect(result).toContain("style");
  });

  it("includes 'Replicate this material exactly' for Material/Finish Sample with copyExact", () => {
    const result = buildImageRoleLabel("Material/Finish Sample", {
      copyExact: true,
    });
    expect(result).toContain("MATERIAL/FINISH SAMPLE");
    expect(result).toContain("Replicate this material exactly");
  });

  it("includes 'Replicate this fixture exactly' for Fixture Reference with copyExact", () => {
    const result = buildImageRoleLabel("Fixture Reference", {
      copyExact: true,
    });
    expect(result).toContain("FIXTURE REFERENCE");
    expect(result).toContain("Replicate this fixture exactly");
  });

  it("handles Custom type with notes", () => {
    const result = buildImageRoleLabel("Custom", {
      notes: "marble top",
      copyExact: false,
    });
    expect(result).toContain("CUSTOM");
    expect(result).toContain("marble top");
  });

  it("appends notes after main instruction when present", () => {
    const result = buildImageRoleLabel("Furniture Reference", {
      copyExact: true,
      notes: "marble top",
    });
    expect(result).toContain("marble top");
  });
});

describe("buildLuxuryPrompt", () => {
  it("returns string containing all 12 sections when called with description only", () => {
    const result = buildLuxuryPrompt("Add velvet sofa", []);
    expect(result).toContain("## Preserve");
    expect(result).toContain("## Design Intent");
    expect(result).toContain("## Primary Change");
    expect(result).toContain("## Reference Binding");
    expect(result).toContain("## Scale & Proportion");
    expect(result).toContain("## Material & Detail Fidelity");
    expect(result).toContain("## Lighting & Atmosphere");
    expect(result).toContain("## Styling Restraint");
    expect(result).toContain("## Color & Cohesion");
    expect(result).toContain("## Constraints");
    expect(result).toContain("## Final Quality");
  });

  it("includes 'quiet luxury' in Design Intent when stylePreset is 'quiet luxury'", () => {
    const result = buildLuxuryPrompt("Add sofa", [], "quiet luxury");
    expect(result).toContain("quiet luxury");
    const designIntentMatch = result.match(
      /## Design Intent\n.*quiet luxury.*/s,
    );
    expect(designIntentMatch).toBeTruthy();
  });

  it("defaults to 'quietly luxurious' in Design Intent when no stylePreset", () => {
    const result = buildLuxuryPrompt("Add sofa", []);
    expect(result).toContain("quietly luxurious");
  });

  it("includes 'Replicate exactly' in Reference Binding for copyExact image", () => {
    const images: ImageInput[] = [
      {
        blobPathname: "test/sofa.jpg",
        imageType: "Furniture Reference",
        copyExact: true,
      },
    ];
    const result = buildLuxuryPrompt("Add sofa", images);
    expect(result).toContain("Replicate exactly");
  });

  it("includes 'Apply style/concept' in Reference Binding for inspiration image", () => {
    const images: ImageInput[] = [
      {
        blobPathname: "test/inspo.jpg",
        imageType: "Inspiration",
        copyExact: false,
      },
    ];
    const result = buildLuxuryPrompt("Add sofa", images);
    expect(result).toContain("Apply style/concept");
  });

  it("includes location text in Placement & Composition when image has location", () => {
    const images: ImageInput[] = [
      {
        blobPathname: "test/sofa.jpg",
        imageType: "Furniture Reference",
        location: "left wall near window",
        copyExact: true,
      },
    ];
    const result = buildLuxuryPrompt("Add sofa", images);
    expect(result).toContain("left wall near window");
    expect(result).toContain("## Placement & Composition");
  });

  it("omits Placement & Composition section when no images have location", () => {
    const images: ImageInput[] = [
      {
        blobPathname: "test/sofa.jpg",
        imageType: "Furniture Reference",
        copyExact: true,
      },
    ];
    const result = buildLuxuryPrompt("Add sofa", images);
    expect(result).not.toContain("## Placement & Composition");
  });

  it("includes image notes in Reference Binding line", () => {
    const images: ImageInput[] = [
      {
        blobPathname: "test/sofa.jpg",
        imageType: "Furniture Reference",
        notes: "marble top",
        copyExact: true,
      },
    ];
    const result = buildLuxuryPrompt("Add sofa", images);
    expect(result).toContain("marble top");
  });

  it("shows 'No reference images provided' when no images", () => {
    const result = buildLuxuryPrompt("Add sofa", []);
    expect(result).toContain("No reference images provided");
  });

  it("includes the description in Primary Change section", () => {
    const result = buildLuxuryPrompt("Add a velvet tufted sofa", []);
    expect(result).toContain("Add a velvet tufted sofa");
  });
});

describe("buildRefinementPrompt", () => {
  it("wraps refinement text with integration instructions", () => {
    const result = buildRefinementPrompt("make the sofa darker");
    expect(result).toContain("make the sofa darker");
    expect(result).toContain("lighting");
    expect(result).toContain("perspective");
    expect(result).toContain("unchanged elements");
  });
});
