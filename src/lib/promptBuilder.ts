/**
 * Structured luxury interior rendering prompt builder.
 *
 * Assembles a 12-section luxury interior rendering template from image
 * metadata and a freeform description. Designed for Gemini NB2 image
 * generation with explicit role binding per image.
 */

export const LUXURY_PERSONA_PROMPT = `You are a luxury interior design visualization assistant. You create photorealistic room renderings with restraint, material realism, and editorial composition. Your work is suitable for Architectural Digest, Restoration Hardware, and high-end design publications. You prioritize natural materials, soft lighting, spatial harmony, and quiet luxury over trend-following or over-decoration.`;

export interface ImageInput {
  blobPathname: string;
  imageType: string;
  location?: string;
  notes?: string;
  copyExact: boolean;
}

/**
 * Returns the role label text for an image part in the Gemini prompt.
 * Each image type gets a specific instruction for how Gemini should
 * interpret it.
 */
export function buildImageRoleLabel(
  imageType: string,
  input: Partial<ImageInput>,
): string {
  const locationTag = input.location ? ` [${input.location}]` : "";
  const noteSuffix = input.notes ? ` ${input.notes}.` : "";

  switch (imageType) {
    case "Floor Plan":
      return `FLOOR PLAN: Use this as the spatial layout reference.${noteSuffix}`;

    case "Existing Space Photo":
      return `EXISTING SPACE PHOTO: This is the current state of the room. Preserve architecture and lighting direction.${noteSuffix}`;

    case "Inspiration":
      return `INSPIRATION${locationTag}: Apply the style and mood, not exact replication.${noteSuffix}`;

    case "Furniture Reference":
      if (input.copyExact) {
        return `FURNITURE REFERENCE${locationTag}: Replicate this piece exactly.${noteSuffix}`;
      }
      return `FURNITURE REFERENCE${locationTag}: Apply style/concept from this piece.${noteSuffix}`;

    case "Material/Finish Sample":
      if (input.copyExact) {
        return `MATERIAL/FINISH SAMPLE${locationTag}: Replicate this material exactly.${noteSuffix}`;
      }
      return `MATERIAL/FINISH SAMPLE${locationTag}: Apply this material style.${noteSuffix}`;

    case "Fixture Reference":
      if (input.copyExact) {
        return `FIXTURE REFERENCE${locationTag}: Replicate this fixture exactly.${noteSuffix}`;
      }
      return `FIXTURE REFERENCE${locationTag}: Apply style from this fixture.${noteSuffix}`;

    default: {
      const typeLabel = imageType.toUpperCase();
      const instruction = input.copyExact
        ? "Replicate exactly."
        : input.notes || "Use as reference.";
      return `${typeLabel}${locationTag}: ${instruction}${input.copyExact && input.notes ? ` ${input.notes}.` : ""}`;
    }
  }
}

/**
 * Assembles the 12-section luxury rendering template from a freeform
 * description, image metadata, and an optional style preset.
 *
 * The template follows NB2 prompting best practices: explicit role
 * binding, copy vs. interpret per image, restraint language, and
 * material realism callouts.
 */
export function buildLuxuryPrompt(
  description: string,
  images: ImageInput[],
  stylePreset?: string,
): string {
  const sections: string[] = [];

  // Section 1 - Preserve
  sections.push(
    `## Preserve\nLock the architecture, layout, camera angle, and lighting direction from the base room image. Do not alter walls, ceiling, flooring, or window positions unless explicitly instructed.`,
  );

  // Section 2 - Design Intent
  sections.push(
    `## Design Intent\nStyle: ${stylePreset || "quietly luxurious"}. Create an interior that embodies this aesthetic with restraint and sophistication.`,
  );

  // Section 3 - Primary Change
  sections.push(`## Primary Change\n${description}`);

  // Section 4 - Reference Binding
  if (images.length > 0) {
    const bindings = images.map((img) => {
      const copyInstruction = img.copyExact
        ? "Replicate exactly"
        : "Apply style/concept, not exact copy";
      const notesSuffix = img.notes ? `. ${img.notes}` : "";
      return `- ${img.imageType.toUpperCase()}: ${copyInstruction}${notesSuffix}`;
    });
    sections.push(`## Reference Binding\n${bindings.join("\n")}`);
  } else {
    sections.push(
      `## Reference Binding\nNo reference images provided -- interpret the description freely.`,
    );
  }

  // Section 5 - Placement & Composition (conditional)
  const imagesWithLocation = images.filter((img) => img.location);
  if (imagesWithLocation.length > 0) {
    const placements = imagesWithLocation.map(
      (img) => `- ${img.imageType}: ${img.location}`,
    );
    sections.push(
      `## Placement & Composition\n${placements.join("\n")}`,
    );
  }

  // Section 6 - Scale & Proportion
  sections.push(
    `## Scale & Proportion\nMaintain realistic scale relationships. All furniture and objects must be proportional to room dimensions. Human-scale reference points preserved.`,
  );

  // Section 7 - Material & Detail Fidelity
  sections.push(
    `## Material & Detail Fidelity\nRender all materials with photographic realism. No plastic, glossy, or synthetic appearance. Show natural grain, texture, patina, and wear appropriate to the material.`,
  );

  // Section 8 - Lighting & Atmosphere
  sections.push(
    `## Lighting & Atmosphere\nSoft, natural, diffused lighting. Realistic shadow falloff with warm ambient tones. Light sources should be consistent with window positions and time of day implied by the base room.`,
  );

  // Section 9 - Styling Restraint
  sections.push(
    `## Styling Restraint\nDo NOT over-decorate. Leave breathing room. Negative space is intentional. Every object must serve a purpose. Remove anything that feels cluttered or gratuitous.`,
  );

  // Section 10 - Color & Cohesion
  sections.push(
    `## Color & Cohesion\nHarmonious palette. New elements must integrate seamlessly with existing space colors. No jarring contrasts unless explicitly requested.`,
  );

  // Section 11 - Constraints
  sections.push(
    `## Constraints\nDo not modify locked architectural elements. Do not introduce clutter, excessive accessories, or items not mentioned in the description. Do not add people, pets, or text.`,
  );

  // Section 12 - Final Quality
  sections.push(
    `## Final Quality\nEditorial-quality, cohesive, realistic, quietly luxurious. The result should be suitable for Architectural Digest or a luxury design portfolio.`,
  );

  return sections.join("\n\n");
}

/**
 * Wraps a freeform refinement instruction with integration guardrails
 * that maintain lighting, perspective, and unchanged elements.
 */
export function buildRefinementPrompt(refinementText: string): string {
  return `Refine the rendering: ${refinementText}\n\nMaintain all unchanged elements, lighting consistency, perspective accuracy, and material realism. Do not introduce new objects or clutter beyond what is described above.`;
}
