import { describe, it } from "vitest";
// RNDR-03: Thumbnail strip (admin)
// Source of truth: src/sanity/components/rendering/ThumbnailStrip.tsx
// Port action: swap @sanity/ui Flex for Tailwind; restyle per 33-UI-SPEC.md § 4:
// active thumbnail has 1.5px #9A7B4B border, inactive has 0.5px #D4C8B8 border.
describe("ThumbnailStrip (admin)", () => {
  it.todo("renders one <button> per rendering with the rendering _key as key");
  it.todo("active thumbnail has 1.5px solid #9A7B4B border");
  it.todo("inactive thumbnails have 0.5px solid #D4C8B8 border");
  it.todo("clicking a thumbnail calls onSelect(index)");
  it.todo("promoted renderings show a gold filled star in the top-right corner");
  it.todo("errored renderings show the warning fallback instead of the image");
});
